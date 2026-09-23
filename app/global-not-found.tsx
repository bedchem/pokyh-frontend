import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import { LocaleProvider } from '@/providers/LocaleProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SessionProvider } from '@/providers/SessionProvider';
import NotFoundClient from '@/components/NotFoundClient';
import { makeT } from '@/lib/i18n/dictionary';
import { metaDict } from '@/lib/i18n/dictionaries/meta';
import ThemeScript from '@/components/ThemeScript';
import { DEFAULT_LOCALE, LOCALE_COOKIE, htmlLang, isLocale } from '@/lib/i18n/locale';

// The root layout lives in app/[lang], so URLs that match no route at all
// render this standalone document (see experimental.globalNotFound).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  const t = makeT(metaDict, isLocale(saved) ? saved : DEFAULT_LOCALE);
  return {
    title: `${t('notFound')} | POKYH`,
    robots: { index: false, follow: true },
  };
}

export default async function GlobalNotFound() {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : DEFAULT_LOCALE;

  return (
    <html lang={htmlLang(locale)} className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body suppressHydrationWarning={true}>
        <LocaleProvider locale={locale}>
          <ThemeProvider>
            <SessionProvider>
              <NotFoundClient />
            </SessionProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
