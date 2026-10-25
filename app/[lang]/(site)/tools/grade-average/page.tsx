import type { Metadata } from 'next';
import GradeCalculator from '@/components/tools/GradeCalculator';
import {
  FaqSection, TOOLS_PATH, ToolCta, ToolHeader, ToolSection, calculatorApp, toolMetadata,
} from '@/components/tools/ToolPage';
import PageJsonLd, { faqEntities } from '@/components/site/PageJsonLd';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localizedUrl } from '@/lib/i18n/seo';
import { SITE_URL } from '@/lib/site-url';
import { toolsDict, GRADE_FAQ_COUNT, type ToolsKey } from '@/lib/i18n/dictionaries/tools';

// Grade average calculator: the calculator first, then how the average works,
// the grading scales and the common questions.

const PATH = `${TOOLS_PATH}/grade-average`;
type PageProps = { params: Promise<{ lang: string }> };

const KEYWORDS = {
  de: ['Notenrechner', 'Notendurchschnitt berechnen', 'Notenschnitt berechnen', 'Durchschnitt Noten Rechner', 'gewichteter Notendurchschnitt', 'welche Note brauche ich', 'Notenrechner Schule'],
  it: ['calcolo media voti', 'calcolatore media voti', 'media ponderata voti', 'calcolo media scolastica', 'che voto mi serve', 'media voti scuola'],
  en: ['grade average calculator', 'calculate grade average', 'weighted grade calculator', 'what grade do I need', 'school grade calculator'],
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  return toolMetadata(locale, PATH, { title: 'gMetaTitle', description: 'gMetaDescription', ogTitle: 'gOgTitle', ogDescription: 'gOgDescription' }, KEYWORDS);
}

const SCALES: ToolsKey[] = ['gScaleItText', 'gScaleDeText', 'gScaleDe15Text', 'gScaleAtText', 'gScaleChText'];

export default async function GradeAveragePage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(toolsDict, locale);
  const href = (path: string) => localizedUrl('', locale, path);
  const faq = Array.from({ length: GRADE_FAQ_COUNT }, (_, i) => ({ q: t(`gq${i + 1}` as ToolsKey), a: t(`ga${i + 1}` as ToolsKey), id: `gq${i + 1}` }));

  return (
    <>
      <PageJsonLd
        locale={locale}
        path={PATH}
        type="FAQPage"
        name={t('gMetaTitle')}
        description={t('gMetaDescription')}
        trail={[{ name: t('hBreadcrumb'), path: TOOLS_PATH }, { name: t('gBreadcrumb'), path: PATH }]}
        main={faqEntities(faq, localizedUrl(SITE_URL, locale, PATH))}
        extra={[calculatorApp(locale, PATH, t('gBreadcrumb'), t('gMetaDescription'))]}
      />
      <ToolHeader
        title={t('gTitle')}
        lead={t('gLead')}
        crumbs={[{ label: 'POKYH', href: href('/') }, { label: t('hBreadcrumb'), href: href(TOOLS_PATH) }, { label: t('gBreadcrumb') }]}
      />
      <div className="wrap rise pb-20 md:pb-28 [animation-delay:180ms]">
        <GradeCalculator />
      </div>

      <ToolSection id="how" title={t('gHowTitle')}>
        <p>{t('gHow')}</p>
        <h3 className="mt-4 text-[21px] font-bold tracking-[-0.02em] text-ink">{t('gWeightedTitle')}</h3>
        <p>{t('gWeighted')}</p>
        <p className="card p-6 text-[16px] text-ink-2 md:px-8">
          <strong className="mb-1 block text-ink">{t('example')}</strong>
          {t('gExample')}
        </p>
      </ToolSection>

      <ToolSection id="scales" title={t('gScalesTitle')}>
        <p>{t('gScalesLead')}</p>
        <ul className="flex flex-col gap-2.5">
          {SCALES.map((key) => (
            <li key={key} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-ink-3" />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </ToolSection>

      <FaqSection title={t('faqTitle')} faq={faq} />
      <ToolCta locale={locale} />
    </>
  );
}
