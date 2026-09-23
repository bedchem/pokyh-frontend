import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { notFound } from 'next/navigation';
import { LocaleProvider } from '@/providers/LocaleProvider';
import { htmlLang, isLocale, type Locale } from '@/lib/i18n/locale';
import { SITE_KEYWORDS, localeAlternates, ogLocale } from '@/lib/i18n/seo';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { metaDict } from '@/lib/i18n/dictionaries/meta';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SessionProvider } from '@/providers/SessionProvider';
import { AppProvider } from '@/providers/AppProvider';
import { SidebarProvider } from '@/providers/SidebarProvider';
import { ActivityLoggerProvider } from '@/providers/ActivityLoggerProvider';
import LayoutShell from '@/components/LayoutShell';
import CookieBanner from '@/components/CookieBanner';
import AnalyticsLoader from '@/components/AnalyticsLoader';
import PWAInit from '@/components/PWAInit';
import SubjectImagePreloader from '@/components/SubjectImagePreloader';
import ThemeScript from '@/components/ThemeScript';
import AppIconApplier from '@/components/AppIconApplier';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const analyticsEnabled = /^G-[A-Z0-9]+$/i.test(GA_ID ?? '');

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'POKYH – Schulapp LBS Brixen',
    template: '%s | POKYH',
  },
  description:
    'POKYH ist die kostenlose Web-App für LBS Brixen Schüler. Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – alles übersichtlich an einem Ort.',
  keywords: [
    'POKYH',
    'POKYH App',
    'POKYH Schulapp',
    'POKYH LBS Brixen',
    'POKYH Südtirol',

    'LBS Brixen',
    'LBS Brixen App',
    'LBS Brixen Stundenplan',
    'LBS Brixen Noten',
    'LBS Brixen Mensa',
    'LBS Brixen Fehlstunden',
    'LBS Brixen Abwesenheiten',
    'LBS Brixen Nachrichten',
    'LBS Brixen Klassenbuch',

    'Landesberufsschule Brixen',
    'Berufsschule Brixen',
    'BFS Tschuggmall',
    'Tschuggmall Schule',
    'Schulportal Brixen',
    'Schulapp Südtirol',
    'Schüler App Südtirol',
    'Berufsschule Südtirol',


    'Stundenplan App',
    'Schulplan App',
    'digitale Schulapp',
    'digitale Schüler App',
    'digitales Klassenbuch',
    'Noten App Schule',
    'Schulorganisation App',
    'Mensa App Schule',
    'Schulverwaltung Schüler',
    'Schülerportal',
    'Schul Dashboard',
    'Schulplaner App',
    'Homework App',
    'School Dashboard',
    'Education App',
    'Student Dashboard',

    'Stundenplan Berufsschule Südtirol',
    'kostenlose Schulapp',
    'kostenlose Schulapp Südtirol',
    'Schulapp kostenlos',
    'gratis Stundenplan App',
    'Schülerorganisation App',

    'Stundenplan',
    'Notenübersicht',
    'Fehlstunden Übersicht',
    'Mensa Speiseplan',
    'Prüfungen Schule',
    'Schul Erinnerungen',
    'Klassen Erinnerungen',
    'Schüler Nachrichten',
    'Schule Nachrichten',

    'Next.js Schulapp',
    'PWA Schulapp',
    'moderne Schulapp',
    'mobile Schulapp',
    'responsive Schulapp',

    'Tschuggmall',
    'BFS Tschuggmall',
    'Tschuggmall Brixen',
    'Tschuggmall Schule',
    'Tschuggmall Schüler',
  ],
  authors: [{ name: 'Nexor', url: 'https://github.com/plattnericus' }, { name: 'Ryhox', url: 'https://github.com/Ryhox' }, { name: 'bedchem', url: 'https://github.com/bedchem/POKYH' }],
  creator: 'POKYH',
  publisher: 'POKYH',
  applicationName: 'POKYH',
  generator: 'Next.js',
  category: 'Education',
  alternates: {
    canonical: SITE_URL,
    languages: {
      'de-IT': SITE_URL,
      'de': SITE_URL,
      'it': SITE_URL,
      'x-default': SITE_URL,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'de_IT',
    alternateLocale: ['it_IT', 'de_DE'],
    url: SITE_URL,
    siteName: 'POKYH',
    title: 'POKYH – Schulapp LBS Brixen',
    description: 'Kostenlose Web-App für LBS Brixen Schüler: Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – schnell, modern, gratis.',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'POKYH – Schulapp LBS Brixen' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKYH – Schulapp LBS Brixen',
    description: 'Kostenlose Web-App für LBS Brixen Schüler: Stundenplan, Noten, Mensa und mehr.',
    images: ['/icon-512.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
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
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(metaDict, locale);
  return {
    ...baseMetadata,
    title: { default: t('siteTitle'), template: '%s | POKYH' },
    description: t('siteDescription'),
    ...(locale === 'de' ? {} : { keywords: SITE_KEYWORDS[locale] }),
    alternates: localeAlternates(SITE_URL, locale, '/'),
    openGraph: {
      ...baseMetadata.openGraph,
      ...ogLocale(locale),
      url: `${SITE_URL}/${locale}/`,
      title: t('siteTitle'),
      description: t('siteOgDescription'),
      images: [{ url: '/icon-512.png', width: 512, height: 512, alt: t('siteTitle') }],
    },
    twitter: {
      ...baseMetadata.twitter,
      title: t('siteTitle'),
      description: t('siteOgDescription'),
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#09090C' },
    { media: '(prefers-color-scheme: light)', color: '#F0F0F5' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

function structuredData(locale: Locale) {
  const t = makeT(metaDict, locale);
  const inLanguage = ['de', 'it', 'en', 'lld'];
  return [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'POKYH',
    alternateName: ['POKYH Schulapp', 'POKYH LBS Brixen', 'Schulapp LBS Brixen'],
    url: `${SITE_URL}/${locale}/`,
    description: t('appDescription'),
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript. Requires a modern browser.',
    inLanguage,
    softwareVersion: '1.0',
    featureList: t('featureList').split('|'),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      description: t('offerDescription'),
    },
    author: {
      '@type': 'Organization',
      name: 'bedchem',
      url: 'https://github.com/bedchem',
      member: [
        { '@type': 'Person', name: 'Nexor', url: 'https://github.com/plattnericus' },
        { '@type': 'Person', name: 'Ryhox', url: 'https://github.com/ryhox' },
      ],
    },
    maintainer: {
      '@type': 'Organization',
      name: 'bedchem',
      url: 'https://github.com/bedchem',
    },
    sameAs: ['https://github.com/bedchem/POKYH', 'https://github.com/bedchem/pocky-web'],
    educationalUse: 'Student information system',
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      educationalAlignment: {
        '@type': 'AlignmentObject',
        alignmentType: 'educationalSubject',
        targetName: 'Landesberufsschule Brixen – Berufsbildungszentrum Christian Josef Tschuggmall',
      },
    },
    isAccessibleForFree: true,
    isFamilyFriendly: true,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'POKYH',
    url: `${SITE_URL}/${locale}/`,
    description: t('websiteDescription'),
    inLanguage,
  },
  ];
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
    <html lang={htmlLang(lang)} className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(lang)[0]) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(lang)[1]) }}
        />
        {/* Preconnect to external APIs used at auth time */}
        <link rel="preconnect" href="https://lbs-brixen.webuntis.com" />
        <link rel="preconnect" href="https://mensa.plattnericus.dev" />
        {/* Draco decoder CDN — full preconnect (TLS handshake included) */}
        <link rel="preconnect" href="https://www.gstatic.com" crossOrigin="anonymous" />
        {GA_ID && <link rel="preconnect" href="https://www.googletagmanager.com" />}
      </head>
      <body suppressHydrationWarning={true}>
        <LocaleProvider locale={lang}>
          <ThemeProvider>
            <SessionProvider>
              <AppProvider>
                <SidebarProvider>
                  <ActivityLoggerProvider>
                    <LayoutShell>{children}</LayoutShell>
                    <SubjectImagePreloader />
                  </ActivityLoggerProvider>
                </SidebarProvider>
              </AppProvider>
            </SessionProvider>
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
