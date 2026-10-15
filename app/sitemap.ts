import type { MetadataRoute } from 'next';
import { ACTIVE_LOCALES, DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';
import { localizedUrl } from '@/lib/i18n/seo';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

type Page = {
  path: string;
  lastModified: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
  // Languages the page exists in, when not all of them (the legal texts have no Ladin).
  locales?: readonly Locale[];
};

const PAGES: Page[] = [
  { path: '/', lastModified: '2026-09-23', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/login', lastModified: '2026-09-23', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/mensa', lastModified: '2026-09-23', changeFrequency: 'daily', priority: 0.85 },
  { path: '/get', lastModified: '2026-09-23', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/get/ios', lastModified: '2026-09-23', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/get/android', lastModified: '2026-09-23', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/get/pwa/ios', lastModified: '2026-09-23', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/get/pwa/android', lastModified: '2026-09-23', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/howto', lastModified: '2026-09-23', changeFrequency: 'monthly', priority: 0.55 },
  { path: '/about', lastModified: '2026-09-23', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/faq', lastModified: '2026-09-23', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/comparison', lastModified: '2026-09-23', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/legal', lastModified: '2026-10-15', changeFrequency: 'yearly', priority: 0.3, locales: ['de', 'it', 'en'] },
];

/** One entry per page and language, each listing all its language versions (hreflang). */
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap(({ path, lastModified, changeFrequency, priority, locales = ACTIVE_LOCALES }) => {
    const languages = {
      ...Object.fromEntries(locales.map((l) => [l, localizedUrl(SITE_URL, l, path)])),
      'x-default': localizedUrl(SITE_URL, DEFAULT_LOCALE, path),
    };
    return locales.map((locale) => ({
      url: localizedUrl(SITE_URL, locale, path),
      lastModified: new Date(lastModified),
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  });
}
