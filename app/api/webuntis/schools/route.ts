import { NextRequest, NextResponse } from 'next/server';
import { searchSchools } from '@/lib/server/schools';

// School search for the sign-in page: any school on WebUntis, by name, town or
// postcode. Public (nobody is signed in yet), limited per address, and the
// answers carry no personal data, so shared caches may keep them a while.
// Errors are reasons, not texts: the page says them in the reader's language.

const MIN = 3;
const MAX = 80;
const PER_MINUTE = 40;
const hits = new Map<string, { count: number; reset: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > PER_MINUTE;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').replace(/[\p{C}]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (q.length < MIN || q.length > MAX) {
    return NextResponse.json({ reason: 'short' }, { status: 400 });
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (limited(ip)) {
    return NextResponse.json({ reason: 'rate' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const result = await searchSchools(q);
  if (!result.ok) {
    return NextResponse.json(
      { reason: result.reason },
      { status: result.reason === 'too_many' ? 422 : 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  return NextResponse.json(
    { schools: result.schools },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600' } },
  );
}
