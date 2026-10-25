'use client';

import { useRef, type ReactNode } from 'react';
import { useGsap } from '@/lib/motion';

// Every [data-reveal] element inside fades up a little the first time it
// enters the viewport, in small batches. Content is fully visible without JS
// and for reduced motion. The hidden state is only applied once the visitor
// starts to scroll (useGsap's lazy), and only to elements still below the
// screen: what has been seen already never disappears to fade in again.
export default function RevealScope({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGsap(({ gsap, ScrollTrigger, reduced, scope }) => {
    if (reduced) return;
    const items = Array.from(scope.querySelectorAll<HTMLElement>('[data-reveal]'))
      .filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    if (!items.length) return;
    gsap.set(items, { y: 14, opacity: 0 });
    ScrollTrigger.batch(items, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power2.out', overwrite: true }),
    });
  }, root, [], { lazy: true });

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
