import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from '@/lib/session-crypto';

// Public paths that never require a session
const PUBLIC_PREFIXES = [
  '/_next',
  '/_vercel',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icons',
  '/icon',
  '/apple-icon',
  '/POKYH_Logo',
  '/api/webuntis/login',
  '/api/mensa',
  '/legal',
  '/models',
  '/draco',
  '/og-image',
];

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

  // Allow internal auth APIs
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const authenticated = await hasValidSession(request);

  // Root → everyone sees the landing page, no auto-redirect
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Login page: authenticated users go straight to /home
  if (pathname === '/login') {
    if (authenticated) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    return NextResponse.next();
  }

  // All other routes require a valid session
  if (!authenticated) {
    // API routes: return JSON 401 (don't redirect — iframes can't follow
    // redirects to pages that set X-Frame-Options: deny, which breaks
    // attachment previews and any other in-frame fetch).
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.json({ error: 'session_expired' }, { status: 401 });
      res.cookies.delete('pockyh_session');
      res.cookies.delete('pockyh_user');
      return res;
    }

    const url = new URL('/login', request.url);
    // Only propagate safe relative paths (no protocol-relative or absolute URLs)
    if (pathname.startsWith('/') && !pathname.startsWith('//')) {
      url.searchParams.set('next', pathname);
    }
    const res = NextResponse.redirect(url);
    // Clear any stale cookies
    res.cookies.delete('pockyh_session');
    res.cookies.delete('pockyh_user');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_vercel|favicon\\.ico|POKYH_Logo\\.png|icon-.*\\.png|icons|apple-icon|manifest\\.(?:json|webmanifest)|robots\\.txt|sitemap\\.xml|\\.well-known|draco).*)',
  ],
};
