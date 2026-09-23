import type { Metadata } from 'next';
import GetClient from './GetClient';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { getDict } from '@/lib/i18n/dictionaries/get';

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
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'POKYH', item: localizedUrl(SITE_URL, locale, '/') },
      { '@type': 'ListItem', position: 2, name: 'Get POKYH', item: localizedUrl(SITE_URL, locale, '/get') },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <GetClient />
    </>
  );
}
