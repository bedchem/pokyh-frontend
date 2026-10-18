import type { MetadataRoute } from 'next';
import { ACTIVE_LOCALES, FALLBACK_LOCALE } from '@/lib/i18n/locale';
import { localizedUrl, ogImage } from '@/lib/i18n/seo';
import { SITE_PAGES } from '@/lib/seo/pages';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

// Rebuilt once a day, so the menu page carries today's date.
export const revalidate = 86400;

/**
 * One entry per page and language, each listing all its language versions
 * (hreflang) and its link preview image (image sitemap).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString().slice(0, 10);
  return SITE_PAGES.flatMap(({ path, lastModified, changeFrequency, priority, card, daily, locales = ACTIVE_LOCALES }) => {
    const languages = {
      ...Object.fromEntries(locales.map((l) => [l, localizedUrl(SITE_URL, l, path)])),
      'x-default': localizedUrl(SITE_URL, locales.includes(FALLBACK_LOCALE) ? FALLBACK_LOCALE : locales[0], path),
    };
    return locales.map((locale) => ({
      url: localizedUrl(SITE_URL, locale, path),
      lastModified: new Date(daily ? today : lastModified),
      changeFrequency,
      priority,
      alternates: { languages },
      images: ogImage(locale, card).map((i) => `${SITE_URL}${i.url}`),
    }));
  });
}
