'use client';

import { useEffect, useState } from 'react';

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * Runs `fn` once the page has loaded and the browser is idle (at the latest
 * `timeout` ms later): for work no one waits for while a page comes alive.
 * Returns a function that cancels it if it has not run yet.
 */
export function whenIdle(fn: () => void, timeout = 2000): () => void {
  const w = window as IdleWindow;
  let handle: number | null = null;
  let cancelled = false;
  const schedule = () => {
    if (cancelled) return;
    handle = w.requestIdleCallback ? w.requestIdleCallback(fn, { timeout }) : window.setTimeout(fn, 200);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener('load', schedule);
    if (handle === null) return;
    if (w.cancelIdleCallback) w.cancelIdleCallback(handle);
    else window.clearTimeout(handle);
  };
}

/** False until the page has loaded and the browser is idle (see whenIdle). */
export function useIdle(timeout?: number): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => whenIdle(() => setIdle(true), timeout), [timeout]);
  return idle;
}
