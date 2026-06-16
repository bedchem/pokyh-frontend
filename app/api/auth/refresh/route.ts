import { NextRequest, NextResponse } from 'next/server';

// Refreshing the POKYH access token must happen server-side: the refresh token
// lives in an httpOnly cookie (pockyh_api_refresh) that client JS cannot read.
// The browser sends it automatically on this same-origin request; we exchange it
// at the backend and set a fresh, non-httpOnly access-token cookie that the
// client can use. Keeps the refresh token secret while making refresh actually work.

const API_BASE = (process.env.API_BACKEND_URL ?? 'https://api.pokyh.com').replace(/\/$/, '');
const API_KEY = process.env.API_BACKEND_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? '';

const COOKIE_OPTS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('pockyh_api_refresh')?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'no_refresh_token' }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ refreshToken }),
      signal: AbortSignal.timeout(10000),
    });

    if (!backendRes.ok) {
      // Refresh token invalid/expired/revoked — clear it so the client stops
      // retrying and falls through to a clean re-login.
      const res = NextResponse.json({ error: 'refresh_failed' }, { status: 401 });
      res.cookies.set('pockyh_api_refresh', '', { ...COOKIE_OPTS, httpOnly: true, maxAge: 0 });
      return res;
    }

    const data = await backendRes.json() as { token?: string };
    if (!data.token) {
      return NextResponse.json({ error: 'invalid_response' }, { status: 502 });
    }

    const res = NextResponse.json({ ok: true, token: data.token });
    res.cookies.set('pockyh_api_token', data.token, {
      ...COOKIE_OPTS,
      httpOnly: false, // client JS reads this for the Authorization header
      maxAge: 8 * 60 * 60,
    });
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'network_error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
