'use client';

// Photos hosted on other sites (the dish photos of the Mensa come from recipe
// sites) are shown from those sites by default, without a referrer; loading
// them sends the visitor's IP address there (privacy notice: legitimate
// interest, Art. 6(1)(f) GDPR). Visitors can object at any time with "Hide
// photos"; that choice is kept in this browser (`pokyh_external_media` = "0",
// listed in the cookie policy). Copying the photos to POKYH's own server is
// not an option: they belong to their authors.

import { useSyncExternalStore } from 'react';

export const EXTERNAL_MEDIA_KEY = 'pokyh_external_media';
const EVENT = 'pokyh-external-media';

const HIDDEN = '0';

function read(): boolean {
  try {
    return localStorage.getItem(EXTERNAL_MEDIA_KEY) !== HIDDEN;
  } catch {
    return true;
  }
}

function subscribe(fn: () => void) {
  window.addEventListener(EVENT, fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener('storage', fn);
  };
}

/** Whether photos from other sites may be shown. Never in the server HTML, so a hidden choice is respected before hydration. */
export function useExternalMedia(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}

export function setExternalMedia(allowed: boolean): void {
  try {
    if (allowed) localStorage.removeItem(EXTERNAL_MEDIA_KEY);
    else localStorage.setItem(EXTERNAL_MEDIA_KEY, HIDDEN);
  } catch {
    // Storage blocked: the choice holds until the page is left.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** The host a photo would be loaded from, for the notice. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
