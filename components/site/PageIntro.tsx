'use client';

import { useRef, type ReactNode } from 'react';
import { useGsap, SplitText } from '@/lib/motion';

// The opening of every public subpage: one large title set in lines that rise
// into place, a lead paragraph beside or below it, and optional actions.
export default function PageIntro({
  title,
  lead,
  children,
  tone,
}: {
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
  tone?: 'periwinkle' | 'butter' | 'sage' | 'blush';
}) {
  const root = useRef<HTMLElement>(null);

  useGsap(({ gsap, reduced }) => {
    if (reduced) return;
    const split = SplitText.create('[data-intro-title]', { type: 'lines', mask: 'lines', linesClass: 'pb-[0.08em]' });
    gsap.from(split.lines, { yPercent: 110, duration: 1.1, stagger: 0.08, ease: 'expo.out', delay: 0.05 });
    gsap.from('[data-intro-fade]', { y: 16, opacity: 0, duration: 0.9, delay: 0.35, stagger: 0.08, ease: 'expo.out' });
    return () => split.revert();
  }, root);

  const bg = tone ? { periwinkle: 'bg-periwinkle', butter: 'bg-butter', sage: 'bg-sage', blush: 'bg-blush' }[tone] : 'bg-canvas';

  return (
    <header ref={root} className={`${bg} text-ink`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 pt-36 md:pt-48 pb-16 md:pb-24 grid gap-8 lg:grid-cols-12 lg:items-end">
        <h1
          data-intro-title
          className="lg:col-span-8 font-extrabold leading-[0.94] tracking-[-0.05em] text-[clamp(44px,11vw,72px)] md:text-[clamp(64px,7.4vw,124px)]"
        >
          {title}
        </h1>
        {(lead || children) && (
          <div className="lg:col-span-4 flex flex-col gap-6 lg:pb-3">
            {lead && (
              <p data-intro-fade className="text-[17px] md:text-[19px] leading-[1.55] text-ink-2">
                {lead}
              </p>
            )}
            {children && <div data-intro-fade>{children}</div>}
          </div>
        )}
      </div>
    </header>
  );
}
