import type { Metadata } from 'next';
import Link from 'next/link';
import { ChartBar, ClockCountdown } from '@phosphor-icons/react/dist/ssr';
import { TONE } from '@/components/site/PageIntro';
import PageJsonLd, { pageList } from '@/components/site/PageJsonLd';
import { TOOLS_PATH, ToolCta, ToolHeader, toolMetadata } from '@/components/tools/ToolPage';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localizedUrl } from '@/lib/i18n/seo';
import { toolsDict, type ToolsKey } from '@/lib/i18n/dictionaries/tools';

// The calculators for school, free and without an account.

type PageProps = { params: Promise<{ lang: string }> };

const KEYWORDS = {
  de: ['Rechner Schule', 'Schulrechner', 'Notenrechner', 'Fehlstunden Rechner'],
  it: ['calcolatori scuola', 'calcolo media voti', 'calcolo assenze'],
  en: ['school calculators', 'grade average calculator', 'absence calculator'],
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  return toolMetadata(locale, TOOLS_PATH, { title: 'hMetaTitle', description: 'hMetaDescription' }, KEYWORDS);
}

const TOOLS: { path: string; title: ToolsKey; text: ToolsKey; Icon: typeof ChartBar; tone: keyof typeof TONE }[] = [
  { path: `${TOOLS_PATH}/grade-average`, title: 'hGradeTitle', text: 'hGradeText', Icon: ChartBar, tone: 'sage' },
  { path: `${TOOLS_PATH}/absences`, title: 'hAbsTitle', text: 'hAbsText', Icon: ClockCountdown, tone: 'blush' },
];

export default async function ToolsPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(toolsDict, locale);
  const href = (path: string) => localizedUrl('', locale, path);

  return (
    <>
      <PageJsonLd
        locale={locale}
        path={TOOLS_PATH}
        type="CollectionPage"
        name={t('hMetaTitle')}
        description={t('hMetaDescription')}
        trail={[{ name: t('hBreadcrumb'), path: TOOLS_PATH }]}
        main={pageList(locale, TOOLS.map(({ path, title }) => ({ path, name: t(title) })))}
      />
      <ToolHeader title={t('hTitle')} lead={t('hLead')} crumbs={[{ label: 'POKYH', href: href('/') }, { label: t('hBreadcrumb') }]} />
      <section className="wrap pb-20 md:pb-28">
        <ul className="grid gap-4 md:grid-cols-2">
          {TOOLS.map(({ path, title, text, Icon, tone }) => (
            <li key={path}>
              <Link href={href(path)} className="card card-hover group flex h-full flex-col gap-5 p-7 md:p-9">
                <span aria-hidden="true" className={`grid size-14 place-items-center rounded-[18px] ${TONE[tone]}`}>
                  <Icon size={26} weight="bold" />
                </span>
                <h2 className="text-[clamp(24px,2.6vw,32px)] font-extrabold leading-[1.1] tracking-[-0.035em]">{t(title)}</h2>
                <p className="text-[16px] leading-[1.6] text-ink-2 md:text-[17px]">{t(text)}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-2 text-[15px] font-bold text-[var(--accent-ink)]">
                  {t('hOpen')}
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 px-2 text-[14px] text-ink-3">{t('privacy')}</p>
      </section>
      <ToolCta locale={locale} />
    </>
  );
}
