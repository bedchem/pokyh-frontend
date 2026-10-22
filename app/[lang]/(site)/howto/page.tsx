import type { Metadata } from 'next';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords, ogImage } from '@/lib/i18n/seo';
import { howtoDict } from '@/lib/i18n/dictionaries/howto';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import PageJsonLd from '@/components/site/PageJsonLd';
import PageIntro, { TONE } from '@/components/site/PageIntro';
import RevealScope from '@/components/site/RevealScope';
import CtaBand from '@/components/site/CtaBand';
import CodeBlock from '@/components/site/CodeBlock';
import { SITE_URL } from '@/lib/site-url';
import { REPO_URLS } from '@/lib/site-links';

const FRONTEND_REPO = REPO_URLS.web;
const BACKEND_REPO = REPO_URLS.backend;

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
      images: ogImage(locale),
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
      <PageJsonLd locale={locale} path="/howto" type="WebPage" name={t('metaTitle')} description={t('metaDescription')} trail={[{ name: makeT(siteDict, locale)('navSelfHost'), path: '/howto' }]} />
      <PageIntro title={t('title')} lead={t('lead')}>
        <div className="flex flex-wrap gap-3">
          {[
            { label: t('repoFrontend'), href: FRONTEND_REPO },
            { label: t('repoBackend'), href: BACKEND_REPO },
          ].map((r, i) => (
            <a key={r.href} href={r.href} target="_blank" rel="noopener noreferrer" className={`key key-lg ${i ? 'key-lilac' : ''}`}>
              {r.label}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </PageIntro>

      <RevealScope>
        <section aria-labelledby="steps-title" className="wrap pb-20 md:pb-28">
          <h2 id="steps-title" data-reveal className="text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[1.04] tracking-[-0.045em] text-ink">{t('stepsTitle')}</h2>
          <ol className="mt-8 grid gap-4">
            {steps.map((s, i) => (
              <li key={s.title} data-reveal className="card grid gap-5 p-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] md:gap-10 md:p-9">
                <div className="flex gap-4">
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-[15px] font-bold text-[var(--paper)] tnum">{i + 1}</span>
                  <div>
                    <h3 className="text-[22px] font-extrabold tracking-[-0.03em] text-ink md:text-[26px]">{s.title}</h3>
                    <p className="mt-1.5 text-[16px] leading-[1.6] text-ink-2 md:text-[17px]">{s.body}</p>
                  </div>
                </div>
                <CodeBlock code={s.code} copyLabel={t('copy')} copiedLabel={t('copied')} />
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="needs-title" className="wrap pb-24 md:pb-32">
          <div className={`squircle grid gap-8 rounded-[28px] p-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:rounded-[40px] md:p-12 ${TONE.butter}`}>
            <h2 id="needs-title" data-reveal className="text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[1.04] tracking-[-0.045em]">
              {t('needsTitle')}
            </h2>
            <ul className="flex flex-col gap-3">
              {[t('n1'), t('n2'), t('n3')].map((n) => (
                <li key={n} data-reveal className="flex gap-3 text-[17px] font-semibold leading-[1.45] md:text-[19px]">
                  <span aria-hidden="true" className="mt-[0.55em] block size-2 shrink-0 rounded-full bg-current" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </RevealScope>

      <CtaBand title={t('ctaTitle')} lead={t('ctaLead')} primary={{ label: t('ctaLogin'), href: '/login' }} tone="periwinkle" />
    </>
  );
}
