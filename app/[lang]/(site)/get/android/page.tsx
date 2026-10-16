import type { Metadata } from 'next';
import AppInstallGuide from '../AppInstallGuide';
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
    title: t('androidMetaTitle'),
    description: t('androidMetaDescription'),
    keywords: pageKeywords(locale, [
      'POKYH Android', 'POKYH installieren Android', 'POKYH App Android',
      'Schulapp Android LBS Brixen', 'POKYH APK',
    ]),
    alternates: localeAlternates(SITE_URL, locale, '/get/android'),
    openGraph: {
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
  return <AppInstallGuide platform="android" locale={await routeLocale(params)} />;
}
