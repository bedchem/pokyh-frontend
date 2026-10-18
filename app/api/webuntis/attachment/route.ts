import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { logDownloadServer } from '@/lib/activity-logger-server';
import { bearerToken, cookieHeader, untis, untisBase } from '@/lib/server/untis';

export const runtime = 'nodejs';

// Attachment download, the way the official client does it:
//   1. storage attachments: GET /v1/messages/{storageId}/attachmentstorageurl
//      → { downloadUrl, additionalHeaders[] }, then fetch the signed URL with
//      those headers (minus `host`) plus its X-Amz-Date.
//   2. blob attachments:    GET /v1/messages/{attachmentId}/attachment
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'session_expired' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('messageId') ?? '';
  const storageId = searchParams.get('storageId') ?? '';
  const attachmentIdRaw = searchParams.get('attachmentId') ?? '';
  const name = (searchParams.get('name') ?? 'Anhang').slice(0, 200);

  if (!/^\d{1,12}$/.test(messageId)) {
    return NextResponse.json({ error: 'Ungültige Nachrichten-ID.' }, { status: 400 });
  }
  if (storageId && !/^[\w\-.:@/+=]{1,256}$/.test(storageId)) {
    return NextResponse.json({ error: 'Ungültige Storage-ID.' }, { status: 400 });
  }
  const attachmentId = /^\d{1,12}$/.test(attachmentIdRaw) && attachmentIdRaw !== '0' ? attachmentIdRaw : '';

  logDownloadServer(req, name, session.username);

  if (storageId) {
    try {
      const info = await untis(session, `/api/rest/view/v1/messages/${encodeURIComponent(storageId)}/attachmentstorageurl`, { timeoutMs: 10000 });
      if (info.expired) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
      const data = (info.json ?? {}) as { downloadUrl?: string; additionalHeaders?: Array<{ key?: string; name?: string; value?: string }> };
      if (info.ok && data.downloadUrl) {
        const url = new URL(data.downloadUrl);
        if (url.protocol !== 'https:') throw new Error('insecure download url');
        const headers: Record<string, string> = {};
        for (const h of data.additionalHeaders ?? []) {
          const k = h.key ?? h.name;
          if (k && h.value && k.toLowerCase() !== 'host') headers[k] = h.value;
        }
        const amzDate = url.searchParams.get('X-Amz-Date');
        if (amzDate) headers['X-Amz-Date'] = amzDate;
        const file = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
        if (file.ok && isFile(file)) return stream(file, name);
      }
    } catch {
      /* try the blob route below */
    }
  }

  if (attachmentId) {
    try {
      const token = await bearerToken(session);
      const file = await fetch(`${untisBase(session)}/api/rest/view/v1/messages/${attachmentId}/attachment`, {
        headers: {
          Cookie: cookieHeader(session),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(30000),
      });
      if (file.status === 401) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
      if (file.ok && isFile(file)) return stream(file, name);
    } catch {
      /* fall through */
    }
  }

  return NextResponse.json({ error: 'Anhang konnte nicht heruntergeladen werden.' }, { status: 404 });
}

function isFile(res: Response): boolean {
  const ct = res.headers.get('content-type') ?? '';
  return !ct.includes('text/html') && !ct.includes('application/json');
}

async function stream(res: Response, name: string): Promise<NextResponse> {
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength === 0) return NextResponse.json({ error: 'Leere Datei.' }, { status: 404 });
  const safeName = name.replace(/[^\w.\-_ ]/g, '_').replace(/\.\./g, '_').trim() || 'Anhang';
  const inline = contentType.startsWith('image/') || contentType === 'application/pdf';
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(safeName)}"`,
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
