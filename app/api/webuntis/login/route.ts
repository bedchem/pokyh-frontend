import { NextRequest, NextResponse } from 'next/server';
import { encryptSession } from '@/lib/session-crypto';

const BASE = 'https://lbs-brixen.webuntis.com/WebUntis';
const SCHOOL = 'lbs-brixen';
const SCHOOL_COOKIE = '_bGJzLWJyaXhlbg==';

// Simple in-memory rate limiter (IP-based, max 30 attempts per 5 min)
const attempts = new Map<string, { count: number; reset: number }>();

function pruneAttempts() {
  const now = Date.now();
  for (const [ip, entry] of attempts) {
    if (now > entry.reset) attempts.delete(ip);
  }
}

function isRateLimited(ip: string): boolean {
  // Prune stale entries occasionally to prevent unbounded growth
  if (Math.random() < 0.05) pruneAttempts();

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

// Session cookies — 4-hour expiry
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 4 * 60 * 60, // 4 hours
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

  const { username: rawUsername, password } = body;
  // Normalise: trim + lowercase for all internal storage; WebUntis itself is case-insensitive
  const username = rawUsername?.trim().toLowerCase() ?? '';

  if (!username || !password?.trim()) {
    return NextResponse.json({ error: 'Benutzername und Passwort erforderlich.' }, { status: 400 });
  }
  if (username.length > 100 || password.length > 200) {
    return NextResponse.json({ error: 'Eingabe zu lang.' }, { status: 400 });
  }

  try {
    // 1. WebUntis JSON-RPC authentication (send lowercase — WebUntis accepts it)
    const rpcRes = await fetch(`${BASE}/jsonrpc.do?school=${SCHOOL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'pockyh-web',
        method: 'authenticate',
        params: { user: username, password, client: 'pockyh' },
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

    // 2+3. Fetch bearer token and class name in parallel (both only need sessionId)
    const cookie = `JSESSIONID=${sessionId}; schoolname="${SCHOOL_COOKIE}"`;
    const [bearerToken, klasseName] = await Promise.all([
      fetch(`${BASE}/api/token/new`, {
        headers: { Cookie: cookie },
        signal: AbortSignal.timeout(10000),
      })
        .then((r) => r.text())
        .then((tok) => ((tok.match(/\./g) ?? []).length === 2 ? tok.trim() : ''))
        .catch(() => ''),
      fetch(`${BASE}/jsonrpc.do?school=${SCHOOL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ id: 'pockyh-klassen', method: 'getKlassen', params: {}, jsonrpc: '2.0' }),
        signal: AbortSignal.timeout(10000),
      })
        .then((r) => r.json())
        .then((kj) => (kj.result as Array<{ id: number; name: string }>)?.find((k) => k.id === klasseId)?.name ?? '')
        .catch(() => ''),
    ]);

    // 4. Encrypt full session into httpOnly cookie
    const sessionData = { sessionId, bearerToken, studentId, klasseId, klasseName, username, loginAt: Date.now() };
    const encrypted = await encryptSession(sessionData);

    // 5. Non-sensitive user data for client
    const userPublic = JSON.stringify({ username, studentId, klasseId, klasseName });

    const res = NextResponse.json({ ok: true, username, studentId, klasseId, klasseName });

    res.cookies.set('pockyh_session', encrypted, COOKIE_OPTS);
    res.cookies.set('pockyh_user', userPublic, {
      ...COOKIE_OPTS,
      httpOnly: false, // Client JS needs to read this
    });

    // Register/login user with the Node.js backend
    try {
      const backendRes = await fetch(`${process.env.API_BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Server-Key': process.env.API_SERVER_KEY ?? '',
          'X-API-Key': process.env.API_BACKEND_KEY ?? '',
        },
        body: JSON.stringify({ username, klasseId, klasseName }),
        signal: AbortSignal.timeout(10000),
      });

      if (backendRes.ok) {
        const backendData = await backendRes.json() as { token: string; refreshToken: string };
        const isSecure = process.env.NODE_ENV === 'production';

        res.cookies.set('pockyh_api_token', backendData.token, {
          httpOnly: false, // Must be readable by client JS
          secure: isSecure,
          sameSite: 'strict',
          path: '/',
          maxAge: 8 * 60 * 60, // 8 hours
        });

        res.cookies.set('pockyh_api_refresh', backendData.refreshToken, {
          httpOnly: true,
          secure: isSecure,
          sameSite: 'strict',
          path: '/',
          maxAge: 30 * 24 * 60 * 60, // 30 days
        });
      }
    } catch (backendErr) {
      // Non-fatal: WebUntis session still works, backend sync failed
      console.error('[login] Backend sync error:', backendErr);
    }

    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Netzwerkfehler';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
