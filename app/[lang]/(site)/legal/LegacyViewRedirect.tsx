'use client';

import { useEffect } from 'react';
import { ACTIVE_LOCALES } from '@/lib/i18n/locale';

// The legal texts used to be one page with ?view=<text> (and ?lang=); each has
// its own page now. Older links (the apps, search results) land here and go
// on to the clean address. nginx answers them with a permanent redirect on
// the server already (deploy/nginx.conf); this covers other hosts. The
// Pokyh Learn notice is gone with Pokyh Learn: its links stay on the overview.
const TEXTS = new Set(['impressum', 'datenschutz', 'nutzungsbedingungen', 'cookies']);
const RETIRED = new Set(['learn']);

export default function LegacyViewRedirect({ locale }: { locale: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (!view || !(TEXTS.has(view) || RETIRED.has(view))) return;
    const asked = params.get('lang');
    const lang = asked && (ACTIVE_LOCALES as readonly string[]).includes(asked) ? asked : locale;
    window.location.replace(TEXTS.has(view) ? `/${lang}/legal/${view}/` : `/${lang}/legal/`);
  }, [locale]);
  return null;
}
