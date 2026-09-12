'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import type { CookieConsent } from '@/components/CookieBanner';

const STORAGE_KEY = 'pokyh_cookie_consent';

function readStoredConsent(): CookieConsent | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'all' || stored === 'necessary' ? stored : null;
  } catch {
    // localStorage can throw in private/blocked contexts – treat as no consent yet.
    return null;
  }
}

/**
 * Loads Google Analytics 4 only after the visitor has explicitly accepted
 * analytics cookies. Reads the stored consent choice on mount and re-checks it
 * whenever CookieBanner reports a live consent change, so accepting or
 * revoking analytics takes effect immediately without a page reload.
 */
export default function AnalyticsLoader({ gaId }: { gaId?: string }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    setConsent(readStoredConsent());

    function handleConsentChanged(event: Event) {
      const detail = (event as CustomEvent<CookieConsent>).detail;
      setConsent(detail === 'all' || detail === 'necessary' ? detail : null);

      // An already-injected gtag script tag cannot be un-injected. As a
      // belt-and-braces measure, tell gtag.js to stop sending hits when the
      // visitor downgrades to "necessary only" after GA had already loaded.
      if (detail === 'necessary' && gaId) {
        (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = true;
      }
    }

    window.addEventListener('cookie-consent-changed', handleConsentChanged);
    return () => window.removeEventListener('cookie-consent-changed', handleConsentChanged);
  }, [gaId]);

  if (!gaId || consent !== 'all') return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            cookie_flags: 'SameSite=None;Secure',
          });
        `}
      </Script>
    </>
  );
}
