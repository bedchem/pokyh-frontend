import type { NextRequest } from 'next/server';
import { mensaFetch, relay } from '@/lib/server/mensa-api';

// Ratings of dishes: GET ?id= for one, POST { dishIds } for several.
export const dynamic = 'force-dynamic';

const ID = /^[a-z0-9-]{1,120}$/i;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? '';
  if (!ID.test(id)) return Response.json({ error: 'invalid' }, { status: 400 });
  try {
    return await relay(await mensaFetch(`/dish-ratings/${encodeURIComponent(id)}`));
  } catch {
    return Response.json({ error: 'unavailable' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { dishIds?: unknown } | null;
  const dishIds = Array.isArray(body?.dishIds) ? body.dishIds.filter((d): d is string => typeof d === 'string' && ID.test(d)).slice(0, 200) : [];
  if (!dishIds.length) return Response.json({});
  try {
    return await relay(await mensaFetch('/dish-ratings/batch', { method: 'POST', body: { dishIds } }));
  } catch {
    return Response.json({ error: 'unavailable' }, { status: 502 });
  }
}
