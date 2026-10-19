'use client';

import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from '@/lib/motion';
import { inputKind, isPace, SCROLL, type InputKind } from '@/lib/scroll-pace';

// Smooth scrolling for the public pages. Lenis drives the native scroll
// position (so anchors, find-in-page and assistive tech keep working) and is
// ticked by GSAP so ScrollTrigger reads the same position every frame.
// The page glides slowly after the wheel or trackpad; each homepage scene
// sets its own pace (`data-scroll-pace`, values in lib/scroll-pace.ts): the
// scene in the middle of the screen decides, and the speed eases over to it.
// Wheels and trackpads are told apart, so each can be tuned on its own.
// Off for reduced motion and for touch input, where the system's own momentum
// is the natural feel. Nested scroll areas (sheets, menus, lists) keep
// scrolling on their own.

// After a page change, the rest of a trackpad flick (the system keeps sending
// momentum wheel events for a second or so) must not scroll the new page on
// its own. Events are swallowed while they keep coming in one stream; a new
// gesture after a short pause scrolls normally.
const navGate = { active: false, last: 0, until: 0, delta: Infinity };
function armGate() {
  const now = performance.now();
  Object.assign(navGate, { active: true, last: now, until: now + 1600, delta: Infinity });
}
/** Armed the moment a link to another page is clicked, before the new page renders. */
function onLinkClick(e: MouseEvent) {
  const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a || a.target === '_blank' || e.defaultPrevented) return;
  const url = new URL(a.href, window.location.href);
  if (url.origin === window.location.origin && url.pathname !== window.location.pathname) armGate();
}
/**
 * True for the tail of a flick: events that keep coming in one stream (by the
 * time the system created them, not when the busy page got to them) and do
 * not grow. A pause or a stronger push is a new gesture and scrolls.
 */
function swallowMomentum(event: WheelEvent | TouchEvent | KeyboardEvent): boolean {
  if (!navGate.active || !('deltaY' in event)) return false;
  const at = event.timeStamp;
  const delta = Math.abs(event.deltaY) + Math.abs(event.deltaX);
  if (at > navGate.until || at - navGate.last > 160 || delta > navGate.delta * 1.5 + 4) {
    navGate.active = false;
    return false;
  }
  navGate.last = at;
  navGate.delta = delta;
  return true;
}

/** The scene under the middle of the screen (the one on top where scenes overlap). */
function sceneAtCentre(): number {
  const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
  const name = el?.closest<HTMLElement>('[data-scroll-pace]')?.dataset.scrollPace;
  return isPace(name) ? SCROLL.pace[name] : SCROLL.pace.page;
}

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
    // The pace in effect follows the scene's pace smoothly (time-based).
    const pace = { current: sceneAtCentre(), target: sceneAtCentre(), probed: 0 };
    // The device of the current wheel stream: a stream that is under way keeps
    // its kind, so a trackpad's slow tail is not taken for a mouse.
    const input: { kind: InputKind; at: number } = { kind: 'wheel', at: -Infinity };
    const instance = new Lenis({
      lerp: SCROLL.lerp.wheel,
      // Applied per device below.
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      allowNestedScroll: true,
      anchors: { offset: -80 },
      stopInertiaOnNavigate: true,
      virtualScroll: (data) => {
        if (data.event.type.includes('wheel')) {
          if (swallowMomentum(data.event)) {
            // Lenis lets go of an event it is told to skip; the browser must not scroll natively either.
            if (data.event.cancelable) data.event.preventDefault();
            return false;
          }
          const event = data.event as WheelEvent;
          const since = event.timeStamp - input.at;
          const kind = inputKind(event, since);
          input.kind = kind === 'wheel' && input.kind === 'precise' && since < 60 && Math.abs(event.deltaY) < 50 ? 'precise' : kind;
          input.at = event.timeStamp;
          // Read by Lenis for this very event (onVirtualScroll → scrollTo).
          instance.options.lerp = SCROLL.lerp[input.kind];
          const gear = SCROLL.gear[input.kind] * pace.current;
          data.deltaX *= gear;
          data.deltaY *= gear;
        }
        return true;
      },
    });
    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number, deltaMs: number) => {
      // Which scene is in charge: checked a few times a second, not every frame.
      if (time - pace.probed > 0.12) {
        pace.probed = time;
        pace.target = sceneAtCentre();
      }
      pace.current += (pace.target - pace.current) * (1 - Math.exp(-(deltaMs / 1000) * SCROLL.blend));
      instance.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', onLinkClick, true);
    window.addEventListener('popstate', armGate);
    setCurrent(instance);
    return () => {
      document.removeEventListener('click', onLinkClick, true);
      window.removeEventListener('popstate', armGate);
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
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname, lenis]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
