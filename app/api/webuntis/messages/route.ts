import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';

import { WEBUNTIS_BASE } from '@/lib/untis-permissions';
const BASE = WEBUNTIS_BASE;
const DEBUG = process.env.DEBUG_API === 'true';

// Message folders (MessageCenter 2021). Each returns a differently-named array
// (incomingMessages / sentMessages / draftMessages); the client normalises them.
const FOLDER_PATHS: Record<string, string> = {
  inbox: process.env.WEBUNTIS_API_PATH_MSG_LIST || '/api/rest/view/v1/messages',
  sent: process.env.WEBUNTIS_API_PATH_MSG_SENT || '/api/rest/view/v1/messages/sent',
  drafts: process.env.WEBUNTIS_API_PATH_MSG_DRAFTS || '/api/rest/view/v1/messages/drafts',
};

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('id');

  if (messageId !== null && !/^\d{1,12}$/.test(messageId)) {
    return NextResponse.json({ error: 'Ungültige Nachrichten-ID.' }, { status: 400 });
  }

  // List: add pageSize so WebUntis returns messages instead of an empty array
  const wantsAttachments = searchParams.get('attachments') === '1';

  // Fallback attachment list fetch: try /messages/{id}/attachments then /messages/{id}
  if (messageId !== null && wantsAttachments) {
    const headers = webUntisHeaders(session);
    const candidates = [
      `${BASE}/api/rest/view/v1/messages/${messageId}/attachments`,
      `${BASE}/api/rest/view/v1/messages/${messageId}`,
    ];
    for (const u of candidates) {
      try {
        const r = await fetch(u, { headers, signal: AbortSignal.timeout(12000) });
        if (!r.ok) continue;
        const t = await r.text();
        if (t.trimStart().startsWith('<')) continue;
        const j = JSON.parse(t);
        return NextResponse.json(j);
      } catch { /* try next */ }
    }
    return NextResponse.json({ attachments: [] });
  }

  const folderParam = searchParams.get('folder') ?? 'inbox';
  const folderPath = FOLDER_PATHS[folderParam] ?? FOLDER_PATHS.inbox;
  const url = messageId
    ? `${BASE}/api/rest/view/v1/messages/${messageId}`
    : `${BASE}${folderPath}?pageSize=100&start=0`;

  try {
    const res = await fetch(url, {
      headers: webUntisHeaders(session),
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();

    if (DEBUG) console.log('[messages] status:', res.status, 'body[:120]:', text.slice(0, 120));

    if (text.trimStart().startsWith('<') || res.status === 401 || res.status === 403) {
      return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    }
    if (!res.ok) {
      console.error('[messages] API error:', res.status, text.slice(0, 200));
      return NextResponse.json({ error: 'Die Nachrichten konnten gerade nicht geladen werden.' }, { status: 502 });
    }

    const json = JSON.parse(text);

    // Normalize: WebUntis sometimes wraps in { data: { incomingMessages: [...] } }
    // or returns { incomingMessages: [...] } directly.
    // For the list endpoint we always return the parsed root so the client can handle both.
    return NextResponse.json(json);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[messages] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('id');
  if (!messageId || !/^\d{1,12}$/.test(messageId)) {
    return NextResponse.json({ error: 'Ungültige Nachrichten-ID.' }, { status: 400 });
  }

  try {
    await fetch(`${BASE}/api/rest/view/v1/messages/${messageId}/markasread`, {
      method: 'POST',
      headers: webUntisHeaders(session),
      signal: AbortSignal.timeout(15000),
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}
