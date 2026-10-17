'use client';

import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from '@/lib/motion';

// Smooth scrolling for the homepage. Lenis drives the native scroll position
// (so anchors, find-in-page and assistive tech keep working) and is ticked by
// GSAP so ScrollTrigger reads the same position every frame. Off on the other
// public pages, for reduced motion and on touch devices, where native
// momentum is better.

const LenisContext = createContext<Lenis | null>(null);

// The running instance lives outside React and is read with
// useSyncExternalStore, so creating it in an effect causes no extra render pass.
let current: Lenis | null = null;
const listeners = new Set<() => void>();
function setCurrent(next: Lenis | null) {
  current = next;
  listeners.forEach((fn) => fn());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

export default function SmoothScroll({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const lenis = useSyncExternalStore(subscribe, () => current, () => null);
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const gsap = ensureGsap();
    const instance = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      syncTouch: false,
      anchors: { offset: -80 },
    });
    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setCurrent(instance);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setCurrent(null);
    };
  }, [enabled]);

  // New page: start at the top and let ScrollTrigger measure the new layout.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.location.hash) return;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname, lenis]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
