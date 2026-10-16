import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { untis } from '@/lib/server/untis';

export const runtime = 'nodejs';

// Reasons and defaults for "Abwesenheit melden" (GET /api/classreg/absences/meta,
// what the official report dialog loads first).
export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'session_expired' }, { status: 401 });

  try {
    const res = await untis(session, '/api/classreg/absences/meta', { rest: false, timeoutMs: 12000 });
    if (res.expired) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    if (!res.ok) return NextResponse.json({ error: 'Abwesenheitsgründe konnten nicht geladen werden.' }, { status: 502 });

    const root = (res.json ?? {}) as Record<string, unknown>;
    const d = ((root.data as Record<string, unknown>) ?? root) as Record<string, unknown>;
    const list = (d.absenceReasons ?? d.reasons ?? []) as Array<Record<string, unknown>>;
    const reasons = (Array.isArray(list) ? list : [])
      .map((r) => ({ id: Number(r.id), name: String(r.name ?? r.longName ?? r.displayName ?? '').trim() }))
      .filter((r) => Number.isFinite(r.id) && r.name && r.name !== '---');
    const def = d.defaultAbsenceReason as { id?: unknown } | undefined;

    return NextResponse.json({
      reasons,
      defaultReasonId: def?.id != null ? Number(def.id) : null,
      defaultDate: typeof d.defaultDate === 'number' ? d.defaultDate : null,
      defaultStartTime: typeof d.defaultStartTime === 'number' ? d.defaultStartTime : null,
      defaultEndTime: typeof d.defaultEndTime === 'number' ? d.defaultEndTime : null,
    });
  } catch {
    return NextResponse.json({ error: 'Abwesenheitsgründe konnten nicht geladen werden.' }, { status: 502 });
  }
}
