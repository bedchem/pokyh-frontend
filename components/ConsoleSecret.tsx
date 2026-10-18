'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from '@/providers/LocaleProvider';
import { useTheme } from '@/providers/ThemeProvider';

// Installs the developer-tools greeting (lib/console-secret.ts) once the page
// is idle, so it costs the first paint nothing.
export default function ConsoleSecret() {
  const { locale } = useLocale();
  const { resolved, setTheme } = useTheme();
  // Read at call time: the console command must flip the theme that is shown now.
  const theme = useRef({ resolved, setTheme });
  useEffect(() => { theme.current = { resolved, setTheme }; }, [resolved, setTheme]);

  useEffect(() => {
    let off = () => {};
    let cancelled = false;
    const start = () => {
      import('@/lib/console-secret').then(({ installConsoleSecret }) => {
        if (cancelled) return;
        off = installConsoleSecret({
          locale,
          toggleTheme: () => theme.current.setTheme(theme.current.resolved === 'dark' ? 'light' : 'dark'),
        });
      }).catch(() => {});
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const handle = idle ? idle(start, { timeout: 3000 }) : window.setTimeout(start, 1500);
    return () => {
      cancelled = true;
      off();
      if (!idle) window.clearTimeout(handle);
    };
  }, [locale]);

  return null;
}
