import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { firstWorkingGet } from '@/lib/untis-permissions';

// The absence-reason list is delivered inside the absences envelope
// (`data.absenceReasons`) on modern WebUntis — there is no standalone reasons
// endpoint. We therefore query the absences view for the current school year and
// extract the reasons from it. Env override + legacy candidates kept as fallback
// so the route self-heals across instances.
function schoolYearRange(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  // School year starts in September; before September we're still in (y-1)/y.
  const startYear = now.getMonth() >= 8 ? y : y - 1;
  return { start: `${startYear}0901`, end: `${startYear + 1}0831` };
}

function candidates(studentId: number): string[] {
  const { start, end } = schoolYearRange();
  const absencesView = `/api/classreg/absences/students?studentId=${studentId}&startDate=${start}&endDate=${end}&excuseStatusId=-1`;
  return [
    process.env.WEBUNTIS_API_PATH_ABSENCE_REASONS,
    absencesView,
    '/api/classreg/absencereason/options',
    '/api/classreg/absences/reasons',
  ].filter(Boolean) as string[];
}

// Normalises the various shapes WebUntis may return into { id, name }[].
function parseReasons(json: unknown): { id: number; name: string }[] {
  const root = (json ?? {}) as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | undefined;
  const arr: unknown[] =
    (root.absenceReasons as unknown[]) ??
    (root.reasons as unknown[]) ??
    (data?.absenceReasons as unknown[]) ??
    (data?.reasons as unknown[]) ??
    (Array.isArray(data) ? data : null) ??
    (Array.isArray(json) ? (json as unknown[]) : null) ??
    [];

  return arr
    .map((item) => {
      const r = item as Record<string, unknown>;
      const id = (r.id ?? r.reasonId ?? r.absenceReasonId ?? r.value) as number;
      const name =
        (r.name ?? r.longName ?? r.displayName ?? r.label ?? r.text ?? r.shortName ?? '') as string;
      return { id: Number(id), name: String(name).trim() };
    })
    .filter((r) => Number.isFinite(r.id) && r.name && r.name !== '---');
}

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  try {
    const result = await firstWorkingGet(
      session,
      candidates(session.studentId),
      (json) => parseReasons(json).length > 0,
    );

    if (!result.ok) {
      if (result.reason === 'expired') {
        return NextResponse.json({ error: 'session_expired' }, { status: 401 });
      }
      return NextResponse.json(
        { error: 'Kein Abwesenheitsgründe-Endpunkt gefunden (WEBUNTIS_API_PATH_ABSENCE_REASONS in .env setzen).' },
        { status: 502 },
      );
    }

    return NextResponse.json({ reasons: parseReasons(result.json), endpoint: result.path });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[absence-reasons] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
