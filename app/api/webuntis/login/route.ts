import { NextRequest, NextResponse } from 'next/server';
import { encryptSession } from '@/lib/session-crypto';
import { fetchAppData, detectParent, extractChildStudentId, extractImageUrl } from '@/lib/untis-permissions';

const BASE = process.env.WEBUNTIS_BASE_URL ?? process.env.WEBUNTIS_BASE ?? 'https://lbs-brixen.webuntis.com/WebUntis';
const SCHOOL = process.env.WEBUNTIS_SCHOOL ?? 'lbs-brixen';
const SCHOOL_COOKIE = '_' + Buffer.from(SCHOOL).toString('base64');

type Klasse = { id: number; name: string };

// Pulls the class element (type === "CLASS") out of a REST timetable response.
// Shape: days[].gridEntries[].position1..7[].current  (same layout the app's
// timetable view parses). Returns the class short name or null.
function extractClassNameFromTimetable(json: unknown): string | null {
  const days = (json as { days?: unknown }).days;
  if (!Array.isArray(days)) return null;
  const POSITIONS = ['position1', 'position2', 'position3', 'position4', 'position5', 'position6', 'position7'];
  for (const day of days) {
    const entries = (day as { gridEntries?: unknown })?.gridEntries;
    if (!Array.isArray(entries)) continue;
    for (const ge of entries) {
      for (const key of POSITIONS) {
        const arr = (ge as Record<string, unknown>)?.[key];
        if (!Array.isArray(arr)) continue;
        for (const el of arr) {
          const cur = (el as { current?: { type?: string; shortName?: string; displayName?: string } })?.current;
          if (cur?.type === 'CLASS') {
            const name = cur.shortName ?? cur.displayName;
            if (typeof name === 'string' && name.trim()) return name.trim();
          }
        }
      }
    }
  }
  return null;
}

