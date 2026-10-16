import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { untis, untisError } from '@/lib/server/untis';
import { fetchMessagePermissions, plainTextToHtml } from '@/lib/untis-messages';

export const runtime = 'nodejs';

// MessageCenter writes, exactly as the official WebUntis web client makes them
// (multipart/form-data: a JSON part "request" plus repeatable "attachments"):
//
//   • TEACHER / STAFF / CUSTOM recipient option → POST /api/rest/view/v2/messages/users
//     { subject, content, requestConfirmation, recipientUserIds, forbidReply, oneDriveAttachments, draftMessageId? }
//   • any other option                          → POST /api/rest/view/v2/messages
//     { subject, content, recipientOption, recipientPersonIds, recipientGroupIds, copyToStudent, … }
//   • new draft                                 → POST /api/rest/view/v2/messages/drafts
//   • edited draft                              → PUT  /api/rest/view/v2/messages/drafts/{id}
//
// Drafts carry no recipients in WebUntis; they are chosen when sending. Each
// write is sent once to one endpoint and never retried against a guessed path.

const USER_OPTIONS = new Set(['TEACHER', 'STAFF', 'CUSTOM']);

// Readable fallback text for callers that show `error` directly; `code` stays stable.
const MESSAGES: Record<string, string> = {
  invalid_request: 'Ungültige Anfrage.',
  no_recipient: 'Kein Empfänger ausgewählt.',
  one_recipient: 'Bitte genau eine Lehrkraft als Empfänger auswählen.',
  no_subject: 'Betreff fehlt.',
  no_content: 'Nachrichtentext fehlt.',
  empty_draft: 'Entwurf ist leer.',
  too_many_files: 'Zu viele Anhänge.',
  file_too_large: 'Eine Datei ist zu groß.',
  send_failed: 'Die Nachricht konnte nicht gesendet werden.',
  draft_failed: 'Der Entwurf konnte nicht gespeichert werden.',
  session_expired: 'session_expired',
};

function fail(code: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: MESSAGES[code] ?? code, code, ...extra }, { status });
}

interface Input {
  subject: string;
  content: string;
  recipientIds: number[];
  files: File[];
  draftId: number | null;
}

async function readInput(req: NextRequest): Promise<Input> {
  const form = await req.formData();
  let rawRecipients: unknown = [];
  try { rawRecipients = JSON.parse(String(form.get('recipients') ?? '[]')); } catch { rawRecipients = []; }
  const recipientIds = (Array.isArray(rawRecipients) ? rawRecipients : [])
    .map((r) => Number((r as { id?: unknown })?.id ?? r))
    .filter((id) => Number.isInteger(id) && id > 0);
  // The draft being edited arrives as a form field or, from older callers, as `?id=`.
  const draftRaw = String(form.get('draftId') ?? new URL(req.url).searchParams.get('id') ?? '');
  return {
    subject: String(form.get('subject') ?? '').trim().slice(0, 255),
    content: String(form.get('content') ?? '').slice(0, 10000),
    recipientIds: [...new Set(recipientIds)],
    files: form.getAll('attachments').filter((f): f is File => f instanceof File && f.size > 0),
    draftId: /^\d{1,12}$/.test(draftRaw) ? Number(draftRaw) : null,
  };
}

function multipart(request: unknown, files: File[]): FormData {
  const fd = new FormData();
  fd.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
  for (const f of files) fd.append('attachments', f, f.name);
  return fd;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return fail('session_expired', 401);

  const isDraft = new URL(req.url).searchParams.get('draft') === '1';

  let input: Input;
  try {
    input = await readInput(req);
  } catch {
    return fail('invalid_request', 400);
  }
  const { subject, content, recipientIds, files, draftId } = input;

  if (!isDraft) {
    if (recipientIds.length === 0) return fail('no_recipient', 400);
    if (!subject) return fail('no_subject', 400);
    if (!content.trim()) return fail('no_content', 400);
  } else if (!subject && !content.trim() && files.length === 0) {
    return fail('empty_draft', 400);
  }

  try {
    const perms = await fetchMessagePermissions(session);
    if (perms.expired) return fail('session_expired', 401);

    if (files.length > perms.maxFileCount) return fail('too_many_files', 400, { limit: perms.maxFileCount });
    const tooBig = files.find((f) => f.size > perms.maxFileSize);
    if (tooBig) return fail('file_too_large', 400, { name: tooBig.name, limit: perms.maxFileSize });

    const option = perms.recipientOptions[0] ?? 'TEACHER';
    // With the TEACHER option the official client sends to exactly one person
    // (its picker is single-select); WebUntis rejects several.
    if (!isDraft && option === 'TEACHER' && recipientIds.length !== 1) return fail('one_recipient', 400);
    const html = plainTextToHtml(content);

    let path: string;
    let method: 'POST' | 'PUT' = 'POST';
    let request: Record<string, unknown>;

    if (isDraft) {
      request = {
        subject,
        content: html,
        recipientOption: option,
        copyToStudent: false,
        requestConfirmation: false,
        forbidReply: false,
        oneDriveAttachments: [],
      };
      if (draftId) {
        path = `/api/rest/view/v2/messages/drafts/${draftId}`;
        method = 'PUT';
        request.attachmentIdsToDelete = [];
      } else {
        path = '/api/rest/view/v2/messages/drafts';
      }
    } else if (USER_OPTIONS.has(option)) {
      path = '/api/rest/view/v2/messages/users';
      request = {
        subject,
        content: html,
        requestConfirmation: false,
        recipientUserIds: recipientIds,
        forbidReply: false,
        oneDriveAttachments: [],
        ...(draftId ? { draftMessageId: draftId } : {}),
      };
    } else {
      path = '/api/rest/view/v2/messages';
      request = {
        subject,
        content: html,
        recipientOption: option,
        recipientPersonIds: recipientIds,
        recipientGroupIds: [],
        copyToStudent: false,
        requestConfirmation: false,
        forbidReply: false,
        oneDriveAttachments: [],
        ...(draftId ? { draftMessageId: draftId } : {}),
      };
    }

    const res = await untis(session, path, { method, form: multipart(request, files), timeoutMs: 30000 });
    if (res.expired) return fail('session_expired', 401);
    if (res.ok) return NextResponse.json({ ok: true, data: res.json });

    console.error('[messages/send] WebUntis rejected the request:', res.status);
    const code = isDraft ? 'draft_failed' : 'send_failed';
    return NextResponse.json({ error: untisError(res.json) ?? MESSAGES[code], code, status: res.status }, { status: 502 });
  } catch (e: unknown) {
    console.error('[messages/send] Error:', e instanceof Error ? e.message : 'unknown');
    return fail(isDraft ? 'draft_failed' : 'send_failed', 502);
  }
}
