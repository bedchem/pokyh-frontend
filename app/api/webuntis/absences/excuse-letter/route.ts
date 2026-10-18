import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { cookieHeader, untis, untisBase } from '@/lib/server/untis';
import { ymdNumber } from '@/lib/server/absences';

export const runtime = 'nodejs';

// "Entschuldigungsschreiben drucken": the excuse letter WebUntis generates as a PDF.
// Same request as the official absence list (handleOpenExcuseReport):
//   GET /reports.do?name=Excuse&format=pdf&rpt_sd&rpt_ed&excuseStatusId&withLateness=true
//       &withAbsences=true&excuseGroup=1|2&id=…
// returns { data: { finished, messageId, reportParams } }; a finished report is
// downloaded from /reports.do?msgId=…&<reportParams>. Reports that WebUntis is
// still generating answer 202 and can simply be requested again.
//
// Read-only: generating the letter changes nothing in WebUntis.

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'session_expired' }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const start = ymdNumber(sp.get('start'));
  const end = ymdNumber(sp.get('end'));
  const group = sp.get('group') === '2' ? '2' : '1'; // 1 = per lesson, 2 = per day
  const ids = (sp.get('ids') ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 100);
  if (start == null || end == null) return NextResponse.json({ error: 'Ungültiger Zeitraum.' }, { status: 400 });

  const params = new URLSearchParams({
    name: 'Excuse',
    format: 'pdf',
    rpt_sd: String(start),
    rpt_ed: String(end),
    excuseStatusId: sp.get('status') && /^-?\d{1,6}$/.test(sp.get('status')!) ? sp.get('status')! : '1',
    withLateness: 'true',
    withAbsences: 'true',
    excuseGroup: group,
  });
  for (const id of ids) params.append('id', String(id));

  try {
    const job = await untis(session, `/reports.do?${params.toString()}`, { rest: false, timeoutMs: 20000 });
    if (job.expired) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    const data = (job.json as { data?: { finished?: boolean; messageId?: unknown; reportParams?: unknown; reportName?: unknown } } | null)?.data;
    if (!job.ok || !data) {
      return NextResponse.json({ error: 'Das Entschuldigungsschreiben konnte nicht erstellt werden.' }, { status: 502 });
    }
    if (!data.finished) {
      return NextResponse.json({ pending: true, error: 'WebUntis erstellt das Schreiben noch. Versuch es gleich noch einmal.' }, { status: 202 });
    }

    const file = await fetch(`${untisBase(session)}/reports.do?msgId=${encodeURIComponent(String(data.messageId ?? ''))}&${String(data.reportParams ?? '')}`, {
      headers: { Cookie: cookieHeader(session) },
      signal: AbortSignal.timeout(30000),
      cache: 'no-store',
    });
    const type = file.headers.get('content-type') ?? '';
    if (!file.ok || type.includes('text/html') || type.includes('application/json')) {
      return NextResponse.json({ error: 'Das Entschuldigungsschreiben konnte nicht geladen werden.' }, { status: 502 });
    }
    const buffer = await file.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': type || 'application/pdf',
        'Content-Disposition': `inline; filename="Entschuldigung-${start}.pdf"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Das Entschuldigungsschreiben konnte nicht erstellt werden.' }, { status: 502 });
  }
}
