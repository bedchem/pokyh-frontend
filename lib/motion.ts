'use client';

// GSAP setup shared by every animated component: GSAP loads when it is first
// needed (lib/gsap.ts, a chunk of its own), animations are scoped to a
// component and reverted on unmount, and anyone who prefers reduced motion
// gets the end state without movement.

import { useEffect, type DependencyList, type RefObject } from 'react';
import type { gsap as Gsap } from 'gsap';
import type { ScrollTrigger as ScrollTriggerClass } from 'gsap/ScrollTrigger';
import type { SplitText as SplitTextClass } from 'gsap/SplitText';
import { afterFirstInput } from '@/lib/first-input';

export interface Motion {
  gsap: typeof Gsap;
  ScrollTrigger: typeof ScrollTriggerClass;
  SplitText: typeof SplitTextClass;
}

let loading: Promise<Motion> | null = null;
let loaded: Motion | null = null;

/** GSAP with its plugins, registered once; the same promise for every caller. */
export function loadGsap(): Promise<Motion> {
  loading ??= import('./gsap').then((m) => (loaded = { gsap: m.gsap, ScrollTrigger: m.ScrollTrigger, SplitText: m.SplitText }));
  return loading;
}

/** GSAP if it has loaded already, else null (nothing is loaded for it). */
export function gsapIfLoaded(): Motion | null {
  return loaded;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type Setup = () => void | (() => void);

export interface GsapSetup extends Motion {
  reduced: boolean;
  scope: HTMLElement;
  near: (build: Setup) => void;
}

/**
 * Runs `setup` inside a gsap.context scoped to `scope`, so selector strings
 * only match inside the component and everything is reverted on unmount or
 * when `deps` change. `reduced` tells the callback to jump to end states. It
 * runs once GSAP has loaded, after the component has been drawn: nothing
 * set up here may be needed for the first paint.
 *
 * `near(build)` runs `build` only once `scope` is within a screen of the
 * view (at once when it already is, or is past it), in the same context.
 * Reveals set up there put their faint start on the text only shortly before
 * it is seen: on the page as loaded, text further down stays at full
 * strength (contrast checkers read faint text as too pale to read).
 *
 * `lazy`: for scroll-driven animations of what is not on the first screen.
 * They are set up after the visitor's first input (lib/first-input.ts), each
 * in an idle task of its own, instead of while the page comes alive: nothing
 * of them shows before the first scroll, and setting them up measures the
 * whole page.
 */
export function useGsap(
  setup: (ctx: GsapSetup) => void | (() => void),
  scope: RefObject<HTMLElement | null>,
  deps: DependencyList = [],
  { lazy = false }: { lazy?: boolean } = {},
): void {
  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    let gone = false;
    let ctx: gsap.Context | null = null;
    let cleanup: void | (() => void);
    const later: Array<() => void> = [];
    const run = () => {
      void loadGsap().then((motion) => {
        if (gone) return;
        const near = (build: Setup) => {
          motion.ScrollTrigger.create({
            trigger: el,
            start: 'top bottom+=100%',
            once: true,
            onEnter: () => ctx?.add(() => {
              const done = build();
              if (typeof done === 'function') later.push(done);
            }),
          });
        };
        ctx = motion.gsap.context(() => {
          cleanup = setup({ ...motion, reduced: prefersReducedMotion(), scope: el, near });
        }, el);
      });
    };
    const cancel = lazy ? afterFirstInput(run) : (run(), () => {});
    return () => {
      gone = true;
      cancel();
      later.forEach((done) => done());
      if (typeof cleanup === 'function') cleanup();
      ctx?.revert();
    };
    // The caller's dependencies, as with useEffect itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Text reveals of the public pages. Nothing moves: words light up one after
// another, as in the manifest, and the rest fades in.

/** Words (or letters) go from faint to full, one after another. */
export function lightUp(g: typeof Gsap, targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) {
  return g.fromTo(targets, { opacity: 0.12 }, { opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power1.out', ...vars });
}

/** A plain fade. */
export function fadeIn(g: typeof Gsap, targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) {
  return g.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.9, stagger: 0.1, ease: 'power2.out', ...vars });
}
