import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'POKYH auf iPhone installieren – iOS Anleitung',
  description:
    'In 3 einfachen Schritten POKYH als App auf deinem iPhone oder iPad installieren. Öffne Safari, tippe auf Teilen und füge POKYH zum Homescreen hinzu.',
  keywords: [
    'POKYH iPhone', 'POKYH iOS', 'POKYH iPad', 'POKYH installieren iPhone',
    'POKYH PWA iOS', 'Schulapp iPhone LBS Brixen',
  ],
  alternates: { canonical: `${SITE_URL}/get/ios` },
  openGraph: {
    title: 'POKYH auf iPhone installieren',
    description: 'In 3 Schritten POKYH als App auf iPhone oder iPad zum Homescreen hinzufügen.',
    url: `${SITE_URL}/get/ios`,
    type: 'website',
    siteName: 'POKYH',
    locale: 'de_IT',
  },
  robots: { index: true, follow: true },
};

const STEPS = [
  {
    num: '01',
    title: 'Safari öffnen',
    body: (
      <>
        Öffne <strong>pokyh.app</strong> in <strong>Safari</strong> auf deinem iPhone oder iPad.
        POKYH muss in Safari geöffnet sein — andere Browser wie Chrome oder Firefox unterstützen die Installation auf iOS nicht.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Teilen-Taste tippen',
    body: (
      <>
        Tippe auf das <strong>Teilen-Symbol</strong> (Quadrat mit Pfeil nach oben) in der unteren Symbolleiste von Safari.
        Scrolle im Menü nach unten, bis du <strong>„Zum Homescreen"</strong> siehst.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <polyline points="16 6 12 2 8 6"/>
        <line x1="12" y1="2" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Zum Homescreen hinzufügen',
    body: (
      <>
        Tippe auf <strong>„Zum Homescreen"</strong> und bestätige mit <strong>„Hinzufügen"</strong> oben rechts.
        POKYH erscheint jetzt wie eine native App auf deinem Homescreen.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
];

export default function IosInstallPage() {
  return (
    <div className="lp-root lp-page">
      <LandingNav />

      <div className="lp-page-hero">
        <Link href="/get" className="get-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Zurück
        </Link>
        <div className="lp-page-hero-eyebrow">iOS · iPadOS · Safari</div>
        <h1 className="lp-page-hero-h1">POKYH auf iPhone<br />installieren</h1>
        <p className="lp-page-hero-sub">
          In 3 Schritten POKYH als App zum Homescreen hinzufügen —
          kein App Store, kein Download.
        </p>
      </div>

      <div className="lp-page-content">

        <div className="get-install-steps">
          {STEPS.map(({ num, title, body, icon }) => (
            <div key={num} className="get-install-step">
              <div className="get-install-step-icon">{icon}</div>
              <div className="get-install-step-content">
                <div className="get-install-step-num">{num}</div>
                <div className="get-install-step-title">{title}</div>
                <div className="get-install-step-body">{body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="get-install-note">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            POKYH ist eine <strong>Progressive Web App (PWA)</strong> — kein App Store,
            keine Installation notwendig. Alle Daten werden sicher und verschlüsselt übertragen.
            POKYH steht in keiner offiziellen Verbindung zu WebUntis / Untis GmbH.
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '60px 0 20px' }}>
          <Link href="/login" className="lp-btn">
            Jetzt anmelden →
          </Link>
        </div>

      </div>

      <LandingFooter />
    </div>
  );
}
