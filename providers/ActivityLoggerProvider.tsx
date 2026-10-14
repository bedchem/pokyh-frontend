'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { logPageView } from '@/lib/activity-logger';
import { noteScreen, startUsageTracking } from '@/lib/usage-tracker';

export function ActivityLoggerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const didMount = useRef(false);

  // Foreground time for the admin usage statistics (see lib/usage-tracker.ts).
  useEffect(() => {
    startUsageTracking();
  }, []);

  useEffect(() => {
    noteScreen();
    // Skip the very first render on mount to avoid double-firing with hydration
    if (!didMount.current) {
      didMount.current = true;
      logPageView(pathname);
      return;
    }
    logPageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}
