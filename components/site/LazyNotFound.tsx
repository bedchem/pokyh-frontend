'use client';

import dynamic from 'next/dynamic';

// Next sends the not-found boundary along with every page. Imported directly,
// the site's frame in it (GSAP, Lenis) would load on every app page as well;
// loaded here, it comes only when a 404 is really shown. The dynamic import
// has to sit in a Client Component: from a Server Component, Next does not
// split the code (node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md).
const NotFoundInFrame = dynamic(() => import('./NotFoundInFrame'));

export default function LazyNotFound() {
  return <NotFoundInFrame />;
}
