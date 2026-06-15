import { NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';
import { WEBUNTIS_BASE, fetchAppData, extractImageUrl } from '@/lib/untis-permissions';

// Proxies the logged-in user's WebUntis profile picture. The image lives behind
// the WebUntis session (cookie + bearer), so the browser can't load it directly —
// this route reads the httpOnly session cookie server-side, discovers the image
// URL from the app-data, then streams the bytes back. Returns 404 when the user
// has no picture so the client cleanly falls back to initials.
export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  // Primary: the image URL captured at login (reliable — session was fresh then).
  // Fallback: a live app-data lookup for sessions created before this was stored.
  let imageUrl = session.imageUrl;
  if (!imageUrl) {
    const appData = await fetchAppData(session);
    imageUrl = appData.ok ? extractImageUrl(appData.json, session.isParent) : undefined;
  }
  if (!imageUrl) {
    return NextResponse.json({ error: 'Kein Profilbild vorhanden.' }, { status: 404 });
  }

  // Resolve relative URLs: root-absolute (`/WebUntis/…`) against the origin,
  // anything else against the API base; absolute URLs are used as-is. SSRF guard:
  // only ever fetch from the configured WebUntis host, even if the app-data were
  // to contain a foreign (or malformed) absolute URL.
  let target: string;
  try {
    const raw = /^https?:\/\//.test(imageUrl)
      ? imageUrl
      : new URL(imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`, WEBUNTIS_BASE).toString();
    const url = new URL(raw);
    if (url.host !== new URL(WEBUNTIS_BASE).host) {
      return NextResponse.json({ error: 'Ungültige Bildquelle.' }, { status: 400 });
    }
    target = url.toString();
  } catch {
    return NextResponse.json({ error: 'Ungültige Bildquelle.' }, { status: 400 });
  }

  try {
    const res = await fetch(target, {
      headers: webUntisHeaders(session),
      signal: AbortSignal.timeout(15000),
    });
    const ct = res.headers.get('content-type') ?? '';
    if (!res.ok || ct.includes('text/html') || ct.includes('application/json')) {
      return NextResponse.json({ error: 'Profilbild nicht ladbar.' }, { status: 404 });
    }
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0) {
      return NextResponse.json({ error: 'Leeres Profilbild.' }, { status: 404 });
    }
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': ct || 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Profilbild nicht ladbar.' }, { status: 502 });
  }
}
