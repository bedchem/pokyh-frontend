import type { Metadata } from 'next';
import FaqClient from './FaqClient';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { faqDict } from '@/lib/i18n/dictionaries/faq';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(faqDict, locale);
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: pageKeywords(locale, ['POKYH FAQ', 'POKYH Fragen', 'POKYH Hilfe', 'POKYH Anmeldung', 'POKYH sicher']),
    alternates: localeAlternates(SITE_URL, locale, '/faq'),
    openGraph: {
      title: t('metaTitle'),
      description: t('ogDescription'),
      url: localizedUrl(SITE_URL, locale, '/faq'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
  };
}

export default function FaqPage() {
  return <FaqClient />;
}
