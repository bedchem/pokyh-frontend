import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

export const metadata: Metadata = {
  title: 'POKYH PWA auf Android installieren – Schritt-für-Schritt Anleitung',
  description:
    'Installiere POKYH als Progressive Web App auf deinem Android-Gerät — direkt über Chrome, ohne App Store. Kostenlos, automatische Updates.',
  keywords: [
    'POKYH PWA Android', 'POKYH installieren Android', 'Progressive Web App Android',
    'POKYH Chrome Android', 'Schulapp PWA LBS Brixen', 'POKYH zum Startbildschirm',
  ],
  alternates: { canonical: `${SITE_URL}/get/pwa/android` },
  openGraph: {
    title: 'POKYH PWA auf Android installieren',
    description: 'Installiere POKYH als PWA auf Android — ohne App Store, direkt über Chrome.',
    url: `${SITE_URL}/get/pwa/android`,
    type: 'website',
    siteName: 'POKYH',
    locale: 'de_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKYH PWA auf Android installieren',
    description: 'Installiere POKYH als PWA auf Android — ohne App Store, direkt über Chrome.',
  },
  robots: { index: true, follow: true },
};

const STEPS = [
  {
    num: '01',
    title: 'pokyh.com in Chrome öffnen',
    text: 'Öffne Google Chrome auf deinem Android-Gerät und rufe pokyh.com auf.',
    body: (
      <>
        Öffne <strong>Google Chrome</strong> auf deinem Android-Gerät und rufe{' '}
        <strong>pokyh.com</strong> auf. Die PWA-Installation funktioniert am zuverlässigsten in Chrome.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    imgLight: '/tutorials_Screenshots/androidWhite_schritt1.webp',
    imgDark:  '/tutorials_Screenshots/android_schritt1.webp',
  },
  {
    num: '02',
    title: 'Menü öffnen & „Zum Startbildschirm hinzufügen" wählen',
    text: 'Tippe auf die drei Punkte oben rechts und wähle „Zum Startbildschirm hinzufügen" oder „App installieren".',
    body: (
      <>
        Tippe auf die <strong>drei Punkte (⋮)</strong> oben rechts in der Chrome-Adressleiste und wähle im Menü{' '}
        <strong>„Zum Startbildschirm hinzufügen"</strong> oder <strong>„App installieren"</strong>. Der genaue Name kann je nach Chrome-Version leicht variieren.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none"/>
      </svg>
    ),
    imgLight: '/tutorials_Screenshots/androidWhite_schritt2.webp',
    imgDark:  '/tutorials_Screenshots/android_schritt2.webp',
  },
  {
    num: '03',
    title: 'Installation bestätigen',
    text: 'Tippe im Dialog auf „Hinzufügen" oder „Installieren".',
    body: (
      <>
        Im erscheinenden Dialog tippst du auf <strong>„Hinzufügen"</strong> oder{' '}
        <strong>„Installieren"</strong>. Android fügt POKYH daraufhin deinem Startbildschirm hinzu.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    imgLight: '/tutorials_Screenshots/androidWhite_schritt3.webp',
    imgDark:  '/tutorials_Screenshots/android_schritt3.webp',
  },
  {
    num: '04',
    title: 'Fertig — POKYH starten',
    text: 'POKYH erscheint als Icon auf deinem Startbildschirm und startet ohne Adressleiste.',
    body: (
      <>
        POKYH erscheint jetzt als Icon auf deinem Startbildschirm. Tippe darauf, um die App zu öffnen — sie startet ohne Adressleiste, genau wie eine native App. Updates werden automatisch im Hintergrund geladen.
      </>
    ),
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    imgLight: '/tutorials_Screenshots/androidBoth_schritt4.webp',
    imgDark:  '/tutorials_Screenshots/androidBoth_schritt4.webp',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'POKYH als PWA auf Android installieren',
  description: 'Installiere POKYH als Progressive Web App auf Android über Chrome — ohne App Store.',
  totalTime: 'PT2M',
  step: STEPS.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.text,
  })),
};

export default function PwaAndroidPage() {
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
        <div className="lp-page-hero-eyebrow">PWA · Android</div>
        <h1 className="lp-page-hero-h1">POKYH auf Android<br />als PWA installieren</h1>
        <p className="lp-page-hero-sub">
          Installiere POKYH direkt über Chrome — kein App Store, kein APK-Download. Die App landet als Icon auf deinem Startbildschirm und aktualisiert sich automatisch.
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
                {imgLight === imgDark ? (
                  <img
                    src={imgLight}
                    alt={`Schritt ${num}: ${title}`}
                    className="screenshot-both"
                    loading={num === '01' ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
