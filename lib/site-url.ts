// The website's public address, named by the canonical links, hreflang, Open
// Graph, the sitemap, robots.txt, llms.txt and the structured data: from
// NEXT_PUBLIC_SITE_URL (frozen when the site is built), without a trailing
// slash, https://pokyh.com when it is not set. A production build never names
// a local address: next.config.ts replaces one before the build starts.

export const DEFAULT_SITE_URL = 'https://pokyh.com';

// localhost, loopback, unspecified, private networks and .local names.
const LOCAL_ADDRESS = /^https?:\/\/(?:localhost|127\.|0\.0\.0\.0|\[::1?\]|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|[^/:]+\.local(?=[:/]|$))/i;

/** Whether an address only exists on this computer or network (development settings). */
export const isLocalAddress = (url: string) => LOCAL_ADDRESS.test(url.trim());

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '') || DEFAULT_SITE_URL;
