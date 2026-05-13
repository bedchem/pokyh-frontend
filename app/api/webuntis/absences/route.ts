import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';

const BASE = process.env.WEBUNTIS_BASE_URL || 'https://lbs-brixen.webuntis.com/WebUntis';
const PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
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

  const baseUrl = `${BASE}/api/classreg/absences/students?studentId=${session.studentId}&startDate=${startDate}&endDate=${endDate}&excuseStatusId=-1&limit=${PAGE_SIZE}&pageSize=${PAGE_SIZE}`;
  const headers = webUntisHeaders(session);

  try {
    const allAbsences: unknown[] = [];
    let totalCount: number | null = null;
    let page = 0;

    while (page < 50) { // safety cap: 50 × 100 = 5000 absences max
      const url = page === 0 ? baseUrl : `${baseUrl}&page=${page}`;
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
      const text = await res.text();

      // Auth/session errors — only bail on first page (subsequent failures just stop pagination)
      if (text.trimStart().startsWith('<') || res.status === 401 || res.status === 403) {
        if (page === 0) {
          console.error('[absences] Session expired');
          return NextResponse.json({ error: 'session_expired' }, { status: 401 });
        }
        break;
      }
      if (!res.ok) {
        if (page === 0) {
          console.error('[absences] API error:', res.status, text.slice(0, 200));
          return NextResponse.json({ error: `Abwesenheiten Fehler (${res.status})` }, { status: 502 });
        }
        break;
      }

      const parsed = JSON.parse(text) as Record<string, unknown>;
      const inner = (parsed?.data as Record<string, unknown>) ?? parsed;
      const pageItems = (inner?.absences as unknown[]) ?? [];

      // Read total count from first page response
      if (totalCount === null) {
        totalCount =
          (inner?.count as number) ??
          (inner?.totalCount as number) ??
          (inner?.totalElements as number) ??
          null;
        console.log('[absences] page 0 — items:', pageItems.length, 'totalCount:', totalCount);
      }

      if (pageItems.length === 0) break; // no more data

      // Duplicate detection: if the first item ID matches what we already have, stop
      const firstId = (pageItems[0] as Record<string, unknown>)?.id;
      if (page > 0 && allAbsences.some((a) => (a as Record<string, unknown>).id === firstId)) {
        console.log('[absences] duplicate page detected at page', page, '— stopping');
        break;
      }

      allAbsences.push(...pageItems);

      const done =
        pageItems.length < PAGE_SIZE ||
        (totalCount !== null && allAbsences.length >= totalCount);
      if (done) break;

      page++;
    }

    console.log('[absences] total fetched:', allAbsences.length, '(expected:', totalCount, ')');
    return NextResponse.json({ data: { absences: allAbsences, count: allAbsences.length } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[absences] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
