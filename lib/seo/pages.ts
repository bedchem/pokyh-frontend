import type { MetadataRoute } from 'next';
import type { Locale } from '@/lib/i18n/locale';

// The public pages, in one place: the sitemap lists them, and each page's
// structured data takes its "last changed" date from here.

export type SitePage = {
  path: string;
  /** Day the page's content last changed (YYYY-MM-DD). */
  lastModified: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
  /** Which link preview card the page uses (lib/i18n/seo.ts ogImage). */
  card?: 'home' | 'login' | 'legal';
  /** Content that changes every day (the menu): listed with today's date. */
  daily?: boolean;
  /** Languages the page exists in, when not all of them. */
  locales?: readonly Locale[];
};

export const SITE_PAGES: SitePage[] = [
  { path: '/', lastModified: '2026-10-18', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/login', lastModified: '2026-10-18', changeFrequency: 'monthly', priority: 0.9, card: 'login' },
  { path: '/webuntis', lastModified: '2026-10-18', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/get', lastModified: '2026-10-17', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/tools/grade-average', lastModified: '2026-10-18', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/tools/absences', lastModified: '2026-10-18', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/faq', lastModified: '2026-10-18', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/about', lastModified: '2026-10-17', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/get/ios', lastModified: '2026-10-17', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/get/android', lastModified: '2026-10-17', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/get/pwa/ios', lastModified: '2026-10-17', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/get/pwa/android', lastModified: '2026-10-17', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/comparison', lastModified: '2026-10-17', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/tools', lastModified: '2026-10-18', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/mensa', lastModified: '2026-10-18', changeFrequency: 'daily', priority: 0.6, daily: true },
  { path: '/howto', lastModified: '2026-10-17', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/legal', lastModified: '2026-10-18', changeFrequency: 'yearly', priority: 0.3, card: 'legal' },
  { path: '/legal/impressum', lastModified: '2026-10-18', changeFrequency: 'yearly', priority: 0.3, card: 'legal' },
  { path: '/legal/datenschutz', lastModified: '2026-10-18', changeFrequency: 'yearly', priority: 0.3, card: 'legal' },
  { path: '/legal/nutzungsbedingungen', lastModified: '2026-10-18', changeFrequency: 'yearly', priority: 0.3, card: 'legal' },
  { path: '/legal/cookies', lastModified: '2026-10-18', changeFrequency: 'yearly', priority: 0.3, card: 'legal' },
  { path: '/legal/learn', lastModified: '2026-10-18', changeFrequency: 'yearly', priority: 0.2, card: 'legal' },
];

/** When a page last changed, for its structured data (today for the daily menu). */
export function pageModified(path: string): string {
  const page = SITE_PAGES.find((p) => p.path === path);
  if (page?.daily) return new Date().toISOString().slice(0, 10);
  return page?.lastModified ?? SITE_PAGES[0].lastModified;
}
