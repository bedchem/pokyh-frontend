/**
 * Single source of truth for the app's locale. `lld` (Ladin) is part of the
 * type from day one so every dictionary/date-locale shape is Ladin-ready, but
 * it is deliberately excluded from `ACTIVE_LOCALES` — the one gate that
 * controls whether it's selectable anywhere in the UI — until it ships.
 */
export type Locale = 'de' | 'it' | 'en' | 'lld';

export const DEFAULT_LOCALE: Locale = 'de';

export const ACTIVE_LOCALES: readonly Locale[] = ['de', 'it', 'en', 'lld'];

export const LOCALE_LABELS: Record<Locale, string> = {
  de: 'DE',
  it: 'IT',
  en: 'EN',
  lld: 'LD',
};

export const LOCALE_NAMES: Record<Locale, string> = {
  de: 'Deutsch',
  it: 'Italiano',
  en: 'English',
  lld: 'Ladin',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'de' || value === 'it' || value === 'en' || value === 'lld';
}

/** Cookie the proxy reads to pick the locale for unprefixed URLs. */
export const LOCALE_COOKIE = 'pockyh_locale';

export function htmlLang(locale: Locale): string {
  return locale === 'en' ? 'en' : locale === 'it' ? 'it-IT' : locale === 'lld' ? 'lld' : 'de-IT';
}

/** Route path without locale prefix and trailing slash: /de/home/ → /home, /de/ → / */
export function stripLocale(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (isLocale(parts[0])) parts.shift();
  return '/' + parts.join('/');
}

/** Swaps (or adds) the locale prefix of a pathname, always with a trailing slash. */
export function localizePath(pathname: string, locale: Locale): string {
  const parts = pathname.split('/').filter(Boolean);
  if (isLocale(parts[0])) parts.shift();
  return `/${[locale, ...parts].join('/')}/`;
}
