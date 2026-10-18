import { ogCard, OG_SIZE } from '@/lib/og/card';
import { routeLocale } from '@/lib/i18n/server';

// Outside the (site) group on purpose: inside a route group Next adds a hash to
// the image's URL, and the legal page links its preview by the plain URL
// (lib/i18n/seo.ts ogImage).

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'POKYH';

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  return ogCard(await routeLocale(params), 'legalTitle', 'legalLine');
}
