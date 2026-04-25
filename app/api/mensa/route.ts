import { NextResponse } from 'next/server';

const MENSA_URL = 'https://mensa.plattnericus.dev/mensa.json';

export const revalidate = 3600; // revalidate hourly

export async function GET() {
  try {
    const res = await fetch(MENSA_URL, {
      headers: { Accept: 'application/json', 'User-Agent': 'ClassByte/1.0' },
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
