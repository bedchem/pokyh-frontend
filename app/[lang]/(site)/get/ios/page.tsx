import type { Metadata } from 'next';
import AppInstallGuide from '../AppInstallGuide';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords, ogImage } from '@/lib/i18n/seo';
import { getDict } from '@/lib/i18n/dictionaries/get';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import PageJsonLd, { mobileApp } from '@/components/site/PageJsonLd';
import { RELEASES } from '../AppInstallGuide';
import { SITE_URL } from '@/lib/site-url';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(getDict, locale);
  return {
    title: t('iosMetaTitle'),
    description: t('iosMetaDescription'),
    keywords: pageKeywords(locale),
    alternates: localeAlternates(SITE_URL, locale, '/get/ios'),
    openGraph: {
      images: ogImage(locale),
      title: t('iosOgTitle'),
      description: t('iosOgDescription'),
      url: localizedUrl(SITE_URL, locale, '/get/ios'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
    robots: { index: true, follow: true },
  };
}

export default async function IosInstallPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(getDict, locale);
  return (
    <>
      <PageJsonLd
        locale={locale}
        path="/get/ios"
        name={t('iosMetaTitle')}
        description={t('iosMetaDescription')}
        trail={[{ name: makeT(siteDict, locale)('navGet'), path: '/get' }, { name: t('iosTitle'), path: '/get/ios' }]}
        main={mobileApp({
          locale,
          path: '/get/ios',
          name: `POKYH ${t('iosTitle')}`,
          description: t('iosMetaDescription'),
          operatingSystem: 'iOS',
          downloadUrl: RELEASES.ios,
        })}
      />
      <AppInstallGuide platform="ios" locale={locale} />
    </>
  );
}
