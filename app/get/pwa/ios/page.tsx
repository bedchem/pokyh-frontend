import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

export const metadata: Metadata = {
  title: 'POKYH PWA auf iPhone installieren – Schritt-für-Schritt iOS Anleitung',
  description:
    'Installiere POKYH als Progressive Web App auf deinem iPhone oder iPad — direkt über Safari, ohne App Store. Kostenlos, automatische Updates.',
  keywords: [
    'POKYH PWA iOS', 'POKYH PWA iPhone', 'Progressive Web App iPhone',
    'POKYH Safari installieren', 'Schulapp PWA LBS Brixen', 'POKYH zum Home-Bildschirm',
  ],
  alternates: { canonical: `${SITE_URL}/get/pwa/ios` },
  openGraph: {
    title: 'POKYH PWA auf iPhone installieren',
    description: 'Installiere POKYH als PWA auf dem iPhone — ohne App Store, direkt über Safari.',
    url: `${SITE_URL}/get/pwa/ios`,
    type: 'website',
    siteName: 'POKYH',
    locale: 'de_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKYH PWA auf iPhone installieren',
    description: 'Installiere POKYH als PWA auf dem iPhone — ohne App Store, direkt über Safari.',
  },
  robots: { index: true, follow: true },
};

const STEPS = [
  {
    num: '01',
    title: 'Safari öffnen',
    text: 'Öffne Safari auf deinem iPhone oder iPad und rufe pokyh.com auf. Nur Safari unterstützt PWA-Installation auf iOS.',
    body: (
      <>
        Öffne <strong>Safari</strong> auf deinem iPhone oder iPad und rufe <strong>pokyh.com</strong> auf.{' '}
        Wichtig: Die PWA-Installation funktioniert auf iOS <strong>ausschließlich in Safari</strong> — andere Browser wie Chrome oder Firefox unterstützen dies nicht.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    imgLight: '/tutorials_Screenshots/iosWhite_schritt1.webp',
    imgDark:  '/tutorials_Screenshots/ios_schritt1.webp',
  },
  {
    num: '02',
    title: 'Teilen-Button tippen',
    text: 'Tippe auf das Teilen-Symbol (Kästchen mit Pfeil nach oben) unten in der Safari-Leiste.',
    body: (
      <>
        Tippe auf das <strong>Teilen-Symbol</strong> in der Safari-Menüleiste — das ist das Kästchen mit dem Pfeil nach oben (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        ). Auf dem iPhone findest du es unten in der Mitte der Safari-Leiste.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <polyline points="16 6 12 2 8 6"/>
        <line x1="12" y1="2" x2="12" y2="15"/>
      </svg>
    ),
    imgLight: '/tutorials_Screenshots/iosWhite_schritt2.webp',
    imgDark:  '/tutorials_Screenshots/ios_schritt2.webp',
  },
  {
    num: '03',
    title: '„Zum Home-Bildschirm" wählen',
    text: 'Scrolle im Teilen-Menü nach unten und tippe auf „Zum Home-Bildschirm".',
    body: (
      <>
        Scrolle im Teilen-Menü nach unten und tippe auf{' '}
        <strong>„Zum Home-Bildschirm"</strong>. Der Eintrag befindet sich in der unteren Liste der Aktionen — ggf. etwas nach unten scrollen.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
    imgLight: '/tutorials_Screenshots/iosWhite_schritt3.webp',
    imgDark:  '/tutorials_Screenshots/ios_schritt3.webp',
  },
  {
    num: '04',
    title: 'Namen prüfen & bestätigen',
    text: 'Tippe oben rechts auf „Hinzufügen", um die Installation abzuschließen.',
    body: (
      <>
        iOS zeigt dir einen Dialog mit dem Namen der App. Du kannst ihn bei Bedarf anpassen. Tippe oben rechts auf <strong>„Hinzufügen"</strong>, um die Installation abzuschließen.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    imgLight: '/tutorials_Screenshots/iosWhite_schritt4.webp',
    imgDark:  '/tutorials_Screenshots/ios_schritt4.webp',
  },
  {
    num: '05',
    title: 'Fertig — POKYH starten',
    text: 'POKYH erscheint als Icon auf deinem Home-Bildschirm und startet im Vollbildmodus ohne Browser-Adressleiste.',
    body: (
      <>
        POKYH erscheint jetzt als Icon auf deinem Home-Bildschirm. Tippe darauf, um die App zu öffnen — sie startet im Vollbildmodus ohne Browser-Adressleiste, genau wie eine native App. Updates werden automatisch geladen, sobald du online bist.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    imgLight: '/tutorials_Screenshots/iosWhite_schritt5.webp',
    imgDark:  '/tutorials_Screenshots/ios_schritt5.webp',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'POKYH als PWA auf iPhone installieren',
  description: 'Installiere POKYH als Progressive Web App auf iPhone oder iPad über Safari — ohne App Store.',
  totalTime: 'PT2M',
  step: STEPS.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.text,
  })),
};

export default function PwaIosPage() {
  return (
    <div className="lp-root lp-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <LandingNav />

      <div className="lp-page-hero">
        <Link href="/get" className="get-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Zurück
        </Link>
        <div className="lp-page-hero-eyebrow">PWA · iOS</div>
        <h1 className="lp-page-hero-h1">POKYH auf iPhone<br />als PWA installieren</h1>
        <p className="lp-page-hero-sub">
          Installiere POKYH direkt über Safari — kein App Store, keine Umwege. Die App landet als Icon auf deinem Home-Bildschirm und aktualisiert sich automatisch.
        </p>
      </div>

      <div className="lp-page-content">
        <div className="get-install-steps">
          {STEPS.map(({ num, title, body, imgLight, imgDark }) => (
            <article key={num} className="get-install-step">
              <div className="get-install-step-text">
                <div className="get-install-step-num">{num}</div>
                <h2 className="get-install-step-title">{title}</h2>
                <div className="get-install-step-body">{body}</div>
              </div>
              <div className="get-install-screenshot-wrap">
                <img
                  src={imgLight}
                  alt={`Schritt ${num}: ${title}`}
                  className="screenshot-light"
                  loading={num === '01' ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <img
                  src={imgDark}
                  alt={`Schritt ${num}: ${title}`}
                  className="screenshot-dark"
                  loading={num === '01' ? 'eager' : 'lazy'}
                  decoding="async"
                  aria-hidden="true"
                />
              </div>
            </article>
          ))}
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
