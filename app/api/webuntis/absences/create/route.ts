import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { untisClassicWrite } from '@/lib/server/untis';
import { absenceWriteOutcome, conflictTexts, hmNumber, ymdNumber } from '@/lib/server/absences';
import { canReportAbsence } from '@/lib/untis-permissions';

export const runtime = 'nodejs';

// "Abwesenheit melden", as the official client does it (classreg/absences/widget/absence.ts,
// createStudentAbsence): POST /api/classreg/absences/students/self with
// { studentId, startDate (yyyymmdd), startTime (hhmm), endDate, endTime, text, reasonId }
// and the session's CSRF token. WebUntis answers { data: { result, conflicts } }; the
// absence is saved only when there are no conflicts.
//
// The student id always comes from the session, never from the request.

interface Body {
  startDate?: unknown;
  endDate?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  reasonId?: unknown;
  text?: unknown;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'session_expired' }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.', code: 'invalid_request' }, { status: 400 });
  }

  const startDate = ymdNumber(body.startDate);
  const endDate = ymdNumber(body.endDate);
  const startTime = hmNumber(body.startTime);
  const endTime = hmNumber(body.endTime);
  if (startDate == null || endDate == null) return NextResponse.json({ error: 'Ungültiges Datum.', code: 'invalid_date' }, { status: 400 });
  if (startTime == null || endTime == null) return NextResponse.json({ error: 'Ungültige Uhrzeit.', code: 'invalid_time' }, { status: 400 });
  if (endDate * 10000 + endTime <= startDate * 10000 + startTime) {
    return NextResponse.json({ error: 'Das Ende muss nach dem Beginn liegen.', code: 'end_before_start' }, { status: 400 });
  }
  const reasonRaw = String(body.reasonId ?? '-1');
  if (!/^-?\d{1,9}$/.test(reasonRaw)) return NextResponse.json({ error: 'Ungültiger Grund.', code: 'invalid_reason' }, { status: 400 });
  const text = String(body.text ?? '').slice(0, 1000);

  // WebUntis' own age-aware flag (showCreateAbsence) decides who may report.
  if (!(await canReportAbsence(session))) {
    return NextResponse.json({ error: 'Abwesenheiten melden ist für dein Konto in WebUntis nicht freigegeben.', code: 'not_allowed' }, { status: 403 });
  }

  try {
    const res = await untisClassicWrite(session, '/api/classreg/absences/students/self', {
      method: 'POST',
      json: { studentId: session.studentId, startDate, startTime, endDate, endTime, text, reasonId: Number(reasonRaw) },
    });
    if (res.expired) return NextResponse.json({ error: 'session_expired' }, { status: 401 });

    const outcome = absenceWriteOutcome(res);
    if (outcome.ok) return NextResponse.json({ ok: true });
    if (outcome.conflicts.length) {
      return NextResponse.json(
        { error: 'Für diesen Zeitraum gibt es bereits eine Abwesenheit.', code: 'conflict', conflicts: conflictTexts(outcome.conflicts) },
        { status: 409 },
      );
    }
    console.error('[absences/create] WebUntis rejected the request:', res.status, outcome.code ?? '');
    return NextResponse.json(
      { error: outcome.error ?? 'Die Abwesenheit konnte nicht gemeldet werden.', code: outcome.code ?? 'create_failed' },
      { status: 502 },
    );
  } catch {
    return NextResponse.json({ error: 'Die Abwesenheit konnte nicht gemeldet werden.', code: 'create_failed' }, { status: 502 });
  }
}
