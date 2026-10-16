import type { Metadata } from 'next';
import Link from 'next/link';
import { AndroidLogo, AppleLogo, ArrowRight, ArrowUpRight, Globe, DeviceMobile } from '@phosphor-icons/react/ssr';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { getDict } from '@/lib/i18n/dictionaries/get';
import PageIntro from '@/components/site/PageIntro';
import RevealScope from '@/components/site/RevealScope';
import { RELEASES } from './AppInstallGuide';

type PageProps = { params: Promise<{ lang: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(getDict, locale);
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: pageKeywords(locale, [
      'POKYH App', 'POKYH installieren', 'POKYH iOS', 'POKYH Android',
      'POKYH APK', 'POKYH Web', 'LBS Brixen App', 'Schulapp installieren',
      'WebUntis App Brixen', 'POKYH herunterladen',
    ]),
    alternates: localeAlternates(SITE_URL, locale, '/get'),
    openGraph: {
      title: 'POKYH – Web & App',
      description: t('ogDescription'),
      url: localizedUrl(SITE_URL, locale, '/get'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: 'POKYH – Web & App',
      description: t('twitterDescription'),
    },
    robots: { index: true, follow: true },
  };
}

export default async function GetPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(getDict, locale);
  const href = (path: string) => `/${locale}${path}${path.endsWith('/') ? '' : '/'}`;
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'POKYH', item: localizedUrl(SITE_URL, locale, '/') },
      { '@type': 'ListItem', position: 2, name: 'Get POKYH', item: localizedUrl(SITE_URL, locale, '/get') },
    ],
  };

  const native = [
    { icon: AndroidLogo, title: t('androidTitle'), body: t('androidBody'), guide: href('/get/android'), releases: RELEASES.android },
    { icon: AppleLogo, title: t('iosTitle'), body: t('iosBody'), guide: href('/get/ios'), releases: RELEASES.ios },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />
      <PageIntro title={t('title')} lead={t('lead')} />

      <RevealScope>
        <section className="bg-canvas">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10 pb-24 md:pb-32">
            {/* Browser */}
            <div data-reveal className="grid gap-6 border-t-2 border-ink py-10 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-1"><Globe size={40} className="text-ink" aria-hidden="true" /></div>
              <div className="lg:col-span-6">
                <p className="text-[14px] font-bold text-accent-ink">{t('recommended')}</p>
                <h2 className="mt-1 text-ink font-extrabold tracking-[-0.045em] leading-[1] text-[clamp(36px,8vw,52px)] lg:text-[clamp(44px,4.4vw,76px)]">{t('webTitle')}</h2>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-6">
                <p className="text-[17px] md:text-[19px] leading-[1.55] text-ink-2">{t('webBody')}</p>
                <Link
                  href={href('/login')}
                  className="group inline-flex h-14 w-fit items-center gap-2.5 rounded-full bg-accent px-7 text-[16px] font-semibold text-on-accent press transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_88%,#000)]"
                >
                  {t('webCta')}
                  <ArrowRight size={18} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Native apps */}
            {native.map(({ icon: Icon, title, body, guide, releases }) => (
              <div key={title} data-reveal className="grid gap-6 border-t border-line py-10 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-1"><Icon size={40} className="text-ink" aria-hidden="true" /></div>
                <h2 className="lg:col-span-6 text-ink font-extrabold tracking-[-0.045em] leading-[1] text-[clamp(32px,7vw,44px)] lg:text-[clamp(40px,3.6vw,60px)]">{title}</h2>
                <div className="lg:col-span-5 flex flex-col gap-5">
                  <p className="text-[17px] leading-[1.55] text-ink-2">{body}</p>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <Link href={guide} className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-canvas press">
                      {t('guide')}
                      <ArrowRight size={16} weight="bold" aria-hidden="true" />
                    </Link>
                    <a href={releases} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink underline-offset-[6px] decoration-2 hover:underline">
                      {t('releases')}
                      <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {/* PWA */}
            <div data-reveal className="grid gap-6 border-y border-line py-10 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-1"><DeviceMobile size={40} className="text-ink" aria-hidden="true" /></div>
              <h2 className="lg:col-span-6 text-ink font-extrabold tracking-[-0.045em] leading-[1] text-[clamp(32px,7vw,44px)] lg:text-[clamp(40px,3.6vw,60px)]">{t('pwaTitle')}</h2>
              <div className="lg:col-span-5 flex flex-col gap-5">
                <p className="text-[17px] leading-[1.55] text-ink-2">{t('pwaBody')}</p>
                <ul className="flex flex-col border-b border-line">
                  {[
                    { label: t('pwaIos'), to: href('/get/pwa/ios') },
                    { label: t('pwaAndroid'), to: href('/get/pwa/android') },
                  ].map((o) => (
                    <li key={o.to} className="border-t border-line">
                      <Link href={o.to} className="group flex items-center justify-between py-4 text-[17px] font-semibold text-ink">
                        {o.label}
                        <ArrowRight size={18} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="pwa-what" className="bg-blush text-ink">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10 py-20 md:py-28 grid gap-8 lg:grid-cols-12">
            <h2 id="pwa-what" data-reveal className="lg:col-span-5 font-extrabold leading-[0.98] tracking-[-0.045em] text-[clamp(32px,7vw,48px)] lg:text-[clamp(40px,3.6vw,64px)]">
              {t('pwaWhatTitle')}
            </h2>
            <p data-reveal className="lg:col-span-6 lg:col-start-7 text-[18px] md:text-[21px] leading-[1.55] text-blush-ink">{t('pwaWhatBody')}</p>
          </div>
        </section>
      </RevealScope>
    </>
  );
}
