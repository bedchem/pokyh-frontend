import { ogCard } from '@/lib/og/card';

// The link preview of addresses without a language, used by the 404 document
// (app/global-not-found.tsx). A plain file instead of the opengraph-image
// convention: at the root, which has no layout of its own, Next resolves that
// convention without the site's address (metadataBase) and falls back to
// localhost while building.

// Written once when the website is built (a static file).
export const dynamic = 'force-static';

export function GET() {
  return ogCard('en', 'homeTitle', 'homeLine');
}
