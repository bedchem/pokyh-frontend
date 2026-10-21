import { NextResponse } from 'next/server';
import { getLegalIdentity } from '@/lib/legal-identity';

// GET /api/legal/contact: POKYH's contact point (Digital Services Act Arts. 11,
// 12 and 16), which the "Melden" button of a comment writes to. Configured at
// build time like the legal pages (lib/legal-identity.ts) and written as a
// static file; public and the same for everyone.

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(
    { email: getLegalIdentity().contactEmail },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
}
