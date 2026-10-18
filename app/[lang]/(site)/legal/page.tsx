import type { Metadata } from 'next';
import { routeLocale } from '@/lib/i18n/server';
import { LegalScreen, legalMetadata } from './LegalViews';
import type { LegalLocale } from './content';

// The overview of the legal texts; each text has its own page (./[view]).

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return legalMetadata((await routeLocale(params)) as LegalLocale, null);
}

export default async function LegalPage({ params }: Props) {
  return <LegalScreen locale={(await routeLocale(params)) as LegalLocale} view={null} />;
}
