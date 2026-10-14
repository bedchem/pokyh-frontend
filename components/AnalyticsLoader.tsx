'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { COOKIE_CONSENT_EVENT, readCookieChoice, type CookieChoice } from '@/lib/cookie-consent';

function isGoogleMeasurementId(value: string | undefined): value is string {
  return Boolean(value && /^G-[A-Z0-9]+$/i.test(value));
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
  // Whether Google Analytics may run; null until the stored choice is read.
  const [consent, setConsent] = useState<boolean | null>(null);
  const enabled = isGoogleMeasurementId(gaId);

  useEffect(() => {
    // Read browser storage after hydration, so analytics is never rendered
    // from a server-side guess about a visitor's consent.
    const initialConsentCheck = window.requestAnimationFrame(() => {
      setConsent(readCookieChoice()?.ga ?? null);
    });

    function handleConsentChanged(event: Event) {
      const allowed = (event as CustomEvent<CookieChoice>).detail?.ga === true;
      setConsent(allowed);

      // An already-injected gtag script tag cannot be un-injected. As a
      // belt-and-braces measure, tell gtag.js to stop sending hits when the
      // visitor downgrades to "necessary only" after GA had already loaded.
      if (!allowed && enabled && gaId) {
        (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = true;
        const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
        gtag?.('consent', 'update', { analytics_storage: 'denied' });
        removeAnalyticsCookies();
      }
      if (allowed && enabled && gaId) {
        (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = false;
      }
    }

    window.addEventListener(COOKIE_CONSENT_EVENT, handleConsentChanged);
    return () => {
      window.cancelAnimationFrame(initialConsentCheck);
      window.removeEventListener(COOKIE_CONSENT_EVENT, handleConsentChanged);
    };
  }, [enabled, gaId]);

  if (!enabled || !gaId || consent !== true) return null;

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
