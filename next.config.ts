import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

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
// address in development).
const API_PATHS = [
  'webuntis', 'auth', 'dishes', 'dish-ratings', 'dish-comments', 'users', 'classes', 'sse',
  'subject-images', 'activity-log', 'client-errors', 'usage', 'privacy', 'push', 'popups',
];
const DEV_API_TARGET = (process.env.API_DEV_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_BACKEND_URL ?? 'https://api.pokyh.com').replace(/\/$/, '');

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

  // Allow LAN devices to access the dev server (e.g. mobile testing)
  allowedDevOrigins: ['192.168.178.90', '192.168.178.*'],

  // No image server in a static site: images are served as they are (the
  // repository's images are already sized and compressed).
  images: { unoptimized: true },

  // Disable X-Powered-By header (don't leak Next.js version)
  poweredByHeader: false,

  // Enable React strict mode for better debugging
  reactStrictMode: true,
};

export default function nextConfig(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      ...base,
      // The API's calls must not be redirected to an address with a slash.
      skipTrailingSlashRedirect: true,
      async rewrites() {
        return API_PATHS.flatMap((p) => [
          { source: `/${p}`, destination: `${DEV_API_TARGET}/${p}` },
          { source: `/${p}/:path*`, destination: `${DEV_API_TARGET}/${p}/:path*` },
        ]);
      },
    };
  }
  return { ...base, output: 'export' };
}
