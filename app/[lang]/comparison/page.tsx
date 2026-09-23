import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { comparisonDict, type ComparisonKey } from '@/lib/i18n/dictionaries/comparison';

type TFn = (key: ComparisonKey) => string;
type PageProps = { params: Promise<{ lang: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(comparisonDict, locale);
  return {
  title: t('metaTitle'),
  description: t('metaDescription'),
  keywords: pageKeywords(locale, [
    'POKYH vs WebUntis', 'POKYH WebUntis Vergleich', 'POKYH Vergleich',
    'WebUntis Alternative Tschuggmall', 'WebUntis Alternative Brixen',
    'POKYH Funktionen', 'Schulapp Vergleich Brixen',
    'Tschuggmall Schulapp', 'BFS Tschuggmall App', 'LBS Brixen Schulapp',
  ]),
  alternates: localeAlternates(SITE_URL, locale, '/comparison'),
  openGraph: {
    title: t('ogTitle'),
    description: t('ogDescription'),
    url: localizedUrl(SITE_URL, locale, '/comparison'),
    type: 'website',
    siteName: 'POKYH',
    ...ogLocale(locale),
  },
  };
}

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const MinusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const TildeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14c2-4 5-4 8 0s6 4 8 0"/>
  </svg>
);

type CmpVal = 'yes' | 'no' | 'partial';

const ROWS: { feat: ComparisonKey; pokyh: CmpVal; webuntis: CmpVal; section: ComparisonKey }[] = [
  { feat: 'rFree',        pokyh: 'yes', webuntis: 'yes',     section: 'secGeneral' },
  { feat: 'rAdFree',      pokyh: 'yes', webuntis: 'yes',     section: 'secGeneral' },
  { feat: 'rNoAccount',   pokyh: 'no',  webuntis: 'no',      section: 'secGeneral' },

  { feat: 'rModern',      pokyh: 'yes', webuntis: 'partial', section: 'secDesign' },
  { feat: 'rDark',        pokyh: 'yes', webuntis: 'partial', section: 'secDesign' },
  { feat: 'rMobileFirst', pokyh: 'yes', webuntis: 'partial', section: 'secDesign' },
  { feat: 'rMobileApp',   pokyh: 'yes', webuntis: 'yes',     section: 'secDesign' },

  { feat: 'rTimetable',   pokyh: 'yes', webuntis: 'yes',     section: 'secFeatures' },
  { feat: 'rSubst',       pokyh: 'yes', webuntis: 'yes',     section: 'secFeatures' },
  { feat: 'rGrades',      pokyh: 'yes', webuntis: 'partial', section: 'secFeatures' },
  { feat: 'rMensa',       pokyh: 'yes', webuntis: 'no',      section: 'secFeatures' },
  { feat: 'rMessages',    pokyh: 'yes', webuntis: 'yes',     section: 'secFeatures' },
  { feat: 'rAbsences',    pokyh: 'yes', webuntis: 'yes',     section: 'secFeatures' },
  { feat: 'rReminders',   pokyh: 'yes', webuntis: 'no',      section: 'secFeatures' },
  { feat: 'rTodos',       pokyh: 'yes', webuntis: 'no',      section: 'secFeatures' },

  { feat: 'rWebApp',      pokyh: 'yes', webuntis: 'yes', section: 'secPlatform' },
  { feat: 'rNativeApps',  pokyh: 'yes', webuntis: 'yes', section: 'secPlatform' },
  { feat: 'rTeachers',    pokyh: 'no',  webuntis: 'yes', section: 'secPlatform' },
  { feat: 'rOfficial',    pokyh: 'no',  webuntis: 'yes', section: 'secPlatform' },
  { feat: 'rOpenSource',  pokyh: 'yes', webuntis: 'no',  section: 'secPlatform' },
];

function Indicator({ val }: { val: CmpVal }) {
  if (val === 'yes')     return <span className="lp-cmp-ind is-yes"><CheckIcon /></span>;
  if (val === 'partial') return <span className="lp-cmp-ind is-partial"><TildeIcon /></span>;
  return <span className="lp-cmp-ind is-no"><MinusIcon /></span>;
}

