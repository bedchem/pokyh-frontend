import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';
import { firstWorkingPost } from '@/lib/untis-permissions';

function candidates(draft: boolean): string[] {
  if (draft) {
    return [
      process.env.WEBUNTIS_API_PATH_MSG_DRAFTS,
      '/api/rest/view/v1/messages/drafts',
    ].filter(Boolean) as string[];
  }
  return [
    process.env.WEBUNTIS_API_PATH_MSG_SEND,
    '/api/rest/view/v1/messages',
    '/api/rest/view/v1/messages/send',
  ].filter(Boolean) as string[];
}

interface Body {
  recipients?: { id: number; type?: string }[];
  subject?: string;
  content?: string;
}

// Send a new message to one or more teachers/recipients via the WebUntis
// messages API (rest/view → uses the Bearer token from webUntisHeaders).
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const isDraft = new URL(req.url).searchParams.get('draft') === '1';

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const recipients = (body.recipients ?? [])
    .filter((r) => r && Number.isFinite(r.id))
    .map((r) => ({ id: Number(r.id), type: (r.type ?? 'TEACHER').toString().toUpperCase() }));
  const subject = (body.subject ?? '').toString().trim().slice(0, 255);
  const content = (body.content ?? '').toString().slice(0, 10000);

  // Drafts may be incomplete; only sending requires recipient + subject + text.
  if (!isDraft) {
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'Kein Empfänger ausgewählt.' }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: 'Betreff fehlt.' }, { status: 400 });
    }
    if (!content.trim()) {
      return NextResponse.json({ error: 'Nachrichtentext fehlt.' }, { status: 400 });
    }
  } else if (!subject && !content.trim()) {
    return NextResponse.json({ error: 'Entwurf ist leer.' }, { status: 400 });
  }

  // Send a superset of recipient shapes so the field WebUntis expects is present.
  // recipientOption is the MessageRecipientOption enum (e.g. TEACHER).
  const payload = {
    subject,
    content,
    recipientOption: recipients[0]?.type ?? 'TEACHER',
    recipients: recipients.map((r) => ({ id: r.id, type: r.type })),
    recipientPersons: recipients.map((r) => r.id),
    storeInSentItems: true,
  };

  try {
    const res = await firstWorkingPost(session, candidates(isDraft), {
      headers: { ...webUntisHeaders(session), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) return NextResponse.json({ ok: true, data: res.data });
    if (res.reason === 'expired') return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    const failMsg = isDraft
      ? 'Der Entwurf konnte nicht gespeichert werden. Bitte versuche es später erneut.'
      : 'Die Nachricht konnte nicht gesendet werden. Bitte versuche es später erneut.';
    if (res.reason === 'error') {
      console.error('[messages/send] API error:', res.status, res.body);
      return NextResponse.json(
        {
          error: failMsg,
          ...(process.env.NEXT_PUBLIC_DEBUG_API === 'true' ? { _debug: { status: res.status, body: res.body } } : {}),
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: failMsg }, { status: 502 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[messages/send] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
