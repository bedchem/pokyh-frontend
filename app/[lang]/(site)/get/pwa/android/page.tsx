import type { Metadata } from 'next';
import PwaInstallGuide from '../../PwaInstallGuide';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords, ogImage } from '@/lib/i18n/seo';
import { getDict } from '@/lib/i18n/dictionaries/get';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import PageJsonLd from '@/components/site/PageJsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(getDict, locale);
  return {
    title: t('pwaAndroidMetaTitle'),
    description: t('pwaAndroidMetaDescription'),
    keywords: pageKeywords(locale),
    alternates: localeAlternates(SITE_URL, locale, '/get/pwa/android'),
    openGraph: {
      images: ogImage(locale),
      title: t('pwaAndroidOgTitle'),
      description: t('pwaAndroidOgDescription'),
      url: localizedUrl(SITE_URL, locale, '/get/pwa/android'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
    twitter: {
      card: 'summary_large_image',
      images: ogImage(locale).map((i) => i.url),
      title: t('pwaAndroidOgTitle'),
      description: t('pwaAndroidOgDescription'),
    },
    robots: { index: true, follow: true },
  };
}

export default async function PwaAndroidPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(getDict, locale);
  return (
    <>
      <PageJsonLd
        locale={locale}
        path="/get/pwa/android"
        name={t('pwaAndroidMetaTitle')}
        description={t('pwaAndroidMetaDescription')}
        trail={[{ name: makeT(siteDict, locale)('navGet'), path: '/get' }, { name: t('pwaAndroidOgTitle'), path: '/get/pwa/android' }]}
      />
      <PwaInstallGuide platform="android" locale={locale} />
    </>
  );
}
