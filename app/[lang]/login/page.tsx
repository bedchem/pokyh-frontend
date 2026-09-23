import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from './LoginForm';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { metaDict } from '@/lib/i18n/dictionaries/meta';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(metaDict, locale);
  return {
  title: { absolute: t('loginTitle') },
  description: t('loginDescription'),
  keywords: pageKeywords(locale, [
    'POKYH',
    'LBS Brixen',
    'Schulapp LBS Brixen',
    'LBS Brixen Anmeldung',
    'Stundenplan LBS Brixen',
    'Noten LBS Brixen',
    'Mensa LBS Brixen',
    'Schule Brixen App',
    'LBS Brixen Stundenplan online',
    'BFS Tschuggmall App',
  ]),
  openGraph: {
    title: t('loginOgTitle'),
    description: t('loginOgDescription'),
    type: 'website',
    ...ogLocale(locale),
    siteName: 'POKYH',
  },
  twitter: {
    card: 'summary_large_image',
    title: t('loginOgTitle'),
    description: t('loginOgDescription'),
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: localeAlternates(SITE_URL, locale, '/login'),
  };
}

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const locale = await routeLocale(params);
  const t = makeT(metaDict, locale);
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'POKYH', item: localizedUrl(SITE_URL, locale, '/') },
      { '@type': 'ListItem', position: 2, name: t('breadcrumbLogin'), item: localizedUrl(SITE_URL, locale, '/login') },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