function Pill({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  return (
    <span className="lp-cmp-pill">
      <span className="lp-cmp-pill-dot" style={{ background: color }} />
      {count}/{total} {label}
    </span>
  );
}

function ColumnList({ valueKey, t }: { valueKey: 'pokyh' | 'webuntis'; accent?: boolean; t: TFn }) {
  let lastSection: string | null = null;
  return (
    <div className="lp-cmp-list">
      {ROWS.map(r => {
        const fresh = r.section !== lastSection;
        lastSection = r.section;
        return (
          <div key={r.feat + valueKey}>
            {fresh && <div className="lp-cmp-section-hd">{t(r.section)}</div>}
            <div className={`lp-cmp-row ${fresh ? 'is-first' : ''}`}>
              <Indicator val={r[valueKey]} />
              <span className="lp-cmp-row-label">{t(r.feat)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function ComparisonPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(comparisonDict, locale);
  const stats = ROWS.reduce(
    (acc, r) => {
      acc.p[r.pokyh]++; acc.w[r.webuntis]++; return acc;
    },
    { p: { yes: 0, partial: 0, no: 0 }, w: { yes: 0, partial: 0, no: 0 } } as Record<'p' | 'w', Record<CmpVal, number>>,
  );
  const total = ROWS.length;

  return (
    <div className="lp-root lp-page">
      <LandingNav />

      <div className="lp-page-hero">
        <div className="lp-page-hero-eyebrow">
          {t('eyebrow')}
        </div>
        <h1 className="lp-page-hero-h1">
          POKYH <span className="lp-cmp-amp">&amp;</span> WebUntis
        </h1>
        <p className="lp-page-hero-sub">
          {t('heroSub')}
        </p>
      </div>

      <div className="lp-page-content">

        {/* Note */}
        <div className="lp-cmp-note">
          <span className="lp-cmp-note-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </span>
          <span>
            <strong style={{ color: 'var(--app-text-primary)' }}>{t('noteStrong')}</strong>{' '}
            {t('note')}
          </span>
        </div>

        {/* Comparison cards */}
        <div className="lp-cmp-grid">
          {/* POKYH */}
          <section className="lp-cmp-card is-accent">
            <div className="lp-cmp-card-head">
              <div className="lp-cmp-card-head-row">
                <div className="lp-cmp-card-id">
                  <div className="lp-cmp-card-mark">P</div>
                  <div>
                    <div className="lp-cmp-card-name">POKYH</div>
                    <div className="lp-cmp-card-sub">{t('pokyhSub')}</div>
                  </div>
                </div>
                <span className="lp-cmp-tag">{t('recommended')}</span>
              </div>
              <div className="lp-cmp-pills">
                <Pill label={t('available')} count={stats.p.yes} total={total} color="var(--lp-cmp-yes, #10B981)" />
                {stats.p.partial > 0 && <Pill label={t('partial')} count={stats.p.partial} total={total} color="var(--lp-cmp-warn, #F4B860)" />}
                <Pill label={t('missing')} count={stats.p.no} total={total} color="var(--app-text-tertiary)" />
              </div>
            </div>
            <ColumnList valueKey="pokyh" accent t={t} />
          </section>

          {/* WebUntis */}
          <section className="lp-cmp-card">
            <div className="lp-cmp-card-head">
              <div className="lp-cmp-card-head-row">
                <div className="lp-cmp-card-id">
                  <div className="lp-cmp-card-mark">W</div>
                  <div>
                    <div className="lp-cmp-card-name">WebUntis</div>
                    <div className="lp-cmp-card-sub">{t('webuntisSub')}</div>
                  </div>
                </div>
                <span className="lp-cmp-tag">{t('original')}</span>
              </div>
              <div className="lp-cmp-pills">
                <Pill label={t('available')} count={stats.w.yes} total={total} color="var(--lp-cmp-yes, #10B981)" />
                <Pill label={t('partial')} count={stats.w.partial} total={total} color="var(--lp-cmp-warn, #F4B860)" />
                <Pill label={t('missing')} count={stats.w.no} total={total} color="var(--app-text-tertiary)" />
              </div>
            </div>
            <ColumnList valueKey="webuntis" t={t} />
          </section>
        </div>

        {/* Legend */}
        <div className="lp-cmp-legend">
          <div><span className="lp-cmp-legend-dot" style={{ background: 'var(--lp-cmp-yes, #10B981)' }} /> {t('legendAvailable')}</div>
          <div><span className="lp-cmp-legend-dot" style={{ background: 'var(--lp-cmp-warn, #F4B860)' }} /> {t('legendLimited')}</div>
          <div><span className="lp-cmp-legend-dot lp-cmp-legend-dot-muted" /> {t('legendUnavailable')}</div>
        </div>

        {/* Summary */}
        <div className="lp-page-section" style={{ borderTop: 'none' }}>
          <h2 className="lp-page-section-title">{t('summaryTitle')}</h2>
          <div className="lp-steps-grid">
            {[
              { num: 'POKYH',              title: t('sumPokyhTitle'),    body: t('sumPokyhBody'), accent: true },
              { num: 'WebUntis',           title: t('sumWebuntisTitle'), body: t('sumWebuntisBody') },
              { num: t('sumTogether'),     title: t('sumTogetherTitle'), body: t('sumTogetherBody') },
            ].map(({ num, title, body, accent }) => (
              <div key={title} className={`lp-step ${accent ? 'is-accent' : ''}`}>
                <div className="lp-step-num">{num}</div>
                <div className="lp-step-title">{title}</div>
                <div className="lp-step-body">{body}</div>
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
          <div style={{ display: 'inline-flex', gap: 22, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href={`/${locale}/login/`} className="lp-btn">{t('ctaLogin')}</Link>
            <Link href={`/${locale}/faq/`} className="lp-alink">{t('ctaFaq')}</Link>
          </div>
        </div>

      </div>

      <LandingFooter />
    </div>
  );
}
