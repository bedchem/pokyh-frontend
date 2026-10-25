'use client';

import dynamic from 'next/dynamic';

// Next sends the not-found boundary along with every page. Imported directly,
// the 404 (its pixel art, and outside the public pages the site's frame with
// GSAP and Lenis) would load on every page as well; loaded here, it comes
// only when a 404 is really shown. The dynamic import has to sit in a Client
// Component: from a Server Component, Next does not split the code
// (node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md).
const NotFoundInFrame = dynamic(() => import('./NotFoundInFrame'));
const NotFoundView = dynamic(() => import('./NotFoundView'));

/** The 404 in the site's frame, for pages outside it. */
export default function LazyNotFound() {
  return <NotFoundInFrame />;
}

/** The 404 alone, for the public pages (their layout is the frame). */
export function LazyNotFoundView() {
  return <NotFoundView />;
}
