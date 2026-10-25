import type { Metadata } from 'next';
import { LazyNotFoundView } from '@/components/site/LazyNotFound';

export const metadata: Metadata = {
  title: '404',
  robots: { index: false, follow: true },
};

// Loaded only when it is shown (see LazyNotFound).
export default function NotFound() {
  return <LazyNotFoundView />;
}
