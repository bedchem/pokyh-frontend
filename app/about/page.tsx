import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'Über POKYH – Die Story dahinter | Schulapp Tschuggmall Brixen',
  description: 'Wie POKYH entstanden ist — von zwei Schülern des BFS Tschuggmall (LBS Brixen), die sich ihre eigene Schulapp gebaut haben. Open Source, kostenlos, für Schüler.',
  keywords: [
    'POKYH Story', 'POKYH Team', 'POKYH Entwickler', 'POKYH Open Source',
    'bedchem GitHub', 'Schulapp selbst gebaut',
    'Tschuggmall App', 'BFS Tschuggmall App', 'Christian Josef Tschuggmall App',
    'LBS Brixen App entwickelt', 'Open Source Schulapp Südtirol',
    'Schüler entwickeln App Brixen',
  ],
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'Über POKYH – Die Story dahinter',
    description: 'Von zwei Schülern des BFS Tschuggmall / LBS Brixen selbst gebaut — kostenlos, open source, für Schüler.',
    url: `${SITE_URL}/about`,
    type: 'website',
    siteName: 'POKYH',
  },
};

const GhIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2C6.5 7.4 6.1 6.1 6.6 4.4c0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.5 1.7.1 3 .1 3.3.7.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>
  </svg>
);

const FEATURES: { title: string; why: string }[] = [
  {
    title: 'Stundenplan',
    why: 'WebUntis zeigt den Stundenplan — aber für uns war er schwer lesbar. Wir wollten ihn auf einen Blick verstehen: welche Stunde, wann, welcher Lehrer, welcher Raum. Und Vertretungen sollten sofort auffallen.',
  },
  {
    title: 'Noten & Schnitt',
    why: 'Den eigenen Notenschnitt selbst ausrechnen zu müssen war nervig. Wir wollten ihn einfach sehen — automatisch, nach Fach, auf zwei Dezimalstellen.',
  },
  {
    title: 'Mensa',
    why: 'Die Mensa war in keiner App. Jeden Tag das gleiche Spiel: Webseite aufrufen, suchen, warten. Wir wollten das Menü direkt dabei haben — mit Bewertungen von Mitschülern.',
  },
  {
    title: 'Nachrichten',
    why: 'Nachrichten in WebUntis zu lesen war umständlich. Anhänge waren schwer zu öffnen, Links nicht klickbar. Wir wollten eine saubere Inbox.',
  },
  {
    title: 'Abwesenheiten',
    why: 'Wie viele Fehlstunden habe ich eigentlich? Eine Gesamtübersicht gab es nicht wirklich. Wir wollten die eigene Fehlquote auf einen Blick sehen.',
  },
  {
    title: 'Klassen-Erinnerungen',
    why: 'Morgen Schularbeit — und die Hälfte der Klasse hat es vergessen. Wir wollten Erinnerungen, die für alle gleichzeitig erscheinen, in Echtzeit.',
  },
  {
    title: 'Todos',
    why: 'Aufgaben auf Papier oder in einer separaten App. Wir wollten eine persönliche Todo-Liste direkt da, wo der Rest auch ist — und die auf allen Geräten synchron bleibt.',
  },
];

function FeatureIcon({ title }: { title: string }) {
  const w = '1.7';
  if (title === 'Stundenplan') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>;
  if (title === 'Noten & Schnitt') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><path d="M5 20V10M12 20V4M19 20v-7"/></svg>;
  if (title === 'Mensa') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><path d="M4 11h16l-1.5 9h-13z"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
  if (title === 'Nachrichten') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z"/></svg>;
  if (title === 'Abwesenheiten') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><path d="M18 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M16 11l6 6M22 11l-6 6"/></svg>;
  if (title === 'Klassen-Erinnerungen') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M14 21a2 2 0 0 1-4 0"/></svg>;
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11"/></svg>;
}

const STACK = [
  { label: 'Express',         sub: 'HTTP Server'        },
  { label: 'TypeScript',      sub: 'Typsicherheit'      },
  { label: 'Prisma + MySQL',  sub: 'Datenbank'          },
  { label: 'SSE',             sub: 'Echtzeit-Updates'   },
  { label: 'JWT',             sub: 'Authentifizierung'  },
  { label: 'Cloudflare',      sub: 'Tunnel & Hosting'   },
];

