import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { howtoDict, type HowtoKey } from '@/lib/i18n/dictionaries/howto';

type PageProps = { params: Promise<{ lang: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(howtoDict, locale);
  return {
  title: t('metaTitle'),
  description: t('metaDescription'),
  keywords: pageKeywords(locale, ['POKYH Download', 'POKYH GitHub', 'POKYH selbst hosten', 'POKYH Open Source', 'POKYH installieren']),
  alternates: localeAlternates(SITE_URL, locale, '/howto'),
  openGraph: {
    title: t('ogTitle'),
    description: t('ogDescription'),
    url: localizedUrl(SITE_URL, locale, '/howto'),
    type: 'website',
    siteName: 'POKYH',
    ...ogLocale(locale),
  },
  };
}

function steps(t: (key: HowtoKey) => string) {
  return [
    { num: '01', title: t('s1Title'), body: t('s1Body'), code: 'git clone https://github.com/bedchem/pokyh\ncd pokyh' },
    { num: '02', title: t('s2Title'), body: t('s2Body'), code: 'npm install' },
    { num: '03', title: t('s3Title'), body: t('s3Body'), code: `cp .env.example .env.local\n${t('s3Comment')}` },
    { num: '04', title: t('s4Title'), body: t('s4Body'), code: `npm run dev\n\n${t('s4Comment')}\nnpm run build && npm start` },
  ];
}

const TECH: { name: string; role: HowtoKey; desc: HowtoKey }[] = [
  { name: 'Next.js 16',    role: 'tFramework', desc: 'tFrameworkDesc' },
  { name: 'TypeScript',    role: 'tLanguage',  desc: 'tLanguageDesc' },
  { name: 'Tailwind',      role: 'tStyling',   desc: 'tStylingDesc' },
  { name: 'POKYH Backend', role: 'tBackend',   desc: 'tBackendDesc' },
];

const GhIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2C6.5 7.4 6.1 6.1 6.6 4.4c0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.5 1.7.1 3 .1 3.3.7.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>
  </svg>
);

export default async function HowtoPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(howtoDict, locale);
  const STEPS = steps(t);
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

        {/* Two options */}
        <div className="lp-howto-options">
          {/* Option A: Hosted */}
          <div className="lp-howto-card">
            <div className="lp-howto-card-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/>
              </svg>
              {t('recommended')}
            </div>
            <div className="lp-howto-card-title">{t('onlineTitle')}</div>
            <div className="lp-howto-card-sub">
              {t('onlineSub')}
            </div>
            <Link href={`/${locale}/login/`} className="lp-howto-card-link">
              {t('loginNow')}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>

          {/* Option B: Self-hosted */}
          <div className="lp-howto-card">
            <div className="lp-howto-card-badge" style={{ color: 'var(--app-text-secondary)', background: 'color-mix(in srgb, var(--app-border) 60%, transparent)' }}>
              <GhIcon /> GitHub
            </div>
            <div className="lp-howto-card-title">{t('selfTitle')}</div>
            <div className="lp-howto-card-sub">
              {t('selfSub')}
            </div>
            <a
              href="https://github.com/bedchem/pokyh"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-howto-card-link"
            >
              github.com/bedchem/pokyh
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Self-hosting guide */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">{t('guideTitle')}</h2>
          <p className="lp-page-section-sub">{t('guideSub')}</p>

          <div className="lp-howto-steps">
            {STEPS.map(step => (
              <div key={step.num} className="lp-howto-step">
                <div className="lp-howto-step-num">{step.num}</div>
                <div>
                  <div className="lp-howto-step-title">{step.title}</div>
                  <div className="lp-howto-step-body">{step.body}</div>
                  <code className="lp-code">{step.code}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">{t('techTitle')}</h2>
          <p className="lp-page-section-sub">{t('techSub')}</p>
          <div className="lp-tech-grid">
            {TECH.map(({ name, role, desc }) => (
              <div key={name} className="lp-tech-card">
                <div className="lp-tech-card-name">{name}</div>
                <div className="lp-tech-card-role">{t(role)}</div>
                <div className="lp-tech-card-desc">{t(desc)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <h2 className="lp-h2">{t('ctaTitle')}</h2>
          <p className="lp-lead" style={{ margin: '12px auto 32px', maxWidth: 460 }}>
            {t('ctaLead')}
          </p>
          <Link href={`/${locale}/login/`} className="lp-btn">{t('ctaLogin')}</Link>
        </div>

      </div>

      <LandingFooter />
    </div>
  );
}
