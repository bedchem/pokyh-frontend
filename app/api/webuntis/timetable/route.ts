import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';

const BASE = 'https://lbs-brixen.webuntis.com/WebUntis';
const DEBUG = process.env.DEBUG_API === 'true';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    console.error('[timetable] No session cookie');
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'Datum fehlt.' }, { status: 400 });

  if (DEBUG) console.log('[timetable] date:', date, 'studentId:', session.studentId);

  try {
    const url = `${BASE}/api/public/timetable/weekly/data?elementType=5&elementId=${session.studentId}&date=${date}&formatId=1`;
    if (DEBUG) console.log('[timetable] fetching:', url);

    const res = await fetch(url, { headers: webUntisHeaders(session), signal: AbortSignal.timeout(15000) });
    const text = await res.text();

    if (DEBUG) console.log('[timetable] status:', res.status, 'body[:100]:', text.slice(0, 100));

    if (text.startsWith('<') || res.status === 401 || res.status === 403) {
      console.error('[timetable] Session expired, got HTML or 401');
      return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    }
    if (!res.ok) {
      console.error('[timetable] API error:', res.status, text.slice(0, 200));
      return NextResponse.json({ error: `Stundenplan Fehler (${res.status})` }, { status: 502 });
    }
    return NextResponse.json(JSON.parse(text));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[timetable] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
