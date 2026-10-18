import { NextResponse, type NextRequest } from 'next/server';
import { clearRenewal } from '@/lib/server/sign-in-cookies';

const CLEAR = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/', maxAge: 0 };

const API_BASE = (process.env.API_BACKEND_URL ?? 'https://api.pokyh.com').replace(/\/$/, '');
const API_KEY = process.env.API_BACKEND_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? '';

// Signing out ends the sign-in everywhere it lives: the backend revokes the
// refresh token (best effort; it is only in the httpOnly cookie, so only this
// route can send it) and every sign-in cookie is cleared.
async function revokeRefreshToken(req: NextRequest): Promise<void> {
  const token = req.cookies.get('pokyh_api_token')?.value;
  const refreshToken = req.cookies.get('pokyh_api_refresh')?.value;
  if (!token || !refreshToken) return;
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify({ refreshToken }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  await revokeRefreshToken(req);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('pokyh_session', '', CLEAR);
  res.cookies.set('pokyh_user', '', { ...CLEAR, httpOnly: false });
  res.cookies.set('pokyh_api_token', '', { ...CLEAR, httpOnly: false });
  res.cookies.set('pokyh_api_refresh', '', CLEAR);
  clearRenewal(res);
  return res;
}
