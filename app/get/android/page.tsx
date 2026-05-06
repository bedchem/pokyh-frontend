import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'POKYH auf Android installieren – Android Anleitung',
  description:
    'In 3 einfachen Schritten POKYH als App auf deinem Android-Gerät installieren. Öffne Chrome, tippe auf Installieren und füge POKYH zum Homescreen hinzu.',
  keywords: [
    'POKYH Android', 'POKYH installieren Android', 'POKYH PWA Android',
    'Schulapp Android LBS Brixen', 'POKYH Chrome',
  ],
  alternates: { canonical: `${SITE_URL}/get/android` },
  openGraph: {
    title: 'POKYH auf Android installieren',
    description: 'In 3 Schritten POKYH als App auf Android zum Homescreen hinzufügen.',
    url: `${SITE_URL}/get/android`,
    type: 'website',
    siteName: 'POKYH',
    locale: 'de_IT',
  },
  robots: { index: true, follow: true },
};

const STEPS = [
  {
    num: '01',
    title: 'Chrome öffnen',
    body: (
      <>
        Öffne <strong>pokyh.app</strong> in <strong>Google Chrome</strong> auf deinem Android-Gerät.
        Chrome erkennt automatisch, dass POKYH als App installiert werden kann.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="4"/>
        <line x1="21.17" y1="8" x2="12" y2="8"/>
        <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
        <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
      </svg>
    ),
  },
  {
    num: '02',
    title: 'App installieren',
    body: (
      <>
        Tippe auf die <strong>drei Punkte</strong> (⋮) oben rechts im Browser-Menü.
        Wähle <strong>„App installieren"</strong> oder <strong>„Zum Homescreen hinzufügen"</strong>.
        Manchmal erscheint auch ein Banner am unteren Bildschirmrand.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="1" fill="currentColor"/>
        <circle cx="12" cy="12" r="1" fill="currentColor"/>
        <circle cx="12" cy="19" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Bestätigen',
    body: (
      <>
        Bestätige mit <strong>„Installieren"</strong> oder <strong>„Hinzufügen"</strong>.
        POKYH erscheint jetzt wie eine native App auf deinem Homescreen und im App-Drawer.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
];

export default function AndroidInstallPage() {
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
        <div className="lp-page-hero-eyebrow">Android · Chrome</div>
        <h1 className="lp-page-hero-h1">POKYH auf Android<br />installieren</h1>
        <p className="lp-page-hero-sub">
          In 3 Schritten POKYH als App zum Homescreen hinzufügen —
          kein Play Store, kein Download.
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
            POKYH ist eine <strong>Progressive Web App (PWA)</strong> — kein Play Store,
            keine APK. Alle Daten werden sicher und verschlüsselt übertragen.
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
