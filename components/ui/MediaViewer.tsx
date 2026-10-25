'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowClockwise, DownloadSimple, X } from '@phosphor-icons/react';
import Spinner from './Spinner';
import { useT } from '@/providers/LocaleProvider';
import { uiDict } from '@/lib/i18n/dictionaries/ui';

// A file opened over the whole screen: a picture fitted to it, or a PDF page
// under page, with its name and a download button in the bar on top. PDFs are
// drawn with pdf.js (loaded only when one is opened, in a worker), so they
// show the same in every browser; Android's Chrome, for one, can't show a PDF
// inside a page at all (the legacy build also covers the older Safari the
// app supports). Escape, the close button and a tap beside a picture close
// it; focus returns to whatever opened it.

export type MediaItem =
  | { kind: 'image'; src: string; name: string; download?: boolean }
  | { kind: 'pdf'; src: string; name: string };

/** pdf.js and its worker, set up once per page load. */
let pdfjsReady: Promise<typeof import('pdfjs-dist/legacy/build/pdf.mjs')> | null = null;
function loadPdfjs() {
  pdfjsReady ??= import('pdfjs-dist/legacy/build/pdf.mjs').then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url), { type: 'module' });
    return pdfjs;
  }).catch((e) => {
    pdfjsReady = null;
    throw e;
  });
  return pdfjsReady;
}

type PdfState =
  | { status: 'loading' }
  | { status: 'ready'; pages: number }
  | { status: 'failed'; message: string; retry: boolean }
  // The file is there but can't be drawn: it can still be downloaded.
  | { status: 'noPreview' };

/** Width the pages are drawn at, in CSS pixels. */
const PAGE_MAX = 920;

export default function MediaViewer({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const t = useT(uiDict);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  const [pdf, setPdf] = useState<PdfState>({ status: 'loading' });
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Focus in, scrolling behind off, Escape closes, focus back on close.
  useEffect(() => {
    const opener = document.activeElement;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  const renderPdf = useCallback(async (signal: { cancelled: boolean }) => {
    // Documents come from the API (another address of the same site): its
    // session cookie has to go along.
    const res = await fetch(item.src, { credentials: 'include', cache: 'no-store' }).catch(() => null);
    if (signal.cancelled) return;
    const type = res?.headers.get('content-type') ?? '';
    if (!res || !res.ok || type.includes('application/json') || type.includes('text/html')) {
      // The app's routes answer with a short, readable reason (e.g. a letter
      // WebUntis is still generating); anything else gets the plain sentence.
      const body = res && type.includes('application/json') ? await res.json().catch(() => null) as { error?: string; pending?: boolean } | null : null;
      setPdf({ status: 'failed', message: body?.error && !/^[a-z_]+$/.test(body.error) ? body.error : t('viewerFailed'), retry: true });
      return;
    }
    const data = await res.arrayBuffer();
    if (signal.cancelled) return;
    setFileUrl(URL.createObjectURL(new Blob([data], { type: 'application/pdf' })));
    try {
      const pdfjs = await loadPdfjs();
      const task = pdfjs.getDocument({ data: new Uint8Array(data) });
      const doc = await task.promise;
      if (signal.cancelled) { void task.destroy(); return; }
      setPdf({ status: 'ready', pages: doc.numPages });
      const host = pagesRef.current;
      if (!host) return;
      host.replaceChildren();
      const width = Math.min(PAGE_MAX, host.clientWidth || window.innerWidth - 32);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      for (let n = 1; n <= doc.numPages; n++) {
        if (signal.cancelled) break;
        const page = await doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (width / base.width) * ratio });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.className = 'block w-full h-auto rounded-[6px] bg-white shadow-[0_10px_40px_rgb(0_0_0/0.35)]';
        canvas.style.maxWidth = `${PAGE_MAX}px`;
        canvas.setAttribute('aria-hidden', 'true');
        host.appendChild(canvas);
        await page.render({ canvas, viewport }).promise;
        page.cleanup();
      }
      void task.destroy();
    } catch {
      if (!signal.cancelled) setPdf({ status: 'noPreview' });
    }
  }, [item.src, t]);

  useEffect(() => {
    if (item.kind !== 'pdf') return;
    const signal = { cancelled: false };
    const id = requestAnimationFrame(() => {
      setPdf({ status: 'loading' });
      void renderPdf(signal);
    });
    return () => { signal.cancelled = true; cancelAnimationFrame(id); };
  }, [item.kind, renderPdf, attempt]);

  // The downloaded copy is released when the viewer closes.
  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

  if (typeof document === 'undefined') return null;

  const downloadHref = item.kind === 'pdf' ? fileUrl : item.download ? item.src : null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={item.name} className="fixed inset-0 z-[220] flex flex-col bg-[#0b0b0d]/[0.94] text-white fade-backdrop">
      <div className="flex h-16 shrink-0 items-center gap-3 px-3 sm:px-5" style={{ paddingTop: 'var(--safe-top)' }}>
        <p className="min-w-0 flex-1 truncate pl-1 text-[15.5px] font-semibold">
          {item.name}
          {item.kind === 'pdf' && pdf.status === 'ready' && pdf.pages > 1 && (
            <span className="ml-2 font-medium text-white/55">{t('viewerPages', { n: pdf.pages })}</span>
          )}
        </p>
        {downloadHref && (
          <a
            href={downloadHref}
            download={item.name}
            aria-label={t('viewerDownload')}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-white/12 px-3.5 text-[14.5px] font-semibold transition-colors hover:bg-white/20 sm:px-4"
          >
            <DownloadSimple size={18} weight="bold" aria-hidden="true" />
            <span className="hidden sm:inline" aria-hidden="true">{t('viewerDownload')}</span>
          </a>
        )}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t('viewerClose')}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-white/12 transition-colors hover:bg-white/20"
        >
          <X size={19} weight="bold" />
        </button>
      </div>

      {item.kind === 'image' ? (
        // A tap beside the picture closes, like the backdrop of every dialog.
        <div className="flex min-h-0 flex-1 items-center justify-center p-4 pb-[max(16px,var(--safe-bottom))] sm:p-8" onClick={onClose}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.src}
            // Attachments and the profile picture come from the API with the
            // sign-in's cookies, over CORS (the site's embedder policy loads
            // other sites' images without cookies).
            crossOrigin="use-credentials"
            alt={item.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-[20px] object-contain shadow-[0_20px_60px_rgb(0_0_0/0.5)]"
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(24px,var(--safe-bottom))] sm:px-8">
          {pdf.status === 'loading' && (
            <div role="status" className="flex flex-col items-center gap-3 py-24 text-white/70">
              <Spinner size={26} />
              <span className="text-[14.5px]">{t('viewerLoading')}</span>
            </div>
          )}
          {(pdf.status === 'failed' || pdf.status === 'noPreview') && (
            <div role="alert" className="mx-auto flex max-w-[40ch] flex-col items-center gap-4 py-24 text-center">
              <p className="text-[16px] leading-relaxed text-white/85">{pdf.status === 'failed' ? pdf.message : t('viewerNoPreview')}</p>
              {pdf.status === 'failed' && pdf.retry && (
                <button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-white/12 px-4 text-[14.5px] font-semibold hover:bg-white/20"
                >
                  <ArrowClockwise size={17} weight="bold" aria-hidden="true" />
                  {t('viewerRetry')}
                </button>
              )}
            </div>
          )}
          <div ref={pagesRef} className="mx-auto flex w-full flex-col items-center gap-4" style={{ maxWidth: PAGE_MAX }} />
        </div>
      )}
    </div>,
    document.body,
  );
}
