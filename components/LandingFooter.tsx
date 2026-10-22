'use client';

import Link from 'next/link';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { SOURCE_OWNER, SOURCE_URL } from '@/lib/site-links';

export default function LandingFooter() {
  const t = useT(commonDict);
  const localize = useLocalizeHref();
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-disclaimer">
          {t('footerDisclaimer')}
        </div>
        <div className="lp-footer-bar">
          <div>
            © 2026{' '}
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">{SOURCE_OWNER}</a>
            {' '}· POKYH · {t('footerMadeBy')}{' '}
            <a href="https://github.com/plattnericus" target="_blank" rel="noopener noreferrer">Plattnericus</a>
            {' '}&amp;{' '}
            <a href="https://github.com/ryhox" target="_blank" rel="noopener noreferrer">Ryhox</a>
          </div>
          <div className="lp-footer-links">
            <Link href={localize('/login')}>{t('login')}</Link>
            <Link href={localize('/about')}>About</Link>
            <Link href={localize('/faq')}>FAQ</Link>
            <Link href={localize('/comparison')}>{t('footerComparison')}</Link>
            <Link href={localize('/howto')}>GET POKYH</Link>
            <Link href={localize('/legal/impressum')}>{t('footerImprint')}</Link>
            <Link href={localize('/legal/datenschutz')}>{t('footerPrivacy')}</Link>
            <Link href={localize('/legal/cookies')}>{t('footerCookies')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
