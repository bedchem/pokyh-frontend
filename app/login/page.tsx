import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from './LoginForm';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'Anmelden – POKYH | Schulapp LBS Brixen',
  description:
    'Melde dich bei POKYH an – der Schulapp für LBS Brixen Schüler. Stundenplan, Noten, Mensa und Nachrichten – schnell und sicher mit deinem Schulaccount.',
  keywords: [
    'POKYH',
    'LBS Brixen',
    'Schulapp LBS Brixen',
    'LBS Brixen Anmeldung',
    'Stundenplan LBS Brixen',
    'Noten LBS Brixen',
    'Mensa LBS Brixen',
    'Schule Brixen App',
    'LBS Brixen Stundenplan online',
    'BFS Tschuggmall App',
  ],
  openGraph: {
    title: 'Anmelden – POKYH Schulapp LBS Brixen',
    description:
      'Melde dich bei POKYH an: Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – die Schulapp für LBS Brixen.',
    type: 'website',
    locale: 'de_IT',
    siteName: 'POKYH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKYH Anmelden – Schulapp LBS Brixen',
    description: 'Stundenplan, Noten, Mensa und mehr für LBS Brixen Schüler.',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: `${SITE_URL}/login` },
};

const breadcrumbData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'POKYH', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Anmelden', item: `${SITE_URL}/login` },
  ],
};

export default function LoginPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
