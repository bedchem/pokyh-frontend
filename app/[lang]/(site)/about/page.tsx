import type { Metadata } from 'next';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { aboutDict, type AboutKey } from '@/lib/i18n/dictionaries/about';
import PageIntro, { TONE, type SiteTone } from '@/components/site/PageIntro';
import RevealScope from '@/components/site/RevealScope';
import CtaBand from '@/components/site/CtaBand';
import GithubCard from '@/components/site/GithubCard';

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

const MISSING: { title: AboutKey; body: AboutKey; tone: SiteTone }[] = [
  { title: 'm1Title', body: 'm1Body', tone: 'butter' },
  { title: 'm2Title', body: 'm2Body', tone: 'blush' },
  { title: 'm3Title', body: 'm3Body', tone: 'periwinkle' },
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

const TEAM: { name: string; handle: string; tone: SiteTone }[] = [
  { name: 'Nexor', handle: 'plattnericus', tone: 'periwinkle' },
  { name: 'Ryhox', handle: 'Ryhox', tone: 'sage' },
];

/** One chapter of the story: a numbered marker on the line, then the text. */
function Chapter({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <li data-reveal className="relative pb-16 pl-12 last:pb-0 md:pb-24 md:pl-20">
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 grid size-8 place-items-center rounded-full bg-ink text-[14px] font-bold text-[var(--paper)] tnum md:size-11 md:text-[16px]"
      >
        {n}
      </span>
      <h2 className="max-w-[20ch] pt-0.5 md:pt-1 text-[clamp(30px,4vw,52px)] font-extrabold leading-[1.02] tracking-[-0.045em]">{title}</h2>
      {children}
    </li>
  );
}

export default async function AboutPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(aboutDict, locale);

  return (
    <>
      <PageIntro title={t('title')} lead={t('lead')} />

      <RevealScope>
        {/* The story, along one line */}
        <section className="wrap pb-24 md:pb-36">
          <ol className="relative max-w-[920px] before:absolute before:bottom-6 before:left-4 before:top-6 before:w-px before:bg-line md:before:left-[22px]">
            <Chapter n={1} title={t('ch1Title')}>
              <p className="mt-5 max-w-[56ch] text-[18px] leading-[1.7] text-ink-2 md:text-[20px]">{t('ch1Body')}</p>
            </Chapter>

            <Chapter n={2} title={t('missingTitle')}>
              <p className="mt-5 text-[18px] leading-[1.7] text-ink-2 md:text-[20px]">{t('missingBody')}</p>
              <ul className="mt-8 grid gap-3 md:gap-4">
                {MISSING.map((m) => (
                  <li key={m.title} className={`squircle rounded-[22px] p-6 md:rounded-[30px] md:p-8 ${TONE[m.tone]}`}>
                    <h3 className="text-[21px] font-bold leading-[1.2] tracking-[-0.02em] md:text-[24px]">{t(m.title)}</h3>
                    <p className="mt-2 max-w-[58ch] text-[16px] leading-[1.6] opacity-85 md:text-[17px]">{t(m.body)}</p>
                  </li>
                ))}
              </ul>
            </Chapter>

            <Chapter n={3} title={t('ch3Title')}>
              <p className="mt-5 max-w-[56ch] text-[18px] leading-[1.7] text-ink-2 md:text-[20px]">{t('ch3Body')}</p>
            </Chapter>

            <Chapter n={4} title={t('builtTitle')}>
              <p className="mt-5 text-[18px] leading-[1.7] text-ink-2 md:text-[20px]">{t('builtLead')}</p>
              <ul className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
                {BUILT.map((f) => (
                  <li key={f.title} className="border-t border-line pt-5">
                    <h3 className="text-[19px] font-bold tracking-[-0.015em] md:text-[21px]">{t(f.title)}</h3>
                    <p className="mt-1.5 text-[16px] leading-[1.6] text-ink-2">{t(f.why)}</p>
                  </li>
                ))}
              </ul>
            </Chapter>

            <Chapter n={5} title={t('ch5Title')}>
              <p className="mt-5 max-w-[56ch] text-[18px] leading-[1.7] text-ink-2 md:text-[20px]">{t('ch5Body')}</p>
            </Chapter>
          </ol>
        </section>

        {/* The people behind it */}
        <section aria-labelledby="team-title" className="wrap pb-24 md:pb-32">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="team-title" data-reveal className="text-[clamp(36px,5.4vw,76px)] font-extrabold leading-[1.04] tracking-[-0.05em]">
                {t('teamTitle')}
              </h2>
              <p data-reveal className="mt-4 max-w-[40ch] text-[18px] leading-[1.6] text-ink-2 md:text-[19px]">{t('teamBody')}</p>
            </div>
            <a
              data-reveal
              href="https://github.com/bedchem"
              target="_blank"
              rel="noopener noreferrer"
              className="key self-start md:self-auto"
            >
              {t('github')}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-2 md:gap-6">
            {TEAM.map((m) => (
              <div key={m.handle} data-reveal>
                <GithubCard name={m.name} handle={m.handle} tone={m.tone} label={t('profile')} />
              </div>
            ))}
          </div>
        </section>
      </RevealScope>

      <CtaBand
        title={t('ctaTitle')}
        lead={t('ctaLead')}
        primary={{ label: t('ctaLogin'), href: '/login' }}
        secondary={{ label: t('ctaCompare'), href: '/comparison' }}
        tone="butter"
      />
    </>
  );
}
