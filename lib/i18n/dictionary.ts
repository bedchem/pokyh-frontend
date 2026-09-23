import { DEFAULT_LOCALE, type Locale } from './locale';

type Vars = Record<string, string | number>;

/**
 * `de` must be complete for every key — it's the fallback every other locale
 * falls back to. `it`/`en`/`lld` may be partial while a namespace is
 * mid-translation; a missing key/locale silently falls back to `de` (with a
 * dev-only warning) instead of ever showing `undefined` or a raw key to a
 * student.
 */
export type Dictionary<K extends string> =
  { de: Record<K, string> } & Partial<Record<Exclude<Locale, 'de'>, Partial<Record<K, string>>>>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

const warned = new Set<string>();

function warnMissing(locale: Locale, key: string) {
  if (process.env.NODE_ENV === 'production') return;
  const flag = `${locale}:${key}`;
  if (warned.has(flag)) return;
  warned.add(flag);
  console.warn(`[i18n] missing "${key}" for locale "${locale}", falling back to "${DEFAULT_LOCALE}"`);
}

export function makeT<K extends string>(dict: Dictionary<K>, locale: Locale) {
  return function t(key: K, vars?: Vars): string {
    const localized = locale === 'de' ? dict.de[key] : dict[locale]?.[key];
    if (localized === undefined && locale !== DEFAULT_LOCALE) warnMissing(locale, key);
    return interpolate(localized ?? dict.de[key], vars);
  };
}
