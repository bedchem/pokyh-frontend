import { NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders, SCHOOL_COOKIE_VAL } from '@/lib/server-session';

const BASE = 'https://lbs-brixen.webuntis.com/WebUntis';
const SCHOOL = 'lbs-brixen';
const DEBUG = process.env.DEBUG_API === 'true';

function log(...args: unknown[]) {
  if (DEBUG) console.log('[grades]', ...args);
}

async function getSchoolyearId(session: { sessionId: string }, targetYear?: number): Promise<number | null | -1> {
  const cookieHeader = `JSESSIONID=${session.sessionId}; schoolname="${SCHOOL_COOKIE_VAL}"`;
  const baseHeaders = { 'Content-Type': 'application/json', Cookie: cookieHeader };

  // For a specific year, look it up directly via getSchoolyears
  if (targetYear != null) {
    try {
      const res = await fetch(`${BASE}/jsonrpc.do?school=${SCHOOL}`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({ id: 'sy2', method: 'getSchoolyears', params: {}, jsonrpc: '2.0' }),
        signal: AbortSignal.timeout(10000),
      });
      const json = await res.json();
      if (json.error?.code === -8500 || json.error?.code === -8501 || json.error?.code === -8520) return -1;
      const years = json.result as Array<{ id: number; startDate: number; endDate: number }> | undefined;
      if (Array.isArray(years)) {
        const match = years.find((y) => Math.floor(y.startDate / 10000) === targetYear);
        if (match?.id) return match.id;
      }
    } catch (e) {
      log('getSchoolyears (targeted) error:', e);
    }
    return null;
  }

  // Current year: try getCurrentSchoolyear first, then fall back to getSchoolyears
  try {
    const res = await fetch(`${BASE}/jsonrpc.do?school=${SCHOOL}`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({ id: 'sy', method: 'getCurrentSchoolyear', params: {}, jsonrpc: '2.0' }),
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();
    log('getCurrentSchoolyear:', JSON.stringify(json).slice(0, 200));
    if (json.error?.code === -8500 || json.error?.code === -8501 || json.error?.code === -8520) return -1;
    const id = json.result?.id as number | undefined;
    if (id) return id;
  } catch (e) {
    log('getCurrentSchoolyear error:', e);
  }

  try {
    const res = await fetch(`${BASE}/jsonrpc.do?school=${SCHOOL}`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({ id: 'sy2', method: 'getSchoolyears', params: {}, jsonrpc: '2.0' }),
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();
    log('getSchoolyears:', JSON.stringify(json).slice(0, 200));
    if (json.error?.code === -8500 || json.error?.code === -8501 || json.error?.code === -8520) return -1;
    const years = json.result as Array<{ id: number; startDate: number; endDate: number }> | undefined;
    if (Array.isArray(years)) {
      const now = parseInt(new Date().toISOString().replace(/-/g, '').slice(0, 8));
      const current = years.find((y) => y.startDate <= now && y.endDate >= now);
      if (current?.id) return current.id;
      if (years.length) return years.sort((a, b) => b.startDate - a.startDate)[0].id;
    }
  } catch (e) {
    log('getSchoolyears error:', e);
  }

  return null;
}

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    console.error('[grades] No session cookie');
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const targetYear = yearParam ? parseInt(yearParam, 10) : undefined;

  log('session studentId:', session.studentId, 'hasBearer:', !!session.bearerToken, 'targetYear:', targetYear);

  try {
    const schoolyearId = await getSchoolyearId(session, targetYear);
    log('schoolyearId:', schoolyearId);

    if (schoolyearId === -1) {
      console.error('[grades] Session expired (WebUntis returned auth error)');
      return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    }
    if (!schoolyearId) {
      console.error('[grades] Could not determine school year');
      return NextResponse.json({ error: 'Schuljahr nicht gefunden. Bitte neu anmelden.' }, { status: 500 });
    }

    // Step 1: Get lesson list
    const listUrl = `${BASE}/api/classreg/grade/grading/list?studentId=${session.studentId}&schoolyearId=${schoolyearId}`;
    log('fetching list:', listUrl);

    const listRes = await fetch(listUrl, {
      headers: webUntisHeaders(session),
      signal: AbortSignal.timeout(20000),
    });

    const listText = await listRes.text();
    log('list status:', listRes.status, 'body[:200]:', listText.slice(0, 200));

    if (listText.startsWith('<') || listRes.status === 401 || listRes.status === 403) {
      console.error('[grades] Session expired (HTML response or 401/403 on list)');
      return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    }
    if (!listRes.ok) {
      console.error('[grades] List API error:', listRes.status, listText.slice(0, 300));
      return NextResponse.json({ error: `Notenliste Fehler (${listRes.status}): ${listText.slice(0, 100)}` }, { status: 502 });
    }

    const listData = JSON.parse(listText);
    const lessons = (listData?.data?.lessons ?? listData?.data?.lesson ?? []) as Array<Record<string, unknown>>;
    log('lessons count:', lessons.length);

    if (lessons.length === 0) {
      return NextResponse.json({ subjects: [] });
    }

    // Step 2: Fetch grades per lesson in parallel (matching Flutter's approach)
    const gradeResults = await Promise.allSettled(
      lessons.map(async (lesson) => {
        const lessonId = lesson.id as number;
        const subjectName = lesson.subjects?.toString() ?? lesson.subject?.toString() ?? '';
        const teacherName = lesson.teachers?.toString() ?? lesson.teacher?.toString() ?? '';

        try {
          const url = `${BASE}/api/classreg/grade/grading/lesson?studentId=${session.studentId}&lessonId=${lessonId}`;
          const res = await fetch(url, {
            headers: webUntisHeaders(session),
            signal: AbortSignal.timeout(15000),
          });
          const text = await res.text();

          if (text.startsWith('<') || res.status === 401) return null;
          if (!res.ok) return null;

          const data = JSON.parse(text);
          const grades = (data?.data?.grades ?? []) as Array<Record<string, unknown>>;

          const gradeEntries = grades
            .map((g) => {
              const mark = (g.mark ?? {}) as Record<string, unknown>;
              const examType = (g.examType ?? {}) as Record<string, unknown>;
              return {
                id: g.id,
                text: g.text ?? '',
                date: g.date,
                markName: mark.name ?? '',
                markValue: mark.markValue ?? 0,
                markDisplayValue: (mark.markDisplayValue as number) ?? (mark.markValue as number) ?? 0,
                examType: examType.longname ?? examType.name ?? g.examType ?? '',
              };
            })
            .filter((g) => (g.markValue as number) > 0);

          return { lessonId, subjectName, teacherName, grades: gradeEntries };
        } catch (e) {
          log('lesson fetch error for', lessonId, ':', e);
          return null;
        }
      })
    );

    const subjects = gradeResults
      .map((r) => (r.status === 'fulfilled' ? r.value : null))
      .filter(Boolean);

    log('subjects with grades:', subjects.length);

    return NextResponse.json({ subjects });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
    console.error('[grades] Unexpected error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
