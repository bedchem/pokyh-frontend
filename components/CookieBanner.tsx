'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { COOKIE_SETTINGS_EVENT } from '@/components/CookieSettingsButton';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { cookieChoiceNeeded, readCookieChoice, saveCookieChoice } from '@/lib/cookie-consent';
import { syncCookieChoice } from '@/lib/privacy-consent';

export { COOKIE_CONSENT_STORAGE_KEY } from '@/lib/cookie-consent';

// "Alle akzeptieren" and "Nur notwendige" are offered side by side, the same
// size and equally easy to reach; the X means "Nur notwendige". The settings
// list each optional purpose with its own switch, never preset (GDPR Art. 7,
// CJEU C-673/17 Planet49, EDPB guidelines 03/2022 on deceptive design).
export default function CookieBanner({ analyticsEnabled = false }: { analyticsEnabled?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState(false);
  const [ga, setGa] = useState(false);
  const t = useT(commonDict);
  const localize = useLocalizeHref();

  useEffect(() => {
    // Defer the browser-only storage read until after hydration. Besides
    // avoiding a server/client render mismatch, this keeps the banner state
    // synchronised with the actual browser choice rather than a server guess.
    const initialCheck = window.requestAnimationFrame(() => {
      if (cookieChoiceNeeded()) setVisible(true);
    });

    function openSettings() {
      // Opened again later: the switches show the choice in force.
      const current = readCookieChoice();
      setStats(current?.stats ?? false);
      setGa(current?.ga ?? false);
      setShowDetails(true);
      setVisible(true);
    }

    window.addEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    return () => {
      window.cancelAnimationFrame(initialCheck);
      window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    };
  }, []);

  function choose(nextStats: boolean, nextGa: boolean) {
    saveCookieChoice(nextStats, analyticsEnabled && nextGa);
    // Signed in: the account's consent follows at once; otherwise right
    // after the next sign-in (PrivacyGate).
    void syncCookieChoice();
    setShowDetails(false);
    setVisible(false);
  }

  // No floating button once a choice is made. Consent stays revocable through
  // the "Cookie-Einstellungen öffnen" button on the Cookie-Richtlinie page
  // (reachable via Rechtliches and the "Cookies" footer link), which dispatches
  // COOKIE_SETTINGS_EVENT to reopen this banner, and in the profile.
  if (!visible) return null;

  const buttonBase = 'min-w-[9rem] flex-1 h-11 rounded-xl text-[14px] font-semibold transition-opacity';

  return (
    <div
      role="dialog"
      aria-label={t('cookieDialog')}
      className="fixed bottom-0 left-0 right-0 z-[999] px-4 pb-4 pt-0 sm:px-6 sm:pb-6"
    >
      <div
        className="mx-auto max-w-2xl max-h-[85dvh] overflow-y-auto rounded-2xl p-5 shadow-2xl"
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
              {analyticsEnabled ? t('cookieTextAnalytics') : t('cookieText')}
            </p>
            <p className="text-[13px] mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              <Link
                href={localize('/legal?view=cookies')}
                className="underline underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--accent)' }}
              >
                {t('cookiePolicyLink')}
              </Link>
              <Link
                href={localize('/legal?view=datenschutz')}
                className="underline underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--accent)' }}
              >
                {t('cookiePrivacyLink')}
              </Link>
            </p>
          </div>
          <button
            onClick={() => choose(false, false)}
            className="flex-shrink-0 p-1.5 rounded-lg transition-opacity hover:opacity-60"
            style={{ color: 'var(--app-text-tertiary)' }}
            aria-label={t('cookieCloseNecessary')}
          >
            <X size={16} />
          </button>
        </div>

        {showDetails && (
          <div className="flex flex-col gap-2">
            <Purpose title={t('cookieNecessaryTitle')} desc={t('cookieNecessaryDesc')}>
              <span className="text-[12px] font-semibold" style={{ color: 'var(--app-text-tertiary)' }}>{t('cookieAlwaysOn')}</span>
            </Purpose>
            <Purpose title={t('cookieStatsTitle')} desc={t('cookieStatsDesc')}>
              <Switch checked={stats} onChange={setStats} label={t('cookieStatsTitle')} />
            </Purpose>
            {analyticsEnabled && (
              <Purpose title={t('cookieGaTitle')} desc={t('cookieGaDesc')}>
                <Switch checked={ga} onChange={setGa} label={t('cookieGaTitle')} />
              </Purpose>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {!showDetails && (
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="text-[13px] font-semibold transition-opacity hover:opacity-70"
              style={{ color: 'var(--accent)' }}
            >
              {t('cookieSettings')}
            </button>
          )}
          <button
            type="button"
            onClick={() => (showDetails ? choose(stats, ga) : choose(false, false))}
            className={`${buttonBase} hover:opacity-80`}
            style={{
              background: 'var(--app-card)',
              color: 'var(--app-text-primary)',
              border: '1px solid var(--app-border)',
            }}
          >
            {showDetails ? t('cookieSaveSelection') : t('cookieNecessaryOnly')}
          </button>
          <button
            type="button"
            onClick={() => choose(true, true)}
            className={`${buttonBase} text-white hover:opacity-90`}
            style={{ background: 'var(--accent)', border: '1px solid var(--accent)' }}
          >
            {t('cookieAcceptAll')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Purpose({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-3.5 py-3" style={{ background: 'var(--app-card)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold leading-snug" style={{ color: 'var(--app-text-primary)' }}>{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: 'var(--app-text-secondary)' }}>{desc}</p>
      </div>
      <div className="flex-shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-[28px] w-[46px] rounded-full transition-colors duration-200"
      style={{ background: checked ? 'var(--accent)' : 'var(--app-card-alt)', border: '1px solid var(--app-border)' }}
    >
      <span
        className="absolute top-[2px] h-[22px] w-[22px] rounded-full bg-white shadow transition-[left] duration-200"
        style={{ left: checked ? 20 : 2 }}
      />
    </button>
  );
}
