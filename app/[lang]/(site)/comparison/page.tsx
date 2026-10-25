import type { Metadata } from 'next';
import { Check, Minus } from '@phosphor-icons/react/ssr';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords, ogImage } from '@/lib/i18n/seo';
import { comparisonDict, type ComparisonKey } from '@/lib/i18n/dictionaries/comparison';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import PageJsonLd from '@/components/site/PageJsonLd';
import PageIntro, { TONE, type SiteTone } from '@/components/site/PageIntro';
import RevealScope from '@/components/site/RevealScope';
import CtaBand from '@/components/site/CtaBand';
import { SITE_URL } from '@/lib/site-url';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(comparisonDict, locale);
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: pageKeywords(locale),
    alternates: localeAlternates(SITE_URL, locale, '/comparison'),
    openGraph: {
      images: ogImage(locale),
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: localizedUrl(SITE_URL, locale, '/comparison'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
  };
}

// Only objective, checkable features. Judgements about the design of another
// company's product are left out (comparative advertising must compare
// verifiable features, Italian D.Lgs. 145/2007 art. 4). WebUntis values: as
// publicly documented; what a school has switched on can differ.
type Val = 'yes' | 'partial' | 'no';
const SECTIONS: { title: ComparisonKey; rows: { key: ComparisonKey; pokyh: Val; untis: Val }[] }[] = [
  {
    title: 'secGeneral',
    rows: [
      { key: 'rFree', pokyh: 'yes', untis: 'yes' },
      { key: 'rAdFree', pokyh: 'yes', untis: 'yes' },
      { key: 'rNoAccount', pokyh: 'partial', untis: 'no' },
    ],
  },
  {
    title: 'secDesign',
    rows: [
      { key: 'rDark', pokyh: 'yes', untis: 'yes' },
      { key: 'rMobileApp', pokyh: 'yes', untis: 'yes' },
    ],
  },
  {
    title: 'secFeatures',
    rows: [
      { key: 'rTimetable', pokyh: 'yes', untis: 'yes' },
      { key: 'rSubst', pokyh: 'yes', untis: 'yes' },
      { key: 'rGrades', pokyh: 'yes', untis: 'partial' },
      { key: 'rCalculator', pokyh: 'yes', untis: 'no' },
      { key: 'rMensa', pokyh: 'partial', untis: 'no' },
      { key: 'rMessages', pokyh: 'yes', untis: 'yes' },
      { key: 'rAbsences', pokyh: 'yes', untis: 'yes' },
      { key: 'rReminders', pokyh: 'yes', untis: 'no' },
      { key: 'rTodos', pokyh: 'yes', untis: 'no' },
    ],
  },
  {
    title: 'secPlatform',
    rows: [
      { key: 'rWebApp', pokyh: 'yes', untis: 'yes' },
      { key: 'rNativeApps', pokyh: 'yes', untis: 'yes' },
      { key: 'rTeachers', pokyh: 'no', untis: 'yes' },
      { key: 'rOfficial', pokyh: 'no', untis: 'yes' },
      { key: 'rOpenSource', pokyh: 'yes', untis: 'no' },
    ],
  },
];

function Mark({ value, label, strong }: { value: Val; label: string; strong?: boolean }) {
  return (
    <span className="flex justify-center">
      {value === 'yes' ? (
        <span className={`grid size-9 place-items-center rounded-full ${strong ? 'bg-sage text-sage-ink' : 'bg-inset text-ink'}`}>
          <Check size={17} weight="bold" aria-hidden="true" />
        </span>
      ) : value === 'partial' ? (
        <span className="grid size-9 place-items-center rounded-full bg-butter text-butter-ink" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 1a7 7 0 0 0 0 14Z" fill="currentColor" /><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
        </span>
      ) : (
        <span className="grid size-9 place-items-center rounded-full text-ink-3">
          <Minus size={17} weight="bold" aria-hidden="true" />
        </span>
      )}
      <span className="visually-hidden">{label}</span>
    </span>
  );
}

