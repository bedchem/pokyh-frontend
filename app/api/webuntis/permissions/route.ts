import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import {
  fetchAppData,
  detectAbsenceRight,
  extractAbsenceSubjectName,
  FORCE_REPORT,
} from '@/lib/untis-permissions';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_API === 'true';

// Returns the current user's WebUntis capabilities relevant to the write
// features — primarily whether they may self-report/excuse absences (18+ gate).
export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  try {
    const data = await fetchAppData(session);
    if (!data.ok) {
      if (data.expired) {
        return NextResponse.json({ error: 'session_expired' }, { status: 401 });
      }
      // App-data unavailable: fall back to the dev override only, never assume rights.
      return NextResponse.json({
        canReportAbsence: FORCE_REPORT,
        personName: session.personName ?? null,
      });
    }

    const canReportAbsence = FORCE_REPORT || detectAbsenceRight(data.json);
    const personName = extractAbsenceSubjectName(data.json) ?? session.personName ?? null;

    return NextResponse.json({
      canReportAbsence,
      personName,
      ...(DEBUG ? { _raw: data.json } : {}),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[permissions] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
