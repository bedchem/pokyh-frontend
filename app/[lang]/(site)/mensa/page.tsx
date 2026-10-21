import type { Metadata } from 'next';
import MensaClient from './MensaClient';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords, ogImage } from '@/lib/i18n/seo';
import { mensaDict } from '@/lib/i18n/dictionaries/mensa';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import PageJsonLd from '@/components/site/PageJsonLd';
import { publicCanteens, publicMenu } from '@/lib/server/mensa-api';
import { canteensFrom, dishesFrom, menuOwner, upcomingDays, type Canteen } from '@/lib/mensa';
import type { Locale } from '@/lib/i18n/locale';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

type PageProps = { params: Promise<{ lang: string }> };

// Prerendered with the menu in it (search engines and slow phones see the
// dishes at once) when the website is built; the browser loads the current
// menu from the API on top, as before.

/**
 * What search engines read about the page, from the canteens there are: one
 * is named with its schools, several are listed, and without the list (the
 * backend can't be reached, or an older one has none) the page says what it
 * is without naming a school.
 */
function mensaMeta(locale: Locale, canteens: Canteen[] | null) {
  const t = makeT(mensaDict, locale);
  const names = canteens?.flatMap((c) => [c.name, ...c.schools.flatMap((s) => [s.name, s.shortName])]).filter(Boolean) ?? [];
  // Search terms of their own only in German (lib/i18n/seo.ts pageKeywords).
  const keywords = pageKeywords(locale, locale === 'de' ? [...new Set([...names, ...t('metaKeywords').split('|')])] : []);
  if (canteens?.length === 1) {
    const [c] = canteens;
    return { title: t('metaTitleOne', { canteen: c.name }), description: t('metaDescriptionOne', { canteen: c.name, schools: c.schools.map((s) => s.name).join(', ') }), keywords };
  }
  if (canteens && canteens.length > 1) {
    const shown = canteens.slice(0, 3).map((c) => c.name);
    if (canteens.length > 3) shown.push(t('metaMore', { n: canteens.length - 3 }));
    const list = new Intl.ListFormat(locale === 'lld' ? 'de' : locale, { type: 'conjunction' }).format(shown);
    return { title: t('metaTitleMany'), description: t('metaDescriptionMany', { names: list }), keywords };
  }
  return { title: t('metaTitle'), description: t('metaDescription'), keywords };
}

async function canteenList(): Promise<Canteen[] | null> {
  const raw = await publicCanteens();
  return raw ? canteensFrom(raw) : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const meta = mensaMeta(locale, await canteenList());
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: localeAlternates(SITE_URL, locale, '/mensa'),
    openGraph: {
      images: ogImage(locale),
      title: meta.title,
      description: meta.description,
      url: localizedUrl(SITE_URL, locale, '/mensa'),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
  };
}

// The Mensa plan is public: everyone sees it in the site layout, signed in
// or not; rating and commenting need an account (see MensaClient). With
// several canteens the page opens on the choice between them.
export default async function MensaPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const [menu, canteens] = await Promise.all([publicMenu(), canteenList()]);
  const meta = mensaMeta(locale, canteens);
  // Only the days still to come travel with the page, as plain day keys.
  const initialDays = menu ? upcomingDays(dishesFrom(menu)).map(({ key, dishes }) => ({ key, dishes })) : undefined;
  return (
    <>
      <PageJsonLd locale={locale} path="/mensa" name={meta.title} description={meta.description} trail={[{ name: makeT(siteDict, locale)('navMensa'), path: '/mensa' }]} />
      <MensaClient
        initialDays={initialDays}
        initialCanteens={canteens ?? undefined}
        initialOwner={menu ? menuOwner(menu) : undefined}
      />
    </>
  );
}
