import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { untis } from '@/lib/server/untis';
import { htmlToText } from '@/lib/untis-messages';

export const runtime = 'nodejs';

const idOk = (id: string | null): id is string => !!id && /^\d{1,12}$/.test(id);

interface DraftPerson { id?: unknown; userId?: unknown; type?: unknown; displayName?: unknown; name?: unknown }

function parseDraft(json: unknown) {
  const root = (json as Record<string, unknown>) ?? {};
  const d = (root.data as Record<string, unknown>) ?? root;
  const subject = String(d.subject ?? '');
  const rawContent = String(d.content ?? d.contentHtml ?? d.body ?? '');
  const content = /<[a-z][\s\S]*>/i.test(rawContent) ? htmlToText(rawContent) : rawContent;

  const rawR = (d.recipientPersons ?? d.recipients ?? []) as DraftPerson[];
  const recipients = (Array.isArray(rawR) ? rawR : [])
    .map((r) => ({
      id: Number(r.id ?? r.userId),
      type: String(r.type ?? 'TEACHER').toUpperCase(),
      name: String(r.displayName ?? r.name ?? ''),
    }))
    .filter((r) => Number.isFinite(r.id) && r.id > 0);

  // Files already uploaded to this draft; WebUntis keeps them on a PUT edit.
  const rawA = (d.storageAttachments ?? d.attachments ?? []) as { id?: unknown; name?: unknown }[];
  const attachments = (Array.isArray(rawA) ? rawA : [])
    .map((a) => ({ id: String(a.id ?? ''), name: String(a.name ?? '') }))
    .filter((a) => a.id && a.name);

  return { id: Number(d.id) || undefined, subject, content, recipients, attachments };
}

// GET ?id= → load a draft (GET /v1/messages/drafts/{id}, as the official client does).
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'session_expired' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!idOk(id)) return NextResponse.json({ error: 'Ungültige Entwurf-ID.' }, { status: 400 });

  try {
    const res = await untis(session, `/api/rest/view/v1/messages/drafts/${id}`, { timeoutMs: 12000 });
    if (res.expired) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    if (!res.ok) return NextResponse.json({ error: 'Entwurf nicht gefunden.' }, { status: 404 });
    return NextResponse.json(parseDraft(res.json));
  } catch {
    return NextResponse.json({ error: 'Entwurf konnte nicht geladen werden.' }, { status: 502 });
  }
}

// DELETE ?id= → delete a draft (DELETE /v1/messages/{id}, as the official client does).
export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'session_expired' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!idOk(id)) return NextResponse.json({ error: 'Ungültige Entwurf-ID.' }, { status: 400 });

  try {
    const res = await untis(session, `/api/rest/view/v1/messages/${id}`, { method: 'DELETE', timeoutMs: 12000 });
    if (res.expired) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    if (res.ok) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: 'Entwurf konnte nicht gelöscht werden.' }, { status: 502 });
  } catch {
    return NextResponse.json({ error: 'Entwurf konnte nicht gelöscht werden.' }, { status: 502 });
  }
}
