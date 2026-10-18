import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { notFoundDict } from '@/lib/i18n/dictionaries/notFound';

// Any other path under a language is a 404 inside the site's frame
// ((site)/not-found.tsx), not the bare document of app/global-not-found.tsx.

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  return { title: { absolute: `${makeT(notFoundDict, locale)('metaTitle')} | POKYH` }, robots: { index: false, follow: true } };
}

export default function UnknownPage() {
  notFound();
}
