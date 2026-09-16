'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { isPWA } from '@/lib/pwa';
import { useSession } from '@/providers/SessionProvider';
import { isKnownPageRoute, isMensaRoute } from '@/lib/routes';

const Sidebar = dynamic(() => import('./Sidebar'));
const DashboardTopbar = dynamic(() => import('./DashboardTopbar'));
const AnnouncementPopup = dynamic(() => import('./AnnouncementPopup'), { ssr: false });

// Landing pages that PWA users should never see
const PWA_BLOCKED = ['/', '/about', '/faq', '/comparison', '/howto'];
const PWA_BLOCKED_PREFIX = ['/get'];

const LANDING_EXACT = ['/', '/login', '/legal', '/howto', '/about', '/faq', '/comparison'];
const LANDING_PREFIX = ['/get'];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (!isPWA()) return;
    const blocked =
      PWA_BLOCKED.includes(pathname) ||
      PWA_BLOCKED_PREFIX.some((p) => pathname === p || pathname.startsWith(p + '/'));
    if (!blocked) return;
    router.replace(user ? '/home' : '/login');
  }, [pathname, user, router]);

  const isLanding =
    LANDING_EXACT.includes(pathname) ||
    LANDING_PREFIX.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Unknown routes (404) and the guest Mensa view bring their own chrome
  const isStandalone =
    !isKnownPageRoute(pathname) ||
    (isMensaRoute(pathname) && (isLoading || !user));

  // Admin popups: guests see the "guests" audience on the public pages, signed-in
  // users the "users" audience. Keyed so signing in/out starts a fresh check.
  const popups = isLoading ? null : (
    <AnnouncementPopup key={user ? 'user' : 'guest'} audience={user ? 'user' : 'guest'} />
  );

  if (isLanding || isStandalone) return <>{children}{popups}</>;

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0 min-h-0">
        <DashboardTopbar />
        <main className="flex-1 overflow-hidden min-h-0">
          {children}
        </main>
      </div>
      {popups}
    </div>
  );
}
