import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { WEBUNTIS_BASE } from '@/lib/untis-permissions';
import { fetchFreshToken, fetchSchoolYearId, fetchMessagePermissions, messageWriteHeaders } from '@/lib/untis-messages';

export const runtime = 'nodejs';

// MessageCenter 2021 writes go to the v2 collection as multipart/form-data (the
// exact request the WebUntis web client makes, verified against the live API):
//   • part "request"      → the message JSON (application/json)
//   • part "attachments"  → each file (repeatable)
// Sending posts to /messages, saving a draft to /messages/drafts. v1 is kept as a
// fallback for older instances.
function paths(draft: boolean): string[] {
  if (draft) {
    return [
      process.env.WEBUNTIS_API_PATH_MSG_DRAFTS,
      '/api/rest/view/v2/messages/drafts',
      '/api/rest/view/v1/messages/drafts',
    ].filter(Boolean) as string[];
  }
  return [
    process.env.WEBUNTIS_API_PATH_MSG_SEND,
    '/api/rest/view/v2/messages',
    '/api/rest/view/v1/messages',
  ].filter(Boolean) as string[];
}

type Rcpt = { id: number; type: string };
interface Meta {
  subject: string;
  content: string;
  recipientOption: string;
  recipientPersons: { id: number }[];
  recipientGroups: never[];
}

