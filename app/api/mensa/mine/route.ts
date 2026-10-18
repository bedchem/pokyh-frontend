import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// The menu of the signed-in account's own school. The backend picks the
// school from the account; a school without a menu answers
// `{ available: false }` and the app shows no Mensa at all. Never cached by
// shared caches: the answer depends on the account.

const BACKEND_URL = (process.env.API_BACKEND_URL ?? 'https://api.pokyh.com').replace(/\/$/, '');
const API_KEY = process.env.API_BACKEND_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? '';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = (await cookies()).get('pokyh_api_token')?.value;
  try {
    const res = await fetch(`${BACKEND_URL}/dishes`, {
      headers: {
        Accept: 'application/json',
        ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return NextResponse.json({ error: 'Mensa API error' }, { status: res.status, headers: { 'Cache-Control': 'private, no-store' } });
    return NextResponse.json(await res.json(), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e: unknown) {
    console.error(`[mensa/mine] ${BACKEND_URL}/dishes unreachable: ${e instanceof Error ? e.message : e}`);
    return NextResponse.json({ error: 'unavailable' }, { status: 502, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
