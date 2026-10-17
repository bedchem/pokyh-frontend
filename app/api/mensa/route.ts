import { NextResponse } from 'next/server';

// Same fallback as the other backend routes, so a local dev server without
// .env.local still loads the menu from the live backend.
const BACKEND_URL = (process.env.API_BACKEND_URL ?? 'https://api.pokyh.com').replace(/\/$/, '');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/dishes`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Mensa API error' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    const cause = (e as { cause?: { code?: string } })?.cause?.code;
    console.error(`[mensa] ${BACKEND_URL}/dishes unreachable: ${msg}${cause ? ` (${cause})` : ''}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
