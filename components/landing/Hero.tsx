'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/providers/LocaleProvider';
import { homepageDict } from '@/lib/i18n/dictionaries/homepage';
import { ensureGsap, prefersReducedMotion, useGsap } from '@/lib/motion';

// The opening: type only. A line about the school app, and the wordmark set
// across the full width. Its letters thicken where the pointer is. While you
// scroll the stage stays put, the wordmark sinks back, and the night section
// rises over it with a slanted edge.

function RotatingWords({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const box = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (words.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % words.length), 2600);
    return () => clearInterval(id);
  }, [words.length]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const gsap = ensureGsap();
    const items = el.querySelectorAll<HTMLElement>('[data-word]');
    const prev = (i - 1 + words.length) % words.length;
    if (first.current || prefersReducedMotion()) {
      first.current = false;
      items.forEach((w, n) => gsap.set(w, { yPercent: n === i ? 0 : 110, opacity: n === i ? 1 : 0 }));
      return;
    }
    gsap.to(items[prev], { yPercent: -110, opacity: 0, duration: 0.9, ease: 'expo.inOut' });
    gsap.fromTo(items[i], { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.inOut' });
  }, [i, words.length]);

  return (
    <span ref={box} className="relative inline-block h-[1.2em] overflow-hidden align-bottom">
      <span className="invisible block whitespace-nowrap">{words.reduce((a, b) => (b.length > a.length ? b : a), '')}</span>
      {words.map((w, n) => (
        <span key={w} data-word aria-hidden={n !== i} className="absolute left-0 top-0 whitespace-nowrap text-[var(--accent-ink)]" style={{ opacity: n === 0 ? 1 : 0 }}>
          {w}
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const t = useT(homepageDict);
  const root = useRef<HTMLElement>(null);
  const words = t('heroWords').split('|');

  useGsap(({ gsap, reduced, scope }) => {
    if (reduced) return;
    const letters = Array.from(scope.querySelectorAll<HTMLElement>('[data-letter]'));
    const mark = scope.querySelector<HTMLElement>('[data-wordmark]')!;

    // Entrance: the letters rise out of the baseline, the line follows.
    gsap.from(letters, { yPercent: 105, duration: 1.6, stagger: 0.07, ease: 'expo.out', delay: 0.1 });
    gsap.from(scope.querySelectorAll('[data-hero-line]'), { yPercent: 100, opacity: 0, duration: 1.3, stagger: 0.1, delay: 0.45, ease: 'expo.out' });

    // Scroll: the wordmark sinks back while the night section covers the stage.
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: scope, start: 'top top', end: 'bottom top', scrub: 0.8 },
    })
      .to(mark, { scale: 0.86, yPercent: -8, transformOrigin: '50% 100%', duration: 1 }, 0)
      .to(letters, { yPercent: (i) => [-6, 4, -10, 6, -4][i] ?? 0, duration: 1 }, 0)
      .to(scope.querySelector('[data-hero-copy]'), { yPercent: -60, opacity: 0, duration: 0.6 }, 0);

    // Pointer: letters near the cursor get heavier (the face is variable).
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const weights = letters.map((el) => gsap.quickTo(el, '--w', { duration: 0.6, ease: 'power3' }));
    const onMove = (e: PointerEvent) => {
      letters.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        const near = Math.max(0, 1 - d / (window.innerWidth * 0.32));
        weights[i](700 - near * 480);
      });
    };
    const onLeave = () => weights.forEach((w) => w(700));
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, root);

  return (
    <section ref={root} data-tone="light" aria-labelledby="hero-title" className="relative h-[200svh] bg-[var(--paper)]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end overflow-hidden px-5 pb-[clamp(10px,2vw,28px)] md:px-10 lg:px-[3vw]">
        <div data-hero-copy className="mb-[clamp(28px,5svh,64px)] flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h1 id="hero-title" className="overflow-hidden text-[clamp(30px,7.4vw,40px)] font-semibold leading-[1.08] tracking-[-0.04em] text-ink md:text-[clamp(40px,3.8vw,68px)]">
            <span data-hero-line className="block">{t('heroLine')}</span>
            <span data-hero-line className="block text-ink-2">
              {t('heroFor')} <RotatingWords words={words} />
            </span>
          </h1>
          <p data-hero-line className="max-w-[30ch] text-[16px] leading-[1.5] text-ink-2 md:pb-2 md:text-right md:text-[18px]">{t('heroText')}</p>
        </div>

        <p
          aria-hidden="true"
          data-wordmark
          className="flex w-full justify-between overflow-hidden leading-[0.74] text-ink [font-size:min(34.5vw,62svh)] [font-weight:700] tracking-[-0.06em]"
        >
          {'pokyh'.split('').map((l, n) => (
            <span key={n} data-letter className="inline-block pb-[0.06em] [--w:700] [font-variation-settings:'wght'_var(--w)]">
              {l}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
