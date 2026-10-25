import type { Metadata } from 'next';
import AbsenceCalculator from '@/components/tools/AbsenceCalculator';
import {
  FaqSection, TOOLS_PATH, ToolCta, ToolHeader, ToolSection, calculatorApp, toolMetadata,
} from '@/components/tools/ToolPage';
import PageJsonLd, { faqEntities } from '@/components/site/PageJsonLd';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localizedUrl } from '@/lib/i18n/seo';
import { SITE_URL } from '@/lib/site-url';
import { toolsDict, ABSENCE_FAQ_COUNT, type ToolsKey } from '@/lib/i18n/dictionaries/tools';

// Absences in percent: the calculator first, then how the share is worked
// out, the three-quarter rule in Italy with its sources, other countries and
// the common questions.

const PATH = `${TOOLS_PATH}/absences`;
type PageProps = { params: Promise<{ lang: string }> };

const KEYWORDS = {
  de: ['Abwesenheiten berechnen', 'Fehlstunden Prozent', 'Fehlstunden Rechner', 'Abwesenheiten Prozent Schule', 'wie viel darf ich fehlen', 'Drei-Viertel-Regel Schule', 'Fehlstunden Südtirol'],
  it: ['calcolo assenze scuola', 'percentuale assenze', 'calcolo ore di assenza', 'limite assenze 25%', 'monte ore assenze', 'quante ore di assenza posso fare', 'validità anno scolastico'],
  en: ['school absence calculator', 'absence percentage calculator', 'attendance percentage school', 'how many hours can I miss', 'three-quarter attendance rule Italy'],
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  return toolMetadata(locale, PATH, { title: 'aMetaTitle', description: 'aMetaDescription', ogTitle: 'aOgTitle', ogDescription: 'aOgDescription' }, KEYWORDS);
}

export default async function AbsencesToolPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(toolsDict, locale);
  const href = (path: string) => localizedUrl('', locale, path);
  const faq = Array.from({ length: ABSENCE_FAQ_COUNT }, (_, i) => ({ q: t(`aq${i + 1}` as ToolsKey), a: t(`aa${i + 1}` as ToolsKey), id: `aq${i + 1}` }));

  return (
    <>
      <PageJsonLd
        locale={locale}
        path={PATH}
        type="FAQPage"
        name={t('aMetaTitle')}
        description={t('aMetaDescription')}
        trail={[{ name: t('hBreadcrumb'), path: TOOLS_PATH }, { name: t('aBreadcrumb'), path: PATH }]}
        main={faqEntities(faq, localizedUrl(SITE_URL, locale, PATH))}
        extra={[calculatorApp(locale, PATH, t('aBreadcrumb'), t('aMetaDescription'))]}
      />
      <ToolHeader
        title={t('aTitle')}
        lead={t('aLead')}
        crumbs={[{ label: 'POKYH', href: href('/') }, { label: t('hBreadcrumb'), href: href(TOOLS_PATH) }, { label: t('aBreadcrumb') }]}
      />
      <div className="wrap rise pb-20 md:pb-28 [animation-delay:180ms]">
        <AbsenceCalculator />
      </div>

      <ToolSection id="how" title={t('aHowTitle')}>
        <p>{t('aHow')}</p>
        <p className="card p-6 text-[16px] text-ink-2 md:px-8">
          <strong className="mb-1 block text-ink">{t('example')}</strong>
          {t('aExample')}
        </p>
      </ToolSection>

      <ToolSection id="rule" title={t('aRuleTitle')}>
        <p>{t('aRule')}</p>
        <p className="text-[15px] text-ink-3">{t('aRuleSource')}</p>
      </ToolSection>

      <ToolSection id="else" title={t('aElseTitle')}>
        <p>{t('aElse')}</p>
      </ToolSection>

      <FaqSection title={t('faqTitle')} faq={faq} />
      <ToolCta locale={locale} />
    </>
  );
}
