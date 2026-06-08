import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { WEBUNTIS_BASE } from '@/lib/untis-permissions';
import { fetchFreshToken, fetchSchoolYearId, messageWriteHeaders } from '@/lib/untis-messages';

export const runtime = 'nodejs';

const idOk = (id: string | null): id is string => !!id && /^\d{1,12}$/.test(id);

// Loading a draft uses the v1 drafts resource (verified against the live API;
// the v2 path 500s on GET).
const loadPaths = (id: string) => [
  `/api/rest/view/v1/messages/drafts/${id}`,
  `/api/rest/view/v2/messages/drafts/${id}`,
];

// Deleting a draft goes through the general messages resource — NOT /drafts/{id}
// (that 500s). DELETE /v1/messages/{id} returns 200 and removes the draft.
const deletePaths = (id: string) => [
  `/api/rest/view/v1/messages/${id}`,
  `/api/rest/view/v2/messages/${id}`,
];

// HTML message body → plain text for the compose textarea (drafts store HTML).
function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*p\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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

  // Files already uploaded to this draft (kept automatically on a PUT edit).
  const rawA = (d.storageAttachments ?? d.attachments ?? []) as { id?: unknown; name?: unknown }[];
  const attachments = (Array.isArray(rawA) ? rawA : [])
    .map((a) => ({ id: String(a.id ?? ''), name: String(a.name ?? '') }))
    .filter((a) => a.id && a.name);

  return { id: Number(d.id) || undefined, subject, content, recipients, attachments };
}

// GET ?id= → load a draft so the compose sheet can prefill it for editing.
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!idOk(id)) return NextResponse.json({ error: 'Ungültige Entwurf-ID.' }, { status: 400 });

  const [token, schoolYearId] = await Promise.all([fetchFreshToken(session), fetchSchoolYearId(session)]);
  const headers = messageWriteHeaders(session, token, schoolYearId);

  for (const p of loadPaths(id)) {
    try {
      const res = await fetch(`${WEBUNTIS_BASE}${p}`, { headers, signal: AbortSignal.timeout(12000) });
      const text = await res.text();
      if (res.status === 404 || res.status === 500) continue;
      if (res.status === 401 || text.trimStart().startsWith('<')) {
        return NextResponse.json({ error: 'session_expired' }, { status: 401 });
      }
      if (!res.ok) continue;
      return NextResponse.json(parseDraft(JSON.parse(text)));
    } catch { /* try next */ }
  }
  return NextResponse.json({ error: 'Entwurf nicht gefunden.' }, { status: 404 });
}

// DELETE ?id= → delete a draft.
export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!idOk(id)) return NextResponse.json({ error: 'Ungültige Entwurf-ID.' }, { status: 400 });

  const [token, schoolYearId] = await Promise.all([fetchFreshToken(session), fetchSchoolYearId(session)]);
  const headers = messageWriteHeaders(session, token, schoolYearId);

  let lastStatus = 0;
  for (const p of deletePaths(id)) {
    try {
      const res = await fetch(`${WEBUNTIS_BASE}${p}`, {
        method: 'DELETE',
        headers,
        signal: AbortSignal.timeout(12000),
      });
      const text = await res.text();
      if (res.status === 404 || res.status === 500) { lastStatus = res.status; continue; }
      if (res.status === 401 || text.trimStart().startsWith('<')) {
        return NextResponse.json({ error: 'session_expired' }, { status: 401 });
      }
      if (res.ok) return NextResponse.json({ ok: true });
      lastStatus = res.status;
    } catch { /* try next */ }
  }
  return NextResponse.json({ error: 'Entwurf konnte nicht gelöscht werden.' }, { status: lastStatus || 502 });
}
