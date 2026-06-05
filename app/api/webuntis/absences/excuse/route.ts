import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { canReportAbsence, writeHeaders, firstWorkingPost } from '@/lib/untis-permissions';

// Modern WebUntis excuses via the REST calendar-entry API (legacy classreg write
// path is 403-blocked). Env-overridable + self-healing across candidates.
function candidates(): string[] {
  return [
    process.env.WEBUNTIS_API_PATH_ABSENCE_EXCUSE,
    '/api/rest/view/v2/calendar-entry/absences/excuse',
    '/api/rest/view/v1/calendar-entry/absences/excuse',
  ].filter(Boolean) as string[];
}

interface Body {
  absenceIds?: number[];
  reasonId?: number | string;
  text?: string;
}

// Excuse one or more existing (open) absences. Re-checks the 18+ right server-side.
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  if (!(await canReportAbsence(session))) {
    return NextResponse.json(
      { error: 'Entschuldigen ist nur für volljährige Schüler verfügbar.' },
      { status: 403 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const ids = Array.isArray(body.absenceIds)
    ? body.absenceIds.filter((n) => Number.isFinite(n)).map(Number)
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Keine Abwesenheiten ausgewählt.' }, { status: 400 });
  }
  const reasonId = String(body.reasonId ?? '0');
  const text = (body.text ?? '').toString().slice(0, 1000);

  const payload = {
    studentId: session.studentId,
    absenceIds: ids,
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
      console.error('[absence/excuse] API error:', res.status, res.body);
      return NextResponse.json({ error: `Entschuldigen fehlgeschlagen (${res.status})` }, { status: 502 });
    }
    return NextResponse.json(
      { error: 'Kein Entschuldigen-Endpunkt gefunden (WEBUNTIS_API_PATH_ABSENCE_EXCUSE in .env setzen).' },
      { status: 502 },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[absence/excuse] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
