'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { useGsap } from '@/lib/motion';

// The hand-over to "Hol dir POKYH": the real app icon turns up in the middle
// of the paper and, as you keep scrolling, opens like an app on a phone until
// its indigo fills the screen. The next section starts in that same indigo,
// the colour the logo is drawn on (#534AB7, Android colors.xml).

const ICON_RADIUS = 0.215; // corner radius of POKYH_Logo.png relative to its size

export default function AppOpen() {
  const root = useRef<HTMLElement>(null);

  useGsap(({ gsap, reduced, scope }) => {
    const layer = scope.querySelector<HTMLElement>('[data-layer]')!;
    const icon = scope.querySelector<HTMLElement>('[data-icon]')!;
    const iconClip = () => {
      const s = icon.offsetWidth;
      const top = (window.innerHeight - s) / 2;
      const side = (window.innerWidth - s) / 2;
      return `inset(${top}px ${side}px ${top}px ${side}px round ${s * ICON_RADIUS}px)`;
    };
    gsap.set(layer, { clipPath: iconClip() });
    if (reduced) return;

    gsap.fromTo(
      icon,
      { scale: 0.2, rotate: -24 },
      {
        scale: 1,
        rotate: 0,
        ease: 'back.out(1.4)',
        scrollTrigger: { trigger: scope, start: 'top 85%', end: 'top 15%', scrub: 0.8 },
      },
    );

    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: scope,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.7,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // The indigo layer takes over from the image as soon as it starts to grow.
          layer.style.visibility = self.progress > 0.12 ? 'visible' : 'hidden';
          const tone = self.progress > 0.45 ? 'dark' : 'light';
          if (scope.dataset.tone !== tone) scope.dataset.tone = tone;
        },
      },
    })
      .fromTo(layer, { clipPath: iconClip }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 1, ease: 'power2.in' }, 0.15)
      .to(icon, { scale: 3.2, opacity: 0, duration: 0.55, ease: 'power2.in' }, 0.15);
  }, root);

  return (
    <section ref={root} data-tone="light" aria-hidden="true" className="relative h-[230svh] bg-[var(--paper)]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div data-layer className="absolute inset-0 bg-[var(--indigo)]" style={{ visibility: 'hidden' }} />
        <span data-icon className="absolute left-[calc(50%-var(--s)/2)] top-[calc(50%-var(--s)/2)] block size-[var(--s)] [--s:clamp(104px,10vw,150px)]">
          <Image src="/POKYH_Logo.png" alt="" width={300} height={300} className="h-full w-full" />
        </span>
      </div>
    </section>
  );
}
