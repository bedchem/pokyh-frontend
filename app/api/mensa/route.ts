import { mensaFetch, MENSA_API_URL, relay } from '@/lib/server/mensa-api';

// The public menu (the installation's default school), read from the Mensa
// backend (lib/server/mensa-api.ts).
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return await relay(await mensaFetch('/dishes'), 'public, s-maxage=600, stale-while-revalidate=3600');
  } catch (e: unknown) {
    const cause = (e as { cause?: { code?: string } })?.cause?.code;
    console.error(`[mensa] ${MENSA_API_URL}/dishes unreachable: ${e instanceof Error ? e.message : e}${cause ? ` (${cause})` : ''}`);
    return Response.json({ error: 'unavailable' }, { status: 502 });
  }
}
