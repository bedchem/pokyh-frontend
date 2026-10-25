import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import { DEFAULT_API_URL } from './lib/backend';
import { DEFAULT_SITE_URL } from './lib/site-url';

// The website is a static export (`next build` writes out/): plain files that
// any web server or CDN can serve. Everything dynamic happens in the browser,
// which talks to the POKYH API (api.pokyh.com) directly — WebUntis included,
// through the API's /webuntis/* routes (lib/backend.ts).
//
// What a Next server did before now lives with the web server, in two
// equivalent forms (keep them in step):
//   deploy/nginx.conf          the Docker image (security headers, redirects,
//                              language detection, the id pages, caching)
//   public/_headers, _redirects  Cloudflare Pages and similar hosts

// A number from the environment; unset or empty keeps the default.
const envSeconds = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return process.env[name]?.trim() && Number.isFinite(value) && value >= 0 ? value : fallback;
};

// The API's top-level paths the website calls. `next dev` passes them on to
// the API on its own address, so the API's cookies land on localhost and the
// website runs as it does in production (lib/backend.ts uses '' as the API
// address in development). They go through app/dev-api, which drops the
// browser's Origin the API's CORS would refuse.
const API_PATHS = [
  'webuntis', 'auth', 'dishes', 'dish-ratings', 'dish-comments', 'users', 'classes', 'sse',
  'subject-images', 'activity-log', 'client-errors', 'usage', 'privacy', 'push', 'popups', 'recaps',
];

const base: NextConfig = {
  // The development badge would sit on the sidebar's profile and settings.
  devIndicators: { position: 'bottom-right' },

  // Pages always end with a slash and are written as <page>/index.html.
  trailingSlash: true,

  experimental: {
    // inlineCss stays off: it blocks the ::view-transition-* pseudo-elements.
    // Root layout lives in app/[lang], so unmatched URLs need their own full
    // 404 document (app/global-not-found.tsx, written as 404.html).
    globalNotFound: true,
    // Only the icons that are used end up in the bundle
    optimizePackageImports: ['@phosphor-icons/react'],
    // How long pages stay in the browser's router cache (seconds), so going
    // back and forth between pages does not fetch them again. The data on
    // the pages loads in the browser and refreshes on its own.
    staleTimes: {
      dynamic: envSeconds('NEXT_STALE_DYNAMIC', 60),
      static: envSeconds('NEXT_STALE_STATIC', 300),
    },
  },

  // Devices on the local network that may open the dev server (testing on a
  // phone): DEV_ALLOWED_ORIGINS, comma-separated hosts, `*` as a wildcard.
  allowedDevOrigins: (process.env.DEV_ALLOWED_ORIGINS ?? '').split(',').map((host) => host.trim()).filter(Boolean),

  // No image server in a static site: images are served as they are (the
  // repository's images are already sized and compressed).
  images: { unoptimized: true },

  // Disable X-Powered-By header (don't leak Next.js version)
  poweredByHeader: false,

  // Enable React strict mode for better debugging
  reactStrictMode: true,
};

// A built site never names a local address. Built with the development
// settings (.env.local), every canonical link, the sitemap and robots.txt
// would say localhost, and the pages would ask the visitor's own computer for
// the API. Such a value is replaced before the build, which still goes
// through; NEXT_PUBLIC_API_LOCAL=true keeps a local API, to test the built
// site against a backend on this machine. The test runs here only, so it never
// reaches the browser.
//
// localhost, loopback, unspecified, private networks and .local names.
const LOCAL_ADDRESS = /^https?:\/\/(?:localhost|127\.|0\.0\.0\.0|\[::1?\]|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|[^/:]+\.local(?=[:/]|$))/i;

function publicAddress(name: string, fallback: string): void {
  const value = process.env[name]?.trim();
  if (!value || !LOCAL_ADDRESS.test(value)) return;
  console.warn(`${name} is a local address (${value}); this build uses ${fallback}.`);
  process.env[name] = fallback;
}

export default function nextConfig(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      ...base,
      // Files ending in .dev.ts are routes in development only (app/dev-api).
      pageExtensions: ['dev.ts', 'tsx', 'ts', 'jsx', 'js'],
      // The API's calls must not be redirected to an address with a slash.
      skipTrailingSlashRedirect: true,
      async rewrites() {
        return API_PATHS.flatMap((p) => [
          { source: `/${p}`, destination: `/dev-api/${p}` },
          { source: `/${p}/:path*`, destination: `/dev-api/${p}/:path*` },
        ]);
      },
    };
  }
  publicAddress('NEXT_PUBLIC_SITE_URL', DEFAULT_SITE_URL);
  if (process.env.NEXT_PUBLIC_API_LOCAL !== 'true') {
    publicAddress('NEXT_PUBLIC_API_BACKEND_URL', DEFAULT_API_URL);
    publicAddress('NEXT_PUBLIC_API_URL', DEFAULT_API_URL);
  }
  return { ...base, output: 'export' };
}
