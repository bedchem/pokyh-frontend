import type { NextRequest } from 'next/server';
import { mensaFetch, relay, schoolRef, withSchool } from '@/lib/server/mensa-api';

// Comments on a dish (read): the account's own school's, or with ?school=
// what a guest sees of that school's. Writing goes to the account's own backend.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? '';
  if (!/^[a-z0-9-]{1,120}$/i.test(id)) return Response.json({ error: 'invalid' }, { status: 400 });
  const school = schoolRef(req.nextUrl.searchParams.get('school'));
  try {
    return await relay(await mensaFetch(withSchool(`/dish-comments/${encodeURIComponent(id)}`, school), { guest: !!school }));
  } catch {
    return Response.json({ error: 'unavailable' }, { status: 502 });
  }
}
