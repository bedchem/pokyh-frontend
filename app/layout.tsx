import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SessionProvider } from '@/providers/SessionProvider';
import { FirebaseProvider } from '@/providers/FirebaseProvider';
import { SidebarProvider } from '@/providers/SidebarProvider';
import LayoutShell from '@/components/LayoutShell';
import { Analytics } from '@vercel/analytics/next';
import CookieBanner from '@/components/CookieBanner';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'POKYH – Schulapp LBS Brixen',
    template: '%s | POKYH',
  },
  description:
    'POKYH ist die offizielle Web-App für LBS Brixen Schüler. Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – alles über deinen WebUntis-Account.',
  keywords: [
    'POKYH', 'LBS Brixen', 'Schulapp', 'WebUntis LBS Brixen',
    'Stundenplan Brixen', 'Noten LBS Brixen', 'Mensa LBS Brixen',
    'Schule App Südtirol', 'LBS Brixen online', 'Berufsschule Brixen',
    'Landesberufsschule Brixen', 'LBS Brixen App',
  ],
  authors: [{ name: 'POKYH Team', url: 'https://github.com/bedchem/POKYH' }],
  creator: 'POKYH',
  publisher: 'POKYH',
  applicationName: 'POKYH',
  generator: 'Next.js',
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
    url: SITE_URL,
    siteName: 'POKYH',
    title: 'POKYH – Schulapp LBS Brixen',
    description: 'Stundenplan, Noten, Mensa und mehr für LBS Brixen Schüler.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'POKYH App' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKYH – Schulapp LBS Brixen',
    description: 'Stundenplan, Noten, Mensa und mehr für LBS Brixen Schüler.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
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
  maximumScale: 1,
  userScalable: false,
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'POKYH',
  alternateName: 'POKYH Schulapp LBS Brixen',
  url: SITE_URL,
  description:
    'Schulapp für LBS Brixen Schüler mit Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten über WebUntis.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  browserRequirements: 'Requires JavaScript. Requires a modern browser.',
  inLanguage: 'de',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  author: {
    '@type': 'Organization',
    name: 'POKYH',
    url: 'https://github.com/bedchem/POKYH',
  },
  educationalUse: 'Student information system',
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'student',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('pockyh_theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <link rel="preconnect" href="https://lbs-brixen.webuntis.com" />
        <link rel="preconnect" href="https://mensa.plattnericus.dev" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
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
            <FirebaseProvider>
              <SidebarProvider>
                <LayoutShell>{children}</LayoutShell>
              </SidebarProvider>
            </FirebaseProvider>
          </SessionProvider>
        </ThemeProvider>
        <Analytics />
        <CookieBanner />
      </body>
    </html>
  );
}