// Derives a student's numeric klasseId from their timetable. WebUntis `getStudents`
// does not expose the class for guardian logins, and at block-teaching schools
// (LBS Brixen) whole weeks are free — so we sample the current week plus mid-month
// points across the school year until a week with lessons reveals the CLASS element,
// then map its name to the numeric id via the getKlassen list. Uses the same REST
// endpoint the timetable view uses (proven for this instance). Best-effort → 0.
async function deriveKlasseIdFromTimetable(
  headers: Record<string, string>,
  studentId: number,
  klassen: Klasse[],
): Promise<number> {
  if (studentId <= 0 || klassen.length === 0) return 0;
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const samples: Date[] = [new Date()];
  for (const m of [9, 10, 11, 12]) samples.push(new Date(startYear, m - 1, 15));
  for (const m of [1, 2, 3, 4, 5, 6]) samples.push(new Date(startYear + 1, m - 1, 15));

  for (const day of samples) {
    const start = iso(day);
    const end = iso(new Date(day.getFullYear(), day.getMonth(), day.getDate() + 5));
    const url = `${BASE}/api/rest/view/v1/timetable/entries?start=${start}&end=${end}&format=1&resourceType=STUDENT&resources=${studentId}&periodTypes=&timetableType=MY_TIMETABLE&layout=START_TIME`;
    try {
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const text = await r.text();
      if (text.startsWith('<')) continue;
      const name = extractClassNameFromTimetable(JSON.parse(text));
      if (name) {
        const match = klassen.find((k) => k.name?.toLowerCase() === name.toLowerCase());
        if (match && match.id > 0) return match.id;
      }
    } catch {
      /* try next sample */
    }
  }
  return 0;
}

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

    if (!rpcRes.ok) {
      const statusMsg =
        rpcRes.status >= 500
          ? `Untis ist momentan nicht erreichbar (Fehler ${rpcRes.status}). Bitte versuche es später erneut.`
          : 'Verbindung zu Untis fehlgeschlagen.';
      return NextResponse.json({ error: statusMsg }, { status: 502 });
    }

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

    const { personId: studentId, klasseId, personType } = rpcJson.result;

    // 2+3+4. Fetch bearer token, class name and the accessible students in parallel.
    const cookie = `JSESSIONID=${sessionId}; schoolname="${SCHOOL_COOKIE}"`;
    const [bearerToken, klassen, students] = await Promise.all([
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
        .then((kj) => (Array.isArray(kj.result) ? (kj.result as Array<{ id: number; name: string }>) : []))
        .catch(() => [] as Array<{ id: number; name: string }>),
      fetch(`${BASE}/jsonrpc.do?school=${SCHOOL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ id: 'pockyh-students', method: 'getStudents', params: {}, jsonrpc: '2.0' }),
        signal: AbortSignal.timeout(10000),
      })
        .then((r) => r.json())
        .then((sj) => (Array.isArray(sj.result) ? (sj.result as Array<{ id: number; klasseId?: number }>) : []))
        .catch(() => []),
    ]);

    // Class name resolved from the final klasseId once it's known (see below).
    let klasseName = klassen.find((k) => k.id === klasseId)?.name ?? '';

    // Resolve the effective student. For a normal student login the logged-in
    // person IS a student (their id appears in getStudents). Guardian/other logins
    // need app-data to detect the parent role and resolve the child's student id.
    let resolvedStudentId = studentId;
    let resolvedKlasseId = klasseId;
    let isParent = false;
    let imageUrl: string | undefined;
    const isStudentSelf = students.some((s) => s.id === studentId);

    // Fetch app-data once here, where the WebUntis session is freshest — this is
    // the most reliable moment to read the profile-image URL (a later, separate
    // request can hit a stale cookie session and fail). Best-effort, capped at 5s
    // so a slow call never stalls login.
    const appData = await Promise.race([
      fetchAppData({ sessionId, bearerToken, studentId, klasseId, klasseName, username }),
      new Promise<{ ok: false }>((resolve) => setTimeout(() => resolve({ ok: false as const }), 5000)),
    ]);
    const appJson = 'ok' in appData && appData.ok ? appData.json : null;

    if (!isStudentSelf) {
      if (students.length) {
        resolvedStudentId = students[0].id;
        if (students[0].klasseId) resolvedKlasseId = students[0].klasseId;
      }
      if (appJson) {
        isParent = detectParent(appJson);
        if (!students.length) {
          const childId = extractChildStudentId(appJson, studentId);
          if (childId) resolvedStudentId = childId;
        }
      }
    }

    // Guardians (and students whose `authenticate` returned klasseId 0): the
    // child's class isn't in getStudents, so derive it from the child's timetable.
    // Uses the resolved (child) studentId + the same REST endpoint as the app.
    if ((!resolvedKlasseId || resolvedKlasseId <= 0) && resolvedStudentId > 0) {
      const ttHeaders: Record<string, string> = {
        Cookie: cookie,
        Accept: 'application/json',
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      };
      const derived = await deriveKlasseIdFromTimetable(ttHeaders, resolvedStudentId, klassen);
      if (derived > 0) resolvedKlasseId = derived;
    }

    // Final class name from the resolved klasseId.
    klasseName = klassen.find((k) => k.id === resolvedKlasseId)?.name ?? klasseName;

    // Diagnostic (no secrets) — shows exactly how the class was resolved in prod logs.
    console.log('[login] resolved', JSON.stringify({
      username, studentId, klasseId, personType,
      isStudentSelf, studentsLen: students.length, isParent,
      resolvedStudentId, resolvedKlasseId, klasseName,
    }));

    // Profile-image URL — for a guardian it's the child's, otherwise the person's.
    if (appJson) imageUrl = extractImageUrl(appJson, isParent);

    // 4. Encrypt full session into httpOnly cookie (uses the resolved student).
    const sessionData = { sessionId, bearerToken, studentId: resolvedStudentId, klasseId: resolvedKlasseId, klasseName, username, personType, isParent, imageUrl, loginAt: Date.now() };
    const encrypted = await encryptSession(sessionData);

    // 5. Non-sensitive user data for client (loginAt lets the client set a proactive expiry timer)
    const userPublic = JSON.stringify({ username, studentId: resolvedStudentId, klasseId: resolvedKlasseId, klasseName, personType, isParent, loginAt: Date.now(), isUntisUser: true });

    // Register/login user with the Node.js backend.
    // pokyhSynced tells the client whether the POKYH session layer was refreshed
    // (not only the WebUntis session) so it knows whether to dispatch
    // pockyh-session-refreshed (which re-runs loginWithSession).
    let pokyhSynced = false;
    try {
      const backendUrl = process.env.API_BACKEND_URL ?? 'https://api.pokyh.com';
      const backendRes = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Server-Key': process.env.API_SERVER_KEY ?? '',
          'X-API-Key': process.env.API_BACKEND_KEY ?? '',
        },
        // Parents are auto-assigned (invisibly) to their child's class — send the
        // resolved child klasseId and the parent role so the backend creates a
        // parent account (own todos, sees class name, no reminders, hidden member).
        // klasseId is coerced to a non-negative number (0 = no class) so the
        // backend never gets undefined/NaN and rejects a valid login with 422.
        body: JSON.stringify({
          username,
          klasseId: Number.isFinite(Number(resolvedKlasseId)) && Number(resolvedKlasseId) > 0
            ? Number(resolvedKlasseId)
            : 0,
          klasseName: klasseName ?? '',
          role: isParent ? 'parent' : 'student',
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (backendRes.ok) {
        const backendData = await backendRes.json() as { token: string; refreshToken: string };
        if (backendData?.token && backendData?.refreshToken) {
          const isSecure = process.env.NODE_ENV === 'production';
          pokyhSynced = true;

          // Build the response only once the backend tokens are in hand so the
          // pockyh_api_token cookie always carries a fresh, valid token. Returning
          // it without tokens (as before) left the client with an expired token →
          // /auth/me 401 → loginWithSession retried forever.
          const res = NextResponse.json({ ok: true, pokyhSynced, username, studentId: resolvedStudentId, klasseId: resolvedKlasseId, klasseName });
          res.cookies.set('pockyh_session', encrypted, COOKIE_OPTS);
          res.cookies.set('pockyh_user', userPublic, { ...COOKIE_OPTS, httpOnly: false });
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
          return res;
        }
      } else {
        const errBody = await backendRes.text().catch(() => '');
        console.error('[login] Backend sync failed:', backendRes.status, errBody.slice(0, 300));
      }
    } catch (backendErr) {
      // Non-fatal: WebUntis session still works, backend sync failed
      console.error('[login] Backend sync error:', backendErr);
    }

    // POKYH backend sync failed — return the WebUntis session so the user can
    // still see timetable/grades, but pokyhSynced=false tells the client NOT to
    // dispatch pockyh-session-refreshed (which would re-run loginWithSession →
    // /auth/me 401 → infinite loop) and NOT to keep stale POKYH cookies around.
    const resFallback = NextResponse.json({ ok: true, pokyhSynced, username, studentId: resolvedStudentId, klasseId: resolvedKlasseId, klasseName });
    resFallback.cookies.set('pockyh_session', encrypted, COOKIE_OPTS);
    resFallback.cookies.set('pockyh_user', userPublic, { ...COOKIE_OPTS, httpOnly: false });
    return resFallback;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Netzwerkfehler';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
