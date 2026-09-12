'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { COOKIE_CONSENT_STORAGE_KEY, type CookieConsent } from '@/components/CookieBanner';

function isGoogleMeasurementId(value: string | undefined): value is string {
  return Boolean(value && /^G-[A-Z0-9]+$/i.test(value));
}

function readStoredConsent(): CookieConsent | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return stored === 'all' || stored === 'necessary' ? stored : null;
  } catch {
    // localStorage can throw in private/blocked contexts – treat as no consent yet.
    return null;
  }
}

function removeAnalyticsCookies() {
  const names = document.cookie.split(';').map((item) => item.trim().split('=')[0]).filter((name) => name === '_ga' || name.startsWith('_ga_'));
  const domains = ['', `; domain=${location.hostname}`, `; domain=.${location.hostname}`];
  for (const name of names) {
    for (const domain of domains) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
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
  const enabled = isGoogleMeasurementId(gaId);

  useEffect(() => {
    // Read browser storage after hydration, so analytics is never rendered
    // from a server-side guess about a visitor's consent.
    const initialConsentCheck = window.requestAnimationFrame(() => {
      setConsent(readStoredConsent());
    });

    function handleConsentChanged(event: Event) {
      const detail = (event as CustomEvent<CookieConsent>).detail;
      setConsent(detail === 'all' || detail === 'necessary' ? detail : null);

      // An already-injected gtag script tag cannot be un-injected. As a
      // belt-and-braces measure, tell gtag.js to stop sending hits when the
      // visitor downgrades to "necessary only" after GA had already loaded.
      if (detail === 'necessary' && enabled && gaId) {
        (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = true;
        const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
        gtag?.('consent', 'update', { analytics_storage: 'denied' });
        removeAnalyticsCookies();
      }
      if (detail === 'all' && enabled && gaId) {
        (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = false;
      }
    }

    window.addEventListener('cookie-consent-changed', handleConsentChanged);
    return () => {
      window.cancelAnimationFrame(initialConsentCheck);
      window.removeEventListener('cookie-consent-changed', handleConsentChanged);
    };
  }, [enabled, gaId]);

  if (!enabled || !gaId || consent !== 'all') return null;

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
          gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
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
