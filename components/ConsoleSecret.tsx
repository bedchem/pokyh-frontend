'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from '@/providers/LocaleProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { isDevtoolsShortcut } from '@/lib/devtools-key';

// Installs the developer-tools greeting (lib/console-secret.ts) once the page
// is idle, so it costs the first paint nothing. A developer-tools shortcut
// before that loads it at once and shows the commands straight away.
export default function ConsoleSecret() {
  const { locale } = useLocale();
  const { resolved, setTheme } = useTheme();
  // Read at call time: the console command must flip the theme that is shown now.
  const theme = useRef({ resolved, setTheme });
  useEffect(() => { theme.current = { resolved, setTheme }; }, [resolved, setTheme]);

  useEffect(() => {
    let off = () => {};
    let cancelled = false;
    let started = false;
    const start = (revealNow: boolean) => {
      if (started) return;
      started = true;
      window.removeEventListener('keydown', early, true);
      import('@/lib/console-secret').then(({ installConsoleSecret }) => {
        if (cancelled) return;
        off = installConsoleSecret({
          locale,
          revealNow,
          toggleTheme: () => theme.current.setTheme(theme.current.resolved === 'dark' ? 'light' : 'dark'),
        });
      }).catch(() => {});
    };
    // Capture phase: a component that stops the key event can't swallow it.
    const early = (e: KeyboardEvent) => {
      if (isDevtoolsShortcut(e)) start(true);
    };
    window.addEventListener('keydown', early, true);
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const handle = idle ? idle(() => start(false), { timeout: 3000 }) : window.setTimeout(() => start(false), 1500);
    return () => {
      cancelled = true;
      window.removeEventListener('keydown', early, true);
      off();
      if (!idle) window.clearTimeout(handle);
    };
  }, [locale]);

  return null;
}
