import type { NextRequest } from 'next/server';

const API_BASE = (process.env.API_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_BACKEND_URL ?? 'https://api.pokyh.com').replace(/\/$/, '');
const API_KEY  = process.env.API_BACKEND_KEY  ?? process.env.NEXT_PUBLIC_API_BACKEND_KEY  ?? process.env.NEXT_PUBLIC_API_KEY ?? '';

export function logDownloadServer(
  req: NextRequest,
  filename: string,
  username?: string,
): void {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';
  const userAgent = req.headers.get('user-agent') ?? '';

  fetch(`${API_BASE}/activity-log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-Forwarded-For': ip,
      'User-Agent': userAgent,
    },
    body: JSON.stringify({
      event: 'download',
      page:   req.nextUrl.pathname,
      detail: filename,
    }),
  }).catch(() => {});
}
