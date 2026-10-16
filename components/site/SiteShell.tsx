'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useRoutePath, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import { isPWA } from '@/lib/pwa';
import SmoothScroll from './SmoothScroll';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

// Marketing pages an installed app should never open on: the PWA starts in the
// app (or on the sign-in form) instead.
const PWA_SKIP = ['/', '/about', '/faq', '/comparison', '/howto'];
const PWA_SKIP_PREFIX = ['/get'];

export default function SiteShell({ children, className }: { children: ReactNode; className?: string }) {
  const t = useT(siteDict);
  const path = useRoutePath();
  const router = useRouter();
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (isLoading || !isPWA()) return;
    const skip = PWA_SKIP.includes(path) || PWA_SKIP_PREFIX.some((p) => path === p || path.startsWith(p + '/'));
    if (skip) router.replace(user ? '/home' : '/login');
  }, [path, user, isLoading, router]);

  // Overscroll above the page shows paper, whatever the app theme painted.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.backgroundColor;
    html.style.backgroundColor = '#F5F2ED';
    return () => { html.style.backgroundColor = prev; };
  }, []);

  return (
    <div className={`site ${className ?? ''}`}>
      <SmoothScroll>
        <a href="#main" className="skip-link">{t('skip')}</a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
      </SmoothScroll>
    </div>
  );
}
