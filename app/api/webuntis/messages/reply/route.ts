import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { untis, untisError } from '@/lib/server/untis';
import { fetchMessagePermissions, plainTextToHtml } from '@/lib/untis-messages';

export const runtime = 'nodejs';

// Replying to a message, as the official client does it:
//   GET  /api/rest/view/v1/messages/{id}/reply-form?contentAsHtml=false
//        → prefilled subject and the recipient (the original sender)
//   POST /api/rest/view/v2/messages/{id}/reply   (multipart: "request" JSON + "attachments")
//        request = { subject, content, oneDriveAttachments }

const idOk = (id: string | null): id is string => !!id && /^\d{1,12}$/.test(id);

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!idOk(id)) return NextResponse.json({ error: 'Ungültige Nachrichten-ID.' }, { status: 400 });

  try {
    const res = await untis(session, `/api/rest/view/v1/messages/${id}/reply-form?contentAsHtml=false`, { timeoutMs: 12000 });
    if (res.expired) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    if (!res.ok) {
      // WebUntis answers 4xx when the sender forbade replies or the message type has none.
      return NextResponse.json({ error: untisError(res.json) ?? 'Auf diese Nachricht kann nicht geantwortet werden.', code: 'reply_unavailable' }, { status: 409 });
    }
    const form = (res.json ?? {}) as { subject?: unknown; recipient?: { displayName?: unknown; userId?: unknown; id?: unknown } };
    return NextResponse.json({
      subject: String(form.subject ?? ''),
      recipient: form.recipient
        ? { name: String(form.recipient.displayName ?? ''), id: Number(form.recipient.userId ?? form.recipient.id) || null }
        : null,
    });
  } catch {
    return NextResponse.json({ error: 'Antwort konnte nicht vorbereitet werden.', code: 'reply_unavailable' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'session_expired', code: 'session_expired' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!idOk(id)) return NextResponse.json({ error: 'Ungültige Nachrichten-ID.', code: 'invalid_request' }, { status: 400 });

  let subject = '';
  let content = '';
  let files: File[] = [];
  try {
    const form = await req.formData();
    subject = String(form.get('subject') ?? '').trim().slice(0, 255);
    content = String(form.get('content') ?? '').slice(0, 10000);
    files = form.getAll('attachments').filter((f): f is File => f instanceof File && f.size > 0);
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.', code: 'invalid_request' }, { status: 400 });
  }
  if (!subject) return NextResponse.json({ error: 'Betreff fehlt.', code: 'no_subject' }, { status: 400 });
  if (!content.trim()) return NextResponse.json({ error: 'Nachrichtentext fehlt.', code: 'no_content' }, { status: 400 });

  try {
    const perms = await fetchMessagePermissions(session);
    if (perms.expired) return NextResponse.json({ error: 'session_expired', code: 'session_expired' }, { status: 401 });
    if (files.length > perms.maxFileCount) return NextResponse.json({ error: 'Zu viele Anhänge.', code: 'too_many_files' }, { status: 400 });
    if (files.some((f) => f.size > perms.maxFileSize)) return NextResponse.json({ error: 'Eine Datei ist zu groß.', code: 'file_too_large' }, { status: 400 });

    const fd = new FormData();
    fd.append('request', new Blob([JSON.stringify({ subject, content: plainTextToHtml(content), oneDriveAttachments: [] })], { type: 'application/json' }));
    for (const f of files) fd.append('attachments', f, f.name);

    const res = await untis(session, `/api/rest/view/v2/messages/${id}/reply`, { method: 'POST', form: fd, timeoutMs: 30000 });
    if (res.expired) return NextResponse.json({ error: 'session_expired', code: 'session_expired' }, { status: 401 });
    if (res.ok) return NextResponse.json({ ok: true });
    console.error('[messages/reply] WebUntis rejected the request:', res.status);
    return NextResponse.json({ error: untisError(res.json) ?? 'Die Antwort konnte nicht gesendet werden.', code: 'send_failed' }, { status: 502 });
  } catch {
    return NextResponse.json({ error: 'Die Antwort konnte nicht gesendet werden.', code: 'send_failed' }, { status: 502 });
  }
}