function buildForm(meta: Meta, files: File[]): FormData {
  const fd = new FormData();
  fd.append('request', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
  for (const f of files) fd.append('attachments', f, f.name);
  return fd;
}

type SendResult =
  | { ok: true; data: unknown; path: string }
  | { ok: false; reason: 'expired' }
  | { ok: false; reason: 'notfound' }
  | { ok: false; reason: 'error'; status: number; message?: string; body: string };

// Extract WebUntis' own German error message (errorMessage / validationErrors) so
// the user sees the real reason (e.g. "nur an eine einzige Lehrkraft").
function serverMessage(body: string): string | undefined {
  try {
    const j = JSON.parse(body) as { errorMessage?: string; validationErrors?: { errorMessage?: string }[] };
    if (j.errorMessage && j.errorMessage.trim()) return j.errorMessage.trim();
    const v = j.validationErrors?.map((e) => e.errorMessage).filter(Boolean).join(' ');
    return v && v.trim() ? v.trim() : undefined;
  } catch {
    return undefined;
  }
}

// POST the multipart body to each candidate path. A 404 means the path doesn't
// exist → next path. A 401 (or an HTML body) means the session expired. Anything
// else (incl. 4xx business rules like 403/400) is a real, final answer — its JSON
// errorMessage is surfaced to the user.
async function trySend(
  headers: Record<string, string>,
  candidatePaths: string[],
  meta: Meta,
  files: File[],
  method: 'POST' | 'PUT' = 'POST',
): Promise<SendResult> {
  const seen = new Set<string>();
  let last: { status: number; body: string } | null = null;

  for (const path of candidatePaths) {
    if (seen.has(path)) continue;
    seen.add(path);

    let res: Response;
    try {
      res = await fetch(`${WEBUNTIS_BASE}${path}`, {
        method,
        headers,
        body: buildForm(meta, files),
        signal: AbortSignal.timeout(30000),
      });
    } catch (e) {
      return { ok: false, reason: 'error', status: 0, body: e instanceof Error ? e.message : 'network' };
    }

    const text = await res.text();
    if (res.status === 404) { last = { status: 404, body: text.slice(0, 300) }; continue; }
    if (res.status === 401 || text.trimStart().startsWith('<')) return { ok: false, reason: 'expired' };
    if (res.ok) {
      let data: unknown = null;
      try { data = JSON.parse(text); } catch { /* empty body ok */ }
      return { ok: true, data, path };
    }
    return { ok: false, reason: 'error', status: res.status, message: serverMessage(text), body: text.slice(0, 300) };
  }

  if (last) return { ok: false, reason: 'error', status: last.status, message: serverMessage(last.body), body: last.body };
  return { ok: false, reason: 'notfound' };
}

async function readInput(req: NextRequest): Promise<{
  subject: string;
  content: string;
  recipients: Rcpt[];
  files: File[];
}> {
  const ct = req.headers.get('content-type') ?? '';
  let subject = '';
  let content = '';
  let rawRecipients: unknown[] = [];
  let files: File[] = [];

  if (ct.includes('multipart/form-data')) {
    const form = await req.formData();
    subject = String(form.get('subject') ?? '');
    content = String(form.get('content') ?? '');
    try { rawRecipients = JSON.parse(String(form.get('recipients') ?? '[]')); } catch { rawRecipients = []; }
    files = form.getAll('attachments').filter((f): f is File => f instanceof File && f.size > 0);
  } else {
    const b = (await req.json()) as { subject?: string; content?: string; recipients?: unknown[] };
    subject = b.subject ?? '';
    content = b.content ?? '';
    rawRecipients = b.recipients ?? [];
  }

  const recipients: Rcpt[] = (rawRecipients as { id?: unknown; type?: unknown }[])
    .filter((r) => r && Number.isFinite(Number(r.id)))
    .map((r) => ({ id: Number(r.id), type: String(r.type ?? 'TEACHER').toUpperCase() }));

  return {
    subject: subject.toString().trim().slice(0, 255),
    content: content.toString().slice(0, 10000),
    recipients,
    files,
  };
}

// Send a new message (or save a draft, optionally with attachments) to one or
// more teachers via the WebUntis MessageCenter API.
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const url = new URL(req.url);
  const isDraft = url.searchParams.get('draft') === '1';
  // Editing an existing draft: update it in place (PUT) so its already-uploaded
  // attachments are preserved (WebUntis keeps them on a PUT) instead of being
  // lost by a recreate. Only valid together with draft=1.
  const idParam = url.searchParams.get('id');
  const editDraftId = isDraft && idParam && /^\d{1,12}$/.test(idParam) ? idParam : null;

  let input: Awaited<ReturnType<typeof readInput>>;
  try {
    input = await readInput(req);
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const { subject, content, recipients, files } = input;

  // Drafts may be incomplete; only sending requires recipient + subject + text.
  if (!isDraft) {
    if (recipients.length === 0) return NextResponse.json({ error: 'Kein Empfänger ausgewählt.' }, { status: 400 });
    if (!subject) return NextResponse.json({ error: 'Betreff fehlt.' }, { status: 400 });
    if (!content.trim()) return NextResponse.json({ error: 'Nachrichtentext fehlt.' }, { status: 400 });
  } else if (!subject && !content.trim() && recipients.length === 0 && files.length === 0) {
    return NextResponse.json({ error: 'Entwurf ist leer.' }, { status: 400 });
  }

  try {
    const [token, schoolYearId] = await Promise.all([fetchFreshToken(session), fetchSchoolYearId(session)]);
    const perms = await fetchMessagePermissions(session, token, schoolYearId);

    // Validate attachments against the account's limits before uploading.
    if (files.length > perms.maxFileCount) {
      return NextResponse.json({ error: `Maximal ${perms.maxFileCount} Anhänge erlaubt.` }, { status: 400 });
    }
    const tooBig = files.find((f) => f.size > perms.maxFileSize);
    if (tooBig) {
      const mb = (perms.maxFileSize / (1024 * 1024)).toFixed(0);
      return NextResponse.json({ error: `„${tooBig.name}" ist zu groß (max. ${mb} MB pro Datei).` }, { status: 400 });
    }

    const meta: Meta = {
      subject,
      content,
      recipientOption: perms.recipientOptions[0] ?? 'TEACHER',
      recipientPersons: recipients.map((r) => ({ id: r.id })),
      recipientGroups: [],
    };

    // Editing → PUT the existing draft (keeps its attachments). Otherwise POST
    // to create a draft / send a message.
    const headers = messageWriteHeaders(session, token, schoolYearId);
    const res = editDraftId
      ? await trySend(
          headers,
          [process.env.WEBUNTIS_API_PATH_MSG_DRAFT_UPDATE, `/api/rest/view/v2/messages/drafts/${editDraftId}`].filter(Boolean) as string[],
          meta,
          files,
          'PUT',
        )
      : await trySend(headers, paths(isDraft), meta, files);

    if (res.ok) return NextResponse.json({ ok: true, data: res.data });
    if (res.reason === 'expired') return NextResponse.json({ error: 'session_expired' }, { status: 401 });

    const fallbackMsg = isDraft
      ? 'Der Entwurf konnte nicht gespeichert werden. Bitte versuche es später erneut.'
      : 'Die Nachricht konnte nicht gesendet werden. Bitte versuche es später erneut.';

    if (res.reason === 'error') {
      console.error('[messages/send] API error:', res.status, res.body);
      // Surface WebUntis' own message (business rules etc.) when present.
      return NextResponse.json(
        {
          error: res.message || fallbackMsg,
          ...(process.env.NEXT_PUBLIC_DEBUG_API === 'true' ? { _debug: { status: res.status, body: res.body } } : {}),
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: fallbackMsg }, { status: 502 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[messages/send] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
