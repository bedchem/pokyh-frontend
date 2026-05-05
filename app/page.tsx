import type { Metadata } from 'next';
import LandingClient from '@/components/LandingClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'POKYH – WebUntis App für LBS Brixen | Schulapp Brixen',
  description:
    'POKYH: Die kostenlose WebUntis Alternative für LBS Brixen. Stundenplan, Noten, Mensa und mehr – Anmeldung mit deinem WebUntis Brixen Account. Kostenlos, werbefrei, von Schülern für Schüler.',
  keywords: [
    'POKYH', 'WebUntis Brixen', 'WebUntis LBS Brixen', 'WebUntis Alternative',
    'WebUntis App Brixen', 'WebUntis auf Steroid', 'WebUntis besser', 'WebUntis',
    'Untis Brixen', 'Untis LBS Brixen', 'Brixen Untis', 'LBS Brixen', 'LBS Brixen App',
    'Schulapp LBS Brixen', 'WebUntis Stundenplan', 'Stundenplan LBS Brixen',
    'Stundenplan Brixen', 'Noten LBS Brixen', 'Mensa LBS Brixen',
    'Abwesenheiten LBS Brixen', 'Landesberufsschule Brixen',
    'Berufsschule Brixen Südtirol', 'Schule App Südtirol', 'LBS Brixen online',
    'Schulapp Südtirol kostenlos', 'BFZ Tschuggmall', 'Tschuggmall Untis',
    'Tschuggmall WebUntis', 'BFZ Tschuggmall App', 'Untis Tschuggmall',
    'Berufsbildungszentrum Tschuggmall', 'Schulportal LBS Brixen',
    'Schüler App Brixen', 'WebUntis Noten', 'WebUntis Abwesenheiten',
    'WebUntis Nachrichten', 'WebUntis Südtirol', 'Untis Südtirol',
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
    title: 'POKYH – WebUntis App für LBS Brixen',
    description: 'Die kostenlose WebUntis Alternative für LBS Brixen: Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – schnell, modern, gratis.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKYH – WebUntis App für LBS Brixen',
    description: 'Die kostenlose WebUntis Alternative für LBS Brixen: Stundenplan, Noten, Mensa und mehr.',
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
        text: 'POKYH ist eine kostenlose Web-App für Schülerinnen und Schüler der LBS Brixen (Landesberufsschule Brixen, Südtirol). Sie bündelt alle wichtigen Schulinformationen – Stundenplan, Noten, Abwesenheiten, Nachrichten und Mensa – in einer modernen, übersichtlichen Oberfläche.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wer kann POKYH nutzen?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'POKYH steht ausschließlich Schülerinnen und Schülern des Berufsbildungszentrums Christian Josef Tschuggmall (LBS Brixen) zur Verfügung, die einen aktiven Schulaccount haben.',
      },
    },
    {
      '@type': 'Question',
      name: 'Ist POKYH kostenlos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja, POKYH ist vollständig kostenlos und werbefrei. Die App ist ein nicht-kommerzielles, von Schülern entwickeltes Open-Source-Projekt ohne Abo-Kosten.',
      },
    },
    {
      '@type': 'Question',
      name: 'Welche Funktionen bietet POKYH?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'POKYH bietet: Stundenplan (Tages- und Wochenansicht mit Prüfungen und Vertretungen), Notenübersicht mit automatischem Gesamtschnitt, Mensa-Speiseplan mit Nährwerten und Bewertungen, Nachrichten-Inbox mit Anhängen, Abwesenheits-Tracking mit Jahresübersicht, klassenweite Erinnerungen für Prüfungen und eine persönliche Todo-Liste.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wie melde ich mich bei POKYH an?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Die Anmeldung bei POKYH erfolgt mit deinen Schulzugangsdaten (Benutzername und Passwort). Dein Passwort wird niemals gespeichert – nur ein verschlüsseltes Session-Token.',
      },
    },
    {
      '@type': 'Question',
      name: 'Ist POKYH sicher?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja. POKYH speichert keine Passwörter. Das Session-Token wird serverseitig AES-GCM-verschlüsselt in einem httpOnly-Cookie gespeichert, auf das JavaScript keinen Zugriff hat. Alle API-Aufrufe erfolgen serverseitig.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wo befindet sich die LBS Brixen?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Die LBS Brixen (Landesberufsschule, auch Berufsbildungszentrum Christian Josef Tschuggmall) befindet sich in Brixen, Südtirol, Italien. POKYH ist speziell für Schülerinnen und Schüler dieser Schule entwickelt worden.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kann ich den Stundenplan von LBS Brixen online einsehen?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja! Mit POKYH kannst du deinen persönlichen Stundenplan der LBS Brixen jederzeit online einsehen – inklusive Vertretungen, Prüfungen und Entfälle, alles in einer übersichtlichen Wochenansicht.',
      },
    },
    {
      '@type': 'Question',
      name: 'Zeigt POKYH auch Vertretungen und Stundenplanänderungen an?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja. POKYH zeigt alle Stundenplanänderungen in Echtzeit an – Vertretungen, Entfälle und zusätzliche Stunden sind farblich klar gekennzeichnet.',
      },
    },
    {
      '@type': 'Question',
      name: 'Funktioniert POKYH auf dem Smartphone?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja, POKYH ist vollständig für Mobile optimiert und funktioniert auf iPhone, Android und allen modernen Smartphones. Die App kann auch als PWA (Progressive Web App) zum Homescreen hinzugefügt werden.',
      },
    },
    {
      '@type': 'Question',
      name: 'Was ist der Unterschied zwischen POKYH und WebUntis?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'POKYH verwendet die WebUntis-API, um dieselben Schuldaten – Stundenplan, Noten, Abwesenheiten und Nachrichten – in einer modernen, schnellen und übersichtlicheren Oberfläche darzustellen. POKYH ist ein inoffizielles, von Schülern entwickeltes Open-Source-Projekt und steht in keiner offiziellen Verbindung zur WebUntis GmbH. Die Anmeldung erfolgt mit demselben WebUntis-Benutzernamen und Passwort – das Passwort wird dabei niemals gespeichert.',
      },
    },
    {
      '@type': 'Question',
      name: 'Speichert POKYH mein WebUntis-Passwort?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nein. POKYH speichert dein Passwort niemals. Das WebUntis-Session-Token wird serverseitig AES-GCM-verschlüsselt in einem httpOnly-Cookie gespeichert, das für JavaScript nicht zugänglich ist. Nur dein Benutzername wird intern für Klassen-Funktionen verwendet.',
      },
    },
  ],
};

const breadcrumbData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'POKYH', item: SITE_URL },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <LandingClient />
    </>
  );
}
