import { NextRequest, NextResponse } from 'next/server';
import { encryptSession } from '@/lib/session-crypto';

const BASE = 'https://lbs-brixen.webuntis.com/WebUntis';
const SCHOOL = 'lbs-brixen';
const SCHOOL_COOKIE = '_bGJzLWJyaXhlbg==';

// Simple in-memory rate limiter (IP-based, max 30 attempts per 5 min)
const attempts = new Map<string, { count: number; reset: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.reset) {
    attempts.set(ip, { count: 1, reset: now + 5 * 60_000 });
    return false;
  }
  if (entry.count >= 30) return true;
  entry.count++;
  return false;
}

// Session cookies — 30-minute expiry
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 30 * 60, // 30 minutes
};

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Zu viele Versuche. Bitte warte 5 Minuten.' },
      { status: 429 }
    );
  }

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
    // 1. WebUntis JSON-RPC authentication
    const rpcRes = await fetch(`${BASE}/jsonrpc.do?school=${SCHOOL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'pockyh-web',
        method: 'authenticate',
        params: { user: username.trim(), password, client: 'pockyh' },
        jsonrpc: '2.0',
      }),
      signal: AbortSignal.timeout(15000),
    });

    const rawCookie = rpcRes.headers.get('set-cookie') ?? '';
    const sessionMatch = rawCookie.match(/JSESSIONID=([^;]+)/);
    const sessionId = sessionMatch?.[1] ?? '';

    const rpcJson = await rpcRes.json();
    if (rpcJson.error) {
      return NextResponse.json(
        { error: rpcJson.error.message ?? 'Anmeldung fehlgeschlagen.' },
        { status: 401 }
      );
    }

    const { personId: studentId, klasseId } = rpcJson.result;

    // 2. Fetch bearer token
    let bearerToken = '';
    try {
      const tokenRes = await fetch(`${BASE}/api/token/new`, {
        headers: { Cookie: `JSESSIONID=${sessionId}; schoolname="${SCHOOL_COOKIE}"` },
        signal: AbortSignal.timeout(10000),
      });
      const tok = await tokenRes.text();
      if ((tok.match(/\./g) ?? []).length === 2) bearerToken = tok.trim();
    } catch {
      /* non-fatal */
    }

    // 3. Resolve class name
    let klasseName = '';
    try {
      const klassenRes = await fetch(`${BASE}/jsonrpc.do?school=${SCHOOL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `JSESSIONID=${sessionId}; schoolname="${SCHOOL_COOKIE}"`,
        },
        body: JSON.stringify({
          id: 'pockyh-klassen',
          method: 'getKlassen',
          params: {},
          jsonrpc: '2.0',
        }),
        signal: AbortSignal.timeout(10000),
      });
      const kj = await klassenRes.json();
      klasseName = (kj.result as Array<{ id: number; name: string }>)?.find((k) => k.id === klasseId)?.name ?? '';
    } catch {
      /* non-fatal */
    }

    // 4. Encrypt full session into httpOnly cookie
    const sessionData = { sessionId, bearerToken, studentId, klasseId, klasseName, username: username.trim(), loginAt: Date.now() };
    const encrypted = await encryptSession(sessionData);

    // 5. Non-sensitive user data for client
    const userPublic = JSON.stringify({ username: username.trim(), studentId, klasseId, klasseName });

    const res = NextResponse.json({ ok: true, username: username.trim(), studentId, klasseId, klasseName });

    res.cookies.set('pockyh_session', encrypted, COOKIE_OPTS);
    res.cookies.set('pockyh_user', userPublic, {
      ...COOKIE_OPTS,
      httpOnly: false, // Client JS needs to read this
    });

    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Netzwerkfehler';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
