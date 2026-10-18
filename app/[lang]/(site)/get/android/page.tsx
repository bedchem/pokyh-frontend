import type { Metadata } from 'next';
import AppInstallGuide from '../AppInstallGuide';
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
    title: t('androidMetaTitle'),
    description: t('androidMetaDescription'),
    keywords: pageKeywords(locale),
    alternates: localeAlternates(SITE_URL, locale, '/get/android'),
    openGraph: {
      images: ogImage(locale),
      title: t('androidOgTitle'),
      description: t('androidOgDescription'),
      url: localizedUrl(SITE_URL, locale, '/get/android'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
    robots: { index: true, follow: true },
  };
}

export default async function AndroidInstallPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(getDict, locale);
  return (
    <>
      <PageJsonLd
        locale={locale}
        path="/get/android"
        name={t('androidMetaTitle')}
        description={t('androidMetaDescription')}
        trail={[{ name: makeT(siteDict, locale)('navGet'), path: '/get' }, { name: t('androidTitle'), path: '/get/android' }]}
      />
      <AppInstallGuide platform="android" locale={locale} />
    </>
  );
}
