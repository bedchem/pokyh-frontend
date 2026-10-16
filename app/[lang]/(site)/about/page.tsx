import type { Metadata } from 'next';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { aboutDict, type AboutKey } from '@/lib/i18n/dictionaries/about';
import PageIntro from '@/components/site/PageIntro';
import RevealScope from '@/components/site/RevealScope';
import CtaBand from '@/components/site/CtaBand';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(aboutDict, locale);
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: pageKeywords(locale, [
      'POKYH Story', 'POKYH Team', 'POKYH Entwickler', 'POKYH Open Source',
      'bedchem GitHub', 'Schulapp selbst gebaut',
      'Tschuggmall App', 'BFS Tschuggmall App', 'Christian Josef Tschuggmall App',
      'LBS Brixen App entwickelt', 'Open Source Schulapp Südtirol',
      'Schüler entwickeln App Brixen',
    ]),
    alternates: localeAlternates(SITE_URL, locale, '/about'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: localizedUrl(SITE_URL, locale, '/about'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
  };
}

const MISSING: { title: AboutKey; body: AboutKey }[] = [
  { title: 'm1Title', body: 'm1Body' },
  { title: 'm2Title', body: 'm2Body' },
  { title: 'm3Title', body: 'm3Body' },
];

const BUILT: { title: AboutKey; why: AboutKey }[] = [
  { title: 'fTimetable', why: 'fTimetableWhy' },
  { title: 'fGrades', why: 'fGradesWhy' },
  { title: 'fMensa', why: 'fMensaWhy' },
  { title: 'fMessages', why: 'fMessagesWhy' },
  { title: 'fAbsences', why: 'fAbsencesWhy' },
  { title: 'fReminders', why: 'fRemindersWhy' },
  { title: 'fTodos', why: 'fTodosWhy' },
];

const STACK: { name: string; role: AboutKey }[] = [
  { name: 'Next.js', role: 'sWeb' },
  { name: 'TypeScript', role: 'sTypes' },
  { name: 'Express', role: 'sApi' },
  { name: 'Prisma · MySQL', role: 'sDb' },
  { name: 'Server-Sent Events', role: 'sRealtime' },
  { name: 'JWT', role: 'sAuth' },
  { name: 'three.js · GSAP', role: 'sMotion' },
  { name: 'Kotlin · Swift', role: 'sNative' },
];

const TEAM = [
  { name: 'Nexor', handle: 'plattnericus' },
  { name: 'Ryhox', handle: 'Ryhox' },
];

export default async function AboutPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(aboutDict, locale);

  return (
    <>
      <PageIntro title={t('title')} lead={t('lead')} />

      <RevealScope>
        <section aria-labelledby="missing-title" className="bg-canvas">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10 pb-24 md:pb-36">
            <h2 id="missing-title" data-reveal className="text-[15px] font-bold text-ink-2">{t('missingTitle')}</h2>
            <ol className="mt-6">
              {MISSING.map((m, i) => (
                <li key={m.title} data-reveal className="grid gap-4 border-t border-line py-10 md:py-14 lg:grid-cols-12 lg:gap-10">
                  <span className="mono text-[14px] text-ink-3 lg:col-span-1 lg:pt-3">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="lg:col-span-7 text-ink font-extrabold leading-[1] tracking-[-0.045em] text-[clamp(30px,7vw,44px)] lg:text-[clamp(40px,4vw,68px)]">
                    {t(m.title)}
                  </h3>
                  <p className="lg:col-span-4 lg:pt-3 text-[17px] md:text-[19px] leading-[1.55] text-ink-2">{t(m.body)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="built-title" className="bg-canvas">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10 pb-24 md:pb-36 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <h2 id="built-title" data-reveal className="text-ink font-extrabold leading-[0.98] tracking-[-0.045em] text-[clamp(36px,8vw,52px)] lg:text-[clamp(44px,4vw,68px)]">
                  {t('builtTitle')}
                </h2>
                <p data-reveal className="mt-5 text-[17px] text-ink-2">{t('builtLead')}</p>
              </div>
            </div>
            <ul className="lg:col-span-7 lg:col-start-6 border-b border-line">
              {BUILT.map((f) => (
                <li key={f.title} data-reveal className="grid gap-2 border-t border-line py-7 md:grid-cols-[14rem_1fr] md:gap-8">
                  <h3 className="text-[21px] md:text-[24px] font-bold tracking-[-0.02em] text-ink">{t(f.title)}</h3>
                  <p className="text-[16px] md:text-[17px] leading-[1.6] text-ink-2">{t(f.why)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="stack-title" className="bg-sage text-ink">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10 py-24 md:py-36 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 id="stack-title" data-reveal className="font-extrabold leading-[0.98] tracking-[-0.045em] text-[clamp(36px,8vw,52px)] lg:text-[clamp(44px,4vw,68px)]">
                {t('stackTitle')}
              </h2>
              <p data-reveal className="mt-6 max-w-[42ch] text-[17px] md:text-[19px] leading-[1.6] text-sage-ink">{t('stackBody')}</p>
            </div>
            <ul className="lg:col-span-6 lg:col-start-7 border-b border-sage-ink/25">
              {STACK.map((s) => (
                <li key={s.name} data-reveal className="flex items-baseline justify-between gap-6 border-t border-sage-ink/25 py-4">
                  <span className="text-[19px] md:text-[22px] font-bold tracking-[-0.02em]">{s.name}</span>
                  <span className="mono text-[13px] md:text-[14px] text-sage-ink">{t(s.role)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="team-title" className="bg-canvas">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10 py-24 md:py-36 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 id="team-title" data-reveal className="text-ink font-extrabold leading-[0.98] tracking-[-0.045em] text-[clamp(36px,8vw,52px)] lg:text-[clamp(44px,4vw,68px)]">
                {t('teamTitle')}
              </h2>
              <p data-reveal className="mt-6 max-w-[36ch] text-[17px] md:text-[19px] leading-[1.6] text-ink-2">{t('teamBody')}</p>
              <a
                data-reveal
                href="https://github.com/bedchem"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-6 text-[15px] font-semibold text-canvas press"
              >
                {t('github')} <span aria-hidden="true" className="ml-2">↗</span>
              </a>
            </div>
            <ul className="lg:col-span-6 lg:col-start-7 border-b border-line">
              {TEAM.map((m) => (
                <li key={m.handle} data-reveal className="border-t border-line">
                  <a
                    href={`https://github.com/${m.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-baseline justify-between gap-6 py-6"
                  >
                    <span className="text-ink font-extrabold leading-none tracking-[-0.05em] text-[clamp(48px,12vw,72px)] lg:text-[clamp(64px,6vw,112px)] transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-3">
                      {m.name}
                    </span>
                    <span className="mono text-[14px] text-ink-3 group-hover:text-ink transition-colors">@{m.handle} ↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </RevealScope>

      <CtaBand
        title={t('ctaTitle')}
        lead={t('ctaLead')}
        primary={{ label: t('ctaLogin'), href: '/login' }}
        secondary={{ label: t('ctaCompare'), href: '/comparison' }}
      />
    </>
  );
}
