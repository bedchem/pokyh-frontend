import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { untisClassicWrite, untisError } from '@/lib/server/untis';

export const runtime = 'nodejs';

// "Löschen" on the student absence list, as the official client does it
// (deleteStudentAbsence): DELETE /api/classreg/absences/students { absenceIds }.
// WebUntis decides which absences the account may delete.
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'session_expired' }, { status: 401 });

  let ids: number[] = [];
  try {
    const body = (await req.json()) as { absenceIds?: unknown };
    ids = (Array.isArray(body.absenceIds) ? body.absenceIds : []).map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 50);
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.', code: 'invalid_request' }, { status: 400 });
  }
  if (ids.length === 0) return NextResponse.json({ error: 'Keine Abwesenheit ausgewählt.', code: 'no_absence' }, { status: 400 });

  try {
    const res = await untisClassicWrite(session, '/api/classreg/absences/students', { method: 'DELETE', json: { absenceIds: ids } });
    if (res.expired) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    const errors = (res.json as { errors?: unknown[] } | null)?.errors;
    if (res.ok && !(Array.isArray(errors) && errors.length)) return NextResponse.json({ ok: true });
    console.error('[absences/delete] WebUntis rejected the request:', res.status);
    return NextResponse.json({ error: untisError(res.json) ?? 'Die Abwesenheit konnte nicht gelöscht werden.', code: 'delete_failed' }, { status: 502 });
  } catch {
    return NextResponse.json({ error: 'Die Abwesenheit konnte nicht gelöscht werden.', code: 'delete_failed' }, { status: 502 });
  }
}
