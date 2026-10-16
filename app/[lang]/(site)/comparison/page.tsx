import type { Metadata } from 'next';
import { Check, Minus } from '@phosphor-icons/react/ssr';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { comparisonDict, type ComparisonKey } from '@/lib/i18n/dictionaries/comparison';
import PageIntro from '@/components/site/PageIntro';
import RevealScope from '@/components/site/RevealScope';
import CtaBand from '@/components/site/CtaBand';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(comparisonDict, locale);
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: pageKeywords(locale, [
      'POKYH vs WebUntis', 'WebUntis Alternative', 'WebUntis Vergleich', 'Schulapp Vergleich',
      'WebUntis Brixen', 'Tschuggmall WebUntis', 'LBS Brixen WebUntis',
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
      { key: 'rModern', pokyh: 'yes', untis: 'partial' },
      { key: 'rDark', pokyh: 'yes', untis: 'partial' },
      { key: 'rMobileFirst', pokyh: 'yes', untis: 'partial' },
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
      { key: 'rMensa', pokyh: 'yes', untis: 'no' },
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
        <span className={`grid size-9 place-items-center rounded-full ${strong ? 'bg-accent text-on-accent' : 'bg-ink text-canvas'}`}>
          <Check size={17} weight="bold" aria-hidden="true" />
        </span>
      ) : value === 'partial' ? (
        <span className="grid size-9 place-items-center rounded-full border-2 border-ink-3" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 1a7 7 0 0 0 0 14Z" fill="var(--ink-3)" /></svg>
        </span>
      ) : (
        <span className="grid size-9 place-items-center rounded-full bg-inset text-ink-3">
          <Minus size={17} weight="bold" aria-hidden="true" />
        </span>
      )}
      <span className="visually-hidden">{label}</span>
    </span>
  );
}

export default async function ComparisonPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(comparisonDict, locale);
  const label = (v: Val) => t(v);

  return (
    <>
      <PageIntro title={t('title')} lead={t('lead')} />

      <RevealScope>
        <section className="bg-canvas">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10 pb-24 md:pb-36">
            <table className="w-full border-collapse text-left">
              <caption className="visually-hidden">{t('title')}</caption>
              <thead className="sticky top-16 md:top-[72px] z-10 bg-canvas">
                <tr className="border-b-2 border-ink">
                  <th scope="col" className="py-5 pr-4 align-bottom"><span className="visually-hidden">{t('title')}</span></th>
                  <th scope="col" className="w-24 md:w-56 py-5 text-center align-bottom">
                    <span className="block text-[17px] md:text-[22px] font-extrabold tracking-[-0.03em] text-ink">POKYH</span>
                    <span className="hidden md:block text-[13px] font-medium text-ink-2">{t('pokyhSub')}</span>
                  </th>
                  <th scope="col" className="w-24 md:w-56 py-5 text-center align-bottom">
                    <span className="block text-[17px] md:text-[22px] font-extrabold tracking-[-0.03em] text-ink-2">WebUntis</span>
                    <span className="hidden md:block text-[13px] font-medium text-ink-3">{t('webuntisSub')}</span>
                  </th>
                </tr>
              </thead>
              {SECTIONS.map((section) => (
                <tbody key={section.title} data-reveal>
                  <tr>
                    <th scope="colgroup" colSpan={3} className="pt-12 pb-3 text-[14px] font-bold text-ink-2">{t(section.title)}</th>
                  </tr>
                  {section.rows.map((row) => (
                    <tr key={row.key} className="border-t border-line">
                      <th scope="row" className="py-4 pr-4 text-[17px] md:text-[20px] font-semibold tracking-[-0.01em] text-ink">{t(row.key)}</th>
                      <td className="py-4"><Mark value={row.pokyh} label={label(row.pokyh)} strong /></td>
                      <td className="py-4"><Mark value={row.untis} label={label(row.untis)} /></td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
            <p data-reveal className="mt-10 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">{t('note')}</p>
          </div>
        </section>

        <section aria-labelledby="summary-title" className="bg-canvas">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10 pb-24 md:pb-36">
            <h2 id="summary-title" data-reveal className="text-ink font-extrabold leading-[0.98] tracking-[-0.045em] text-[clamp(36px,8vw,52px)] lg:text-[clamp(44px,4vw,68px)]">
              {t('sumTitle')}
            </h2>
            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {([
                ['sumPokyhTitle', 'sumPokyhBody'],
                ['sumWebuntisTitle', 'sumWebuntisBody'],
                ['sumTogetherTitle', 'sumTogetherBody'],
              ] as const).map(([title, body], i) => (
                <div key={title} data-reveal className="border-t-2 border-ink pt-6">
                  <h3 className={`text-[24px] md:text-[28px] font-extrabold tracking-[-0.03em] ${i === 0 ? 'text-accent-ink' : 'text-ink'}`}>{t(title)}</h3>
                  <p className="mt-3 text-[16px] md:text-[17px] leading-[1.6] text-ink-2">{t(body)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealScope>

      <CtaBand
        title={t('ctaTitle')}
        lead={t('ctaLead')}
        primary={{ label: t('ctaLogin'), href: '/login' }}
        secondary={{ label: t('ctaFaq'), href: '/faq' }}
        tone="sage"
      />
    </>
  );
}
