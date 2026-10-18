import type { Metadata } from 'next';
import { ACTIVE_LOCALES, FALLBACK_LOCALE, type Locale } from './locale';

/**
 * Open Graph locale per app locale: the regions link previews know (Ladin has
 * no ISO 639-1 code, so it keeps its 639-3 one).
 */
export const OG_LOCALE: Record<Locale, string> = {
  de: 'de_DE',
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
      'x-default': localizedUrl(siteUrl, FALLBACK_LOCALE, path),
    },
  };
}

/** Open Graph locale fields for a page. */
export function ogLocale(locale: Locale): { locale: string; alternateLocale: string[] } {
  return { locale: OG_LOCALE[locale], alternateLocale: ACTIVE_LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]) };
}

/**
 * Search terms per language: what people type when they look for a better way
 * to use WebUntis. Few and honest; search engines rank on the visible text.
 */
export const SITE_KEYWORDS: Record<Locale, string[]> = {
  de: [
    'POKYH', 'WebUntis Alternative', 'WebUntis App', 'Untis App Alternative', 'WebUntis Login', 'WebUntis Schule finden',
    'Stundenplan App', 'Vertretungsplan App', 'Schul-App', 'Schulapp kostenlos', 'Noten App', 'Notenschnitt berechnen',
    'Abwesenheiten Schule', 'Fehlstunden', 'Schülerportal', 'Eltern WebUntis', 'Schulapp Südtirol', 'Schulapp Österreich',
    'Schulapp Deutschland', 'Schulapp Schweiz',
  ],
  it: [
    'POKYH', 'alternativa WebUntis', 'app WebUntis', 'WebUntis accesso', 'cercare scuola WebUntis', 'app orario scolastico',
    'app supplenze', 'app scuola', 'app scolastica gratuita', 'app voti', 'calcolo media voti', 'assenze scuola',
    'ore di assenza', 'portale studenti', 'genitori WebUntis', 'app scuola Alto Adige', 'app scuola Italia',
  ],
  en: [
    'POKYH', 'WebUntis alternative', 'WebUntis app', 'Untis app alternative', 'WebUntis login', 'find WebUntis school',
    'school timetable app', 'substitution plan app', 'school app', 'free school app', 'grades app', 'grade average calculator',
    'school absences', 'absence percentage calculator', 'student portal', 'WebUntis for parents', 'school app Europe', 'school app worldwide',
  ],
  lld: [],
};

/** Page keywords for `de` when a page has its own, the site-wide list of the language otherwise. */
export function pageKeywords(locale: Locale, german: string[] = []): string[] {
  return locale === 'de' && german.length ? german : SITE_KEYWORDS[locale];
}

/**
 * The link preview of a page (the generated cards in app/[lang]/…/opengraph-image).
 * Set on every page, because a page's own `openGraph` replaces the one it
 * would inherit, images included.
 */
export function ogImage(locale: Locale, section: 'home' | 'login' | 'legal' = 'home') {
  const path = section === 'home' ? '' : `${section}/`;
  return [{ url: `/${locale}/${path}opengraph-image`, width: 1200, height: 630, alt: 'POKYH' }];
}
