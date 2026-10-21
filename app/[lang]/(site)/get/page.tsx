import type { Metadata } from 'next';
import Link from 'next/link';
import { AndroidLogo, AppleLogo, ArrowRight, ArrowUpRight, Globe, DeviceMobile } from '@phosphor-icons/react/ssr';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords, ogImage } from '@/lib/i18n/seo';
import PageJsonLd from '@/components/site/PageJsonLd';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import { getDict } from '@/lib/i18n/dictionaries/get';
import PageIntro, { TONE } from '@/components/site/PageIntro';
import RevealScope from '@/components/site/RevealScope';
import { RELEASES } from './AppInstallGuide';
import { SITE_URL } from '@/lib/site-url';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(getDict, locale);
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: pageKeywords(locale),
    alternates: localeAlternates(SITE_URL, locale, '/get'),
    openGraph: {
      images: ogImage(locale),
      title: 'POKYH - Web & App',
      description: t('ogDescription'),
      url: localizedUrl(SITE_URL, locale, '/get'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
    twitter: {
      card: 'summary_large_image',
      images: ogImage(locale).map((i) => i.url),
      title: 'POKYH - Web & App',
      description: t('twitterDescription'),
    },
    robots: { index: true, follow: true },
  };
}

export default async function GetPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(getDict, locale);
  const href = (path: string) => `/${locale}${path}${path.endsWith('/') ? '' : '/'}`;
  const native = [
    { icon: AndroidLogo, title: t('androidTitle'), body: t('androidBody'), guide: href('/get/android'), releases: RELEASES.android, tone: 'sage' as const },
    { icon: AppleLogo, title: t('iosTitle'), body: t('iosBody'), guide: href('/get/ios'), releases: RELEASES.ios, tone: 'blush' as const },
  ];

  return (
    <>
      <PageJsonLd locale={locale} path="/get" name={t('metaTitle')} description={t('metaDescription')} trail={[{ name: makeT(siteDict, locale)('navGet'), path: '/get' }]} />
      <PageIntro title={t('title')} lead={t('lead')} />

      <RevealScope>
        <section className="wrap grid gap-4 pb-20 md:grid-cols-2 md:gap-5 md:pb-28">
          {/* Browser: the way most people start */}
          <div data-reveal className={`squircle flex flex-col gap-8 rounded-[28px] p-7 md:col-span-2 md:flex-row md:items-end md:justify-between md:rounded-[40px] md:p-12 ${TONE.periwinkle}`}>
            <div>
              <Globe size={44} aria-hidden="true" />
              <h2 className="mt-6 text-[clamp(34px,4.6vw,64px)] font-extrabold leading-[1.04] tracking-[-0.05em]">{t('webTitle')}</h2>
              <p className="mt-4 max-w-[46ch] text-[17px] leading-[1.6] opacity-85 md:text-[19px]">{t('webBody')}</p>
            </div>
            <Link href={href('/login')} className="key key-lg self-start md:self-auto">
              {t('webCta')}
              <ArrowRight size={18} weight="bold" className="key-arrow" aria-hidden="true" />
            </Link>
          </div>

          {/* Native apps */}
          {native.map(({ icon: Icon, title, body, guide, releases, tone }) => (
            <div key={title} data-reveal className={`squircle flex flex-col rounded-[28px] p-7 md:rounded-[40px] md:p-10 ${TONE[tone]}`}>
              <Icon size={40} aria-hidden="true" />
              <h2 className="mt-6 text-[clamp(28px,3vw,40px)] font-extrabold leading-[1.02] tracking-[-0.04em]">{title}</h2>
              <p className="mt-3 flex-1 text-[16px] leading-[1.6] opacity-85 md:text-[17px]">{body}</p>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link href={guide} className="key">
                  {t('guide')}
                  <ArrowRight size={16} weight="bold" className="key-arrow" aria-hidden="true" />
                </Link>
                <a href={releases} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[15px] font-semibold underline-offset-[6px] decoration-2 hover:underline">
                  {t('releases')}
                  <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
                </a>
              </div>
            </div>
          ))}
          {/* Web-App on the home screen */}
          <div data-reveal className={`squircle flex flex-col rounded-[28px] p-7 md:col-span-2 md:rounded-[40px] md:p-12 ${TONE.butter}`}>
            <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end">
              <div>
                <DeviceMobile size={44} aria-hidden="true" />
                <h2 className="mt-6 text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[1] tracking-[-0.045em]">{t('pwaTitle')}</h2>
                <p className="mt-4 max-w-[46ch] text-[17px] leading-[1.6] opacity-85 md:text-[18px]">{t('pwaBody')}</p>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: t('pwaIos'), to: href('/get/pwa/ios'), Icon: AppleLogo },
                  { label: t('pwaAndroid'), to: href('/get/pwa/android'), Icon: AndroidLogo },
                ].map(({ label, to, Icon }) => (
                  <Link key={to} href={to} className="key key-lg key-line justify-between">
                    <span className="flex items-center gap-3"><Icon size={20} weight="bold" aria-hidden="true" />{label}</span>
                    <ArrowRight size={18} weight="bold" className="key-arrow" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </section>

        <section aria-labelledby="pwa-what" className="wrap pb-24 md:pb-32">
          <div className="grid gap-6 border-t border-line pt-12 md:grid-cols-[1fr_1.4fr] md:gap-12 md:pt-16">
            <h2 id="pwa-what" data-reveal className="text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[1] tracking-[-0.045em]">
              {t('pwaWhatTitle')}
            </h2>
            <p data-reveal className="max-w-[60ch] text-[18px] leading-[1.7] text-ink-2 md:text-[19px]">{t('pwaWhatBody')}</p>
          </div>
        </section>
      </RevealScope>
    </>
  );
}
