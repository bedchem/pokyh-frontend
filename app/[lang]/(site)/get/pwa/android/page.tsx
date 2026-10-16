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
    title: t('pwaAndroidMetaTitle'),
    description: t('pwaAndroidMetaDescription'),
    keywords: pageKeywords(locale, [
      'POKYH PWA Android', 'POKYH installieren Android', 'Progressive Web App Android',
      'POKYH Chrome Android', 'Schulapp PWA LBS Brixen', 'POKYH zum Startbildschirm',
    ]),
    alternates: localeAlternates(SITE_URL, locale, '/get/pwa/android'),
    openGraph: {
      title: t('pwaAndroidOgTitle'),
      description: t('pwaAndroidOgDescription'),
      url: localizedUrl(SITE_URL, locale, '/get/pwa/android'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('pwaAndroidOgTitle'),
      description: t('pwaAndroidOgDescription'),
    },
    robots: { index: true, follow: true },
  };
}

export default async function PwaAndroidPage({ params }: PageProps) {
  return <PwaInstallGuide platform="android" locale={await routeLocale(params)} />;
}
