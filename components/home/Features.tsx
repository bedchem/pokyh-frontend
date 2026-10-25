'use client';

import { useRef } from 'react';
import FeatureCarousel from '@/components/landing/FeatureCarousel';
import { useGsap } from '@/lib/motion';

// The carousel rises over the night of the manifest in the colour of its
// first function (the stage paints it; the dark behind shows when the stage
// later sinks back). Its top edge starts as an arch and pulls flat as it reaches
// the top, while the sentence underneath sinks back. Without motion nothing
// rises: it simply follows the sentence instead of covering it.

export default function Features() {
  const root = useRef<HTMLDivElement>(null);

  useGsap(({ gsap, reduced, scope }) => {
    if (reduced) return;
    gsap.fromTo(
      scope,
      { borderTopLeftRadius: '50% 18vw', borderTopRightRadius: '50% 18vw' },
      {
        borderTopLeftRadius: '50% 0vw',
        borderTopRightRadius: '50% 0vw',
        ease: 'none',
        scrollTrigger: { trigger: scope, start: 'top bottom', end: 'top 12%', scrub: true },
      },
    );
    const under = document.querySelector('[data-manifest-inner]');
    if (under) {
      gsap.fromTo(
        under,
        { scale: 1, yPercent: 0, opacity: 1 },
        {
          scale: 0.84,
          yPercent: -14,
          opacity: 0.1,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: scope, start: 'top bottom', end: 'top top', scrub: true },
        },
      );
    }
  }, root, [], { lazy: true });

  return (
    <div ref={root} data-features data-scroll-pace="features" className="relative z-10 -mt-[calc(100*var(--lvh))] overflow-clip bg-[var(--night)] motion-reduce:mt-0">
      <FeatureCarousel />
    </div>
  );
}
