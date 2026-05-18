import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';

const BASE = 'https://lbs-brixen.webuntis.com/WebUntis';

function toIso(date: number, time: number): string {
  const d = date.toString().padStart(8, '0');
  const t = time.toString().padStart(4, '0');
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${t.slice(0, 2)}:${t.slice(2, 4)}:00`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date      = searchParams.get('date');
  const startTime = searchParams.get('startTime');
  const endTime   = searchParams.get('endTime');

  if (!date || !startTime || !endTime) {
    return NextResponse.json({ error: 'Parameter fehlen.' }, { status: 400 });
  }

  try {
    const start = encodeURIComponent(toIso(parseInt(date), parseInt(startTime)));
    const end   = encodeURIComponent(toIso(parseInt(date), parseInt(endTime)));
    const url   = `${BASE}/api/rest/view/v2/calendar-entry/detail?elementId=${session.studentId}&elementType=5&startDateTime=${start}&endDateTime=${end}&homeworkOption=DUE`;

    const res  = await fetch(url, { headers: webUntisHeaders(session), signal: AbortSignal.timeout(10000) });
    const text = await res.text();
    if (text.startsWith('<')) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    if (!res.ok) return NextResponse.json({ error: `API ${res.status}` }, { status: 502 });
    return NextResponse.json(JSON.parse(text));
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}
