import { ogCard, OG_SIZE } from '@/lib/og/card';
import { routeLocale } from '@/lib/i18n/server';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'POKYH';

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  return ogCard(await routeLocale(params), 'homeTitle', 'homeLine');
}
