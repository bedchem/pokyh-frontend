import type { Metadata } from 'next';
import LandingClient from '@/components/LandingClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'POKYH – Schulapp LBS Brixen | Stundenplan, Noten & Mensa',
  description:
    'POKYH ist die kostenlose Schulapp für LBS Brixen Schüler: Stundenplan mit Vertretungen, Noten mit Gesamtschnitt, Mensa-Plan, Abwesenheiten und Nachrichten — modern, schnell, gratis.',
  keywords: [
    'POKYH', 'POKYH App', 'POKYH Schulapp', 'POKYH Südtirol',

    // Tschuggmall – alle Schreibweisen
    'Tschuggmall', 'Chr. J. Tschuggmall', 'Chr. Josef Tschuggmall',
    'Christian Josef Tschuggmall', 'C. J. Tschuggmall',
    'BFS Tschuggmall', 'BBZ Tschuggmall', 'Berufsbildungszentrum Tschuggmall',
    'Tschuggmall Brixen', 'Tschuggmall App', 'Tschuggmall Schüler',
    'Tschuggmall Stundenplan', 'Tschuggmall Noten', 'Tschuggmall Mensa',

    // LBS Brixen (reduziert, selektiv)
    'LBS Brixen', 'LBS Brixen App', 'Stundenplan LBS Brixen', 'Noten LBS Brixen',
    'Landesberufsschule Brixen', 'Berufsschule Brixen',

    // Brixen / Bressanone allgemein
    'Schulapp Brixen', 'Schulportal Brixen', 'Schülerportal Brixen',
    'Stundenplan Brixen', 'Schüler App Brixen', 'Bressanone Schulapp',

    // Südtirol / Alto Adige
    'Schulapp Südtirol', 'Schulapp Südtirol kostenlos', 'Berufsschule Südtirol App',
    'Stundenplan Berufsschule Südtirol', 'Alto Adige Schulapp',

    // WebUntis – vergleichend / erklärend
    'WebUntis Alternative', 'WebUntis Brixen', 'WebUntis LBS Brixen',
    'Schulapp statt WebUntis', 'besseres WebUntis',

    // Features
    'automatischer Notenschnitt', 'Mensa App Brixen', 'Fehlstunden Tracker',
    'Stundenplan App', 'Noten App Schule', 'Klassen Erinnerungen',
    'Mensa Speiseplan Brixen', 'Notenübersicht', 'Fehlstunden Übersicht',
    'digitale Schulapp', 'mobile Schulapp', 'PWA Schulapp', 'kostenlose Schulapp',
    'School Dashboard', 'Education App',
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
    title: 'POKYH – Schulapp für LBS Brixen',
    description: 'Die kostenlose Schulapp für LBS Brixen: Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – schnell, modern, gratis.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKYH – Schulapp für LBS Brixen',
    description: 'Die kostenlose Schulapp für LBS Brixen: Stundenplan, Noten, Mensa und mehr – von Schülern für Schüler.',
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
        text: 'Die LBS Brixen (Landesberufsschule, auch Berufsbildungszentrum Christian Josef Tschuggmall / BBZ Tschuggmall) befindet sich in Brixen (Bressanone), Südtirol, Italien. POKYH ist speziell für Schülerinnen und Schüler dieser Schule entwickelt worden.',
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
        text: 'Ja, POKYH ist vollständig für Mobile optimiert und funktioniert auf iPhone, Android und allen modernen Smartphones. Die App kann als PWA installiert oder als native App heruntergeladen werden.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wie unterscheidet sich POKYH vom offiziellen Schulportal?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'POKYH nutzt die offizielle Schulschnittstelle und zeigt dieselben Daten – Stundenplan, Noten, Abwesenheiten und Nachrichten – in einer modernen, schnellen und übersichtlicheren Oberfläche. POKYH ist ein inoffizielles, von Schülern entwickeltes Open-Source-Projekt und steht in keiner Verbindung zum offiziellen Anbieter. Die Anmeldung erfolgt mit denselben Schulzugangsdaten – das Passwort wird dabei niemals gespeichert.',
      },
    },
    {
      '@type': 'Question',
      name: 'Speichert POKYH mein Passwort?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nein. POKYH speichert dein Passwort niemals. Das Session-Token wird serverseitig AES-GCM-verschlüsselt in einem httpOnly-Cookie gespeichert, das für JavaScript nicht zugänglich ist. Nur dein Benutzername wird intern für Klassen-Funktionen verwendet.',
      },
    },
    {
      '@type': 'Question',
      name: 'Gibt es eine App für den Stundenplan der LBS Brixen?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja! POKYH ist als Web-App, iOS-App und Android-App verfügbar. Du kannst POKYH direkt im Browser nutzen, als PWA auf dem Homescreen installieren oder die native App herunterladen. Der persönliche Stundenplan der LBS Brixen ist damit jederzeit auf jedem Gerät abrufbar.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wie sehe ich meine Fehlstunden bei der LBS Brixen?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'In POKYH findest du unter "Abwesenheiten" eine vollständige Übersicht deiner Fehlstunden und Abwesenheiten – sortiert nach Datum, mit Jahresübersicht und Gesamtquote. So behältst du immer den Überblick über deine Anwesenheit an der LBS Brixen.',
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
      {/* SSR-only SEO blurb — visually hidden via sr-only, fully crawlable by Google */}
      <section className="sr-only" aria-label="Über POKYH">
        <p>
          <strong>POKYH</strong> ist die kostenlose <strong>Schulapp</strong> für Schülerinnen und Schüler des{' '}
          <strong>Berufsbildungszentrums Christian Josef Tschuggmall</strong> (
          <strong>BFS Tschuggmall</strong> / <strong>BBZ Tschuggmall</strong> / <strong>LBS Brixen</strong>,
          Landesberufsschule Brixen, Südtirol, Bressanone). Mit deinen Schulzugangsdaten direkt anmelden —
          kein separates Passwort. <strong>Stundenplan Tschuggmall Brixen</strong> mit Vertretungen und Prüfungen.{' '}
          <strong>Noten und Notenschnitt</strong> nach Fach, automatisch berechnet.{' '}
          <strong>Mensa-Speiseplan Brixen</strong> täglich aktuell.{' '}
          <strong>Abwesenheiten und Fehlstunden</strong> auf einen Blick.{' '}
          <strong>Klassen-Erinnerungen</strong> in Echtzeit.
          Auch gefunden unter: <strong>Chr. J. Tschuggmall App</strong>,{' '}
          <strong>Christian Josef Tschuggmall Schüler</strong>,{' '}
          <strong>Tschuggmall Stundenplan</strong>,{' '}
          <strong>Schulapp Brixen</strong>, <strong>Berufsschule Brixen App</strong>,{' '}
          <strong>WebUntis Alternative Brixen</strong>, <strong>WebUntis Brixen</strong>.
          POKYH steht in keiner offiziellen Verbindung zum offiziellen Schulportal.
          Kostenlos, werbefrei, open source — von Schülern für Schüler.
        </p>
      </section>
    </>
  );
}
