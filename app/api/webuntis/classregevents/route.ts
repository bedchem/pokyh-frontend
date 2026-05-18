import { NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';

const BASE = process.env.WEBUNTIS_BASE_URL || 'https://lbs-brixen.webuntis.com/WebUntis';

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  }

  const now = new Date();
  const schoolYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const startDate = `${schoolYear}0908`;
  const endDate = `${schoolYear + 1}0612`;

  const url = `${BASE}/api/classreg/classregevents?startDate=${startDate}&endDate=${endDate}&studentId=${session.studentId}`;
  const headers = webUntisHeaders(session);

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    const text = await res.text();

    if (text.trimStart().startsWith('<') || res.status === 401 || res.status === 403) {
      console.error('[classregevents] Session expired');
      return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    }

    if (!res.ok) {
      console.error('[classregevents] API error:', res.status, text.slice(0, 200));
      return NextResponse.json({ error: `Klassenbuch Fehler (${res.status})` }, { status: 502 });
    }

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[classregevents] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
