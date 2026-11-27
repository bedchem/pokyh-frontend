'use client';

import { useEffect } from 'react';

// The lesson popup used to show a photo per subject, kept in the browser's
// Cache Storage. It draws the subject's colour and short name now; this clears
// the pictures a browser still keeps from before.
const OLD_CACHES = ['pokyh-subject-images-v1', 'pokyh-subject-images-v2', 'pokyh-subject-images-v3'];

export default function SubjectImageCacheCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('caches' in window)) return;
    const timer = window.setTimeout(() => {
      for (const name of OLD_CACHES) caches.delete(name).catch(() => {});
    }, 4000);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
