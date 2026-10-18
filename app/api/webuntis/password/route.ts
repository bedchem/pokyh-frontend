import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { untisClassicWrite, untisError, untisErrorCode } from '@/lib/server/untis';
import { defaultSchool } from '@/lib/server/schools';
import { sealRenewal } from '@/lib/server/sign-in-cookies';

export const runtime = 'nodejs';

// Changing the WebUntis password, exactly as the official profile page does it:
// POST /api/profile/access/password { oldPassword, newPassword } with the
// session's CSRF token and Tenant-Id. WebUntis checks the old password and its
// password rules itself and answers { errors: [{ code, title }] } on failure.
//
// Passwords pass through to WebUntis only: never logged, never stored here;
// the new one only goes back into the browser's sealed renewal cookie.

const attempts = new Map<string, { count: number; reset: number }>();
function limited(key: string): boolean {
  const now = Date.now();
  const e = attempts.get(key);
  if (!e || now > e.reset) {
    attempts.set(key, { count: 1, reset: now + 10 * 60_000 });
    return false;
  }
  e.count += 1;
  return e.count > 5;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'session_expired', code: 'session_expired' }, { status: 401 });

  if (limited(session.sessionId)) {
    return NextResponse.json({ error: 'Zu viele Versuche. Bitte warte ein paar Minuten.', code: 'rate_limited' }, { status: 429 });
  }

  let oldPassword = '';
  let newPassword = '';
  try {
    const body = (await req.json()) as { oldPassword?: unknown; newPassword?: unknown };
    oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword : '';
    newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.', code: 'invalid_request' }, { status: 400 });
  }
  if (!oldPassword || !newPassword) return NextResponse.json({ error: 'Bitte beide Passwörter eingeben.', code: 'missing' }, { status: 400 });
  if (oldPassword.length > 200 || newPassword.length > 200) return NextResponse.json({ error: 'Eingabe zu lang.', code: 'too_long' }, { status: 400 });
  if (oldPassword === newPassword) return NextResponse.json({ error: 'Das neue Passwort muss sich vom alten unterscheiden.', code: 'same_password' }, { status: 400 });

  try {
    const res = await untisClassicWrite(session, '/api/profile/access/password', {
      method: 'POST',
      json: { oldPassword, newPassword },
      timeoutMs: 15000,
    });
    if (res.expired) return NextResponse.json({ error: 'session_expired', code: 'session_expired' }, { status: 401 });

    const errors = (res.json as { errors?: unknown[] } | null)?.errors;
    if (res.ok && !(Array.isArray(errors) && errors.length)) {
      // The automatic renewal signs in with the new password from now on.
      const done = NextResponse.json({ ok: true });
      await sealRenewal(done, { username: session.username, password: newPassword, school: session.school ?? defaultSchool() });
      return done;
    }

    // The reason WebUntis gives (wrong old password, rules not met, …) is shown as is.
    console.error('[password] WebUntis rejected the change:', res.status, untisErrorCode(res.json) ?? '');
    return NextResponse.json(
      { error: untisError(res.json) ?? 'Das Passwort konnte nicht geändert werden.', code: untisErrorCode(res.json) ?? 'change_failed' },
      { status: res.status === 400 || res.status === 422 ? 400 : 502 },
    );
  } catch {
    return NextResponse.json({ error: 'Das Passwort konnte nicht geändert werden.', code: 'change_failed' }, { status: 502 });
  }
}
