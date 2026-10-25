// The website's public address, named by the canonical links, hreflang, Open
// Graph, the sitemap, robots.txt, llms.txt and the structured data: from
// NEXT_PUBLIC_SITE_URL (frozen when the site is built), without a trailing
// slash, https://www.pokyh.com when it is not set (the address the site
// answers at; pokyh.com forwards there). A production build never names a
// local address: next.config.ts replaces one before the build starts.

export const DEFAULT_SITE_URL = 'https://www.pokyh.com';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '') || DEFAULT_SITE_URL;
