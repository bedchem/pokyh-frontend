'use client';

import { useCallback, useSyncExternalStore } from 'react';

// Whether the desktop sidebar is folded to its icons. Kept in localStorage
// under the name the privacy notice lists ("pokyh_sidebar_collapsed").
const KEY = 'pokyh_sidebar_collapsed';
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'true' || v === '1';
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function useSidebarCollapsed(): [boolean, (next: boolean) => void] {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);
  const set = useCallback((next: boolean) => {
    try { localStorage.setItem(KEY, String(next)); } catch { /* storage blocked */ }
    listeners.forEach((l) => l());
  }, []);
  return [collapsed, set];
}
