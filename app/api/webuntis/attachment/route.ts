import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';

const BASE = 'https://lbs-brixen.webuntis.com/WebUntis';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('messageId');
  const storageId = searchParams.get('storageId');
  const attachmentId = searchParams.get('attachmentId') ?? '0';
  const name = searchParams.get('name') ?? 'Anhang';

  if (!messageId || !storageId) {
    return NextResponse.json({ error: 'Parameter fehlen.' }, { status: 400 });
  }

  const headers = webUntisHeaders(session);

  // Strategy 1: Try attachmentstorageurl for encrypted S3 downloads (like the Flutter app)
  try {
    const storageInfoUrl = `${BASE}/api/rest/view/v1/messages/${storageId}/attachmentstorageurl`;
    const infoRes = await fetch(storageInfoUrl, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (infoRes.ok) {
      const info = await infoRes.json();
      const downloadUrl = info?.downloadUrl as string | undefined;
      const additionalHeaders = info?.additionalHeaders as Array<{ name: string; value: string }> | undefined;

      if (downloadUrl) {
        const reqHeaders: Record<string, string> = {};
        if (additionalHeaders) {
          for (const h of additionalHeaders) {
            if (h.name && h.value) reqHeaders[h.name] = h.value;
          }
        }
        const fileRes = await fetch(downloadUrl, {
          headers: reqHeaders,
          signal: AbortSignal.timeout(30000),
        });
        if (fileRes.ok) {
          return streamFile(fileRes, name);
        }
      }
    }
  } catch {/* fallthrough */}

  // Strategy 2: Try multiple direct URL candidates (same order as Flutter app)
  const candidates = [
    `${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${storageId}`,
    `${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${storageId}/content`,
    `${BASE}/api/rest/view/v1/messages/${messageId}/storage/${storageId}`,
  ];
  if (attachmentId !== '0') {
    candidates.push(`${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${attachmentId}`);
    candidates.push(`${BASE}/api/rest/view/v1/messages/${messageId}/attachments/${attachmentId}/content`);
  }

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) {
        return streamFile(res, name);
      }
    } catch {/* try next */}
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
