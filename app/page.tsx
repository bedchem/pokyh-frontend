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
    alternateLocale: ['it_IT', 'de_DE'],
    url: SITE_URL,
    siteName: 'POKYH',
    title: 'POKYH – Die Schulapp für LBS Brixen Schüler',
    description: 'Kostenlose Web-App für LBS Brixen Schüler: Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – direkt über WebUntis.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'POKYH – Schulapp LBS Brixen' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKYH – Die Schulapp für LBS Brixen',
    description: 'Kostenlose Web-App für LBS Brixen Schüler: Stundenplan, Noten, Mensa und mehr.',
    images: [{ url: '/og-image.png', alt: 'POKYH – Schulapp LBS Brixen' }],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
};

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Was ist POKYH?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'POKYH ist eine kostenlose Web-App für Schülerinnen und Schüler der LBS Brixen (Landesberufsschule Brixen, Südtirol). Sie bündelt WebUntis-Daten wie Stundenplan, Noten, Abwesenheiten und Nachrichten in einer modernen Oberfläche.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wer kann POKYH nutzen?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'POKYH steht ausschließlich Schülerinnen und Schülern der LBS Brixen zur Verfügung, die einen aktiven WebUntis-Account haben.',
      },
    },
    {
      '@type': 'Question',
      name: 'Ist POKYH kostenlos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja, POKYH ist vollständig kostenlos und werbefrei. Die App ist ein nicht-kommerzielles, von Schülern entwickeltes Open-Source-Projekt.',
      },
    },
    {
      '@type': 'Question',
      name: 'Welche Funktionen bietet POKYH?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'POKYH bietet: Stundenplan (Wochenansicht mit Prüfungen und Vertretungen), Notenübersicht mit Notensimulator, Mensa-Speiseplan mit Nährwerten, Nachrichten-Inbox, Abwesenheits-Tracking, Klassen-Erinnerungen und eine persönliche Todo-Liste.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wie melde ich mich bei POKYH an?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Die Anmeldung erfolgt mit deinen WebUntis-Zugangsdaten (Benutzername und Passwort). Dein Passwort wird niemals gespeichert – nur ein verschlüsseltes Session-Token.',
      },
    },
    {
      '@type': 'Question',
      name: 'Ist POKYH sicher?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja. POKYH speichert keine Passwörter. Das WebUntis-Session-Token wird serverseitig AES-GCM-verschlüsselt in einem httpOnly-Cookie gespeichert, auf das JavaScript keinen Zugriff hat. Alle API-Aufrufe erfolgen serverseitig.',
      },
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <LandingClient />
    </>
  );
}
