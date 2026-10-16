import type { Metadata } from 'next';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { howtoDict } from '@/lib/i18n/dictionaries/howto';
import PageIntro from '@/components/site/PageIntro';
import RevealScope from '@/components/site/RevealScope';
import CtaBand from '@/components/site/CtaBand';
import CodeBlock from '@/components/site/CodeBlock';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';
const FRONTEND_REPO = 'https://github.com/bedchem/pokyh-frontend';
const BACKEND_REPO = 'https://github.com/bedchem/pokyh-backend';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(howtoDict, locale);
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: pageKeywords(locale, ['POKYH selbst hosten', 'POKYH Open Source', 'POKYH GitHub', 'Schulapp Open Source', 'Next.js Schulapp']),
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

export default async function HowtoPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(howtoDict, locale);

  const steps = [
    { title: t('s1Title'), body: t('s1Body'), code: `git clone ${FRONTEND_REPO}.git\ncd pokyh-frontend` },
    { title: t('s2Title'), body: t('s2Body'), code: 'npm install' },
    { title: t('s3Title'), body: t('s3Body'), code: `cp .env.example .env.local\n${t('s3Comment')}` },
    { title: t('s4Title'), body: t('s4Body'), code: `npm run dev\n\n${t('s4Comment')}\nnpm run build && npm start` },
  ];

  return (
    <>
      <PageIntro title={t('title')} lead={t('lead')}>
        <ul className="flex flex-col border-b border-line">
          {[
            { label: t('repoFrontend'), href: FRONTEND_REPO },
            { label: t('repoBackend'), href: BACKEND_REPO },
          ].map((r) => (
            <li key={r.href} className="border-t border-line">
              <a href={r.href} target="_blank" rel="noopener noreferrer" className="group flex items-baseline justify-between gap-4 py-3.5">
                <span className="text-[16px] font-semibold text-ink">{r.label}</span>
                <span className="mono text-[13px] text-ink-2 group-hover:text-accent-ink transition-colors">
                  {r.href.replace('https://', '')} ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </PageIntro>

      <RevealScope>
        <section aria-labelledby="steps-title" className="bg-canvas">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10 pb-24 md:pb-36">
            <h2 id="steps-title" data-reveal className="text-[15px] font-bold text-ink-2">{t('stepsTitle')}</h2>
            <ol className="mt-6">
              {steps.map((s, i) => (
                <li key={s.title} data-reveal className="grid gap-5 border-t border-line py-10 lg:grid-cols-12 lg:gap-10">
                  <span className="mono text-[14px] text-ink-3 lg:col-span-1 lg:pt-2">{String(i + 1).padStart(2, '0')}</span>
                  <div className="lg:col-span-4">
                    <h3 className="text-[26px] md:text-[32px] font-extrabold tracking-[-0.035em] text-ink">{s.title}</h3>
                    <p className="mt-2 text-[16px] md:text-[17px] leading-[1.6] text-ink-2">{s.body}</p>
                  </div>
                  <div className="lg:col-span-7">
                    <CodeBlock code={s.code} copyLabel={t('copy')} copiedLabel={t('copied')} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="needs-title" className="bg-butter text-ink">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10 py-20 md:py-28 grid gap-10 lg:grid-cols-12">
            <h2 id="needs-title" data-reveal className="lg:col-span-4 font-extrabold leading-[0.98] tracking-[-0.045em] text-[clamp(32px,7vw,48px)] lg:text-[clamp(40px,3.6vw,60px)]">
              {t('needsTitle')}
            </h2>
            <ul className="lg:col-span-7 lg:col-start-6 border-b border-butter-ink/25">
              {[t('n1'), t('n2'), t('n3')].map((n) => (
                <li key={n} data-reveal className="border-t border-butter-ink/25 py-5 text-[18px] md:text-[21px] font-semibold tracking-[-0.015em]">
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </RevealScope>

      <CtaBand title={t('ctaTitle')} lead={t('ctaLead')} primary={{ label: t('ctaLogin'), href: '/login' }} />
    </>
  );
}
