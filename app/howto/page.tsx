import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'GET POKYH – Herunterladen & Selbst hosten',
  description: 'Hol dir POKYH: Nutze die gehostete Version direkt auf pokyh.app oder lade den Open-Source-Code von GitHub und betreibe POKYH auf deinem eigenen Server.',
  keywords: ['POKYH Download', 'POKYH GitHub', 'POKYH selbst hosten', 'POKYH Open Source', 'POKYH installieren'],
  alternates: { canonical: `${SITE_URL}/howto` },
  openGraph: {
    title: 'GET POKYH – Download & Selbst hosten',
    description: 'Nutze POKYH direkt im Browser oder lade den Quellcode von GitHub und hoste es selbst.',
    url: `${SITE_URL}/howto`,
    type: 'website',
    siteName: 'POKYH',
  },
};

const STEPS = [
  {
    num: '01',
    title: 'Repository klonen',
    body: 'Lade den POKYH-Quellcode von GitHub herunter.',
    code: 'git clone https://github.com/bedchem/pokyh\ncd pokyh',
  },
  {
    num: '02',
    title: 'Abhängigkeiten installieren',
    body: 'Installiere alle Node.js-Pakete mit npm.',
    code: 'npm install',
  },
  {
    num: '03',
    title: 'Umgebungsvariablen konfigurieren',
    body: 'Kopiere die Beispielkonfiguration und passe sie an deine Umgebung an.',
    code: 'cp .env.example .env.local\n# .env.local mit deinen Werten befüllen',
  },
  {
    num: '04',
    title: 'Starten',
    body: 'Starte den Entwicklungsserver — oder baue für die Produktion.',
    code: 'npm run dev\n\n# Für Produktion:\nnpm run build && npm start',
  },
];

const TECH = [
  { name: 'Next.js 16', role: 'Framework', desc: 'App Router, Server Components und optimierter Build.' },
  { name: 'TypeScript', role: 'Sprache',   desc: 'Vollständig typisiert für Wartbarkeit und weniger Bugs.' },
  { name: 'Tailwind',   role: 'Styling',   desc: 'Utility-first CSS für konsistentes, schnelles Styling.' },
  { name: 'POKYH Backend', role: 'API & Echtzeit', desc: 'Eigener Node.js-Server mit SSE für Todos, Erinnerungen und Klassen-Features.' },
];

const GhIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2C6.5 7.4 6.1 6.1 6.6 4.4c0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.5 1.7.1 3 .1 3.3.7.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>
  </svg>
);

export default function HowtoPage() {
  return (
    <div className="lp-root lp-page">
      <LandingNav />

      <div className="lp-page-hero">
        <div className="lp-page-hero-eyebrow">Open Source · MIT Lizenz</div>
        <h1 className="lp-page-hero-h1">Hol dir POKYH</h1>
        <p className="lp-page-hero-sub">
          Nutze POKYH direkt im Browser — oder lade den Quellcode von GitHub und hoste es auf deinem eigenen Server. Kostenlos, werbefrei, Open Source.
        </p>
      </div>

      <div className="lp-page-content">

        {/* Two options */}
        <div className="lp-howto-options">
          {/* Option A: Hosted */}
          <div className="lp-howto-card">
            <div className="lp-howto-card-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/>
              </svg>
              Empfohlen
            </div>
            <div className="lp-howto-card-title">Direkt online nutzen</div>
            <div className="lp-howto-card-sub">
              Melde dich auf pokyh.app mit deinem WebUntis-Account an — kein Download, keine Konfiguration, sofort loslegen.
            </div>
            <Link href="/login" className="lp-howto-card-link">
              Jetzt anmelden
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>

          {/* Option B: Self-hosted */}
          <div className="lp-howto-card">
            <div className="lp-howto-card-badge" style={{ color: 'var(--app-text-secondary)', background: 'color-mix(in srgb, var(--app-border) 60%, transparent)' }}>
              <GhIcon /> GitHub
            </div>
            <div className="lp-howto-card-title">Selbst hosten</div>
            <div className="lp-howto-card-sub">
              Lade den vollständigen Quellcode von GitHub herunter und betreibe POKYH auf deinem eigenen Server oder lokal auf deinem Rechner.
            </div>
            <a
              href="https://github.com/bedchem/pokyh"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-howto-card-link"
            >
              github.com/bedchem/pokyh
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Self-hosting guide */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">Self-Hosting Anleitung</h2>
          <p className="lp-page-section-sub">In wenigen Minuten läuft POKYH lokal oder auf deinem Server.</p>

          <div className="lp-howto-steps">
            {STEPS.map(step => (
              <div key={step.num} className="lp-howto-step">
                <div className="lp-howto-step-num">{step.num}</div>
                <div>
                  <div className="lp-howto-step-title">{step.title}</div>
                  <div className="lp-howto-step-body">{step.body}</div>
                  <code className="lp-code">{step.code}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">Tech Stack</h2>
          <p className="lp-page-section-sub">Gebaut mit modernen Webtechnologien.</p>
          <div className="lp-tech-grid">
            {TECH.map(({ name, role, desc }) => (
              <div key={name} className="lp-tech-card">
                <div className="lp-tech-card-name">{name}</div>
                <div className="lp-tech-card-role">{role}</div>
                <div className="lp-tech-card-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <h2 className="lp-h2">Lieber einfach anmelden?</h2>
          <p className="lp-lead" style={{ margin: '12px auto 32px', maxWidth: 460 }}>
            Keine Installation. Direkt mit deinem WebUntis-Account loslegen.
          </p>
          <Link href="/login" className="lp-btn">Mit WebUntis anmelden</Link>
        </div>

      </div>

      <LandingFooter />
    </div>
  );
}
