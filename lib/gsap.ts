'use client';

// GSAP with the plugins the site uses, set up once. Loaded on demand through
// loadGsap() (lib/motion.ts) and never imported by a page directly: it is the
// largest library of the public pages, and nothing it animates is needed
// before the visitor scrolls, points or opens something.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { VIEWPORT_GROW_EVENT } from '@/components/ViewportScript';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  // A phone's browser bars sliding in and out change only the window's
  // height: no new measuring of the scroll scenes for that (they are laid
  // out in viewport heights that stay put, components/ViewportScript.tsx).
  ScrollTrigger.config({ ignoreMobileResize: true });
  // ...unless the large viewport turned out taller than first measured.
  window.addEventListener(VIEWPORT_GROW_EVENT, () => ScrollTrigger.refresh());
  gsap.defaults({ ease: 'power3.out', duration: 0.8 });
}

export { gsap, ScrollTrigger, SplitText };
