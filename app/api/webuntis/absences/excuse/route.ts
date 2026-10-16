import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { untis, untisClassicWrite } from '@/lib/server/untis';
import { absenceWriteOutcome, conflictTexts } from '@/lib/server/absences';

export const runtime = 'nodejs';

// Giving a reason and a note for an existing absence: what "entschuldigen" is for a
// student in WebUntis. The excuse status itself is set by the school.
//
// As the official edit dialog does it (classreg/absences/widget/absence.ts):
//   1. GET  /api/classreg/absences/student?absenceId=…   → { data: { absence, meta } }
//      only when absence.canEdit is true
//   2. POST /api/classreg/absences/students/edit
//      { absenceId, startDate, startTime, endDate, endTime, text, reasonId }
//      keeping the absence's own dates and times.

interface Body {
  absenceIds?: unknown;
  reasonId?: unknown;
  text?: unknown;
}

interface UntisAbsence {
  id?: number;
  startDate?: number;
  startTime?: number;
  endDate?: number;
  endTime?: number;
  canEdit?: boolean;
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

  const ids = (Array.isArray(body.absenceIds) ? body.absenceIds : [])
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 20);
  if (ids.length === 0) return NextResponse.json({ error: 'Keine Abwesenheit ausgewählt.', code: 'no_absence' }, { status: 400 });
  const reasonRaw = String(body.reasonId ?? '-1');
  if (!/^-?\d{1,9}$/.test(reasonRaw)) return NextResponse.json({ error: 'Ungültiger Grund.', code: 'invalid_reason' }, { status: 400 });
  const reasonId = Number(reasonRaw);
  const text = String(body.text ?? '').slice(0, 1000);

  const results: { id: number; ok: boolean; code?: string; error?: string; conflicts?: string[] }[] = [];

  for (const id of ids) {
    try {
      const current = await untis(session, `/api/classreg/absences/student?absenceId=${id}`, { rest: false, timeoutMs: 12000 });
      if (current.expired) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
      const absence = ((current.json as { data?: { absence?: UntisAbsence } } | null)?.data?.absence) ?? null;
      if (!current.ok || !absence) {
        results.push({ id, ok: false, code: 'not_found' });
        continue;
      }
      if (!absence.canEdit) {
        results.push({ id, ok: false, code: 'not_editable' });
        continue;
      }

      const res = await untisClassicWrite(session, '/api/classreg/absences/students/edit', {
        method: 'POST',
        json: {
          absenceId: id,
          startDate: absence.startDate,
          startTime: absence.startTime,
          endDate: absence.endDate,
          endTime: absence.endTime,
          text,
          reasonId,
        },
      });
      if (res.expired) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
      const outcome = absenceWriteOutcome(res);
      if (outcome.ok) results.push({ id, ok: true });
      else {
        if (!outcome.conflicts.length) console.error('[absences/excuse] WebUntis rejected the edit:', res.status, outcome.code ?? '');
        results.push({
          id,
          ok: false,
          code: outcome.conflicts.length ? 'conflict' : (outcome.code ?? 'edit_failed'),
          error: outcome.error,
          conflicts: outcome.conflicts.length ? conflictTexts(outcome.conflicts) : undefined,
        });
      }
    } catch {
      results.push({ id, ok: false, code: 'edit_failed' });
    }
  }

  const saved = results.filter((r) => r.ok).length;
  if (saved === results.length) return NextResponse.json({ ok: true, results });

  const first = results.find((r) => !r.ok);
  const message =
    first?.code === 'not_editable'
      ? 'WebUntis erlaubt dir bei dieser Abwesenheit keine Änderung.'
      : first?.code === 'not_found'
        ? 'Die Abwesenheit wurde in WebUntis nicht gefunden.'
        : first?.code === 'conflict'
          ? 'WebUntis meldet eine Überschneidung mit einer anderen Abwesenheit.'
          : first?.error ?? 'Die Abwesenheit konnte nicht gespeichert werden.';
  return NextResponse.json({ ok: false, saved, results, error: message, code: first?.code }, { status: saved > 0 ? 207 : 422 });
}
