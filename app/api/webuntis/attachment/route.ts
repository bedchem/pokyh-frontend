import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';

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
  // storageId is optional — attachments can also be fetched by numeric attachmentId alone
  if (storageId && !/^[\w\-.:@/+=]{1,256}$/.test(storageId)) {
    return NextResponse.json({ error: 'Ungültige Storage-ID.' }, { status: 400 });
  }
  const attachmentId = /^\d{1,12}$/.test(attachmentIdRaw) ? attachmentIdRaw : '';

  const headers = webUntisHeaders(session);

  // Strategy 1: attachmentstorageurl — gets a signed S3 URL with optional extra headers
  if (storageId) {
    try {
      const infoRes = await fetch(
        `${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${storageId}/attachmentstorageurl`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      if (infoRes.ok) {
        const info = await infoRes.json() as Record<string, unknown>;
        const downloadUrl = info?.downloadUrl as string | undefined;
        const additionalHeaders = info?.additionalHeaders as Array<{ name: string; value: string }> | undefined;
        if (downloadUrl) {
          const reqHeaders: Record<string, string> = {};
          for (const h of additionalHeaders ?? []) {
            if (h.name && h.value) reqHeaders[h.name] = h.value;
          }
          const fileRes = await fetch(downloadUrl, { headers: reqHeaders, signal: AbortSignal.timeout(30000) });
          if (fileRes.ok) return streamFile(fileRes, name);
        }
      }
    } catch { /* fallthrough */ }
  }

  // Build candidate URLs — put most-likely-correct URLs first
  const candidates: string[] = [];

  if (attachmentId) {
    candidates.push(
      `${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${attachmentId}/download`,
      `${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${attachmentId}/content`,
      `${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${attachmentId}`,
    );
  }
  if (storageId) {
    candidates.push(
      `${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${storageId}/download`,
      `${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${storageId}/content`,
      `${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${storageId}`,
      `${BASE}/api/rest/view/v1/messages/${messageId}/storage/${storageId}`,
    );
  }

  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
      if (res.ok) return streamFile(res, name);
    } catch { /* try next */ }
  }

  return NextResponse.json({ error: 'Anhang konnte nicht heruntergeladen werden.' }, { status: 404 });
}

async function streamFile(res: Response, name: string): Promise<NextResponse> {
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
  const buffer = await res.arrayBuffer();
  const safeName = name.replace(/[^\w.\-_ ]/g, '_').replace('..', '_').trim();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(safeName)}"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
