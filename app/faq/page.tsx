import type { Metadata } from 'next';
import FaqClient from './FaqClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export const metadata: Metadata = {
  title: 'FAQ – Häufige Fragen zu POKYH',
  description: 'Häufige Fragen zu POKYH: Wie funktioniert die Anmeldung? Ist POKYH sicher? Was kostet es? Alle Antworten auf einen Blick.',
  keywords: ['POKYH FAQ', 'POKYH Fragen', 'POKYH Hilfe', 'POKYH Anmeldung', 'POKYH sicher'],
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: 'FAQ – Häufige Fragen zu POKYH',
    description: 'Alle Antworten zu POKYH: Anmeldung, Sicherheit, Funktionen und mehr.',
    url: `${SITE_URL}/faq`,
    type: 'website',
    siteName: 'POKYH',
  },
};

export default function FaqPage() {
  return <FaqClient />;
}
