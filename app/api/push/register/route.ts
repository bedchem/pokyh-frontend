import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/server-session';

const API_BASE = (process.env.API_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_BACKEND_URL ?? 'https://api.pokyh.com').replace(/\/$/, '');
const API_KEY = process.env.API_BACKEND_KEY ?? process.env.NEXT_PUBLIC_API_BACKEND_KEY ?? '';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const apiToken = request.cookies.get('pockyh_api_token')?.value;
  if (!apiToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { endpoint, p256dh, auth } = await request.json() as {
    endpoint: string;
    p256dh: string;
    auth: string;
  };

  const res = await fetch(`${API_BASE}/push/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      endpoint,
      p256dh,
      auth,
      jsessionid: session.sessionId,
      bearerToken: session.bearerToken ?? '',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    return NextResponse.json({ error: err.error ?? 'registration failed' }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}
