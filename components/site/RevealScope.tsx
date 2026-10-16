'use client';

import { useRef, type ReactNode } from 'react';
import { ScrollTrigger, useGsap } from '@/lib/motion';

// Every [data-reveal] element inside rises into place the first time it enters
// the viewport, in small batches. Content is fully visible without JS and for
// reduced motion; the hidden state is only applied once GSAP runs.
export default function RevealScope({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGsap(({ gsap, reduced, scope }) => {
    if (reduced) return;
    const items = scope.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!items.length) return;
    gsap.set(items, { y: 32, opacity: 0 });
    ScrollTrigger.batch(items, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.9, stagger: 0.07, ease: 'expo.out', overwrite: true }),
    });
  }, root);

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
