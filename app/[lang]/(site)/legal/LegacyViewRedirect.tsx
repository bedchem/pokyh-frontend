'use client';

import { useEffect } from 'react';
import { ACTIVE_LOCALES } from '@/lib/i18n/locale';

// The legal texts used to be one page with ?view=<text> (and ?lang=); each has
// its own page now. Older links (the apps, Pokyh Learn, search results) land
// here and go on to the clean address. nginx answers them with a permanent
// redirect on the server already (deploy/nginx.conf); this covers other hosts.
const TEXTS = new Set(['impressum', 'datenschutz', 'nutzungsbedingungen', 'cookies', 'learn']);

export default function LegacyViewRedirect({ locale }: { locale: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (!view || !TEXTS.has(view)) return;
    const asked = params.get('lang');
    const lang = asked && (ACTIVE_LOCALES as readonly string[]).includes(asked) ? asked : locale;
    window.location.replace(`/${lang}/legal/${view}/`);
  }, [locale]);
  return null;
}
