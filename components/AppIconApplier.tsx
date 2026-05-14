'use client';

import { useEffect } from 'react';

const APP_ICON_PREF_KEY = 'pokyh_app_icon';

const ICON_SRCS: Record<string, string> = {
  standard: '/icons/app-icon-standard.png',
  classic:  '/icons/app-icon-classic.png',
  nexor:    '/icons/app-icon-nexor.png',
  nexor2:   '/icons/app-icon-nexor2.png',
  special:  '/icons/app-icon-special.png',
  meme:     '/icons/app-icon-meme.png',
};

export default function AppIconApplier() {
  useEffect(() => {
    const stored = localStorage.getItem(APP_ICON_PREF_KEY);
    const src = stored && ICON_SRCS[stored];
    if (!src) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = src;
  }, []);

  return null;
}
