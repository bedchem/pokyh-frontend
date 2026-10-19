import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, DM_Mono } from 'next/font/google';
import '../globals.css';
import { notFound } from 'next/navigation';
import { LocaleProvider } from '@/providers/LocaleProvider';
import { ACTIVE_LOCALES, htmlLang, isLocale, type Locale } from '@/lib/i18n/locale';
import { SOURCE_URL } from '@/lib/site-links';
import { SITE_KEYWORDS, localeAlternates, ogLocale, ogImage } from '@/lib/i18n/seo';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { metaDict } from '@/lib/i18n/dictionaries/meta';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SessionProvider } from '@/providers/SessionProvider';
import { AppProvider } from '@/providers/AppProvider';
import { ActivityLoggerProvider } from '@/providers/ActivityLoggerProvider';
import GlobalOverlays from '@/components/shell/GlobalOverlays';
import CookieBanner from '@/components/CookieBanner';
import AnalyticsLoader from '@/components/AnalyticsLoader';
import PWAInit from '@/components/PWAInit';
import SubjectImagePreloader from '@/components/SubjectImagePreloader';
import ThemeScript from '@/components/ThemeScript';
import AppIconApplier from '@/components/AppIconApplier';
import ConsoleSecret from '@/components/ConsoleSecret';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const analyticsEnabled = /^G-[A-Z0-9]+$/i.test(GA_ID ?? '');

// Plus Jakarta Sans is the Android app's typeface; DM Mono sets tabular data
// (times, periods, rooms) only. Preloaded is what every page uses at once:
// Jakarta's latin subset (German, Italian and English need nothing else; the
// other subsets still load when a page has such letters). DM Mono appears on
// a few screens only and loads when one needs it; preloading files a page
// doesn't use makes the browser warn about them.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
  preload: false,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

const SOURCE = SOURCE_URL;

const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  authors: [{ name: 'POKYH', url: SITE_URL }],
  creator: 'POKYH',
  publisher: 'POKYH',
  applicationName: 'POKYH',
  category: 'education',
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png' }],
  },
  appleWebApp: { capable: true, title: 'POKYH', statusBarStyle: 'default' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
    // Bing Webmaster Tools; Bing's index also feeds Copilot, ChatGPT search and DuckDuckGo.
    ...(process.env.BING_SITE_VERIFICATION ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } } : {}),
  },
};

// The languages are known at build time: every page that needs nothing from
// the request (the app's pages render in the browser) is prerendered once per
// language, so links prefetch it whole and a click opens it at once.
export function generateStaticParams() {
  return ACTIVE_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(metaDict, locale);
  return {
    ...baseMetadata,
    title: { default: t('siteTitle'), template: '%s | POKYH' },
    description: t('siteDescription'),
    keywords: SITE_KEYWORDS[locale],
    alternates: localeAlternates(SITE_URL, locale, '/'),
    openGraph: {
      images: ogImage(locale),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
      url: `${SITE_URL}/${locale}/`,
      title: t('siteTitle'),
      description: t('siteOgDescription'),
    },
    twitter: {
      card: 'summary_large_image',
      images: ogImage(locale).map((i) => i.url),
      title: t('siteTitle'),
      description: t('siteOgDescription'),
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#111114' },
    { media: '(prefers-color-scheme: light)', color: '#F5F2ED' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

/**
 * Who POKYH is and what it does, for search engines and AI answers: the
 * organisation, the website and the app. Only facts that are visible on the
 * pages; no ratings (there are none to show).
 */
function structuredData(locale: Locale) {
  const t = makeT(metaDict, locale);
  const home = `${SITE_URL}/${locale}/`;
  const org = `${SITE_URL}/#organization`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': org,
        name: 'POKYH',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png`, width: 512, height: 512 },
        sameAs: [SOURCE],
        description: t('websiteDescription'),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'POKYH',
        url: home,
        description: t('websiteDescription'),
        inLanguage: ACTIVE_LOCALES.map(htmlLang),
        publisher: { '@id': org },
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}/#app`,
        name: 'POKYH',
        url: home,
        description: t('appDescription'),
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web, iOS, Android',
        browserRequirements: 'Requires JavaScript and a current browser.',
        inLanguage: ACTIVE_LOCALES.map(htmlLang),
        featureList: t('featureList').split('|'),
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', description: t('offerDescription') },
        audience: { '@type': 'EducationalAudience', educationalRole: ['student', 'parent'], audienceType: t('audience') },
        publisher: { '@id': org },
        disambiguatingDescription: t('independence'),
      },
    ],
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html lang={htmlLang(lang)} className={`${jakarta.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(lang)).replace(/</g, '\\u003c') }}
        />
        {/* No preconnect to Google here: even opening the connection would
            hand the visitor's address to Google before any consent.
            AnalyticsLoader loads Analytics only once it is accepted. */}
      </head>
      <body suppressHydrationWarning={true}>
        <LocaleProvider locale={lang}>
          <ThemeProvider>
            <SessionProvider>
              <AppProvider>
                <ActivityLoggerProvider>
                  {children}
                  <GlobalOverlays />
                  <SubjectImagePreloader />
                </ActivityLoggerProvider>
              </AppProvider>
            </SessionProvider>
            <ConsoleSecret />
          </ThemeProvider>
          <CookieBanner analyticsEnabled={analyticsEnabled} />
          <AnalyticsLoader gaId={GA_ID} />
          <PWAInit />
          <AppIconApplier />
        </LocaleProvider>
      </body>
    </html>
  );
}
