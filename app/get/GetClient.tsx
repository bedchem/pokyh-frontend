'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

type Tab = 'web' | 'app' | 'pwa';

export default function GetClient() {
  const [tab, setTab] = useState<Tab>('web');

  const pillClass =
    tab === 'app' ? ' middle' :
    tab === 'pwa' ? ' right' : '';

  return (
    <div className="lp-root lp-page">
      <LandingNav />

      <div className="get-wrap">

        {/* Sliding segmented control */}
        <nav className="get-toggle" aria-label="Inhaltsauswahl" role="group">
          <span className={`get-toggle-pill${pillClass}`} aria-hidden="true" />

          <button
            className={`get-toggle-btn${tab === 'web' ? ' active' : ''}`}
            onClick={() => setTab('web')}
            aria-pressed={tab === 'web'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Web Login
          </button>

          <button
            className={`get-toggle-btn${tab === 'app' ? ' active' : ''}`}
            onClick={() => setTab('app')}
            aria-pressed={tab === 'app'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            App
          </button>

          <button
            className={`get-toggle-btn${tab === 'pwa' ? ' active' : ''}`}
            onClick={() => setTab('pwa')}
            aria-pressed={tab === 'pwa'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            PWA
          </button>
        </nav>

        {/* Content */}
        <div className="get-hero">
          {tab === 'web' && (
            <>
              <p className="get-eyebrow">Sofort loslegen</p>
              <h1 className="get-h1">POKYH im Browser nutzen</h1>
              <p className="get-sub">
                Kein Download, keine Installation. Melde dich mit deinem{' '}
                <strong>WebUntis-Account</strong> an — kostenlos und sofort einsatzbereit.
              </p>
              <div className="get-actions">
                <Link href="/login" className="lp-btn get-cta-btn">
                  Jetzt anmelden
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
              <p className="get-note">Funktioniert auf jedem Gerät · Kein Passwort gespeichert</p>
            </>
          )}

          {tab === 'app' && (
            <>
              <p className="get-eyebrow">Mobile App</p>
              <h1 className="get-h1">POKYH installieren</h1>
              <p className="get-sub">
                Auf https://github.com/bedchem/pokyh kann man die mobile apk (android) und .ipa (ios) herunterladen bei Releases und dann ausführen.
              </p>
              <div className="get-platforms">
                <Link href="/get/ios" className="get-platform-card">
                  <Image
                    src="/icons/apple.svg"
                    alt="Apple"
                    width={36}
                    height={36}
                    className="get-platform-img get-platform-img-apple"
                    aria-hidden="true"
                  />
                  <div className="get-platform-info">
                    <div className="get-platform-name">iOS</div>
                    <div className="get-platform-hint">.ipa Datei herunterladen</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="get-platform-arrow" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
                <Link href="/get/android" className="get-platform-card">
                  <Image
                    src="/icons/android.svg"
                    alt="Android"
                    width={40}
                    height={40}
                    className="get-platform-img"
                    aria-hidden="true"
                  />
                  <div className="get-platform-info">
                    <div className="get-platform-name">Android</div>
                    <div className="get-platform-hint">.apk Datei herunterladen</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="get-platform-arrow" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
              <p className="get-note">Kostenlos · Open Source · Immer aktuell</p>
            </>
          )}

          {tab === 'pwa' && (
            <>
              <p className="get-eyebrow">Progressive Web App</p>
              <h1 className="get-h1">POKYH als PWA installieren</h1>

              <div className="get-pwa-info">
                <div className="get-pwa-info-title">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Was ist eine PWA?
                </div>
                <p className="get-pwa-info-body">
                  Eine <strong>Progressive Web App (PWA)</strong> ist eine Website, die du direkt auf deinem Gerät installieren kannst — ganz ohne App Store oder APK-Datei. POKYH verhält sich danach wie eine native App: eigenes Icon auf dem Startbildschirm, kein sichtbares Browserfenster, schnelles Laden. Updates geschehen automatisch im Hintergrund — du musst nie manuell updaten.
                </p>
              </div>

              <p className="get-sub">
                Wähle dein Betriebssystem für die Schritt-für-Schritt-Anleitung:
              </p>
              <div className="get-platforms">
                <Link href="/get/pwa/ios" className="get-platform-card">
                  <Image
                    src="/icons/apple.svg"
                    alt="Apple"
                    width={36}
                    height={36}
                    className="get-platform-img get-platform-img-apple"
                    aria-hidden="true"
                  />
                  <div className="get-platform-info">
                    <div className="get-platform-name">iOS / iPadOS</div>
                    <div className="get-platform-hint">Installation über Safari</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="get-platform-arrow" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
                <Link href="/get/pwa/android" className="get-platform-card">
                  <Image
                    src="/icons/android.svg"
                    alt="Android"
                    width={40}
                    height={40}
                    className="get-platform-img"
                    aria-hidden="true"
                  />
                  <div className="get-platform-info">
                    <div className="get-platform-name">Android</div>
                    <div className="get-platform-hint">Installation über Chrome</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="get-platform-arrow" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
              <p className="get-note">Kein App Store · Automatische Updates · Kostenlos</p>
            </>
          )}
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
