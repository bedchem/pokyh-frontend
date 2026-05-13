'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isPWA } from '@/lib/pwa';
import { registerServiceWorker, requestPermissionAndSubscribe } from '@/lib/push';

let _swRegistered = false;

export default function PWAInit() {
  const pathname = usePathname();

  useEffect(() => {
    if (_swRegistered) return;
    _swRegistered = true;
    registerServiceWorker().then((reg) => {
      if (!reg || !isPWA()) return;
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      // Already granted — re-register with backend to refresh the WebUntis session tokens
      if (Notification.permission === 'granted') {
        requestPermissionAndSubscribe();
      }
    });
  }, []);

  // Ask for permission when user first lands on /home in PWA
  useEffect(() => {
    if (!isPWA() || pathname !== '/home') return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    requestPermissionAndSubscribe();
  }, [pathname]);

  return null;
}
