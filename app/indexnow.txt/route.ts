import { indexNowKey } from '@/lib/indexnow';

// The IndexNow key file (lib/indexnow.ts), at the site root so it covers every URL.

export function GET() {
  const key = indexNowKey();
  if (!key) return new Response('Not found', { status: 404 });
  return new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
}
