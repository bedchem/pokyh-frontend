import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from '@/lib/session-crypto';
import { isCanteenRoute, isMensaRoute, isProtectedAppRoute } from '@/lib/routes';

import { DEFAULT_LOCALE, FALLBACK_LOCALE, LOCALE_COOKIE, RETIRED_LOCALES, isLocale, localizePath, type Locale } from '@/lib/i18n/locale';

// Assets and public APIs: never localised, never require a session
const PUBLIC_PREFIXES = [
  '/_next',
  '/_vercel',
  '/.well-known',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
  '/llms-full.txt',
  '/indexnow.txt',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icons',
  '/icon',
  '/apple-icon',
  '/opengraph-image',
  '/POKYH_Logo',
  '/api/webuntis/login',
  '/api/webuntis/password-reset',
  '/api/webuntis/schools',
  '/api/mensa',
  '/api/privacy-notice',
  '/models',
  '/draco',
  '/og-image',
  '/tutorials_Screenshots',
  '/pokyh_ion',
];

// Cookie names before the rename, with the options they are set with
// (api/webuntis/login, api/auth/*, LocaleProvider).
const LEGACY_COOKIES = [
  { name: 'session', httpOnly: true, maxAge: 4 * 60 * 60 },
  { name: 'user', httpOnly: false, maxAge: 4 * 60 * 60 },
  { name: 'api_token', httpOnly: false, maxAge: 8 * 60 * 60 },
  { name: 'api_refresh', httpOnly: true, maxAge: 30 * 24 * 60 * 60 },
  { name: 'locale', httpOnly: false, maxAge: 365 * 24 * 60 * 60 },
];

// Pages that are public (checked on the path without the locale prefix)
const PUBLIC_PAGE_PREFIXES = ['/legal', '/about', '/faq', '/comparison', '/howto', '/get', '/webuntis', '/tools'];

function preferredLocale(request: NextRequest): Locale {
  const usable = (value: string | undefined): value is Locale =>
    isLocale(value) && !(RETIRED_LOCALES as readonly string[]).includes(value);
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (usable(saved)) return saved;
  const accept = request.headers.get('accept-language') ?? '';
  for (const part of accept.split(',')) {
    const code = part.split(';')[0].trim().toLowerCase().split('-')[0];
    if (usable(code)) return code;
  }
  return FALLBACK_LOCALE;
}

function redirectTo(request: NextRequest, pathname: string, search = request.nextUrl.search) {
  // Plain URL instead of nextUrl.clone(): NextURL re-normalises the trailing slash
  return NextResponse.redirect(new URL(pathname + search, request.url));
}

const SESSION_MAX_MS = 4 * 60 * 60 * 1000; // 4 hours: must match COOKIE_OPTS.maxAge in login/route.ts

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get('pokyh_session')?.value;
  if (!cookie) return false;
  const session = await decryptSession<{ sessionId: string; loginAt?: number }>(cookie);
  if (!session?.sessionId) return false;
  if (session.loginAt && Date.now() - session.loginAt > SESSION_MAX_MS) return false;
  return true;
}

// The legal texts used to be one page with ?view=<text> (and ?lang=); each has
// its own prerendered page now. Older links (apps, Pokyh Learn, search
// results) get one permanent redirect to the clean address.
const LEGAL_TEXTS = new Set(['impressum', 'datenschutz', 'nutzungsbedingungen', 'cookies', 'learn']);
const OLD_LEGAL_PATH = /^\/(?:([a-z]{2,3})\/)?legal\/?$/;

