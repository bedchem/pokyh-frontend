import { DEFAULT_LOCALE, isLocale, type Locale } from './locale';
import { makeT, type Dictionary } from './dictionary';

/** Locale from the `[lang]` route param of a Server Component. */
export async function routeLocale(params: Promise<{ lang: string }>): Promise<Locale> {
  const { lang } = await params;
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

/** Server-side counterpart of `useT()`. */
export async function getT<K extends string>(params: Promise<{ lang: string }>, dict: Dictionary<K>) {
  return makeT(dict, await routeLocale(params));
}
