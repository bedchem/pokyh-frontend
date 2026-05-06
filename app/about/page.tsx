import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'Über POKYH – Die Schulapp für LBS Brixen',
  description: 'Wer steckt hinter POKYH? Alles über das kostenlose Open-Source-Projekt von Schülern der LBS Brixen — gebaut für Schüler, von Schülern.',
  keywords: ['POKYH About', 'POKYH Team', 'POKYH Open Source', 'LBS Brixen App', 'bedchem GitHub'],
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'Über POKYH – Die Schulapp für LBS Brixen',
    description: 'POKYH ist ein Open-Source-Projekt von Schülern der LBS Brixen — kostenlos, werbefrei, modern.',
    url: `${SITE_URL}/about`,
    type: 'website',
    siteName: 'POKYH',
  },
};

const FEATURES = [
  {
    title: 'Stundenplan',
    sub: 'Tages- und Wochenansicht mit Vertretungen und Prüfungen in Echtzeit.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>,
  },
  {
    title: 'Noten & Schnitt',
    sub: 'Alle Noten nach Fach — Gesamtschnitt automatisch berechnet.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>,
  },
  {
    title: 'Mensa',
    sub: 'Tagesmenü mit Bewertungen, Nährwerten und Allergenen.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 11h16l-1.5 9h-13z"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>,
  },
  {
    title: 'Nachrichten',
    sub: 'Direkt aus WebUntis — mit Anhängen und lesbaren Links.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z"/></svg>,
  },
  {
    title: 'Abwesenheiten',
    sub: 'Entschuldigte und unentschuldigte Fehlstunden mit Jahresübersicht.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M16 11l6 6M22 11l-6 6"/></svg>,
  },
  {
    title: 'Erinnerungen',
    sub: 'Klassenweite Erinnerungen für Prüfungen — in Echtzeit für alle.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M14 21a2 2 0 0 1-4 0"/></svg>,
  },
  {
    title: 'Todos',
    sub: 'Persönliche Todo-Liste — synchronisiert auf allen Geräten.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    title: 'Dunkelmodus',
    sub: 'Vollständiger Dark Mode — automatisch oder manuell.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  },
];

const GhIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2C6.5 7.4 6.1 6.1 6.6 4.4c0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.5 1.7.1 3 .1 3.3.7.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>
  </svg>
);

export default function AboutPage() {
  return (
    <div className="lp-root lp-page">
      <LandingNav />

      <div className="lp-page-hero">
        <div className="lp-page-hero-eyebrow">Von Schülern, für Schüler</div>
        <h1 className="lp-page-hero-h1">Was ist POKYH?</h1>
        <p className="lp-page-hero-sub">
          POKYH ist die kostenlose Web-App für Schülerinnen und Schüler der LBS Brixen — gebaut weil WebUntis besser sein kann.
        </p>
      </div>

      <div className="lp-page-content">

        {/* Why */}
        <div className="lp-page-section" style={{ borderTop: 'none', paddingTop: 0 }}>
          <div className="lp-steps-grid">
            {[
              { num: '2026', title: 'Entstanden',    body: 'POKYH entstand 2026 als Schulprojekt — mit dem Ziel, die tägliche Schul-App übersichtlicher zu machen.' },
              { num: 'Free', title: 'Kostenlos',     body: 'Keine Registrierung, keine Kosten, keine Werbung. Einfach mit dem WebUntis-Account der Schule anmelden.' },
              { num: 'MIT',  title: 'Open Source',   body: 'Der gesamte Quellcode ist auf GitHub verfügbar — transparent, nachvollziehbar, für alle.' },
            ].map(({ num, title, body }) => (
              <div key={title} className="lp-step">
                <div className="lp-step-num">{num}</div>
                <div className="lp-step-title">{title}</div>
                <div className="lp-step-body">{body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">Was POKYH bietet</h2>
          <p className="lp-page-section-sub">Alle Schulinformationen, die du täglich brauchst — an einem Ort.</p>
          <div className="lp-about-features">
            {FEATURES.map(({ title, sub, icon }) => (
              <div key={title} className="lp-about-feat">
                <div className="lp-about-feat-icon">{icon}</div>
                <div className="lp-about-feat-title">{title}</div>
                <div className="lp-about-feat-sub">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">Das Team</h2>
          <p className="lp-page-section-sub">
            POKYH wird in der Freizeit von zwei Schülern der LBS Brixen entwickelt — als Open-Source-Projekt unter der{' '}
            <a href="https://github.com/bedchem" target="_blank" rel="noopener noreferrer" style={{ color: '#6366F1', textDecoration: 'none' }}>bedchem</a>
            {' '}Organisation auf GitHub.
          </p>
          <div className="lp-makers-grid" style={{ maxWidth: '100%' }}>
            <a href="https://github.com/plattnericus" target="_blank" rel="noopener noreferrer" className="lp-maker">
              <div className="lp-maker-mono">N</div>
              <div>
                <div className="lp-maker-name">
                  Nexor{' '}
                  <span style={{ color: 'var(--app-text-tertiary)', fontWeight: 400 }}>· Plattnericus</span>
                </div>
                <div className="lp-maker-handle"><GhIcon />github.com/plattnericus</div>
              </div>
            </a>
            <a href="https://github.com/ryhox" target="_blank" rel="noopener noreferrer" className="lp-maker">
              <div className="lp-maker-mono">R</div>
              <div>
                <div className="lp-maker-name">Ryhox</div>
                <div className="lp-maker-handle"><GhIcon />github.com/ryhox</div>
              </div>
            </a>
          </div>
        </div>

        {/* Open Source */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">Open Source</h2>
          <p className="lp-page-section-sub">
            Der vollständige Quellcode ist auf GitHub unter der MIT-Lizenz verfügbar. Wir freuen uns über Beiträge, Issues und Feedback.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <a
              href="https://github.com/bedchem/pokyh"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <GhIcon /> Auf GitHub ansehen
            </a>
            <Link href="/howto" className="lp-alink">Selbst hosten</Link>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <h2 className="lp-h2">Bereit?</h2>
          <p className="lp-lead" style={{ margin: '12px auto 32px', maxWidth: 460 }}>
            Kostenlos. Ohne Registrierung. Mit deinem WebUntis-Account.
          </p>
          <Link href="/login" className="lp-btn">Mit WebUntis anmelden</Link>
        </div>

      </div>

      <LandingFooter />
    </div>
  );
}
