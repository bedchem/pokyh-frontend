import { NextRequest, NextResponse } from 'next/server';
import { readPageConfig } from '@/lib/server/untis';
import { parseSchool, schoolBase, schoolCookieValue, schoolLoginName } from '@/lib/server/schools';

export const runtime = 'nodejs';

// "Passwort vergessen", WebUntis' own reset request (PasswordResetRequestActions):
// POST /passwordReset/resetPassword.do { username, email }. WebUntis then e-mails a
// reset link to the address stored for the account; Pokyh never sees a password.
//
// The request needs an anonymous WebUntis session: the login page sets the session
// cookie and embeds the CSRF token and tenant id that go with it.
//
// Error codes from WebUntis: INVALID_USER_DATA, SEND_EMAIL_FAILURE,
// PW_RESET_NOT_ALLOWED, INTERNAL_ERROR.
//
// The school is the one picked on the sign-in page (validated against the
// WebUntis hosts, lib/server/schools.ts); without one, the default school.

const attempts = new Map<string, { count: number; reset: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  if (attempts.size > 2000) for (const [k, v] of attempts) if (now > v.reset) attempts.delete(k);
  const e = attempts.get(ip);
  if (!e || now > e.reset) {
    attempts.set(ip, { count: 1, reset: now + 15 * 60_000 });
    return false;
  }
  e.count += 1;
  return e.count > 5;
}

const MESSAGES: Record<string, { status: number; error: string }> = {
  INVALID_USER_DATA: { status: 400, error: 'Benutzername und E-Mail-Adresse passen zu keinem Konto.' },
  SEND_EMAIL_FAILURE: { status: 502, error: 'WebUntis konnte die E-Mail gerade nicht senden.' },
  PW_RESET_NOT_ALLOWED: { status: 403, error: 'Das Zurücksetzen des Passworts ist an deiner Schule nicht freigegeben. Wende dich an das Sekretariat.' },
  INTERNAL_ERROR: { status: 502, error: 'WebUntis hat einen internen Fehler gemeldet.' },
};

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (limited(ip)) return NextResponse.json({ error: 'Zu viele Versuche. Bitte warte 15 Minuten.', code: 'rate_limited' }, { status: 429 });

  let username = '';
  let email = '';
  let school: ReturnType<typeof parseSchool> = null;
  try {
    const body = (await req.json()) as { username?: unknown; email?: unknown; school?: unknown };
    username = String(body.username ?? '').trim();
    email = String(body.email ?? '').trim();
    school = parseSchool(body.school);
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.', code: 'invalid_request' }, { status: 400 });
  }
  if (!username || !email) return NextResponse.json({ error: 'Bitte Benutzername und E-Mail-Adresse eingeben.', code: 'missing' }, { status: 400 });
  if (username.length > 100 || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Bitte eine gültige E-Mail-Adresse eingeben.', code: 'invalid_email' }, { status: 400 });
  }

  try {
    // 1. Anonymous session: cookie + CSRF token + tenant from the login page.
    const base = schoolBase(school);
    const page = await fetch(`${base}/?school=${encodeURIComponent(schoolLoginName(school))}`, {
      headers: { Accept: 'text/html' },
      signal: AbortSignal.timeout(12000),
      cache: 'no-store',
    });
    const sessionId = (page.headers.get('set-cookie') ?? '').match(/JSESSIONID=([^;]+)/)?.[1];
    const config = readPageConfig(await page.text());
    if (!sessionId || !config.csrf) {
      return NextResponse.json({ error: 'WebUntis ist gerade nicht erreichbar.', code: 'unavailable' }, { status: 502 });
    }

    // 2. The reset request itself.
    const res = await fetch(`${base}/passwordReset/resetPassword.do`, {
      method: 'POST',
      headers: {
        Cookie: `JSESSIONID=${sessionId}; schoolname="${schoolCookieValue(school)}"`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': config.csrf,
        ...(config.tenant ? { 'Tenant-Id': config.tenant } : {}),
      },
      body: JSON.stringify({ username, email }),
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });
    const text = await res.text();
    let json: { errors?: { code?: string }[] } | null = null;
    try { json = text ? JSON.parse(text) : {}; } catch { json = null; }

    const code = json?.errors?.[0]?.code;
    if (res.ok && json && !code) return NextResponse.json({ ok: true });

    const mapped = code ? MESSAGES[code] : undefined;
    console.error('[password-reset] WebUntis rejected the request:', res.status, code ?? '');
    return NextResponse.json(
      { error: mapped?.error ?? 'Das Zurücksetzen konnte nicht gestartet werden.', code: code ?? 'reset_failed' },
      { status: mapped?.status ?? 502 },
    );
  } catch {
    return NextResponse.json({ error: 'WebUntis ist gerade nicht erreichbar.', code: 'unavailable' }, { status: 502 });
  }
}
