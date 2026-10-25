'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { logPageView } from '@/lib/activity-logger';
import { noteScreen, startUsageTracking } from '@/lib/usage-tracker';
import { whenIdle } from '@/lib/idle';

export function ActivityLoggerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const didMount = useRef(false);

  // Foreground time for the admin usage statistics (see lib/usage-tracker.ts),
  // from the moment the page is idle: counting has no part in it coming alive.
  useEffect(() => whenIdle(() => startUsageTracking()), []);

  useEffect(() => {
    noteScreen();
    // The page the visit starts on is logged once the page is idle, like the
    // counting above; every page opened after it at once.
    if (!didMount.current) {
      didMount.current = true;
      return whenIdle(() => logPageView(pathname));
    }
    logPageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}
