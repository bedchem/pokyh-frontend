import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'POKYH & WebUntis – Der Vergleich',
  description: 'POKYH vs. WebUntis: Was ist der Unterschied? POKYH nutzt die WebUntis-API und bietet eine modernere Oberfläche für Schüler der LBS Brixen.',
  keywords: ['POKYH vs WebUntis', 'POKYH Vergleich', 'WebUntis Alternative LBS Brixen', 'WebUntis Unterschied'],
  alternates: { canonical: `${SITE_URL}/comparison` },
  openGraph: {
    title: 'POKYH & WebUntis – Der Vergleich',
    description: 'Was ist der Unterschied zwischen POKYH und WebUntis? Eine ehrliche Gegenüberstellung.',
    url: `${SITE_URL}/comparison`,
    type: 'website',
    siteName: 'POKYH',
  },
};

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const MinusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const TildeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14c2-4 5-4 8 0s6 4 8 0"/>
  </svg>
);

type CmpVal = 'yes' | 'no' | 'partial';

const ROWS: { feat: string; pokyh: CmpVal; webuntis: CmpVal; section: string }[] = [
  { feat: 'Kostenlos',           pokyh: 'yes', webuntis: 'yes',     section: 'Allgemein' },
  { feat: 'Werbefrei',           pokyh: 'yes', webuntis: 'yes',     section: 'Allgemein' },
  { feat: 'Kein Account nötig',  pokyh: 'no',  webuntis: 'no',      section: 'Allgemein' },

  { feat: 'Modernes Design',     pokyh: 'yes', webuntis: 'partial', section: 'Design & UX' },
  { feat: 'Dark Mode',           pokyh: 'yes', webuntis: 'partial', section: 'Design & UX' },
  { feat: 'Mobile-First',        pokyh: 'yes', webuntis: 'partial', section: 'Design & UX' },
  { feat: 'Mobile App / Download',pokyh: 'yes', webuntis: 'yes',     section: 'Design & UX' },

  { feat: 'Stundenplan',              pokyh: 'yes', webuntis: 'yes',     section: 'Funktionen' },
  { feat: 'Vertretungen & Entfall',   pokyh: 'yes', webuntis: 'yes',     section: 'Funktionen' },
  { feat: 'Noten mit Schnitt',        pokyh: 'yes', webuntis: 'partial', section: 'Funktionen' },
  { feat: 'Mensa-Speiseplan',         pokyh: 'yes', webuntis: 'no',      section: 'Funktionen' },
  { feat: 'Nachrichten mit Anhängen', pokyh: 'yes', webuntis: 'yes',     section: 'Funktionen' },
  { feat: 'Abwesenheiten',            pokyh: 'yes', webuntis: 'yes',     section: 'Funktionen' },
  { feat: 'Klassen-Erinnerungen',     pokyh: 'yes', webuntis: 'no',      section: 'Funktionen' },
  { feat: 'Persönliche Todos',        pokyh: 'yes', webuntis: 'no',      section: 'Funktionen' },

  { feat: 'Web-App',              pokyh: 'yes', webuntis: 'yes', section: 'Plattform' },
  { feat: 'iOS & Android App',    pokyh: 'yes', webuntis: 'yes', section: 'Plattform' },
  { feat: 'Für Lehrkräfte',       pokyh: 'no',  webuntis: 'yes', section: 'Plattform' },
  { feat: 'Offizielle Plattform', pokyh: 'no',  webuntis: 'yes', section: 'Plattform' },
  { feat: 'Open Source',          pokyh: 'yes', webuntis: 'no',  section: 'Plattform' },
];

const SECTIONS = ['Allgemein', 'Design & UX', 'Funktionen', 'Plattform'] as const;

function Indicator({ val }: { val: CmpVal }) {
  if (val === 'yes')     return <span className="lp-cmp-ind is-yes"><CheckIcon /></span>;
  if (val === 'partial') return <span className="lp-cmp-ind is-partial"><TildeIcon /></span>;
  return <span className="lp-cmp-ind is-no"><MinusIcon /></span>;
}

