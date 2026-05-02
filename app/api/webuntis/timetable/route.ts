import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';

const BASE = 'https://lbs-brixen.webuntis.com/WebUntis';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'Datum fehlt.' }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Ungültiges Datumsformat.' }, { status: 400 });
  }

  // Compute Saturday (start + 5 days) using local date arithmetic to avoid TZ issues
  const [y, m, d] = date.split('-').map(Number);
  const endDate = new Date(y, m - 1, d + 5);
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  try {
    const url = `${BASE}/api/rest/view/v1/timetable/entries?start=${date}&end=${end}&format=1&resourceType=STUDENT&resources=${session.studentId}&periodTypes=&timetableType=MY_TIMETABLE&layout=START_TIME`;
    const res  = await fetch(url, { headers: webUntisHeaders(session), signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    if (text.startsWith('<') || res.status === 401 || res.status === 403) {
      return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    }
    if (!res.ok) return NextResponse.json({ error: `API ${res.status}` }, { status: 502 });
    return NextResponse.json(JSON.parse(text));
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}
