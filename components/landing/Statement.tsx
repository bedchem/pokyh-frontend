'use client';

import { useRef, type ReactNode } from 'react';
import { SplitText, useGsap } from '@/lib/motion';

// A display title and a long sentence whose words light up as you scroll.
// *Starred* words are highlighted. On night sections the block is pinned
// while it plays (as in the hero → mission hand-over); on paper it plays as
// the section passes.

type Token = { text: string; hl: boolean };

export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  text.split('*').forEach((part, n) => {
    part.split(/\s+/).filter(Boolean).forEach((w) => out.push({ text: w, hl: n % 2 === 1 }));
  });
  return out;
}

export default function Statement({
  title,
  text,
  tone,
  id,
  rise = false,
  className = '',
  children,
}: {
  title: string;
  text: string;
  tone: 'dark' | 'light';
  id: string;
  /** Slides over the section before it, with a slanted top edge that straightens. */
  rise?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  const dark = tone === 'dark';
  const tokens = tokenize(text);
  // Final colours of plain and highlighted words.
  const plain = dark ? '#8A8781' : '#161513';
  const lit = dark ? '#C3BDFF' : '#4F46E5';
  const off = dark ? 'rgba(255,255,255,0.09)' : 'rgba(22,21,19,0.1)';

  useGsap(({ gsap, reduced, scope }) => {
    const words = gsap.utils.toArray<HTMLElement>(scope.querySelectorAll('[data-w]'));
    if (reduced) return;
    const blur = window.matchMedia('(min-width: 768px)').matches;
    const split = SplitText.create(scope.querySelector('[data-st-title]'), { type: 'chars' });
    const after = scope.querySelector('[data-st-after]');

    gsap.set(words, { color: off, filter: blur ? 'blur(9px)' : 'none' });
    if (after) gsap.set(after, { opacity: 0, y: 24 });

    if (rise) {
      gsap.fromTo(
        scope,
        { clipPath: 'polygon(0% 16vw, 100% 0vw, 100% 100%, 0% 100%)' },
        { clipPath: 'polygon(0% 0vw, 100% 0vw, 100% 100%, 0% 100%)', ease: 'none', scrollTrigger: { trigger: scope, start: 'top bottom', end: 'top top', scrub: 0.6 } },
      );
    }

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: dark
        ? { trigger: scope, start: 'top top', end: '+=150%', pin: scope.querySelector('[data-st-pin]'), scrub: 0.6 }
        : { trigger: scope, start: 'top 70%', end: 'bottom 75%', scrub: 0.6 },
    });
    tl.from(split.chars, {
      opacity: 0,
      yPercent: 70,
      xPercent: 60,
      filter: 'blur(10px)',
      stagger: 0.05,
      duration: 0.5,
      ease: 'power2.out',
    }, 0);
    tl.to(words, {
      color: (_i: number, el: HTMLElement) => (el.dataset.hl ? lit : plain),
      filter: 'blur(0px)',
      stagger: 0.06,
      duration: 0.5,
    }, 0.25);
    if (after) tl.to(after, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
    if (dark) tl.to({}, { duration: 0.4 });
    return () => split.revert();
  }, root);

  return (
    <section
      ref={root}
      id={id}
      data-tone={tone}
      aria-labelledby={`${id}-title`}
      className={`${dark ? 'bg-[var(--night)] text-white' : 'bg-[var(--paper)] text-ink'} ${rise ? 'relative z-10 -mt-[100svh]' : ''} ${className}`}
    >
      <div data-st-pin className="flex min-h-[100svh] flex-col items-center justify-center px-5 py-28 text-center md:px-10">
        <h2 id={`${id}-title`} data-st-title className="font-display text-[clamp(46px,12vw,64px)] leading-[1.05] md:text-[clamp(56px,5.2vw,96px)]">
          {title}
        </h2>
        <p className="mt-6 max-w-[23em] text-[clamp(25px,6.6vw,34px)] font-medium leading-[1.3] tracking-[-0.028em] md:mt-[clamp(24px,2.6vw,44px)] md:text-[clamp(30px,3.1vw,52px)]">
          {tokens.map((tok, n) => (
            <span key={n}>
              <span data-w data-hl={tok.hl ? '1' : undefined} style={{ color: tok.hl ? lit : plain }}>
                {tok.text}
              </span>{' '}
            </span>
          ))}
        </p>
        {children && <div data-st-after className="mt-12 md:mt-16">{children}</div>}
      </div>
    </section>
  );
}
