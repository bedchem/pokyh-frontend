'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { getDict } from '@/lib/i18n/dictionaries/get';
import { rich } from '@/lib/i18n/rich';

type Tab = 'web' | 'app' | 'pwa';

export default function GetClient() {
  const t = useT(getDict);
  const localize = useLocalizeHref();
  const [tab, setTab] = useState<Tab>('web');

  const pillClass =
    tab === 'app' ? ' middle' :
    tab === 'pwa' ? ' right' : '';

  return (
    <div className="lp-root lp-page">
      <LandingNav />

      <div className="get-wrap">

        {/* Sliding segmented control */}
        <nav className="get-toggle" aria-label={t('tabsAria')} role="group">
          <span className={`get-toggle-pill${pillClass}`} aria-hidden="true" />

          <button
            className={`get-toggle-btn${tab === 'web' ? ' active' : ''}`}
            onClick={() => setTab('web')}
            aria-pressed={tab === 'web'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {t('tabWeb')}
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
              <p className="get-eyebrow">{t('webEyebrow')}</p>
              <h1 className="get-h1">{t('webTitle')}</h1>
              <p className="get-sub">
                {rich(t('webSub'))}
              </p>
              <div className="get-actions">
                <Link href={localize('/login')} className="lp-btn get-cta-btn">
                  {t('loginNow')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
              <p className="get-note">{t('webNote')}</p>
            </>
          )}

          {tab === 'app' && (
            <>
              <p className="get-eyebrow">{t('appEyebrow')}</p>
              <h1 className="get-h1">{t('appTitle')}</h1>
              <p className="get-sub">
                {rich(t('appSubBefore'))}{' '}
                <a href="https://github.com/bedchem/POKYH_ANDROID/releases" target="_blank" rel="noopener noreferrer">bedchem/POKYH_ANDROID</a>{' '}
                {rich(t('appSubMiddle'))}{' '}
                <a href="https://github.com/bedchem/POKYH_IOS/releases" target="_blank" rel="noopener noreferrer">bedchem/POKYH_IOS</a>{t('appSubAfter')}
              </p>
              <div className="get-platforms">
                <Link href={localize('/get/ios')} className="get-platform-card">
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
                    <div className="get-platform-hint">{t('ipaHint')}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="get-platform-arrow" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
                <Link href={localize('/get/android')} className="get-platform-card">
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
                    <div className="get-platform-hint">{t('apkHint')}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="get-platform-arrow" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
              <p className="get-note">{t('appNote')}</p>
            </>
          )}

          {tab === 'pwa' && (
            <>
              <p className="get-eyebrow">{t('pwaEyebrow')}</p>
              <h1 className="get-h1">{t('pwaTitle')}</h1>

              <div className="get-pwa-info">
                <div className="get-pwa-info-title">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {t('pwaWhat')}
                </div>
                <p className="get-pwa-info-body">
                  {rich(t('pwaWhatBody'))}
                </p>
              </div>

              <p className="get-sub">
                {t('pwaChoose')}
              </p>
              <div className="get-platforms">
                <Link href={localize('/get/pwa/ios')} className="get-platform-card">
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
                    <div className="get-platform-hint">{t('viaSafari')}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="get-platform-arrow" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
                <Link href={localize('/get/pwa/android')} className="get-platform-card">
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
                    <div className="get-platform-hint">{t('viaChrome')}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="get-platform-arrow" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
              <p className="get-note">{t('pwaNote')}</p>
            </>
          )}
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
