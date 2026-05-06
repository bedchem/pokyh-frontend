import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'POKYH & WebUntis – Der Vergleich',
  description: 'POKYH vs. WebUntis: Was ist der Unterschied? POKYH nutzt die WebUntis-API und bietet eine modernere Oberfläche für Schüler der LBS Brixen.',
  keywords: ['POKYH vs WebUntis', 'POKYH Vergleich', 'WebUntis Alternative LBS Brixen', 'WebUntis Unterschied'],
  alternates: { canonical: `${SITE_URL}/vergleich` },
  openGraph: {
    title: 'POKYH & WebUntis – Der Vergleich',
    description: 'Was ist der Unterschied zwischen POKYH und WebUntis? Eine ehrliche Gegenüberstellung.',
    url: `${SITE_URL}/vergleich`,
    type: 'website',
    siteName: 'POKYH',
  },
};

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const MinusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

type CmpVal = 'yes' | 'no' | 'partial';

const ROWS: { feat: string; pokyh: CmpVal; webuntis: CmpVal }[] = [
  // Allgemein
  { feat: 'Kostenlos',          pokyh: 'yes', webuntis: 'yes'     },
  { feat: 'Werbefrei',          pokyh: 'yes', webuntis: 'yes'     },
  { feat: 'Kein Account nötig', pokyh: 'no',  webuntis: 'no'      },
  // Design & UX
  { feat: 'Modernes Design',         pokyh: 'yes',     webuntis: 'partial' },
  { feat: 'Dark Mode',               pokyh: 'yes',     webuntis: 'partial' },
  { feat: 'Mobile-First',            pokyh: 'yes',     webuntis: 'partial' },
  { feat: 'PWA (Homescreen-App)',     pokyh: 'yes',     webuntis: 'yes'     },
  // Funktionen Schüler
  { feat: 'Stundenplan',             pokyh: 'yes', webuntis: 'yes'     },
  { feat: 'Vertretungen & Entfall',  pokyh: 'yes', webuntis: 'yes'     },
  { feat: 'Noten mit Schnitt',       pokyh: 'yes', webuntis: 'partial' },
  { feat: 'Mensa-Speiseplan',        pokyh: 'yes', webuntis: 'no'      },
  { feat: 'Nachrichten mit Anhängen',pokyh: 'yes', webuntis: 'yes'     },
  { feat: 'Abwesenheiten',           pokyh: 'yes', webuntis: 'yes'     },
  { feat: 'Klassen-Erinnerungen',    pokyh: 'yes', webuntis: 'no'      },
  { feat: 'Persönliche Todos',       pokyh: 'yes', webuntis: 'no'      },
  // Plattform
  { feat: 'Web-App',                 pokyh: 'yes', webuntis: 'yes'     },
  { feat: 'iOS & Android App',       pokyh: 'no',  webuntis: 'yes'     },
  { feat: 'Für Lehrkräfte',          pokyh: 'no',  webuntis: 'yes'     },
  { feat: 'Offizielle Plattform',    pokyh: 'no',  webuntis: 'yes'     },
  { feat: 'Open Source',             pokyh: 'yes', webuntis: 'no'      },
];

const SECTIONS = [
  { label: 'Allgemein',         start: 0,  end: 3  },
  { label: 'Design & UX',       start: 3,  end: 7  },
  { label: 'Funktionen',        start: 7,  end: 15 },
  { label: 'Plattform',         start: 15, end: 19 },
];

function Cell({ val }: { val: CmpVal }) {
  if (val === 'yes') return <div className="lp-cmp-cell"><div className="lp-cmp-yes"><CheckIcon /></div></div>;
  if (val === 'partial') return <div className="lp-cmp-cell"><div className="lp-cmp-partial">~</div></div>;
  return <div className="lp-cmp-cell"><div className="lp-cmp-no"><MinusIcon /></div></div>;
}

export default function VergleichPage() {
  return (
    <div className="lp-root lp-page">
      <LandingNav />

      <div className="lp-page-hero">
        <div className="lp-page-hero-eyebrow">Transparent & fair</div>
        <h1 className="lp-page-hero-h1">POKYH & WebUntis</h1>
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

        {/* Comparison table */}
        <div className="lp-cmp-table">
          <div className="lp-cmp-head">
            <div className="lp-cmp-head-cell" style={{ textAlign: 'left' }}>Funktion</div>
            <div className="lp-cmp-head-cell" style={{ color: '#6366F1' }}>POKYH</div>
            <div className="lp-cmp-head-cell">WebUntis</div>
          </div>

          {SECTIONS.map(({ label, start, end }) => (
            <div key={label}>
              <div className="lp-cmp-section-hd">{label}</div>
              {ROWS.slice(start, end).map(row => (
                <div key={row.feat} className="lp-cmp-row">
                  <div className="lp-cmp-feat">{row.feat}</div>
                  <Cell val={row.pokyh} />
                  <Cell val={row.webuntis} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { icon: <div className="lp-cmp-yes" style={{ width: 20, height: 20 }}><CheckIcon /></div>, label: 'Verfügbar' },
            { icon: <div className="lp-cmp-partial" style={{ width: 20, height: 20, fontSize: 10 }}>~</div>, label: 'Eingeschränkt' },
            { icon: <div className="lp-cmp-no" style={{ width: 20, height: 20 }}><MinusIcon /></div>, label: 'Nicht verfügbar' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--app-text-tertiary)' }}>
              {icon} {label}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">Kurz zusammengefasst</h2>
          <div className="lp-steps-grid">
            {[
              {
                num: 'POKYH',
                title: 'Für Schüler',
                body: 'Modernes Design, automatischer Notenschnitt, Mensa, Erinnerungen und Todos — optimiert für den Schulalltag an der LBS Brixen.',
              },
              {
                num: 'WebUntis',
                title: 'Die offizielle Plattform',
                body: 'Die offizielle App von Untis GmbH — mit iOS- und Android-App, Funktionen für Lehrkräfte und offizieller Unterstützung.',
              },
              {
                num: 'Zusammen',
                title: 'Beide ergänzen sich',
                body: 'Du meldest dich in POKYH mit deinem WebUntis-Account an. POKYH und WebUntis widersprechen sich nicht — du kannst beide nutzen.',
              },
            ].map(({ num, title, body }) => (
              <div key={title} className="lp-step">
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
            <Link href="/login" className="lp-btn">Mit WebUntis anmelden</Link>
            <Link href="/faq" className="lp-alink">Zu den FAQ</Link>
          </div>
        </div>

      </div>

      <LandingFooter />
    </div>
  );
}
