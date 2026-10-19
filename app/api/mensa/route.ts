import type { NextRequest } from 'next/server';
import { mensaFetch, MENSA_API_URL, relay, schoolRef, withSchool } from '@/lib/server/mensa-api';

// The public menu, read from the Mensa backend (lib/server/mensa-api.ts) as a
// guest: the installation's default school, or with ?school= the school
// chosen on the public Mensa page.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const path = withSchool('/dishes', schoolRef(req.nextUrl.searchParams.get('school')));
  try {
    return await relay(await mensaFetch(path, { guest: true }), 'public, s-maxage=600, stale-while-revalidate=3600');
  } catch (e: unknown) {
    const cause = (e as { cause?: { code?: string } })?.cause?.code;
    console.error(`[mensa] ${MENSA_API_URL}/dishes unreachable: ${e instanceof Error ? e.message : e}${cause ? ` (${cause})` : ''}`);
    return Response.json({ error: 'unavailable' }, { status: 502 });
  }
}
