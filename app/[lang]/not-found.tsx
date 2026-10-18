import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import NotFoundView from '@/components/site/NotFoundView';

export const metadata: Metadata = {
  title: '404',
  robots: { index: false, follow: true },
};

// notFound() outside the public pages (an unknown language, an app page):
// the same 404, in the site's frame.
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundView />
    </SiteShell>
  );
}
