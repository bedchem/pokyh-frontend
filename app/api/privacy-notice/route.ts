import { NextResponse } from 'next/server';
import { PRIVACY_NOTICE_DAY, PRIVACY_NOTICE_VERSION } from '@/lib/privacy-notice';

// GET /api/privacy-notice: the current privacy notice for the iOS and Android
// apps: its version and its day. The apps show it once after an account's first
// sign-in and, as "aktualisiert", to accounts still signed in that acknowledged
// an older version, each time with a link to the full notice; the
// acknowledgement goes to the backend (POST /privacy/acknowledge) as on the
// website. Public and the same for everyone.

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(
    { version: PRIVACY_NOTICE_VERSION, day: PRIVACY_NOTICE_DAY, path: '/legal?view=datenschutz' },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
