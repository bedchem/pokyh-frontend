import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from '@/lib/session-crypto';

// Public paths that never require a session
const PUBLIC_PREFIXES = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/icons',
  '/icon',
  '/apple-icon',
  '/api/webuntis/login',
  '/api/mensa',
];

const SESSION_MAX_MS = 30 * 60 * 1000; // 30 minutes

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

  // Root → redirect based on auth state
  if (pathname === '/') {
    return NextResponse.redirect(new URL(authenticated ? '/home' : '/login', request.url));
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
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
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
    '/((?!_next/static|_next/image|favicon\\.ico|icons|apple-icon|manifest\\.json|robots\\.txt|sitemap\\.xml).*)',
  ],
};
