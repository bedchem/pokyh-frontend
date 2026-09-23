import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';
import { makeT } from '@/lib/i18n/dictionary';
import { getDict } from '@/lib/i18n/dictionaries/get';
import { rich } from '@/lib/i18n/rich';
import type { Locale } from '@/lib/i18n/locale';

const RELEASES = {
  ios: 'https://github.com/bedchem/POKYH_IOS/releases',
  android: 'https://github.com/bedchem/POKYH_ANDROID/releases',
} as const;

const GlobeIcon = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const DownloadIcon = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const InstallIcon = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

/** Download guide for the native POKYH apps (shared by /get/ios and /get/android). */
export default function AppInstallGuide({ platform, locale }: { platform: 'ios' | 'android'; locale: Locale }) {
  const t = makeT(getDict, locale);
  const ios = platform === 'ios';
  const releases = RELEASES[platform];

  const steps = [
    {
      num: '01',
      title: t('appStep1Title'),
      body: (
        <>
          {t('appStep1Before')} <strong><a href={releases} target="_blank" rel="noopener noreferrer">{releases}</a></strong> {t('appStep1After')}
        </>
      ),
      icon: GlobeIcon,
    },
    {
      num: '02',
      title: ios ? t('iosStep2Title') : t('androidStep2Title'),
      body: rich(ios ? t('iosStep2Body') : t('androidStep2Body')),
      icon: DownloadIcon,
    },
    {
      num: '03',
      title: t('iosStep3Title'),
      body: ios ? t('iosStep3Body') : t('androidStep3Body'),
      icon: InstallIcon,
    },
  ];

  return (
    <div className="lp-root lp-page">
      <LandingNav />

      <div className="lp-page-hero">
        <Link href={`/${locale}/get/`} className="get-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {t('back')}
        </Link>
        <div className="lp-page-hero-eyebrow">{ios ? 'iOS' : 'Android'}</div>
        <h1 className="lp-page-hero-h1">
          {ios ? t('iosTitle1') : t('androidTitle1')}<br />{ios ? t('iosTitle2') : t('androidTitle2')}
        </h1>
        <p className="lp-page-hero-sub">
          {ios ? t('iosSub') : t('androidSub')}
        </p>
      </div>

      <div className="lp-page-content">

        <div className="get-install-steps">
          {steps.map(({ num, title, body, icon }) => (
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
