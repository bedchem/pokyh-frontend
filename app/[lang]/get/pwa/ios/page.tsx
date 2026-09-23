import type { Metadata } from 'next';
import PwaInstallGuide from '../../PwaInstallGuide';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { getDict } from '@/lib/i18n/dictionaries/get';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(getDict, locale);
  return {
    title: t('pwaIosMetaTitle'),
    description: t('pwaIosMetaDescription'),
    keywords: pageKeywords(locale, [
      'POKYH PWA iOS', 'POKYH PWA iPhone', 'Progressive Web App iPhone',
      'POKYH Safari installieren', 'Schulapp PWA LBS Brixen', 'POKYH zum Home-Bildschirm',
    ]),
    alternates: localeAlternates(SITE_URL, locale, '/get/pwa/ios'),
    openGraph: {
      title: t('pwaIosOgTitle'),
      description: t('pwaIosOgDescription'),
      url: localizedUrl(SITE_URL, locale, '/get/pwa/ios'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('pwaIosOgTitle'),
      description: t('pwaIosOgDescription'),
    },
    robots: { index: true, follow: true },
  };
}

export default async function PwaIosPage({ params }: PageProps) {
  return <PwaInstallGuide platform="ios" locale={await routeLocale(params)} />;
}
