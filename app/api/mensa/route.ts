import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_BACKEND_URL ?? 'http://localhost:4000';

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/dishes`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Mensa API error' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
