'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { COOKIE_SETTINGS_EVENT } from '@/components/CookieSettingsButton';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { commonDict } from '@/lib/i18n/dictionaries/common';

export const COOKIE_CONSENT_STORAGE_KEY = 'pokyh_cookie_consent';

export type CookieConsent = 'all' | 'necessary';

export default function CookieBanner({ analyticsEnabled = false }: { analyticsEnabled?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const t = useT(commonDict);
  const localize = useLocalizeHref();

  useEffect(() => {
    // Defer the browser-only storage read until after hydration. Besides
    // avoiding a server/client render mismatch, this keeps the banner state
    // synchronised with the actual browser choice rather than a server guess.
    const initialCheck = window.requestAnimationFrame(() => {
      if (!localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)) setVisible(true);
    });

    function openSettings() {
      setShowDetails(true);
      setVisible(true);
    }

    window.addEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    return () => {
      window.cancelAnimationFrame(initialCheck);
      window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    };
  }, []);

  function accept(choice: CookieConsent) {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice);
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: choice }));
    setShowDetails(false);
    setVisible(false);
  }

  // No floating button once a choice is made. Consent stays revocable through
  // the "Cookie-Einstellungen öffnen" button on the Cookie-Richtlinie page
  // (reachable via Rechtliches and the "Cookies" footer link), which dispatches
  // COOKIE_SETTINGS_EVENT to reopen this banner.
  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t('cookieDialog')}
      className="fixed bottom-0 left-0 right-0 z-[999] px-4 pb-4 pt-0 sm:px-6 sm:pb-6"
    >
      <div
        className="mx-auto max-w-2xl rounded-2xl p-5 shadow-2xl"
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}
          >
            <Cookie size={17} color="var(--accent)" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold leading-snug" style={{ color: 'var(--app-text-primary)' }}>
              {t('cookieTitle')}
            </p>
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--app-text-secondary)' }}>
              {analyticsEnabled ? t('cookieTextAnalytics') : t('cookieText')}{' '}
              <Link
                href={localize('/legal?view=cookies')}
                className="underline underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: '#4F46E5' }}
              >
                {t('cookieMore')}
              </Link>
            </p>
          </div>
          <button
            onClick={() => accept('necessary')}
            className="flex-shrink-0 p-1.5 rounded-lg transition-opacity hover:opacity-60"
            style={{ color: 'var(--app-text-tertiary)' }}
            aria-label={t('cookieCloseNecessary')}
          >
            <X size={16} />
          </button>
        </div>

        {showDetails && (
          <div className="rounded-xl p-3.5 text-[12px] leading-relaxed" style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)' }}>
            <p className="font-semibold" style={{ color: 'var(--app-text-primary)' }}>{t('cookieChoice')}</p>
            <p className="mt-1">{t('cookieChoiceText')} {analyticsEnabled ? t('cookieChoiceAnalytics') : t('cookieChoiceNoAnalytics')}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {!showDetails && <button type="button" onClick={() => setShowDetails(true)} className="text-[12px] font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>{t('cookieSettings')}</button>}
          <button
            onClick={() => accept('necessary')}
            className="min-w-[9rem] flex-1 h-10 rounded-xl text-[13px] font-semibold transition-opacity hover:opacity-70 press-scale"
            style={{
              background: 'var(--app-card)',
              color: 'var(--app-text-secondary)',
              border: '1px solid var(--app-border)',
            }}
          >
            {t('cookieNecessaryOnly')}
          </button>
          {analyticsEnabled && <button
              onClick={() => accept('all')}
              className="min-w-[9rem] flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90 press-scale"
              style={{ background: 'var(--accent)' }}
            >
              {t('cookieAcceptAll')}
            </button>}
        </div>
      </div>
    </div>
  );
}
