/**
 * Single source of truth for the app's locale. `lld` (Ladin) stays in the
 * type so existing dictionaries keep compiling, but it is not offered anywhere:
 * only `ACTIVE_LOCALES` can be selected, and the proxy sends /lld/ URLs to
 * the German version.
 */
export type Locale = 'de' | 'it' | 'en' | 'lld';

export const DEFAULT_LOCALE: Locale = 'de';

export const ACTIVE_LOCALES: readonly Locale[] = ['de', 'it', 'en'];

/**
 * The language for everyone whose browser asks for none of ours, and the
 * `x-default` of the hreflang links: English unless
 * NEXT_PUBLIC_FALLBACK_LOCALE names another active locale.
 */
export const FALLBACK_LOCALE: Locale = (() => {
  const wanted = process.env.NEXT_PUBLIC_FALLBACK_LOCALE;
  return wanted && (ACTIVE_LOCALES as readonly string[]).includes(wanted) ? (wanted as Locale) : 'en';
})();

/** Locales that exist in the type but are retired from the UI and URLs. */
export const RETIRED_LOCALES: readonly Locale[] = ['lld'];

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
export const LOCALE_COOKIE = 'pokyh_locale';

/** Language of the pages, without a region: they are written for every country. */
export function htmlLang(locale: Locale): string {
  return locale;
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
