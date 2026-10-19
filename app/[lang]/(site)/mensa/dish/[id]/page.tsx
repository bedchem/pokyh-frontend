import type { Metadata } from 'next';
import DishView from '@/components/mensa/DishView';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { mensaDict } from '@/lib/i18n/dictionaries/mensa';

type PageProps = { params: Promise<{ lang: string; id: string }> };

// A dish of the public Mensa plan. Dishes come and go with the menu, so their
// pages stay out of search results; the plan itself is indexed.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  return {
    title: makeT(mensaDict, locale)('title'),
    robots: { index: false, follow: true },
  };
}

export default async function MensaDishPage({ params }: PageProps) {
  const { id } = await params;
  return <DishView id={decodeURIComponent(id)} />;
}