export default function AboutPage() {
  return (
    <div className="lp-root lp-page">
      <LandingNav />

      {/* Hero */}
      <div className="lp-page-hero">
        <div className="lp-page-hero-eyebrow">Von Schülern, für Schüler</div>
        <h1 className="lp-page-hero-h1">Die Story dahinter.</h1>
        <p className="lp-page-hero-sub">
          POKYH ist kein kommerzielles Produkt. Es ist das Ergebnis davon, dass wir selbst eine bessere Schulapp wollten — und sie einfach gebaut haben.
        </p>
      </div>

      <div className="lp-page-content">

        {/* Die Idee */}
        <div className="lp-page-section" style={{ borderTop: 'none', paddingTop: 0 }}>
          <h2 className="lp-page-section-title">Wie es angefangen hat</h2>
          <p className="lp-page-section-sub" style={{ maxWidth: 620 }}>
            WebUntis ist die offizielle Plattform unserer Schule — und sie funktioniert gut für das, wofür sie gedacht ist. Aber im Alltag haben uns drei Dinge immer wieder gefehlt:
          </p>
          <div className="lp-steps-grid" style={{ marginTop: 32 }}>
            {[
              {
                num: '01',
                title: 'Keine Mensa',
                body: 'Das Tagesmenü war nirgends in der App. Wir haben täglich eine separate Webseite aufgerufen — das wollten wir ändern.',
              },
              {
                num: '02',
                title: 'Keine Klassen-Erinnerungen',
                body: 'Schularbeiten, Abgaben, wichtige Termine — irgendjemand in der Klasse hat es immer vergessen. Eine klassenweite Erinnerung in Echtzeit gab es nicht.',
              },
              {
                num: '03',
                title: 'Kein sauberes UI',
                body: 'Für den schnellen Blick auf den Stundenplan oder die Noten war die Oberfläche zu unübersichtlich. Wir wollten etwas, das direkt lesbar ist.',
              },
            ].map(({ num, title, body }) => (
              <div key={num} className="lp-step">
                <div className="lp-step-num">{num}</div>
                <div className="lp-step-title">{title}</div>
                <div className="lp-step-body">{body}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 32, color: 'var(--app-text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 620 }}>
            Also haben wir angefangen zu bauen — zuerst als kleines Schulprojekt, dann immer größer. Heute ist POKYH eine vollständige Web-App mit eigenem Backend, die täglich von Schülern der LBS Brixen genutzt wird.
          </p>
        </div>

        {/* Features mit Warum */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">Was wir gebaut haben — und warum</h2>
          <p className="lp-page-section-sub">Jede Funktion hat einen konkreten Grund.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 28, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--lp-card-border)' }}>
            {FEATURES.map(({ title, why }, i) => (
              <div
                key={title}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr',
                  gap: '0 20px',
                  alignItems: 'start',
                  padding: '20px 24px',
                  background: 'var(--lp-card-bg)',
                  borderTop: i > 0 ? '1px solid var(--lp-card-border)' : 'none',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--lp-card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--app-text-secondary)' }}>
                  <FeatureIcon title={title} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--app-text-primary)', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--app-text-secondary)', lineHeight: 1.65 }}>{why}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backend */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">Unser eigenes Backend</h2>
          <p className="lp-page-section-sub" style={{ maxWidth: 620 }}>
            Die WebUntis-Daten kommen direkt über die offizielle API. Aber für alles, was darüber hinausgeht — Klassen-Erinnerungen, Todos, Echtzeit-Updates — haben wir ein eigenes Backend von Grund auf gebaut.
          </p>
          <p style={{ marginTop: 16, color: 'var(--app-text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 620 }}>
            Das war ehrlich gesagt der technisch spannendste Teil. Erinnerungen sollen in Echtzeit bei allen Klassenmitgliedern ankommen — dafür haben wir Server-Sent Events (SSE) implementiert. Das Backend läuft als Express-Server mit TypeScript, Prisma als ORM und MySQL als Datenbank. Dazu kommt ein eigenes Admin-Panel und eine JWT-basierte Authentifizierung.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 28 }}>
            {STACK.map(({ label, sub }) => (
              <div
                key={label}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--lp-card-border)',
                  background: 'var(--lp-card-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--app-text-primary)' }}>{label}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--app-text-tertiary)' }}>{sub}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <a
              href="https://github.com/bedchem/pokyh"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <GhIcon /> Auf GitHub ansehen
            </a>
          </div>
        </div>

        {/* Team */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">Das Team</h2>
          <p className="lp-page-section-sub" style={{ maxWidth: 560 }}>
            POKYH wird von zwei Schülern der LBS Brixen in der Freizeit entwickelt — als Open-Source-Projekt unter der{' '}
            <a href="https://github.com/bedchem" target="_blank" rel="noopener noreferrer" style={{ color: '#6366F1', textDecoration: 'none' }}>bedchem</a>
            {' '}Organisation auf GitHub.
          </p>
          <div className="lp-makers-grid" style={{ maxWidth: '100%', marginTop: 24 }}>
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

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <h2 className="lp-h2">Selbst ausprobieren.</h2>
          <p className="lp-lead" style={{ margin: '12px auto 32px', maxWidth: 460 }}>
            Kostenlos. Mit deinem WebUntis-Account oder POKYH-Konto.
          </p>
          <div style={{ display: 'inline-flex', gap: 22, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/login" className="lp-btn">Jetzt anmelden</Link>
            <Link href="/comparison" className="lp-alink">POKYH vs. WebUntis</Link>
          </div>
        </div>

      </div>

      <LandingFooter />
    </div>
  );
}
