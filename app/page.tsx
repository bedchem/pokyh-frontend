import type { Metadata } from 'next';
import LandingClient from '@/components/LandingClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'POKYH – Die Schulapp für LBS Brixen Schüler',
  description:
    'POKYH ist die kostenlose Web-App für Schülerinnen und Schüler der LBS Brixen. Stundenplan, Noten, Mensa, Abwesenheiten, Nachrichten und Klassen-Erinnerungen – alles über WebUntis.',
  keywords: [
    'POKYH', 'LBS Brixen', 'LBS Brixen App', 'Schulapp LBS Brixen',
    'WebUntis LBS Brixen', 'Stundenplan LBS Brixen', 'Noten LBS Brixen',
    'Mensa LBS Brixen', 'Abwesenheiten LBS Brixen', 'Landesberufsschule Brixen',
    'Berufsschule Brixen Südtirol', 'Schule App Südtirol', 'LBS Brixen online',
    'LBS Brixen Stundenplan online', 'Schulapp Südtirol kostenlos',
  ],
  alternates: {
    canonical: SITE_URL,
    languages: { 'de-IT': SITE_URL, 'de': SITE_URL, 'it': SITE_URL, 'x-default': SITE_URL },
  },
  openGraph: {
    type: 'website',
    locale: 'de_IT',
    url: SITE_URL,
    siteName: 'POKYH',
    title: 'POKYH – Die Schulapp für LBS Brixen Schüler',
    description: 'Kostenlose Web-App für LBS Brixen Schüler: Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – direkt über WebUntis.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'POKYH – Schulapp LBS Brixen' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKYH – Die Schulapp für LBS Brixen',
    description: 'Stundenplan, Noten, Mensa und mehr für LBS Brixen Schüler.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

export default function LandingPage() {
  return <LandingClient />;
}
