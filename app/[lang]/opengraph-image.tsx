import { ogCard, OG_SIZE } from '@/lib/og/card';
import { routeLocale } from '@/lib/i18n/server';
import { ACTIVE_LOCALES } from '@/lib/i18n/locale';

export const size = OG_SIZE;
export const contentType = 'image/png';
// Written once when the website is built (a static file).
export const dynamic = 'force-static';
export const alt = 'POKYH';

// One card per language, rendered at build time.
export function generateStaticParams() {
  return ACTIVE_LOCALES.map((lang) => ({ lang }));
}

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  return ogCard(await routeLocale(params), 'homeTitle', 'homeLine');
}
