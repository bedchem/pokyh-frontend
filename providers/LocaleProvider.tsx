'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { DEFAULT_LOCALE, LOCALE_COOKIE, localizePath, stripLocale, type Locale } from '@/lib/i18n/locale';
import { makeT, type Dictionary } from '@/lib/i18n/dictionary';
import { dateFnsLocale, intlLocaleTag } from '@/lib/i18n/dateLocale';

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const Ctx = createContext<LocaleCtx>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

// The URL prefix (/de/, /it/, …) is the single source of truth. Switching
// the language remembers it in a cookie (read by the proxy for unprefixed
// URLs) and loads the same page under the new prefix. It's a full page load
// on purpose: the root layout sits in app/[lang], so a client-side
// navigation would re-create <html>/<head> in the browser, and React refuses
// to run the inline theme <script> there.
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo<LocaleCtx>(
    () => ({
      locale,
      setLocale(next: Locale) {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
        if (next === locale) return;
        const { pathname, search, hash } = window.location;
        window.location.assign(localizePath(pathname, next) + search + hash);
      },
    }),
    [locale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLocale = () => useContext(Ctx);

/** Current route without locale prefix and trailing slash (/de/home/ → /home). */
export function useRoutePath(): string {
  return stripLocale(usePathname() ?? '/');
}

/** Maps an app route to its URL in the current locale ('/home' → '/de/home/'). */
export function useLocalizeHref() {
  const { locale } = useLocale();
  return useCallback((href: string) => localizeHref(href, locale), [locale]);
}

function localizeHref(href: string, locale: Locale): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const match = href.match(/^([^?#]*)(.*)$/)!;
  return localizePath(match[1], locale) + match[2];
}

/** Intl tag for toLocaleDateString & co. and the date-fns locale of the current language. */
export function useDateLocale() {
  const { locale } = useLocale();
  return useMemo(() => ({ tag: intlLocaleTag(locale), fns: dateFnsLocale(locale) }), [locale]);
}

export function useT<K extends string>(dict: Dictionary<K>) {
  const { locale } = useLocale();
  return useMemo(() => makeT(dict, locale), [dict, locale]);
}
