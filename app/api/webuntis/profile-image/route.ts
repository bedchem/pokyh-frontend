import { NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';
import { untisBase } from '@/lib/server/untis';
import { fetchAppData, extractImageUrl } from '@/lib/untis-permissions';

// Proxies the logged-in user's WebUntis profile picture. The image lives behind
// the WebUntis session (cookie + bearer), so the browser can't load it directly -
// this route reads the httpOnly session cookie server-side, discovers the image
// URL from the app-data, then streams the bytes back. Without a picture it
// answers 204 (no content): the image fails quietly and the client shows the
// initials; a 404 would print an error in every visitor's console.
const NO_PICTURE = () => new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'private, max-age=600' } });

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const BASE = untisBase(session);

  // Primary: the image URL captured at login (reliable, session was fresh then).
  // Fallback: a live app-data lookup for sessions created before this was stored.
  let imageUrl = session.imageUrl;
  if (!imageUrl) {
    const appData = await fetchAppData(session);
    imageUrl = appData.ok ? extractImageUrl(appData.json, session.isParent) : undefined;
  }
  if (!imageUrl) return NO_PICTURE();

  // Resolve relative URLs: root-absolute (`/WebUntis/…`) against the origin,
  // anything else against the API base; absolute URLs are used as-is. SSRF guard:
  // only ever fetch from the WebUntis domain family. Profile images are served
  // from a separate CDN host (e.g. images.webuntis.com), so we allow any subdomain
  // of the base's registrable domain (derived from the school's base, not hardcoded)
  // rather than just the exact API host, while still blocking foreign hosts.
  let target: string;
  try {
    const raw = /^https?:\/\//.test(imageUrl)
      ? imageUrl
      : new URL(imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`, BASE).toString();
    const url = new URL(raw);
    const baseHost = new URL(BASE).host;
    const rootDomain = baseHost.split('.').slice(-2).join('.'); // e.g. webuntis.com
    const allowed = url.host === rootDomain || url.host.endsWith(`.${rootDomain}`);
    if (url.protocol !== 'https:' || !allowed) {
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
    if (!res.ok || ct.includes('text/html') || ct.includes('application/json')) return NO_PICTURE();
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0) return NO_PICTURE();
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
