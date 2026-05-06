'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

type Tab = 'web' | 'app';

export default function GetClient() {
  const [tab, setTab] = useState<Tab>('web');

  return (
    <div className="lp-root lp-page">
      <LandingNav />

      <div className="get-wrap">

        {/* Sliding segmented control */}
        <nav className="get-toggle" aria-label="Inhaltsauswahl" role="group">
          <span className={`get-toggle-pill${tab === 'app' ? ' right' : ''}`} aria-hidden="true" />

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
        </nav>

        {/* Content */}
        <div className="get-hero">
          {tab === 'web' ? (
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
          ) : (
            <>
              <p className="get-eyebrow">Progressive Web App</p>
              <h1 className="get-h1">POKYH installieren</h1>
              <p className="get-sub">
                Füge POKYH wie eine native App zum Homescreen hinzu —
                kein App Store, kein Download, immer die neueste Version.
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
                    <div className="get-platform-name">iOS · iPadOS</div>
                    <div className="get-platform-hint">Safari → Zum Homescreen</div>
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
                    <div className="get-platform-hint">Chrome → App installieren</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="get-platform-arrow" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
              <p className="get-note">Kostenlos · Kein App Store · Immer aktuell</p>
            </>
          )}
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
