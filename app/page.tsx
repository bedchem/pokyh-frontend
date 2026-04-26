import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, BarChart2, Utensils, MessageCircle, UserX, CheckSquare, Bell } from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'POKYH – Die Schulapp für LBS Brixen Schüler',
  description:
    'POKYH ist die kostenlose Web-App für Schülerinnen und Schüler der LBS Brixen (Landesberufsschule Brixen, Südtirol). Stundenplan, Noten, Mensa, Abwesenheiten, Nachrichten und Klassen-Erinnerungen – alles über WebUntis.',
  keywords: [
    'POKYH',
    'LBS Brixen',
    'LBS Brixen App',
    'Schulapp LBS Brixen',
    'WebUntis LBS Brixen',
    'Stundenplan LBS Brixen',
    'Noten LBS Brixen',
    'Mensa LBS Brixen',
    'Abwesenheiten LBS Brixen',
    'Landesberufsschule Brixen',
    'Berufsschule Brixen Südtirol',
    'Schule App Südtirol',
    'LBS Brixen online',
    'LBS Brixen Stundenplan online',
    'Schulapp Südtirol kostenlos',
  ],
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
    title: 'POKYH – Die Schulapp für LBS Brixen Schüler',
    description:
      'Kostenlose Web-App für LBS Brixen Schüler: Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – direkt über WebUntis.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'POKYH – Schulapp LBS Brixen' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKYH – Die Schulapp für LBS Brixen',
    description: 'Stundenplan, Noten, Mensa und mehr für LBS Brixen Schüler.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
};

const FEATURES = [
  {
    Icon: Calendar,
    title: 'Stundenplan',
    desc: 'Tages- und Wochenübersicht inkl. Vertretungen, Entfall und Prüfungen direkt aus WebUntis.',
    color: '#6366F1',
  },
  {
    Icon: BarChart2,
    title: 'Noten & Schnitt',
    desc: 'Alle Noten nach Fach, Gesamtdurchschnitt auf 2 Dezimalstellen und Notenentwicklung.',
    color: '#10B981',
  },
  {
    Icon: Utensils,
    title: 'Mensa-Plan',
    desc: 'Tagesmenü der LBS Brixen Mensa mit Preisen und Allergenen.',
    color: '#F97316',
  },
  {
    Icon: MessageCircle,
    title: 'Nachrichten',
    desc: 'WebUntis-Nachrichten mit Anhang-Vorschau und klickbaren Links direkt in der App.',
    color: '#6366F1',
  },
  {
    Icon: UserX,
    title: 'Abwesenheiten',
    desc: 'Fehlstunden nach Monat, entschuldigt/unentschuldigt und Fehlquote im Schuljahr.',
    color: '#EF4444',
  },
  {
    Icon: Bell,
    title: 'Erinnerungen',
    desc: 'Klassenweite Erinnerungen für Prüfungen und Hausaufgaben – geteilt in Echtzeit.',
    color: '#F59E0B',
  },
  {
    Icon: CheckSquare,
    title: 'Todos',
    desc: 'Persönliche Aufgabenliste mit Fälligkeit – syncronisiert über alle Geräte.',
    color: '#8B5CF6',
  },
];

export default function LandingPage() {
  return (
    <div style={{ background: '#09090C', minHeight: '100dvh', fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)' }}>
      {/* Nav */}
      <header style={{ borderBottom: '1px solid #1a1a2e' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14 }}>
              P
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#F0F0F8', letterSpacing: '-0.02em' }}>POKYH</span>
          </div>
          <Link
            href="/login"
            style={{ padding: '8px 18px', borderRadius: 10, background: '#6366F1', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
          >
            Anmelden
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 99, padding: '4px 14px', marginBottom: 24 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1' }} />
            <span style={{ color: '#818CF8', fontSize: 12, fontWeight: 600 }}>LBS Brixen · Landesberufsschule Brixen</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, color: '#F0F0F8', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Die smarte Schulapp<br />
            <span style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              für LBS Brixen Schüler
            </span>
          </h1>

          <p style={{ fontSize: 17, color: '#8A8A9C', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px', fontWeight: 400 }}>
            Stundenplan, Noten, Mensa, Abwesenheiten und Nachrichten – alles in einer modernen Web-App, direkt über deinen WebUntis-Account.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/login"
              style={{ padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}
            >
              Jetzt anmelden →
            </Link>
            <Link
              href="/legal"
              style={{ padding: '14px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: '#8A8A9C', fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-block' }}
            >
              Impressum
            </Link>
          </div>
        </section>

        {/* Features grid */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#52525F', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 32 }}>
            Alle Funktionen für LBS Brixen
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {FEATURES.map(({ Icon, title, desc, color }) => (
              <article
                key={title}
                style={{
                  background: '#111116',
                  border: '1px solid #1C1C28',
                  borderRadius: 16,
                  padding: '20px',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={18} color={color} strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F8', marginBottom: 6, letterSpacing: '-0.01em' }}>
                  {title}
                </h3>
                <p style={{ fontSize: 13, color: '#52525F', lineHeight: 1.6 }}>
                  {desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA bottom */}
        <section style={{ background: '#111116', borderTop: '1px solid #1C1C28', borderBottom: '1px solid #1C1C28' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '52px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: '#F0F0F8', letterSpacing: '-0.025em', marginBottom: 14 }}>
              Bereit für die smarte Schulapp?
            </h2>
            <p style={{ fontSize: 15, color: '#8A8A9C', marginBottom: 28 }}>
              Kostenlos, ohne Registrierung – einfach mit deinem bestehenden WebUntis-Account anmelden.
            </p>
            <Link
              href="/login"
              style={{ padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}
            >
              Zum Login →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ maxWidth: 1000, margin: '0 auto', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontSize: 13, color: '#52525F' }}>
          © {new Date().getFullYear()} POKYH – Schulapp LBS Brixen
        </p>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/login" style={{ fontSize: 13, color: '#52525F', textDecoration: 'none' }}>Anmelden</Link>
          <Link href="/legal" style={{ fontSize: 13, color: '#52525F', textDecoration: 'none' }}>Impressum</Link>
          <Link href="/legal#datenschutz" style={{ fontSize: 13, color: '#52525F', textDecoration: 'none' }}>Datenschutz</Link>
        </div>
      </footer>
    </div>
  );
}
