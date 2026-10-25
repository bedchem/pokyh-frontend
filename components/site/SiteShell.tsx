'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useRoutePath } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { isPWA } from '@/lib/pwa';
import dynamic from 'next/dynamic';
import SmoothScroll from './SmoothScroll';
import SiteHeader from './SiteHeader';

// The footer is in the page as built; in the browser it comes alive in a task
// of its own once its code is there, after the page above it.
const SiteFooter = dynamic(() => import('./SiteFooter'));

// Marketing pages an installed app should never open on: the PWA starts in the
// app (or on the sign-in form) instead.
const PWA_SKIP = ['/', '/about', '/faq', '/comparison', '/howto'];
const PWA_SKIP_PREFIX = ['/get'];

export default function SiteShell({ children, className }: { children: ReactNode; className?: string }) {
  const path = useRoutePath();
  const router = useRouter();
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (isLoading || !isPWA()) return;
    const skip = PWA_SKIP.includes(path) || PWA_SKIP_PREFIX.some((p) => path === p || path.startsWith(p + '/'));
    if (skip) router.replace(user ? '/home' : '/login');
  }, [path, user, isLoading, router]);

  return (
    <div className={`site ${className ?? ''}`}>
      <SmoothScroll>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
      </SmoothScroll>
    </div>
  );
}
