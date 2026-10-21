// The id the detail pages are built for (see lib/route-id.ts). Its own module,
// without 'use client', so the routes' generateStaticParams can import it.

export const ROUTE_PLACEHOLDER = '_';

/** For the routes' generateStaticParams: the one page every id is served from. */
export function placeholderParams() {
  return [{ id: ROUTE_PLACEHOLDER }];
}
