import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { untis } from '@/lib/server/untis';

export const runtime = 'nodejs';

// Message folders (MessageCenter 2021). Each returns a differently named array
// (incomingMessages / sentMessages / draftMessages); the client normalises them.
const FOLDER_PATHS: Record<string, string> = {
  inbox: process.env.WEBUNTIS_API_PATH_MSG_LIST || '/api/rest/view/v1/messages',
  sent: process.env.WEBUNTIS_API_PATH_MSG_SENT || '/api/rest/view/v1/messages/sent',
  drafts: process.env.WEBUNTIS_API_PATH_MSG_DRAFTS || '/api/rest/view/v1/messages/drafts',
};

const idOk = (id: string | null): id is string => !!id && /^\d{1,12}$/.test(id);

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'session_expired' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('id');
  if (messageId !== null && !idOk(messageId)) {
    return NextResponse.json({ error: 'Ungültige Nachrichten-ID.' }, { status: 400 });
  }

  const folder = searchParams.get('folder') ?? 'inbox';
  const path = messageId
    ? folder === 'sent'
      ? `/api/rest/view/v1/messages/sent/${messageId}`
      : `/api/rest/view/v1/messages/${messageId}`
    : `${FOLDER_PATHS[folder] ?? FOLDER_PATHS.inbox}?pageSize=100&start=0`;

  try {
    const res = await untis(session, path);
    if (res.expired || res.status === 403) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    if (!res.ok) {
      console.error('[messages] WebUntis error:', res.status);
      return NextResponse.json({ error: 'Die Nachrichten konnten gerade nicht geladen werden.' }, { status: 502 });
    }
    // Attachment lists ride along in the message detail.
    if (messageId && searchParams.get('attachments') === '1') {
      const j = (res.json ?? {}) as Record<string, unknown>;
      const d = (j.data as Record<string, unknown>) ?? j;
      return NextResponse.json({ attachments: d.storageAttachments ?? d.attachments ?? [] });
    }
    return NextResponse.json(res.json);
  } catch (e: unknown) {
    console.error('[messages] Error:', e instanceof Error ? e.message : 'unknown');
    return NextResponse.json({ error: 'Die Nachrichten konnten gerade nicht geladen werden.' }, { status: 502 });
  }
}

// POST ?id= → mark one message as read. WebUntis has no separate "mark read"
// call; the official client marks a message read by opening it, so we do the same.
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'session_expired' }, { status: 401 });

  const messageId = new URL(req.url).searchParams.get('id');
  if (!idOk(messageId)) return NextResponse.json({ error: 'Ungültige Nachrichten-ID.' }, { status: 400 });

  try {
    const res = await untis(session, `/api/rest/view/v1/messages/${messageId}`);
    if (res.expired) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    return NextResponse.json({ ok: res.ok });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
