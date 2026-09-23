import type { Metadata } from 'next';
import LandingClient from '@/components/LandingClient';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { metaDict } from '@/lib/i18n/dictionaries/meta';
import { FAQ_COUNT, faqDict, type FaqKey } from '@/lib/i18n/dictionaries/faq';
import { localeAlternates, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { rich } from '@/lib/i18n/rich';
import type { Locale } from '@/lib/i18n/locale';

type PageProps = { params: Promise<{ lang: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(metaDict, locale);
  return {
  title: { absolute: t('landingTitle') },
  description: t('landingDescription'),
  keywords: pageKeywords(locale, [
    'POKYH', 'POKYH App', 'POKYH Schulapp', 'POKYH Südtirol',

    // Tschuggmall – alle Schreibweisen
    'Tschuggmall', 'Chr. J. Tschuggmall', 'Chr. Josef Tschuggmall',
    'Christian Josef Tschuggmall', 'C. J. Tschuggmall',
    'BFS Tschuggmall', 'BBZ Tschuggmall', 'Berufsbildungszentrum Tschuggmall',
    'Tschuggmall Brixen', 'Tschuggmall App', 'Tschuggmall Schüler',
    'Tschuggmall Stundenplan', 'Tschuggmall Noten', 'Tschuggmall Mensa',

    // LBS Brixen (reduziert, selektiv)
    'LBS Brixen', 'LBS Brixen App', 'Stundenplan LBS Brixen', 'Noten LBS Brixen',
    'Landesberufsschule Brixen', 'Berufsschule Brixen',

    // Brixen / Bressanone allgemein
    'Schulapp Brixen', 'Schulportal Brixen', 'Schülerportal Brixen',
    'Stundenplan Brixen', 'Schüler App Brixen', 'Bressanone Schulapp',

    // Südtirol / Alto Adige
    'Schulapp Südtirol', 'Schulapp Südtirol kostenlos', 'Berufsschule Südtirol App',
    'Stundenplan Berufsschule Südtirol', 'Alto Adige Schulapp',

    // WebUntis – vergleichend / erklärend
    'WebUntis Alternative', 'WebUntis Brixen', 'WebUntis LBS Brixen',
    'Schulapp statt WebUntis', 'besseres WebUntis',

    // Features
    'automatischer Notenschnitt', 'Mensa App Brixen', 'Fehlstunden Tracker',
    'Stundenplan App', 'Noten App Schule', 'Klassen Erinnerungen',
    'Mensa Speiseplan Brixen', 'Notenübersicht', 'Fehlstunden Übersicht',
    'digitale Schulapp', 'mobile Schulapp', 'PWA Schulapp', 'kostenlose Schulapp',
    'School Dashboard', 'Education App',
  ]),
  alternates: localeAlternates(SITE_URL, locale, '/'),
  openGraph: {
    type: 'website',
    ...ogLocale(locale),
    url: `${SITE_URL}/${locale}/`,
    siteName: 'POKYH',
    title: t('landingOgTitle'),
    description: t('landingOgDescription'),
  },
  twitter: {
    card: 'summary_large_image',
    title: t('landingOgTitle'),
    description: t('landingOgDescription'),
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
  };
}

function faqStructuredData(locale: Locale) {
  const t = makeT(faqDict, locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    mainEntity: Array.from({ length: FAQ_COUNT }, (_, i) => ({
      '@type': 'Question',
      name: t(`q${i + 1}` as FaqKey),
      acceptedAnswer: { '@type': 'Answer', text: t(`a${i + 1}` as FaqKey) },
    })),
  };
}

export default async function LandingPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(metaDict, locale);
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'POKYH', item: `${SITE_URL}/${locale}/` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData(locale)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <LandingClient />
      {/* SSR-only SEO blurb — visually hidden via sr-only, fully crawlable by search engines */}
      <section className="sr-only" aria-label={t('seoBlurbAria')}>
        <p>{rich(t('seoBlurb'))}</p>
      </section>
    </>
  );
}
