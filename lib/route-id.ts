'use client';

import { useSyncExternalStore } from 'react';
import { ROUTE_PLACEHOLDER } from './route-placeholder';

// Detail pages with an id in the address (/de/messages/123/, /de/mensa/dish/x/)
// are built once, for the placeholder id "_": the website is static and the ids
// are only known in the browser. The web server answers every id with that one
// page (deploy/nginx.conf, public/_redirects), and the page reads the real id
// from the address. During the server render and hydration the placeholder is
// in effect (so the markup matches); right after, the real id.

export { ROUTE_PLACEHOLDER };

const noSubscription = () => () => {};

/** The address's last segment (still URL-encoded), e.g. "123" of /de/messages/123/. */
function lastSegment(): string {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? ROUTE_PLACEHOLDER;
}

/**
 * The real id of a detail page. `param` is the route's own parameter: the
 * real id under `next dev`, the placeholder in the built website.
 */
export function useRouteId(param: string): string {
  return useSyncExternalStore(
    noSubscription,
    () => (param === ROUTE_PLACEHOLDER ? lastSegment() : param),
    () => param,
  );
}
