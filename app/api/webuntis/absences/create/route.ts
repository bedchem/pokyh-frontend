import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { canReportAbsence, writeHeaders, firstWorkingPost } from '@/lib/untis-permissions';

// Modern WebUntis (ui2020) rejects the legacy classreg write path (403). Creating
// an absence goes through the REST calendar-entry API (bearer-authenticated).
function candidates(): string[] {
  return [
    process.env.WEBUNTIS_API_PATH_ABSENCE_CREATE,
    '/api/rest/view/v2/calendar-entry/absences',
    '/api/rest/view/v1/calendar-entry/absences',
  ].filter(Boolean) as string[];
}

// YYYYMMDD + HHMM → "YYYY-MM-DDTHH:MM" (local, no zone — WebUntis treats it as
// the school's local time).
function toIso(ymd: string, hmm: string): string {
  const t = hmm.padStart(4, '0');
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T${t.slice(0, 2)}:${t.slice(2, 4)}`;
}

interface Body {
  startDate?: number | string; // YYYYMMDD
  endDate?: number | string;
  startTime?: number | string; // HHMM
  endTime?: number | string;
  reasonId?: number | string;
  text?: string;
}

const isYmd = (v: string) => /^\d{8}$/.test(v);
const isHmm = (v: string) => /^\d{1,4}$/.test(v);

// Create a self-reported absence. studentId comes from the session, never the
// client. The 18+ right is re-checked server-side before the write.
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  if (!(await canReportAbsence(session))) {
    return NextResponse.json(
      { error: 'Selbst-Entschuldigung ist nur für volljährige Schüler verfügbar.' },
      { status: 403 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const startDate = String(body.startDate ?? '');
  const endDate = String(body.endDate ?? '');
  const startTime = String(body.startTime ?? '');
  const endTime = String(body.endTime ?? '');
  const reasonId = String(body.reasonId ?? '0');
  const text = (body.text ?? '').toString().slice(0, 1000);

  if (!isYmd(startDate) || !isYmd(endDate)) {
    return NextResponse.json({ error: 'Ungültiges Datum.' }, { status: 400 });
  }
  if (!isHmm(startTime) || !isHmm(endTime)) {
    return NextResponse.json({ error: 'Ungültige Uhrzeit.' }, { status: 400 });
  }
  if (!/^\d{1,9}$/.test(reasonId)) {
    return NextResponse.json({ error: 'Ungültiger Grund.' }, { status: 400 });
  }

  const payload = {
    studentId: session.studentId,
    startDateTime: toIso(startDate, startTime),
    endDateTime: toIso(endDate, endTime),
    absenceReasonId: Number(reasonId),
    text,
  };

  try {
    const res = await firstWorkingPost(session, candidates(), {
      headers: writeHeaders(session, 'application/json'),
      body: JSON.stringify(payload),
    });

    if (res.ok) return NextResponse.json({ ok: true, data: res.data, endpoint: res.path });
    if (res.reason === 'expired') return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    if (res.reason === 'error') {
      console.error('[absence/create] API error:', res.status, res.body);
      return NextResponse.json(
        {
          error: 'Die Abwesenheit konnte nicht gespeichert werden. Bitte versuche es später erneut.',
          ...(process.env.NEXT_PUBLIC_DEBUG_API === 'true'
            ? { _debug: { status: res.status, body: res.body, sent: payload } }
            : {}),
        },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: 'Die Abwesenheit konnte nicht gespeichert werden. Bitte versuche es später erneut.' },
      { status: 502 },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[absence/create] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
