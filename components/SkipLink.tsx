'use client';

import { useRoutePath, useT } from '@/providers/LocaleProvider';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import { isProtectedAppRoute } from '@/lib/routes';

// The first thing on every page, before the cookie banner: straight to the
// page's own content (the app's frame has its own main, components/app/AppShell.tsx).
export default function SkipLink() {
  const t = useT(siteDict);
  const path = useRoutePath();
  return <a href={isProtectedAppRoute(path) ? '#app-main' : '#main'} className="skip-link">{t('skip')}</a>;
}
