import { NextResponse } from 'next/server';

const CLEAR = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/', maxAge: 0 };

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('pokyh_session', '', CLEAR);
  res.cookies.set('pokyh_user', '', { ...CLEAR, httpOnly: false });
  res.cookies.set('pokyh_api_token', '', { ...CLEAR, httpOnly: false });
  res.cookies.set('pokyh_api_refresh', '', CLEAR);
  return res;
}
