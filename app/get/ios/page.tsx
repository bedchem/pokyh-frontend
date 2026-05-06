import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'POKYH auf iPhone installieren – iOS Anleitung',
  description:
    'Lade die aktuelle POKYH App für iOS herunter — direkt von GitHub.',
  keywords: [
    'POKYH iPhone', 'POKYH iOS', 'POKYH iPad', 'POKYH installieren iPhone',
    'POKYH IPA', 'Schulapp iPhone LBS Brixen',
  ],
  alternates: { canonical: `${SITE_URL}/get/ios` },
  openGraph: {
    title: 'POKYH auf iPhone installieren',
    description: 'Lade dir die aktuelle POKYH App für iOS herunter.',
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
    title: 'Release öffnen',
    body: (
      <>
        Gehe auf <strong><a href="https://github.com/bedchem/pokyh/releases" target="_blank" rel="noopener noreferrer">https://github.com/bedchem/pokyh/releases</a></strong> in deinem Browser.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    num: '02',
    title: '.ipa herunterladen',
    body: (
      <>
        Suche den neuesten Release und lade die <strong>.ipa</strong> Datei (iOS) herunter.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Installieren & Ausführen',
    body: (
      <>
        Installiere die .ipa Datei über Sideloading Tools (z.B. AltStore, Sideloadly oder TrollStore) auf deinem iPhone. Danach kannst du die POKYH App ausführen.
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
        <div className="lp-page-hero-eyebrow">iOS</div>
        <h1 className="lp-page-hero-h1">POKYH auf iPhone<br />installieren</h1>
        <p className="lp-page-hero-sub">
          Lade dir die aktuelle POKYH App für iOS herunter — direkt von GitHub.
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

      </div>

      <LandingFooter />
    </div>
  );
}
