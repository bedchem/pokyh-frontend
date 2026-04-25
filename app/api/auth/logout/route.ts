import { NextResponse } from 'next/server';

const CLEAR = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/', maxAge: 0 };

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('pockyh_session', '', CLEAR);
  res.cookies.set('pockyh_user', '', { ...CLEAR, httpOnly: false });
  return res;
}
