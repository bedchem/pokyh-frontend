import { ogCard, OG_SIZE } from '@/lib/og/card';
import { routeLocale } from '@/lib/i18n/server';
import { ACTIVE_LOCALES } from '@/lib/i18n/locale';

// Outside the (site) group on purpose: inside a route group Next adds a hash to
// the image's URL, and the legal page links its preview by the plain URL
// (lib/i18n/seo.ts ogImage).

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'POKYH';

// One card per language, rendered at build time.
export function generateStaticParams() {
  return ACTIVE_LOCALES.map((lang) => ({ lang }));
}

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  return ogCard(await routeLocale(params), 'legalTitle', 'legalLine');
}
