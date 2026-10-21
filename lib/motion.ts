'use client';

// GSAP setup shared by every animated component: plugins are registered once,
// animations are scoped to a component and reverted on unmount, and anyone who
// prefers reduced motion gets the end state without movement.

import { useLayoutEffect, useEffect, type DependencyList, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { VIEWPORT_GROW_EVENT } from '@/components/ViewportScript';

let registered = false;

export function ensureGsap(): typeof gsap {
  if (!registered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin);
    // A phone's browser bars sliding in and out change only the window's
    // height: no new measuring of the scroll scenes for that (they are laid
    // out in viewport heights that stay put, components/ViewportScript.tsx).
    ScrollTrigger.config({ ignoreMobileResize: true });
    // ...unless the large viewport turned out taller than first measured.
    window.addEventListener(VIEWPORT_GROW_EVENT, () => ScrollTrigger.refresh());
    gsap.defaults({ ease: 'power3.out', duration: 0.8 });
    registered = true;
  }
  return gsap;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Runs `setup` inside a gsap.context scoped to `scope`, so selector strings
 * only match inside the component and everything is reverted on unmount or
 * when `deps` change. `reduced` tells the callback to jump to end states.
 */
export function useGsap(
  setup: (ctx: { gsap: typeof gsap; reduced: boolean; scope: HTMLElement }) => void | (() => void),
  scope: RefObject<HTMLElement | null>,
  deps: DependencyList = [],
): void {
  useIsoLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    const g = ensureGsap();
    let cleanup: void | (() => void);
    const ctx = g.context(() => {
      cleanup = setup({ gsap: g, reduced: prefersReducedMotion(), scope: el });
    }, el);
    return () => {
      if (typeof cleanup === 'function') cleanup();
      ctx.revert();
    };
  }, deps);
}

// Text reveals of the public pages. Nothing moves: words light up one after
// another, as in the manifest, and the rest fades in.

/** Words (or letters) go from faint to full, one after another. */
export function lightUp(g: typeof gsap, targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) {
  return g.fromTo(targets, { opacity: 0.12 }, { opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power1.out', ...vars });
}

/** A plain fade. */
export function fadeIn(g: typeof gsap, targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) {
  return g.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.9, stagger: 0.1, ease: 'power2.out', ...vars });
}

export { gsap, ScrollTrigger, SplitText };
