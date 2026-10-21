import type { Metadata } from 'next';
import PwaInstallGuide from '../../PwaInstallGuide';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords, ogImage } from '@/lib/i18n/seo';
import { getDict } from '@/lib/i18n/dictionaries/get';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import PageJsonLd from '@/components/site/PageJsonLd';
import { SITE_URL } from '@/lib/site-url';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(getDict, locale);
  return {
    title: t('pwaIosMetaTitle'),
    description: t('pwaIosMetaDescription'),
    keywords: pageKeywords(locale),
    alternates: localeAlternates(SITE_URL, locale, '/get/pwa/ios'),
    openGraph: {
      images: ogImage(locale),
      title: t('pwaIosOgTitle'),
      description: t('pwaIosOgDescription'),
      url: localizedUrl(SITE_URL, locale, '/get/pwa/ios'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
    twitter: {
      card: 'summary_large_image',
      images: ogImage(locale).map((i) => i.url),
      title: t('pwaIosOgTitle'),
      description: t('pwaIosOgDescription'),
    },
    robots: { index: true, follow: true },
  };
}

export default async function PwaIosPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(getDict, locale);
  return (
    <>
      <PageJsonLd
        locale={locale}
        path="/get/pwa/ios"
        name={t('pwaIosMetaTitle')}
        description={t('pwaIosMetaDescription')}
        trail={[{ name: makeT(siteDict, locale)('navGet'), path: '/get' }, { name: t('pwaIosOgTitle'), path: '/get/pwa/ios' }]}
      />
      <PwaInstallGuide platform="ios" locale={locale} />
    </>
  );
}
