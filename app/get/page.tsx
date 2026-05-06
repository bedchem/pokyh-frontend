import type { Metadata } from 'next';
import GetClient from './GetClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'POKYH – Web & App | LBS Brixen',
  description:
    'POKYH nutzen: Direkt im Browser anmelden oder als App auf iPhone und Android installieren. Einfach die .apk oder .ipa von GitHub laden.',
  keywords: [
    'POKYH App', 'POKYH installieren', 'POKYH iOS', 'POKYH Android',
    'POKYH APK', 'POKYH Web', 'LBS Brixen App', 'Schulapp installieren',
    'WebUntis App Brixen', 'POKYH herunterladen',
  ],
  alternates: { canonical: `${SITE_URL}/get` },
  openGraph: {
    title: 'POKYH – Web & App',
    description: 'POKYH im Browser nutzen oder als App auf iPhone und Android installieren.',
    url: `${SITE_URL}/get`,
    type: 'website',
    siteName: 'POKYH',
    locale: 'de_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKYH – Web & App',
    description: 'POKYH im Browser oder als App auf iPhone und Android.',
  },
  robots: { index: true, follow: true },
};

const breadcrumbData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'POKYH', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Get POKYH', item: `${SITE_URL}/get` },
  ],
};

export default function GetPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <GetClient />
    </>
  );
}
