'use client';

import { useState } from 'react';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { FAQ_COUNT, faqDict, type FaqKey } from '@/lib/i18n/dictionaries/faq';

const FAQ_ITEMS = Array.from({ length: FAQ_COUNT }, (_, i) => ({
  q: `q${i + 1}` as FaqKey,
  a: `a${i + 1}` as FaqKey,
}));

export default function FaqClient() {
  const t = useT(faqDict);
  const localize = useLocalizeHref();
  const [open, setOpen] = useState<number | null>(null);
  const toggle = (i: number) => setOpen(prev => (prev === i ? null : i));

  return (
    <div className="lp-root lp-page">
      <LandingNav />

      <div className="lp-page-hero">
        <div className="lp-page-hero-eyebrow">{t('eyebrow')}</div>
        <h1 className="lp-page-hero-h1">{t('title')}</h1>
        <p className="lp-page-hero-sub">
          {t('sub')}
        </p>
      </div>

      <div className="lp-page-content">
        <div className="lp-faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={`lp-faq-item${open === i ? ' open' : ''}`}>
              <button className="lp-faq-q" onClick={() => toggle(i)} aria-expanded={open === i}>
                <span className="lp-faq-q-text">{t(item.q)}</span>
                <span className="lp-faq-q-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </button>
              <div className="lp-faq-a" aria-hidden={open !== i}>
                <div className="lp-faq-a-inner">{t(item.a)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '72px 0 40px' }}>
          <h2 className="lp-h2">{t('ctaTitle')}</h2>
          <p className="lp-lead" style={{ margin: '12px auto 32px', maxWidth: 460 }}>
            {t('ctaLead')}
          </p>
          <div style={{ display: 'inline-flex', gap: 22, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href={localize('/login')} className="lp-btn">{t('ctaLogin')}</Link>
            <a href="https://github.com/bedchem/pokyh" target="_blank" rel="noopener noreferrer" className="lp-alink">GitHub</a>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
