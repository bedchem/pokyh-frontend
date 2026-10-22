import type { Metadata } from 'next';
import LazyNotFound from '@/components/site/LazyNotFound';

export const metadata: Metadata = {
  title: '404',
  robots: { index: false, follow: true },
};

// notFound() outside the public pages (an unknown language, an app page):
// the same 404, in the site's frame, loaded only when it is shown.
export default function NotFound() {
  return <LazyNotFound />;
}
