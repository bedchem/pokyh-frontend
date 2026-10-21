import { ACTIVE_LOCALES, FALLBACK_LOCALE, LOCALE_NAMES } from '@/lib/i18n/locale';
import { localeRedirectScript } from '@/lib/locale-redirect';

// The site's root (/): every page lives under a language, so the root only
// sends on to the right one (lib/locale-redirect.ts). Written as index.html
// when the website is built. nginx redirects on the server before this file
// is ever read (deploy/nginx.conf); other hosts serve it, and search engines
// find every language version in its alternate links.

export const dynamic = 'force-static';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com').replace(/\/$/, '');

export function GET() {
  const links = ACTIVE_LOCALES.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}/${l}/">`).join('');
  const choices = ACTIVE_LOCALES.map((l) => `<a href="/${l}/">${LOCALE_NAMES[l]}</a>`).join(' · ');
  const html = `<!doctype html><html lang="${FALLBACK_LOCALE}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
    + `<title>POKYH</title><link rel="canonical" href="${SITE_URL}/${FALLBACK_LOCALE}/">${links}<link rel="alternate" hreflang="x-default" href="${SITE_URL}/${FALLBACK_LOCALE}/">`
    + `<script>${localeRedirectScript()}</script>`
    + `<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100dvh;margin:0}a{margin:0 .4em}</style></head>`
    + `<body><noscript><p>${choices}</p></noscript></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
