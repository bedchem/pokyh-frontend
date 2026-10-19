import type { NextRequest } from 'next/server';
import { mensaFetch, relay, schoolRef, withSchool } from '@/lib/server/mensa-api';

// Ratings of dishes: GET ?id= for one, POST { dishIds } for several. With
// ?school= they are what a guest sees of that school's ratings.
export const dynamic = 'force-dynamic';

const ID = /^[a-z0-9-]{1,120}$/i;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? '';
  if (!ID.test(id)) return Response.json({ error: 'invalid' }, { status: 400 });
  const school = schoolRef(req.nextUrl.searchParams.get('school'));
  try {
    return await relay(await mensaFetch(withSchool(`/dish-ratings/${encodeURIComponent(id)}`, school), { guest: !!school }));
  } catch {
    return Response.json({ error: 'unavailable' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { dishIds?: unknown } | null;
  const dishIds = Array.isArray(body?.dishIds) ? body.dishIds.filter((d): d is string => typeof d === 'string' && ID.test(d)).slice(0, 200) : [];
  if (!dishIds.length) return Response.json({});
  const school = schoolRef(req.nextUrl.searchParams.get('school'));
  try {
    return await relay(await mensaFetch(withSchool('/dish-ratings/batch', school), { method: 'POST', body: { dishIds }, guest: !!school }));
  } catch {
    return Response.json({ error: 'unavailable' }, { status: 502 });
  }
}
