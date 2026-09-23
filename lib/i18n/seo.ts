import type { Metadata } from 'next';
import { ACTIVE_LOCALES, DEFAULT_LOCALE, type Locale } from './locale';

/** Open Graph locale per app locale (Ladin has no ISO 639-1 code, so it keeps its 639-3 one). */
export const OG_LOCALE: Record<Locale, string> = {
  de: 'de_IT',
  it: 'it_IT',
  en: 'en_US',
  lld: 'lld_IT',
};

/** hreflang value per app locale. */
const HREFLANG: Record<Locale, string> = {
  de: 'de',
  it: 'it',
  en: 'en',
  lld: 'lld',
};

/** `/about` → `/de/about/` style URL for one locale. */
export function localizedUrl(siteUrl: string, locale: Locale, path: string): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return `${siteUrl}/${locale}/${clean ? `${clean}/` : ''}`;
}

/**
 * Canonical + hreflang alternates for a page, so search engines treat the
 * language versions as one page instead of duplicates.
 */
export function localeAlternates(siteUrl: string, locale: Locale, path: string): NonNullable<Metadata['alternates']> {
  return {
    canonical: localizedUrl(siteUrl, locale, path),
    languages: {
      ...Object.fromEntries(ACTIVE_LOCALES.map((l) => [HREFLANG[l], localizedUrl(siteUrl, l, path)])),
      'x-default': localizedUrl(siteUrl, DEFAULT_LOCALE, path),
    },
  };
}

/** Open Graph locale fields for a page. */
export function ogLocale(locale: Locale): { locale: string; alternateLocale: string[] } {
  return { locale: OG_LOCALE[locale], alternateLocale: ACTIVE_LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]) };
}

/** Site-wide search keywords per language (page-specific German lists stay for `de`). */
export const SITE_KEYWORDS: Record<Locale, string[]> = {
  de: [],
  it: [
    'POKYH', 'POKYH app', 'app scolastica', 'app scolastica Bressanone', 'LBS Bressanone', 'LBS Bressanone app',
    'Scuola professionale Bressanone', 'Tschuggmall', 'BFS Tschuggmall', 'orario scolastico', 'orario LBS Bressanone',
    'voti scuola', 'media dei voti', 'mensa Bressanone', 'menù mensa', 'assenze scuola', 'registro di classe',
    'promemoria di classe', 'app scuola Alto Adige', 'alternativa WebUntis', 'WebUntis Bressanone', 'app scolastica gratuita',
  ],
  en: [
    'POKYH', 'POKYH app', 'school app', 'school app Brixen', 'LBS Brixen', 'LBS Brixen app', 'vocational school Brixen',
    'Tschuggmall', 'BFS Tschuggmall', 'school timetable', 'timetable app', 'grade average', 'grades app',
    'school cafeteria menu', 'school absences', 'class register', 'class reminders', 'South Tyrol school app',
    'WebUntis alternative', 'WebUntis Brixen', 'free school app',
  ],
  lld: [
    'POKYH', 'POKYH app', 'app dla scola', 'app dla scola Porsenù', 'LBS Porsenù', 'scola prufesciunela Porsenù',
    'Tschuggmall', 'BFS Tschuggmall', 'urar dla scola', 'notes dla scola', 'media dla notes', 'mensa Porsenù',
    'assënzes', 'register de tlas', 'recurdanzes dla tlas', 'app dla scola Südtirol', 'alternativa a WebUntis',
    'Gherdëina', 'ladin',
  ],
};

/** German page keywords for `de`, the site-wide list of the language otherwise. */
export function pageKeywords(locale: Locale, german: string[]): string[] {
  return locale === 'de' ? german : SITE_KEYWORDS[locale];
}