const SUMMARY: { title: ComparisonKey; body: ComparisonKey; tone: SiteTone }[] = [
  { title: 'sumPokyhTitle', body: 'sumPokyhBody', tone: 'periwinkle' },
  { title: 'sumWebuntisTitle', body: 'sumWebuntisBody', tone: 'butter' },
  { title: 'sumTogetherTitle', body: 'sumTogetherBody', tone: 'sage' },
];

export default async function ComparisonPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(comparisonDict, locale);
  const label = (v: Val) => t(v);

  return (
    <>
      <PageJsonLd locale={locale} path="/comparison" type="WebPage" name={t('metaTitle')} description={t('metaDescription')} trail={[{ name: makeT(siteDict, locale)('navCompare'), path: '/comparison' }]} />
      <PageIntro title={t('title')} lead={t('lead')} />

      <RevealScope>
        <section className="wrap pb-20 md:pb-28">
          <div data-reveal className="card px-4 pb-4 pt-2 md:px-10 md:pb-8 md:pt-4">
            <table className="w-full border-collapse text-left">
              <caption className="visually-hidden">{t('title')}</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="py-5 pr-4 align-bottom"><span className="visually-hidden">{t('title')}</span></th>
                  <th scope="col" className="w-20 py-5 text-center align-bottom md:w-48">
                    <span className="block text-[16px] font-extrabold tracking-[-0.02em] text-ink md:text-[20px]">POKYH</span>
                    <span className="hidden text-[13px] font-medium text-ink-2 md:block">{t('pokyhSub')}</span>
                  </th>
                  <th scope="col" className="w-20 py-5 text-center align-bottom md:w-48">
                    <span className="block text-[16px] font-extrabold tracking-[-0.02em] text-ink-2 md:text-[20px]">WebUntis</span>
                    <span className="hidden text-[13px] font-medium text-ink-3 md:block">{t('webuntisSub')}</span>
                  </th>
                </tr>
              </thead>
              {SECTIONS.map((section) => (
                <tbody key={section.title}>
                  <tr>
                    <th scope="colgroup" colSpan={3} className="pb-2 pt-9 text-[15px] font-bold text-ink-3">{t(section.title)}</th>
                  </tr>
                  {section.rows.map((row) => (
                    <tr key={row.key} className="border-t border-line-soft">
                      <th scope="row" className="py-3.5 pr-4 text-[16px] font-semibold leading-[1.35] text-ink md:text-[18px]">{t(row.key)}</th>
                      <td className="py-3.5"><Mark value={row.pokyh} label={label(row.pokyh)} strong /></td>
                      <td className="py-3.5"><Mark value={row.untis} label={label(row.untis)} /></td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
          <p data-reveal className="mt-6 max-w-[64ch] text-[15px] leading-[1.6] text-ink-2">{t('note')}</p>
          <p data-reveal className="mt-3 max-w-[64ch] text-[13px] leading-[1.6] text-ink-3">{t('asOf')}</p>
        </section>

        <section aria-labelledby="summary-title" className="wrap pb-20 md:pb-28">
          <h2 id="summary-title" data-reveal className="text-[clamp(34px,5vw,68px)] font-extrabold leading-[1.04] tracking-[-0.05em]">
            {t('sumTitle')}
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {SUMMARY.map((s) => (
              <div key={s.title} data-reveal className={`squircle rounded-[24px] p-7 md:rounded-[32px] md:p-8 ${TONE[s.tone]}`}>
                <h3 className="text-[22px] font-extrabold tracking-[-0.03em] md:text-[26px]">{t(s.title)}</h3>
                <p className="mt-3 text-[16px] leading-[1.6] md:text-[17px]">{t(s.body)}</p>
              </div>
            ))}
          </div>
        </section>
      </RevealScope>

      <CtaBand
        title={t('ctaTitle')}
        lead={t('ctaLead')}
        primary={{ label: t('ctaLogin'), href: '/login' }}
        secondary={{ label: t('ctaFaq'), href: '/faq' }}
        tone="periwinkle"
      />
    </>
  );
}
