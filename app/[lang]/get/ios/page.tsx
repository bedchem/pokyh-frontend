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
    title: t('iosMetaTitle'),
    description: t('iosMetaDescription'),
    keywords: pageKeywords(locale, [
      'POKYH iPhone', 'POKYH iOS', 'POKYH iPad', 'POKYH installieren iPhone',
      'POKYH IPA', 'Schulapp iPhone LBS Brixen',
    ]),
    alternates: localeAlternates(SITE_URL, locale, '/get/ios'),
    openGraph: {
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
  return <AppInstallGuide platform="ios" locale={await routeLocale(params)} />;
}
