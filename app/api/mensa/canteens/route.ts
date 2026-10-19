import { mensaFetch, relay } from '@/lib/server/mensa-api';

// The canteens to choose from on the public Mensa page, each with the
// schools it serves (pokyh-backend GET /dishes/canteens).
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return await relay(await mensaFetch('/dishes/canteens', { guest: true }), 'public, s-maxage=600, stale-while-revalidate=3600');
  } catch {
    return Response.json({ error: 'unavailable' }, { status: 502 });
  }
}
