import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Anmelden – POKYH | Schulapp LBS Brixen',
  description:
    'POKYH ist die moderne Web-App für LBS Brixen Schüler. Stundenplan, Noten, Mensa und Nachrichten – direkt über deinen WebUntis-Account erreichbar.',
  keywords: [
    'POKYH',
    'LBS Brixen',
    'Schulapp LBS Brixen',
    'WebUntis LBS Brixen',
    'Stundenplan LBS Brixen',
    'Noten LBS Brixen',
    'Mensa LBS Brixen',
    'Schule Brixen App',
    'LBS Brixen Anmeldung',
    'LBS Brixen Stundenplan online',
  ],
  openGraph: {
    title: 'POKYH – Schulapp für LBS Brixen Schüler',
    description:
      'Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – alles an einem Ort für LBS Brixen.',
    type: 'website',
    locale: 'de_IT',
    siteName: 'POKYH',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'POKYH – Schulapp LBS Brixen',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKYH – Schulapp LBS Brixen',
    description: 'Stundenplan, Noten, Mensa und mehr für LBS Brixen Schüler.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: '/login' },
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
