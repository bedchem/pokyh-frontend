import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SessionProvider } from '@/providers/SessionProvider';
import { AppProvider } from '@/providers/AppProvider';
import { SidebarProvider } from '@/providers/SidebarProvider';
import { ActivityLoggerProvider } from '@/providers/ActivityLoggerProvider';
import LayoutShell from '@/components/LayoutShell';
import CookieBanner from '@/components/CookieBanner';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'POKYH – Schulapp LBS Brixen',
    template: '%s | POKYH',
  },
  description:
    'POKYH ist die kostenlose Web-App für LBS Brixen Schüler. Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – alles übersichtlich an einem Ort.',
  keywords: [
    'POKYH', 'LBS Brixen', 'Schulapp', 'Schulapp LBS Brixen',
    'WebUntis LBS Brixen', 'WebUntis Alternative', 'WebUntis App besser',
    'WebUntis auf Steroid', 'Stundenplan LBS Brixen', 'Noten LBS Brixen',
    'Mensa LBS Brixen', 'Schule App Südtirol', 'LBS Brixen online', 'Berufsschule Brixen',
    'Landesberufsschule Brixen', 'LBS Brixen App', 'Abwesenheiten LBS Brixen',
    'Schulapp kostenlos Südtirol', 'BFZ Tschuggmall', 'Schulportal Brixen',
    'Stundenplan Berufsschule Südtirol', 'Schüler App Brixen', 'WebUntis Brixen',
  ],
  authors: [{ name: 'Felix Plattner', url: 'https://github.com/bedchem/POKYH' }],
  creator: 'Felix Plattner',
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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKYH – Schulapp LBS Brixen',
    description: 'Kostenlose Web-App für LBS Brixen Schüler: Stundenplan, Noten, Mensa und mehr.',
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

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'POKYH',
    alternateName: ['POKYH Schulapp', 'POKYH LBS Brixen', 'Schulapp LBS Brixen'],
    url: SITE_URL,
    description:
      'Kostenlose Web-App für Schülerinnen und Schüler der LBS Brixen (Landesberufsschule Brixen, Südtirol). Stundenplan, Noten, Mensa, Abwesenheiten, Nachrichten und Klassen-Erinnerungen – alles übersichtlich an einem Ort.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript. Requires a modern browser.',
    inLanguage: ['de', 'it'],
    softwareVersion: '1.0',
    featureList: [
      'Stundenplan (Tages- und Wochenansicht)',
      'Prüfungen und Vertretungen im Stundenplan',
      'Noten nach Fach mit automatischem Gesamtschnitt',
      'Mensa-Speiseplan mit Nährwerten und Bewertungen',
      'Nachrichten-Inbox mit Anhängen',
      'Abwesenheiten & Fehlstunden mit Jahresübersicht',
      'Klassenweite Erinnerungen für Prüfungen',
      'Persönliche Todo-Liste',
      'Dunkelmodus & Mobile-First Design',
      'Kostenlos und werbefrei',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      description: 'Vollständig kostenlos und werbefrei',
    },
    author: {
      '@type': 'Organization',
      name: 'bedchem',
      url: 'https://github.com/bedchem',
      member: [
        { '@type': 'Person', name: 'Felix Plattner', url: 'https://github.com/plattnericus' },
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
    url: SITE_URL,
    description: 'Die Schulapp für LBS Brixen Schüler – Stundenplan, Noten, Mensa und mehr.',
    inLanguage: ['de', 'it'],
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-IT" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('pockyh_theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData[0]) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData[1]) }}
        />
        {/* Preconnect to external APIs used at auth time */}
        <link rel="preconnect" href="https://lbs-brixen.webuntis.com" />
        <link rel="preconnect" href="https://mensa.plattnericus.dev" />
        {/* Draco decoder CDN — full preconnect (TLS handshake included) */}
        <link rel="preconnect" href="https://www.gstatic.com" crossOrigin="anonymous" />
        {GA_ID && <link rel="preconnect" href="https://www.googletagmanager.com" />}
      </head>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                anonymize_ip: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false,
                cookie_flags: 'SameSite=None;Secure',
              });
            `}
          </Script>
        </>
      )}
      <body>
        <ThemeProvider>
          <SessionProvider>
            <AppProvider>
              <SidebarProvider>
                <ActivityLoggerProvider>
                  <LayoutShell>{children}</LayoutShell>
                </ActivityLoggerProvider>
              </SidebarProvider>
            </AppProvider>
          </SessionProvider>
        </ThemeProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
