import type { Metadata } from 'next';
import FaqClient from './FaqClient';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords, ogImage } from '@/lib/i18n/seo';
import { FAQ_GROUPS, faqDict, type FaqKey } from '@/lib/i18n/dictionaries/faq';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import PageJsonLd, { faqEntities } from '@/components/site/PageJsonLd';
import { SITE_URL } from '@/lib/site-url';

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
      images: ogImage(locale),
      title: t('metaTitle'),
      description: t('ogDescription'),
      url: localizedUrl(SITE_URL, locale, '/faq'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
  };
}

export default async function FaqPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(faqDict, locale);
  // In the order the page shows them, each with the address of its place there.
  const faq = FAQ_GROUPS.flatMap((g) => g.questions).map((n) => ({ q: t(`q${n}` as FaqKey), a: t(`a${n}` as FaqKey), id: `q${n}` }));
  return (
    <>
      <PageJsonLd
        locale={locale}
        path="/faq"
        type="FAQPage"
        name={t('metaTitle')}
        description={t('metaDescription')}
        trail={[{ name: makeT(siteDict, locale)('navFaq'), path: '/faq' }]}
        main={faqEntities(faq, localizedUrl(SITE_URL, locale, '/faq'))}
      />
      <FaqClient />
    </>
  );
}
