'use client';

import { useEffect, useId, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, X } from '@phosphor-icons/react';

// A dialog that is a bottom sheet on phones and a centred panel on larger
// screens. Focus moves in and is trapped, Escape and the backdrop close it,
// the page behind does not scroll, and focus returns to the opener.
// `onBack` adds a back arrow for a second step; `footer` stays pinned under
// the scrolling content (the actions of a long form). On a phone the sheet
// has the usual grab bar on top, and dragging its top part down closes it.
export default function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  closeLabel = 'Close',
  wide = false,
  onBack,
  backLabel = 'Back',
  footer,
  titleClassName = '',
  titleStyle,
  underTitle,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  closeLabel?: string;
  wide?: boolean;
  onBack?: () => void;
  backLabel?: string;
  footer?: ReactNode;
  /** Extra classes and style for the title (a lesson's name in its subject's colour). */
  titleClassName?: string;
  titleStyle?: CSSProperties;
  /** Shown right under the title, in the header (a lesson's status chips). */
  underTitle?: ReactNode;
}) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Dragging the sheet's top part down on a touch screen: it follows the
  // finger and closes past a distance (or on a quick flick), else springs back.
  const drag = useRef<{ id: number; y: number; t: number; dy: number } | null>(null);
  const setOffset = (dy: number, animate: boolean) => {
    const el = panel.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none';
    el.style.transform = dy ? `translateY(${dy}px)` : '';
  };
  const onDragStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch' || window.matchMedia('(min-width: 640px)').matches) return;
    if ((e.target as HTMLElement).closest('button, a')) return;
    // The opening animation keeps its end state (fill: both), which would hold the panel in place.
    if (panel.current) panel.current.style.animation = 'none';
    drag.current = { id: e.pointerId, y: e.clientY, t: performance.now(), dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    d.dy = Math.max(0, e.clientY - d.y);
    setOffset(d.dy, false);
  };
  const onDragEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const speed = d.dy / Math.max(1, performance.now() - d.t);
    if (d.dy > 110 || (d.dy > 40 && speed > 0.6)) {
      setOffset(panel.current?.offsetHeight ?? 600, true);
      window.setTimeout(() => onCloseRef.current(), 200);
    } else {
      setOffset(0, true);
    }
  };

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const focusFirst = () => {
      const el = panel.current?.querySelector<HTMLElement>('input, textarea, select, button:not([data-sheet-close])');
      (el ?? panel.current)?.focus();
    };
    const raf = requestAnimationFrame(focusFirst);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(); }
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prevOverflow;
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-[#0b0b0d]/45 fade-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        className={`squircle relative w-full ${wide ? 'sm:max-w-[640px]' : 'sm:max-w-[520px]'} max-h-[92dvh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-surface text-ink shadow-[var(--shadow-float)] outline-none slide-up sm:animate-none`}
        style={{ paddingBottom: footer ? undefined : 'max(20px, var(--safe-bottom))' }}
      >
        <div
          className="sticky top-0 z-10 flex touch-none items-start justify-between gap-4 bg-surface px-6 pt-6 pb-3 sm:touch-auto"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          {/* The grab bar, on phones only. */}
          <span aria-hidden="true" className="absolute left-1/2 top-2.5 h-[5px] w-10 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--ink-3)_45%,transparent)] sm:hidden" />
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              className="-ml-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-inset hover:text-ink transition-colors"
            >
              <ArrowLeft size={20} weight="bold" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={`${id}-title`} className={`text-[22px] font-extrabold leading-tight tracking-[-0.03em] ${titleClassName}`} style={titleStyle}>{title}</h2>
            {underTitle && <div className="mt-2.5">{underTitle}</div>}
            {description && <p id={`${id}-desc`} className="mt-1.5 text-[14px] leading-[1.55] text-ink-2">{description}</p>}
          </div>
          <button
            type="button"
            data-sheet-close
            onClick={onClose}
            aria-label={closeLabel}
            className="-mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-inset hover:text-ink transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>
        <div className="px-6 pt-2">{children}</div>
        {footer && (
          <div className="sticky bottom-0 z-10 mt-5 border-t border-line bg-surface px-6 pt-4" style={{ paddingBottom: 'max(20px, var(--safe-bottom))' }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
