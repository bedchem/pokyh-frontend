import { ogAlt, ogCard, OG_SIZE } from '@/lib/og/card';

// Preview for URLs without a language prefix (they redirect to one).
export const alt = ogAlt('en', 'homeTitle');
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return ogCard('en', 'homeTitle', 'homeLine');
}