function legacyLegalRedirect(request: NextRequest): NextResponse | null {
  const match = OLD_LEGAL_PATH.exec(request.nextUrl.pathname);
  const view = request.nextUrl.searchParams.get('view');
  if (!match || !view || !LEGAL_TEXTS.has(view)) return null;
  const usable = (value: string | null | undefined): value is Locale =>
    isLocale(value) && !(RETIRED_LOCALES as readonly string[]).includes(value);
  const asked = request.nextUrl.searchParams.get('lang');
  const lang = usable(asked) ? asked : usable(match[1]) ? match[1] : preferredLocale(request);
  return NextResponse.redirect(new URL(`/${lang}/legal/${view}/`, request.url), 308);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legal = legacyLegalRedirect(request);
  if (legal) return legal;

  // Always allow static assets and explicitly public paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    // Allow internal auth APIs
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    // API routes: return JSON 401 (don't redirect, iframes can't follow
    // redirects to pages that set X-Frame-Options: deny, which breaks
    // attachment previews and any other in-frame fetch).
    if (!(await hasValidSession(request))) {
      const res = NextResponse.json({ error: 'session_expired' }, { status: 401 });
      res.cookies.delete('pokyh_session');
      res.cookies.delete('pokyh_user');
      return res;
    }
    return NextResponse.next();
  }

  // Other static files (anything with a file extension) are served as-is
  if (/\.[a-z0-9]+$/i.test(pathname)) {
    return NextResponse.next();
  }

  // Generated metadata images (e.g. /de/login/opengraph-image) are files, not pages:
  // no trailing slash and no login, so link-preview crawlers get them directly.
  if (/\/(opengraph-image|twitter-image|icon|apple-icon)(-[\w-]+)?$/.test(pathname)) {
    return NextResponse.next();
  }

  // Cookies from before the rename (pockyh_* → pokyh_*): moved over once on the
  // next page load, so nobody is signed out by the new names.
  if (request.method === 'GET') {
    const legacy = LEGACY_COOKIES.filter((c) => request.cookies.has(`pockyh_${c.name}`));
    if (legacy.length) {
      const res = NextResponse.redirect(request.url, 307);
      for (const c of legacy) {
        if (!request.cookies.has(`pokyh_${c.name}`)) {
          res.cookies.set(`pokyh_${c.name}`, request.cookies.get(`pockyh_${c.name}`)!.value, {
            path: '/',
            httpOnly: c.httpOnly,
            secure: c.name !== 'locale' && process.env.NODE_ENV === 'production',
            sameSite: c.name === 'locale' ? 'lax' : 'strict',
            maxAge: c.maxAge,
          });
        }
        res.cookies.delete(`pockyh_${c.name}`);
      }
      return res;
    }
  }

  // Every page lives under a locale prefix with a trailing slash: /about → /de/about/
  const segments = pathname.split('/').filter(Boolean);
  // Retired languages (Ladin) keep working as links but land on the German page.
  if ((RETIRED_LOCALES as readonly string[]).includes(segments[0] ?? '')) {
    return redirectTo(request, localizePath('/' + segments.slice(1).join('/'), DEFAULT_LOCALE));
  }
  if (!isLocale(segments[0])) {
    return redirectTo(request, localizePath(pathname, preferredLocale(request)));
  }
  if (!pathname.endsWith('/')) {
    return redirectTo(request, `${pathname}/`);
  }

  const locale = segments[0];
  // Path without locale prefix and trailing slash, e.g. /de/home/ → /home
  const path = '/' + segments.slice(1).join('/');

  const res = await handlePage(request, path, locale);
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    res.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  }
  return res;
}

async function handlePage(request: NextRequest, path: string, locale: Locale): Promise<NextResponse> {
  // Root → everyone sees the landing page, no auto-redirect
  if (path === '/' || PUBLIC_PAGE_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  const authenticated = await hasValidSession(request);

  // Login page: authenticated users go straight to /home
  if (path === '/login') {
    if (authenticated) {
      return redirectTo(request, `/${locale}/home/`, '');
    }
    return NextResponse.next();
  }

  // The Mensa exists twice: the public page (/mensa), open to everyone and
  // signed-in accounts too (they see their comments there as well), and the
  // one inside the app (/canteen). Guests are sent from the app's to the
  // public one; a dish page keeps its dish: /canteen/dish/x → /mensa/dish/x.
  if (isCanteenRoute(path) && !authenticated) {
    return redirectTo(request, `/${locale}/mensa${path.slice('/canteen'.length)}/`);
  }

  // Mensa menu is public; rating and commenting stay behind the login in the UI.
  // Drop a stale user cookie so the client renders the guest view instead of
  // hitting 401s and bouncing to /login.
  if (isMensaRoute(path)) {
    const res = NextResponse.next();
    if (!authenticated && request.cookies.has('pokyh_user')) {
      res.cookies.delete('pokyh_session');
      res.cookies.delete('pokyh_user');
    }
    return res;
  }

  // Unknown pages render the 404 page instead of asking for a login
  if (!isProtectedAppRoute(path)) {
    return NextResponse.next();
  }

  // All other routes require a valid session
  if (!authenticated) {
    const pathname = request.nextUrl.pathname;
    // Only propagate safe relative paths (no protocol-relative or absolute URLs)
    const search = pathname.startsWith('/') && !pathname.startsWith('//')
      ? `?next=${encodeURIComponent(pathname)}`
      : '';
    const res = redirectTo(request, `/${locale}/login/`, search);
    // Clear any stale cookies
    res.cookies.delete('pokyh_session');
    res.cookies.delete('pokyh_user');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_vercel|favicon\\.ico|POKYH_Logo\\.png|icon-.*\\.png|icons|apple-icon|manifest\\.(?:json|webmanifest)|robots\\.txt|sitemap\\.xml|\\.well-known|draco|tutorials_Screenshots|pokyh_ion\\.png).*)',
  ],
};
