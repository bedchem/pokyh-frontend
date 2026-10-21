import type { Metadata } from 'next';
import Home from '@/components/home/Home';
import PageJsonLd from '@/components/site/PageJsonLd';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { metaDict } from '@/lib/i18n/dictionaries/meta';
import { localeAlternates, ogLocale, pageKeywords, ogImage } from '@/lib/i18n/seo';
import { SITE_URL } from '@/lib/site-url';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(metaDict, locale);
  return {
    title: { absolute: t('landingTitle') },
    description: t('landingDescription'),
    keywords: pageKeywords(locale),
    alternates: localeAlternates(SITE_URL, locale, '/'),
    openGraph: {
      images: ogImage(locale),
      type: 'website',
      ...ogLocale(locale),
      url: `${SITE_URL}/${locale}/`,
      siteName: 'POKYH',
      title: t('landingOgTitle'),
      description: t('landingOgDescription'),
    },
    twitter: {
      card: 'summary_large_image',
      images: ogImage(locale).map((i) => i.url),
      title: t('landingOgTitle'),
      description: t('landingOgDescription'),
    },
  };
}

export default async function LandingPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(metaDict, locale);

  return (
    <>
      <PageJsonLd locale={locale} path="/" name={t('landingTitle')} description={t('landingDescription')} />
      <Home />
    </>
  );
}
