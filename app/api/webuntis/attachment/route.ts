import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, SCHOOL_COOKIE_VAL } from '@/lib/server-session';

const BASE = 'https://lbs-brixen.webuntis.com/WebUntis';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('messageId') ?? '';
  const storageId = searchParams.get('storageId') ?? '';
  const attachmentIdRaw = searchParams.get('attachmentId') ?? '';
  const name = searchParams.get('name') ?? 'Anhang';

  if (!messageId || !/^\d{1,12}$/.test(messageId)) {
    return NextResponse.json({ error: 'Ungültige Nachrichten-ID.' }, { status: 400 });
  }
  if (storageId && !/^[\w\-.:@/+=]{1,256}$/.test(storageId)) {
    return NextResponse.json({ error: 'Ungültige Storage-ID.' }, { status: 400 });
  }
  const attachmentId = /^\d{1,12}$/.test(attachmentIdRaw) ? attachmentIdRaw : '';

  // Auth headers matching Flutter: Bearer + Cookie, NO Accept:application/json
  const authHeaders: Record<string, string> = {
    Cookie: `JSESSIONID=${session.sessionId}; schoolname="${SCHOOL_COOKIE_VAL}"`,
    ...(session.bearerToken ? { Authorization: `Bearer ${session.bearerToken}` } : {}),
  };

  // JSON-specific headers for metadata endpoints only
  const jsonHeaders: Record<string, string> = {
    ...authHeaders,
    Accept: 'application/json',
  };

  // ── Strategy 1: attachmentstorageurl (S3 pre-signed URL) ──────────────
  // Flutter: messages/{storageId}/attachmentstorageurl  (keyed on UUID, not messageId)
  if (storageId) {
    try {
      const infoRes = await fetch(
      `${BASE}/api/rest/view/v1/messages/${messageId}/attachmentstorageurl/${storageId}`,
        { headers: jsonHeaders, signal: AbortSignal.timeout(8000) },
      );
      if (infoRes.ok) {
        const info = (await infoRes.json()) as Record<string, unknown>;
        const downloadUrl = info?.downloadUrl as string | undefined;
        const additionalHeaders = info?.additionalHeaders as
          | Array<{ name: string; value: string }>
          | undefined;
        if (downloadUrl) {
          const s3Headers: Record<string, string> = {};
          for (const h of additionalHeaders ?? []) {
            if (h.name && h.value) s3Headers[h.name] = h.value;
          }
          const fileRes = await fetch(downloadUrl, {
            headers: s3Headers,
            signal: AbortSignal.timeout(30000),
          });
          if (fileRes.ok && isFileResponse(fileRes)) return streamFile(fileRes, name);
        }
      }
    } catch {
      /* fallthrough */
    }
  }

  // ── Strategy 2: direct download URLs (mirrors Flutter candidate order) ─
  const candidates: string[] = [];

  if (storageId) {
    candidates.push(
      `${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${storageId}`,
      `${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${storageId}/content`,
      `${BASE}/api/rest/view/v1/messages/${messageId}/storage/${storageId}`,
    );
  }
  if (attachmentId && attachmentId !== '0') {
    candidates.push(
      `${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${attachmentId}`,
      `${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${attachmentId}/content`,
    );
  }

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: authHeaders,
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok && isFileResponse(res)) return streamFile(res, name);
    } catch {
      /* try next */
    }
  }

  return NextResponse.json(
    { error: 'Anhang konnte nicht heruntergeladen werden.' },
    { status: 404 },
  );
}

function isFileResponse(res: Response): boolean {
  const ct = res.headers.get('content-type') ?? '';
  // Reject JSON/HTML error pages masquerading as "OK"
  if (ct.includes('text/html') || ct.includes('application/json')) return false;
  return true;
}

async function streamFile(res: Response, name: string): Promise<NextResponse> {
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength === 0) {
    return NextResponse.json({ error: 'Leere Datei.' }, { status: 404 });
  }
  const safeName = name.replace(/[^\w.\-_ ]/g, '_').replace('..', '_').trim();
  const disposition =
    contentType.startsWith('image/') || contentType === 'application/pdf'
      ? 'inline'
      : 'attachment';
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `${disposition}; filename="${encodeURIComponent(safeName)}"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
