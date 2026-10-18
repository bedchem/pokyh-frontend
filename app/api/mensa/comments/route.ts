import type { NextRequest } from 'next/server';
import { mensaFetch, relay } from '@/lib/server/mensa-api';

// Comments on a dish (read). Writing goes to the account's own backend.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? '';
  if (!/^[a-z0-9-]{1,120}$/i.test(id)) return Response.json({ error: 'invalid' }, { status: 400 });
  try {
    return await relay(await mensaFetch(`/dish-comments/${encodeURIComponent(id)}`));
  } catch {
    return Response.json({ error: 'unavailable' }, { status: 502 });
  }
}
