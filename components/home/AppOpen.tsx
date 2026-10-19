'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useGsap } from '@/lib/motion';
import { SCROLL, sceneHeight } from '@/lib/scroll-pace';

// The hand-over to "Hol dir POKYH": the app icon turns up in the middle of
// the paper and, as you keep scrolling, is pressed and opens like an app on
// a phone until its indigo fills the screen. Icon and indigo are one element
// (a clipped layer); on it lies the real logo's mark: public/POKYH_Logo.png
// without its tile (POKYH_Logo_mark.webp, colour-to-alpha against the tile's
// #534AB7), so over the indigo it is the logo pixel for pixel, and 512 px
// stay sharp as far as it grows before it fades. The next section starts in
// that same indigo (#534AB7, Android colors.xml). Without motion it is left
// out: it is only the way between the Mensa and the next section, and a
// still icon on paper says nothing.

const RADIUS = 0.225; // corner radius of the app icon relative to its size

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function AppOpen() {
  const root = useRef<HTMLElement>(null);

  useGsap(({ gsap, reduced, scope }) => {
    const stage = scope.querySelector<HTMLElement>('[data-stage]')!;
    const layer = scope.querySelector<HTMLElement>('[data-layer]')!;
    const mark = scope.querySelector<HTMLElement>('[data-mark]')!;
    const state = { enter: reduced ? 1 : 0, open: 0 };

    const render = () => {
      const icon = mark.offsetWidth;
      const vw = stage.clientWidth;
      const vh = stage.clientHeight;
      const { enter, open } = state;
      // A short press before it opens.
      const press = 1 - 0.07 * Math.sin(Math.PI * smooth(0, 0.16, open));
      const grow = smooth(0.08, 1, open);
      const s = (0.6 + 0.4 * enter) * press;
      const rise = (1 - enter) * 70;
      const w = icon * s + (vw - icon * s) * grow;
      const h = icon * s + (vh - icon * s) * grow;
      const top = (vh - h) / 2 + rise * (1 - grow);
      const side = (vw - w) / 2;
      const r = icon * s * RADIUS * (1 - grow);
      layer.style.clipPath = `inset(${top.toFixed(2)}px ${side.toFixed(2)}px ${(vh - top - h).toFixed(2)}px ${side.toFixed(2)}px round ${r.toFixed(2)}px)`;
      layer.style.opacity = clamp01(enter * 1.6).toFixed(3);
      mark.style.transform = `translateY(${rise.toFixed(2)}px) scale(${(s * (1 + grow * 0.5)).toFixed(4)})`;
      mark.style.opacity = (clamp01(enter * 1.6) * (1 - smooth(0.05, 0.45, open))).toFixed(3);
      const tone = grow > 0.5 ? 'dark' : 'light';
      if (scope.dataset.tone !== tone) scope.dataset.tone = tone;
    };

    render();
    if (reduced) return;

    gsap.to(state, {
      enter: 1,
      ease: 'power2.out',
      onUpdate: render,
      scrollTrigger: { trigger: scope, start: 'top 90%', end: 'top 10%', scrub: 0.6 },
    });
    gsap.to(state, {
      open: 1,
      ease: 'power1.inOut',
      onUpdate: render,
      scrollTrigger: { trigger: scope, start: 'top top', end: 'bottom bottom', scrub: 0.6, onRefresh: render },
    });
    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, root);

  return (
    <section
      ref={root}
      data-tone="light"
      data-scroll-pace="appOpen"
      aria-hidden="true"
      className="relative bg-[var(--paper)] motion-reduce:hidden"
      style={{ height: sceneHeight('appOpen', SCROLL.length.appOpen) }}
    >
      <div data-stage className="sticky top-0 h-[calc(100*var(--lvh))] overflow-hidden">
        <div data-layer className="absolute inset-0 bg-[var(--indigo)]" style={{ clipPath: 'inset(50%)' }} />
        <div
          data-mark
          className="absolute left-[calc(50%-var(--s)/2)] top-[calc(50%-var(--s)/2)] grid size-[var(--s)] place-items-center text-white will-change-transform [--s:clamp(112px,11vw,168px)]"
          style={{ opacity: 0 }}
        >
          <Image src="/POKYH_Logo_mark.webp" alt="" width={512} height={512} unoptimized draggable={false} className="size-full select-none" />
        </div>
      </div>
    </section>
  );
}
