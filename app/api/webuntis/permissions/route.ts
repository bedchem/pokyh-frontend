import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import {
  fetchAppData,
  detectAbsenceRight,
  fetchAbsenceCreateFlag,
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
    // Age-aware gate (WebUntis' own showCreateAbsence) + app-data (for the
    // subject name) fetched in parallel.
    const [flag, data] = await Promise.all([
      fetchAbsenceCreateFlag(session),
      fetchAppData(session),
    ]);

    if (!data.ok && data.expired) {
      return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    }

    const canReportAbsence =
      FORCE_REPORT || (flag !== null ? flag : (data.ok ? detectAbsenceRight(data.json) : false));
    const personName = data.ok
      ? (extractAbsenceSubjectName(data.json) ?? session.personName ?? null)
      : (session.personName ?? null);

    return NextResponse.json({
      canReportAbsence,
      personName,
      ...(DEBUG && data.ok ? { _raw: data.json } : {}),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[permissions] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
