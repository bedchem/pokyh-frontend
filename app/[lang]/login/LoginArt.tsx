'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/providers/LocaleProvider';
import { homepageDict } from '@/lib/i18n/dictionaries/homepage';
import { drawTile, resolveFonts, type TileKind } from '@/lib/landing-art';
import { prefersReducedMotion } from '@/lib/motion';

// The school day beside the sign-in form: the homepage's tiles (lib/landing-art)
// laid out as a calm, tilted grid that leans a little with the pointer.
// Decorative. `compact` is the narrow band on phones.

const TILES: TileKind[] = ['time', 'grade', 'cancel', 'week', 'exam', 'message'];
/** Each column sits a little higher or lower, so the grid has a rhythm. */
const COLUMN_SHIFT = ['8%', '-10%', '14%'];

export default function LoginArt({ compact = false }: { compact?: boolean }) {
  const th = useT(homepageDict);
  const root = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    let live = true;
    (async () => {
      await document.fonts.ready.catch(() => undefined);
      if (!live) return;
      const fonts = resolveFonts();
      const text = {
        period: th('tPeriod'), subject: th('tSubject'), room: th('tRoom'),
        gradeSubject: th('tGradeSubject'), average: th('tAverage'),
        cancel: th('tCancel'), cancelSub: th('tCancelSub'),
        msgFrom: th('tMsgFrom'), msgText: th('tMsgText'),
        examDay: th('tExamDay'), exam: th('tExam'),
        weekdays: th('tWeekdays').split('|'),
      };
      const size = compact ? 180 : 300;
      const urls = TILES.map((kind) => drawTile(kind, size, true, text, fonts).toDataURL('image/png'));
      if (live) setImages(urls);
    })();
    return () => { live = false; };
  }, [th, compact]);

  // The grid leans a little towards the pointer.
  useEffect(() => {
    const el = root.current;
    if (!el || compact || prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const mx = (e.clientX / window.innerWidth - 0.5) * 2;
      const my = (e.clientY / window.innerHeight - 0.5) * 2;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', mx.toFixed(3));
        el.style.setProperty('--my', my.toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [compact]);

  const columns = [0, 1, 2].map((c) => images.filter((_, i) => i % 3 === c));

  return (
    <div
      ref={root}
      aria-hidden="true"
      className={`pointer-events-none absolute overflow-hidden ${compact ? 'inset-y-0 right-0 w-[58%] [perspective:900px]' : 'inset-x-0 top-0 h-[64%] [perspective:1400px]'}`}
    >
      {images.length > 0 && (
        <div
          className={`absolute grid grid-cols-3 ${compact ? '-right-[10%] -top-[30%] w-[120%] gap-2.5' : '-right-[12%] -top-[14%] w-[96%] gap-4'}`}
          style={{
            transform: 'rotateX(calc(26deg + var(--my, 0) * -3deg)) rotateZ(-16deg) rotateY(calc(var(--mx, 0) * 4deg))',
            transformStyle: 'preserve-3d',
            transition: 'transform 1s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {columns.map((col, c) => (
            <div key={c} className={`flex flex-col ${compact ? 'gap-2.5' : 'gap-4'}`} style={{ translate: `0 ${COLUMN_SHIFT[c]}` }}>
              {col.map((src, r) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={r}
                  src={src}
                  alt=""
                  className={`login-piece block w-full shadow-[0_22px_40px_-18px_rgb(0_0_0/0.55)] ${compact ? 'rounded-[12px]' : 'rounded-[20px]'}`}
                  style={{ animationDelay: `${(c * 2 + r) * 0.07}s` }}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
