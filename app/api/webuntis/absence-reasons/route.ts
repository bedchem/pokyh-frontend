import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { firstWorkingGet } from '@/lib/untis-permissions';

// The absence-reason list is delivered inside the absences envelope
// (`data.absenceReasons`) on modern WebUntis — there is no standalone reasons
// endpoint. The list is static, so we query a single day (cheap) instead of the
// whole school year. An explicit env override is tried first for other instances.
function today(): string {
  const n = new Date();
  return `${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, '0')}${String(n.getDate()).padStart(2, '0')}`;
}

function candidates(studentId: number): string[] {
  const d = today();
  const absencesView = `/api/classreg/absences/students?studentId=${studentId}&startDate=${d}&endDate=${d}&excuseStatusId=-1`;
  return [process.env.WEBUNTIS_API_PATH_ABSENCE_REASONS, absencesView].filter(Boolean) as string[];
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
        { error: 'Abwesenheitsgründe konnten gerade nicht geladen werden.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ reasons: parseReasons(result.json) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[absence-reasons] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
