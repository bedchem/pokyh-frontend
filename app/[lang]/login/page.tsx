import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from './LoginForm';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, ogLocale, pageKeywords, ogImage } from '@/lib/i18n/seo';
import PageJsonLd from '@/components/site/PageJsonLd';
import { metaDict } from '@/lib/i18n/dictionaries/meta';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(metaDict, locale);
  return {
  title: { absolute: t('loginTitle') },
  description: t('loginDescription'),
  keywords: pageKeywords(locale),
  openGraph: {
      images: ogImage(locale, 'login'),
    title: t('loginOgTitle'),
    description: t('loginOgDescription'),
    type: 'website',
    ...ogLocale(locale),
    siteName: 'POKYH',
  },
  twitter: {
    card: 'summary_large_image',
    images: ogImage(locale, 'login').map((i) => i.url),
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
  return (
    <>
      <PageJsonLd locale={locale} path="/login" name={t('loginTitle')} description={t('loginDescription')} trail={[{ name: t('breadcrumbLogin'), path: '/login' }]} />
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
