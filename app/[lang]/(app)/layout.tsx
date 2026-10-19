import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import AppShell from '@/components/app/AppShell';
import './app.css';

// The signed-in app: the tab says only "POKYH" (the public pages carry the
// search-engine titles), and nothing in here is meant for search engines.
export const metadata: Metadata = {
  title: { absolute: 'POKYH' },
  robots: { index: false, follow: false },
};

// The browser bar in the app's own canvas (globals.css, --canvas).
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#111114' },
    { media: '(prefers-color-scheme: light)', color: '#F2EEE7' },
  ],
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
