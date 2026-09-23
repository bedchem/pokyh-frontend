import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from '@/lib/session-crypto';
import { isMensaRoute, isProtectedAppRoute } from '@/lib/routes';

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, localizePath, type Locale } from '@/lib/i18n/locale';

// Assets and public APIs: never localised, never require a session
const PUBLIC_PREFIXES = [
  '/_next',
  '/_vercel',
  '/.well-known',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icons',
  '/icon',
  '/apple-icon',
  '/opengraph-image',
  '/POKYH_Logo',
  '/api/webuntis/login',
  '/api/mensa',
  '/models',
  '/draco',
  '/og-image',
  '/tutorials_Screenshots',
  '/pokyh_ion',
];

// Pages that are public (checked on the path without the locale prefix)
const PUBLIC_PAGE_PREFIXES = ['/legal', '/about', '/faq', '/comparison', '/howto', '/get'];

function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const accept = request.headers.get('accept-language') ?? '';
  for (const part of accept.split(',')) {
    const code = part.split(';')[0].trim().toLowerCase().split('-')[0];
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

function redirectTo(request: NextRequest, pathname: string, search = request.nextUrl.search) {
  // Plain URL instead of nextUrl.clone(): NextURL re-normalises the trailing slash
  return NextResponse.redirect(new URL(pathname + search, request.url));
}

const SESSION_MAX_MS = 4 * 60 * 60 * 1000; // 4 hours — must match COOKIE_OPTS.maxAge in login/route.ts

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get('pockyh_session')?.value;
  if (!cookie) return false;
  const session = await decryptSession<{ sessionId: string; loginAt?: number }>(cookie);
  if (!session?.sessionId) return false;
  if (session.loginAt && Date.now() - session.loginAt > SESSION_MAX_MS) return false;
  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets and explicitly public paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    // Allow internal auth APIs
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    // API routes: return JSON 401 (don't redirect — iframes can't follow
    // redirects to pages that set X-Frame-Options: deny, which breaks
    // attachment previews and any other in-frame fetch).
    if (!(await hasValidSession(request))) {
      const res = NextResponse.json({ error: 'session_expired' }, { status: 401 });
      res.cookies.delete('pockyh_session');
      res.cookies.delete('pockyh_user');
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

  // Every page lives under a locale prefix with a trailing slash: /about → /de/about/
  const segments = pathname.split('/').filter(Boolean);
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

  // Mensa menu is public; rating and commenting stay behind the login in the UI.
  // Drop a stale user cookie so the client renders the guest view instead of
  // hitting 401s and bouncing to /login.
  if (isMensaRoute(path)) {
    const res = NextResponse.next();
    if (!authenticated && request.cookies.has('pockyh_user')) {
      res.cookies.delete('pockyh_session');
      res.cookies.delete('pockyh_user');
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
    res.cookies.delete('pockyh_session');
    res.cookies.delete('pockyh_user');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_vercel|favicon\\.ico|POKYH_Logo\\.png|icon-.*\\.png|icons|apple-icon|manifest\\.(?:json|webmanifest)|robots\\.txt|sitemap\\.xml|\\.well-known|draco|tutorials_Screenshots|pokyh_ion\\.png).*)',
  ],
};