function Pill({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  return (
    <span className="lp-cmp-pill">
      <span className="lp-cmp-pill-dot" style={{ background: color }} />
      {count}/{total} {label}
    </span>
  );
}

function ColumnList({ valueKey, accent }: { valueKey: 'pokyh' | 'webuntis'; accent?: boolean }) {
  let lastSection: string | null = null;
  return (
    <div className="lp-cmp-list">
      {ROWS.map(r => {
        const fresh = r.section !== lastSection;
        lastSection = r.section;
        return (
          <div key={r.feat + valueKey}>
            {fresh && <div className="lp-cmp-section-hd">{r.section}</div>}
            <div className={`lp-cmp-row ${fresh ? 'is-first' : ''}`}>
              <Indicator val={r[valueKey]} />
              <span className="lp-cmp-row-label">{r.feat}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ComparisonPage() {
  const stats = ROWS.reduce(
    (acc, r) => {
      acc.p[r.pokyh]++; acc.w[r.webuntis]++; return acc;
    },
    { p: { yes: 0, partial: 0, no: 0 }, w: { yes: 0, partial: 0, no: 0 } } as Record<'p' | 'w', Record<CmpVal, number>>,
  );
  const total = ROWS.length;

  return (
    <div className="lp-root lp-page">
      <LandingNav />

      <div className="lp-page-hero">
        <div className="lp-page-hero-eyebrow">
          Transparent &amp; fair
        </div>
        <h1 className="lp-page-hero-h1">
          POKYH <span className="lp-cmp-amp">&amp;</span> WebUntis
        </h1>
        <p className="lp-page-hero-sub">
          POKYH und WebUntis ergänzen sich — POKYH nutzt die WebUntis-API und bringt deine Schuldaten in einer moderneren Oberfläche.
        </p>
      </div>

      <div className="lp-page-content">

        {/* Note */}
        <div className="lp-cmp-note">
          <span className="lp-cmp-note-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </span>
          <span>
            <strong style={{ color: 'var(--app-text-primary)' }}>Wichtig:</strong>{' '}
            POKYH ist kein offizieller Ersatz für WebUntis und steht in keiner Verbindung zur Untis GmbH. Die Anmeldung erfolgt weiterhin mit deinem WebUntis-Benutzernamen und Passwort. POKYH liest dieselben Daten über die offizielle WebUntis-Schnittstelle — und zeigt sie dir übersichtlicher.
          </span>
        </div>

        {/* Comparison cards */}
        <div className="lp-cmp-grid">
          {/* POKYH */}
          <section className="lp-cmp-card is-accent">
            <div className="lp-cmp-card-head">
              <div className="lp-cmp-card-head-row">
                <div className="lp-cmp-card-id">
                  <div className="lp-cmp-card-mark">P</div>
                  <div>
                    <div className="lp-cmp-card-name">POKYH</div>
                    <div className="lp-cmp-card-sub">Für Schüler · LBS Brixen</div>
                  </div>
                </div>
                <span className="lp-cmp-tag">Empfehlung</span>
              </div>
              <div className="lp-cmp-pills">
                <Pill label="verfügbar" count={stats.p.yes} total={total} color="var(--lp-cmp-yes, #10B981)" />
                {stats.p.partial > 0 && <Pill label="teilweise" count={stats.p.partial} total={total} color="var(--lp-cmp-warn, #F4B860)" />}
                <Pill label="fehlt" count={stats.p.no} total={total} color="var(--app-text-tertiary)" />
              </div>
            </div>
            <ColumnList valueKey="pokyh" accent />
          </section>

          {/* WebUntis */}
          <section className="lp-cmp-card">
            <div className="lp-cmp-card-head">
              <div className="lp-cmp-card-head-row">
                <div className="lp-cmp-card-id">
                  <div className="lp-cmp-card-mark">W</div>
                  <div>
                    <div className="lp-cmp-card-name">WebUntis</div>
                    <div className="lp-cmp-card-sub">Offiziell · Untis GmbH</div>
                  </div>
                </div>
                <span className="lp-cmp-tag">Original</span>
              </div>
              <div className="lp-cmp-pills">
                <Pill label="verfügbar" count={stats.w.yes} total={total} color="var(--lp-cmp-yes, #10B981)" />
                <Pill label="teilweise" count={stats.w.partial} total={total} color="var(--lp-cmp-warn, #F4B860)" />
                <Pill label="fehlt" count={stats.w.no} total={total} color="var(--app-text-tertiary)" />
              </div>
            </div>
            <ColumnList valueKey="webuntis" />
          </section>
        </div>

        {/* Legend */}
        <div className="lp-cmp-legend">
          <div><span className="lp-cmp-legend-dot" style={{ background: 'var(--lp-cmp-yes, #10B981)' }} /> Verfügbar</div>
          <div><span className="lp-cmp-legend-dot" style={{ background: 'var(--lp-cmp-warn, #F4B860)' }} /> Eingeschränkt</div>
          <div><span className="lp-cmp-legend-dot lp-cmp-legend-dot-muted" /> Nicht verfügbar</div>
        </div>

        {/* Summary */}
        <div className="lp-page-section" style={{ borderTop: 'none' }}>
          <h2 className="lp-page-section-title">Kurz zusammengefasst</h2>
          <div className="lp-steps-grid">
            {[
              { num: 'POKYH',    title: 'Für Schüler',              body: 'Modernes Design, automatischer Notenschnitt, Mensa, Erinnerungen und Todos — optimiert für den Schulalltag an der LBS Brixen.', accent: true },
              { num: 'WebUntis', title: 'Die offizielle Plattform', body: 'Die offizielle App von Untis GmbH — mit iOS- und Android-App, Funktionen für Lehrkräfte und offizieller Unterstützung.' },
              { num: 'Zusammen', title: 'Beide ergänzen sich',      body: 'Du meldest dich in POKYH mit deinem WebUntis-Account an. POKYH und WebUntis widersprechen sich nicht — du kannst beide nutzen.' },
            ].map(({ num, title, body, accent }) => (
              <div key={title} className={`lp-step ${accent ? 'is-accent' : ''}`}>
                <div className="lp-step-num">{num}</div>
                <div className="lp-step-title">{title}</div>
                <div className="lp-step-body">{body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <h2 className="lp-h2">Überzeug dich selbst.</h2>
          <p className="lp-lead" style={{ margin: '12px auto 32px', maxWidth: 460 }}>
            Kostenlos. Ohne Registrierung. Mit deinem WebUntis-Account.
          </p>
          <div style={{ display: 'inline-flex', gap: 22, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/login" className="lp-btn">Mit WebUntis anmelden </Link>
            <Link href="/faq" className="lp-alink">Zu den FAQ</Link>
          </div>
        </div>

      </div>

      <LandingFooter />
    </div>
  );
}
