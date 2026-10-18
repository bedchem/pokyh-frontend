import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { routeLocale } from '@/lib/i18n/server';
import { LEGAL_VIEWS, LegalScreen, isLegalView, legalMetadata } from '../LegalViews';
import type { LegalLocale } from '../content';

// One legal text, prerendered per language (/de/legal/datenschutz/ …).

type Props = { params: Promise<{ lang: string; view: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_VIEWS.map((view) => ({ view }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { view } = await params;
  if (!isLegalView(view)) return {};
  return legalMetadata((await routeLocale(params)) as LegalLocale, view);
}

export default async function LegalTextPage({ params }: Props) {
  const { view } = await params;
  if (!isLegalView(view)) notFound();
  return <LegalScreen locale={(await routeLocale(params)) as LegalLocale} view={view} />;
}
