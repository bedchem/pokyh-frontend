import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';

const BASE = 'https://lbs-brixen.webuntis.com/WebUntis';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') ?? '';
  const endDate = searchParams.get('endDate') ?? '';

  if (startDate && !/^\d{8}$/.test(startDate)) {
    return NextResponse.json({ error: 'Ungültiges Startdatum.' }, { status: 400 });
  }
  if (endDate && !/^\d{8}$/.test(endDate)) {
    return NextResponse.json({ error: 'Ungültiges Enddatum.' }, { status: 400 });
  }

  try {
    const url = `${BASE}/api/homeworks/lessons?startDate=${startDate}&endDate=${endDate}`;
    const res = await fetch(url, { headers: webUntisHeaders(session), signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    if (text.startsWith('<')) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    return NextResponse.json(JSON.parse(text));
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}
