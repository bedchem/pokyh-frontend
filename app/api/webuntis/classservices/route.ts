import { NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';

import { WEBUNTIS_BASE } from '@/lib/untis-permissions';
const BASE = WEBUNTIS_BASE;

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const now = new Date();
  const schoolYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const startDate = `${schoolYear}0901`;
  const endDate = `${schoolYear + 1}0630`;

  try {
    const res = await fetch(
      `${BASE}/api/classreg/classservices?startDate=${startDate}&endDate=${endDate}`,
      { headers: webUntisHeaders(session), signal: AbortSignal.timeout(15000) },
    );
    const text = await res.text();
    if (text.trimStart().startsWith('<') || res.status === 401 || res.status === 403)
      return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    if (!res.ok)
      return NextResponse.json({ error: 'Die Klassendienste konnten gerade nicht geladen werden.' }, { status: 502 });
    return NextResponse.json(JSON.parse(text));
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}
