import type { Metadata } from 'next';
import MensaClient from './MensaClient';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { mensaDict } from '@/lib/i18n/dictionaries/mensa';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(mensaDict, locale);
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: pageKeywords(locale, ['Mensa LBS Brixen', 'Mensa Brixen Speiseplan', 'Tschuggmall Mensa', 'POKYH Mensa', 'Speiseplan Berufsschule Brixen']),
    alternates: localeAlternates(SITE_URL, locale, '/mensa'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: localizedUrl(SITE_URL, locale, '/mensa'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
  };
}

// The Mensa plan is public: everyone sees it in the site layout; rating and
// commenting need an account (see MensaClient).
export default function MensaPage() {
  return <MensaClient />;
}
