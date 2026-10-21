import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Books, CalendarDots, ChartBar, ChatsCircle, ClockCountdown, Sparkle } from '@phosphor-icons/react/dist/ssr';
import CtaBand from '@/components/site/CtaBand';
import PageJsonLd, { faqEntities } from '@/components/site/PageJsonLd';
import { TONE } from '@/components/site/PageIntro';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogImage, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { webuntisPageDict, WEBUNTIS_FAQ_COUNT, type WebuntisPageKey } from '@/lib/i18n/dictionaries/webuntisPage';
import { SITE_URL } from '@/lib/site-url';

// For people who search for WebUntis: what POKYH shows from it, how signing in
// works, who it is for, and the questions they ask (also as FAQPage data).
// Server-rendered text, so search engines and AI answers read all of it.

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(webuntisPageDict, locale);
  return {
    title: { absolute: t('metaTitle') },
    description: t('metaDescription'),
    keywords: pageKeywords(locale),
    alternates: localeAlternates(SITE_URL, locale, '/webuntis'),
    openGraph: {
      images: ogImage(locale),
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: localizedUrl(SITE_URL, locale, '/webuntis'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
    twitter: { card: 'summary_large_image', title: t('ogTitle'), description: t('ogDescription'), images: ogImage(locale).map((i) => i.url) },
  };
}

const SEE: { title: WebuntisPageKey; text: WebuntisPageKey; Icon: typeof CalendarDots; tone: keyof typeof TONE }[] = [
  { title: 'sTimetableTitle', text: 'sTimetable', Icon: CalendarDots, tone: 'periwinkle' },
  { title: 'sExamsTitle', text: 'sExams', Icon: Books, tone: 'butter' },
  { title: 'sGradesTitle', text: 'sGrades', Icon: ChartBar, tone: 'sage' },
  { title: 'sAbsencesTitle', text: 'sAbsences', Icon: ClockCountdown, tone: 'blush' },
  { title: 'sMessagesTitle', text: 'sMessages', Icon: ChatsCircle, tone: 'mint' },
  { title: 'sExtraTitle', text: 'sExtra', Icon: Sparkle, tone: 'periwinkle' },
];

export default async function WebuntisPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(webuntisPageDict, locale);
  const href = (path: string) => localizedUrl('', locale, path);
  const faq = Array.from({ length: WEBUNTIS_FAQ_COUNT }, (_, i) => ({
    q: t(`q${i + 1}` as WebuntisPageKey),
    a: t(`a${i + 1}` as WebuntisPageKey),
  }));
  const howTo = {
    '@type': 'HowTo',
    name: t('stepsTitle'),
    step: (['1', '2', '3'] as const).map((n, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: t(`step${n}Title` as WebuntisPageKey),
      text: t(`step${n}` as WebuntisPageKey),
    })),
  };

  return (
    <>
      <PageJsonLd
        locale={locale}
        path="/webuntis"
        type="FAQPage"
        name={t('metaTitle')}
        description={t('metaDescription')}
        trail={[{ name: t('breadcrumb'), path: '/webuntis' }]}
        main={faqEntities(faq)}
        extra={[howTo]}
      />

      <header className="wrap pb-14 pt-36 md:pb-20 md:pt-48">
        <h1 className="rise max-w-[15ch] text-[clamp(42px,7.2vw,96px)] font-extrabold leading-[1.02] tracking-[-0.05em]">{t('title')}</h1>
        <p className="rise mt-7 max-w-[58ch] text-[18px] leading-[1.6] text-ink-2 md:text-[21px] [animation-delay:120ms]">{t('lead')}</p>
        <div className="rise mt-9 flex flex-wrap items-center gap-4 [animation-delay:180ms]">
          <Link href={href('/login')} className="key key-lg key-indigo">
            {t('cta')}
            <span aria-hidden="true" className="key-arrow">→</span>
          </Link>
          <span className="text-[15px] text-ink-3">{t('ctaNote')}</span>
        </div>
      </header>

      <section aria-labelledby="steps" className="wrap pb-20 md:pb-28">
        <h2 id="steps" className="text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[1.04] tracking-[-0.045em]">{t('stepsTitle')}</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {(['1', '2', '3'] as const).map((n) => (
            <li key={n} className="card flex flex-col gap-4 p-7 md:p-8">
              <span aria-hidden="true" className="font-display text-[56px] leading-none text-ink-3">{n}</span>
              <h3 className="text-[21px] font-bold tracking-[-0.02em]">{t(`step${n}Title` as WebuntisPageKey)}</h3>
              <p className="text-[16px] leading-[1.6] text-ink-2">{t(`step${n}` as WebuntisPageKey)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="see" className="wrap pb-20 md:pb-28">
        <h2 id="see" className="text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[1.04] tracking-[-0.045em]">{t('seeTitle')}</h2>
        <p className="mt-4 max-w-[56ch] text-[17px] leading-[1.6] text-ink-2 md:text-[18px]">{t('seeLead')}</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SEE.map(({ title, text, Icon, tone }) => (
            <li key={title} className="card flex flex-col gap-4 p-7">
              <span aria-hidden="true" className={`grid size-12 place-items-center rounded-[16px] ${TONE[tone]}`}>
                <Icon size={24} weight="bold" />
              </span>
              <h3 className="text-[20px] font-bold tracking-[-0.02em]">{t(title)}</h3>
              <p className="text-[16px] leading-[1.6] text-ink-2">{t(text)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="who" className="wrap pb-20 md:pb-28">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <h2 id="who" className="text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[1.04] tracking-[-0.045em]">{t('whoTitle')}</h2>
            <p className="mt-5 text-[17px] leading-[1.65] text-ink-2 md:text-[18px]">{t('whoStudents')}</p>
            <p className="mt-4 text-[17px] leading-[1.65] text-ink-2 md:text-[18px]">{t('whoParents')}</p>
          </div>
          <div>
            <h2 className="text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[1.04] tracking-[-0.045em]">{t('schoolsTitle')}</h2>
            <p className="mt-5 text-[17px] leading-[1.65] text-ink-2 md:text-[18px]">{t('schools')}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq" className="wrap pb-20 md:pb-28">
        <h2 id="faq" className="text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[1.04] tracking-[-0.045em]">{t('faqTitle')}</h2>
        <div className="mt-10 flex flex-col gap-3">
          {faq.map((f) => (
            <details key={f.q} className="card group p-6 md:px-8">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[18px] font-bold tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
                {f.q}
                <ArrowRight size={18} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-4 max-w-[68ch] text-[16px] leading-[1.65] text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 max-w-[68ch] text-[14px] leading-[1.6] text-ink-3">{t('independence')}</p>
      </section>

      <CtaBand
        title={t('endTitle')}
        lead={t('endLead')}
        primary={{ label: t('endCta'), href: '/login' }}
        secondary={{ label: t('endSecondary'), href: '/faq' }}
        tone="periwinkle"
      />
    </>
  );
}
