import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';

const BASE = 'https://lbs-brixen.webuntis.com/WebUntis';
const DEBUG = process.env.DEBUG_API === 'true';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    console.error('[absences] No session cookie');
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') ?? '';
  const endDate = searchParams.get('endDate') ?? '';

  if (startDate && !/^\d{8}$/.test(startDate)) {
    return NextResponse.json({ error: 'Ungültiges Startdatum.' }, { status: 400 });
  }
  if (endDate && !/^\d{8}$/.test(endDate)) {
    return NextResponse.json({ error: 'Ungültiges Enddatum.' }, { status: 400 });
  }

  if (DEBUG) console.log('[absences] startDate:', startDate, 'endDate:', endDate, 'studentId:', session.studentId);

  try {
    const url = `${BASE}/api/classreg/absences/students?studentId=${session.studentId}&startDate=${startDate}&endDate=${endDate}&excuseStatusId=-1`;
    const res = await fetch(url, { headers: webUntisHeaders(session), signal: AbortSignal.timeout(15000) });
    const text = await res.text();

    if (DEBUG) console.log('[absences] status:', res.status, 'body[:100]:', text.slice(0, 100));

    if (text.trimStart().startsWith('<') || res.status === 401 || res.status === 403) {
      console.error('[absences] Session expired');
      return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    }
    if (!res.ok) {
      console.error('[absences] API error:', res.status, text.slice(0, 200));
      return NextResponse.json({ error: `Abwesenheiten Fehler (${res.status})` }, { status: 502 });
    }
    return NextResponse.json(JSON.parse(text));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[absences] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
