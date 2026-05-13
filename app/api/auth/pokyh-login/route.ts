import { NextRequest, NextResponse } from 'next/server';

const API_BASE = (process.env.API_BACKEND_URL ?? 'https://api.pokyh.com').replace(/\/$/, '');
const API_KEY = process.env.API_BACKEND_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? '';

const COOKIE_OPTS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const { username, password } = body;
  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Benutzername und Passwort erforderlich.' }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await backendRes.json() as {
      token?: string;
      refreshToken?: string;
      user?: { stableUid: string; username: string; classId: string | null; isAdmin: boolean };
      error?: string;
    };

    if (!backendRes.ok) {
      return NextResponse.json({ error: data.error ?? 'Anmeldung fehlgeschlagen.' }, { status: backendRes.status });
    }

    if (!data.token || !data.refreshToken || !data.user) {
      return NextResponse.json({ error: 'Ungültige Antwort vom Server.' }, { status: 500 });
    }

    const userPublic = JSON.stringify({
      username: data.user.username,
      studentId: 0,
      klasseId: 0,
      klasseName: '',
      isUntisUser: false,
      loginAt: Date.now(),
    });

    const res = NextResponse.json({ ok: true, username: data.user.username });

    res.cookies.set('pockyh_api_token', data.token, {
      ...COOKIE_OPTS,
      httpOnly: false,
      maxAge: 8 * 60 * 60,
    });
    res.cookies.set('pockyh_api_refresh', data.refreshToken, {
      ...COOKIE_OPTS,
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
    });
    res.cookies.set('pockyh_user', userPublic, {
      ...COOKIE_OPTS,
      httpOnly: false,
      maxAge: 8 * 60 * 60,
    });

    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Netzwerkfehler';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
