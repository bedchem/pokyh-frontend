'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { X } from '@phosphor-icons/react';
import { COOKIE_SETTINGS_EVENT } from '@/components/CookieSettingsButton';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import {
  ASK_AGAIN_AFTER_MS,
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  cookieChoiceNeeded,
  readCookieChoice,
  saveCookieChoice,
} from '@/lib/cookie-consent';
import { syncCookieChoice } from '@/lib/privacy-consent';

export { COOKIE_CONSENT_STORAGE_KEY } from '@/lib/cookie-consent';

// The banner is part of the page as built, so it shows with the first paint
// instead of after the scripts (on a first visit it is the largest thing on a
// phone's screen). Whether it is due is only known in the browser: this
// script in the head marks the page before that paint, the same test as
// cookieChoiceNeeded() (a choice that is not readable counts as none), and
// globals.css shows the banner as built only on a marked page. Once the page
// runs, the banner below takes over.
const ASK_INIT = `(function(){var a=1;try{var r=localStorage.getItem(${JSON.stringify(COOKIE_CONSENT_STORAGE_KEY)});if(r){var c=r==='all'?{stats:!0,ga:!0,at:''}:r==='necessary'?{stats:!1,ga:!1,at:''}:JSON.parse(r);if(c&&typeof c.stats==='boolean'&&typeof c.ga==='boolean'&&typeof c.at==='string'){var t=Date.parse(c.at);a=!c.stats&&!(t===t&&Date.now()-t<=${ASK_AGAIN_AFTER_MS})}}}catch(e){}if(a)document.documentElement.setAttribute('data-cookie-ask','')})()`;

const noopSubscribe = () => () => {};

/** Marks a page whose visitor still has to choose; rendered with the server HTML only, like ThemeScript. */
export function CookieAskScript() {
  const fromServerHtml = useSyncExternalStore(noopSubscribe, () => false, () => true);
  if (!fromServerHtml) return null;
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: ASK_INIT }} />;
}

function subscribeChoice(fn: () => void) {
  window.addEventListener(COOKIE_CONSENT_EVENT, fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, fn);
    window.removeEventListener('storage', fn);
  };
}

// "Alle akzeptieren" and "Nur notwendige" are offered side by side, the same
// size and equally easy to reach; the X means "Nur notwendige". The settings
// list each optional purpose with its own switch, never preset (GDPR Art. 7,
// CJEU C-673/17 Planet49, EDPB guidelines 03/2022 on deceptive design).
export default function CookieBanner({ analyticsEnabled = false }: { analyticsEnabled?: boolean }) {
  // null in the page as built and while it comes alive (the head script
  // decides there), then whether this browser still has to choose.
  const needed = useSyncExternalStore(subscribeChoice, () => cookieChoiceNeeded(), () => null);
  // Chosen on this page: closed even where storage is blocked and the choice
  // cannot be read back.
  const [dismissed, setDismissed] = useState(false);
  const [reopened, setReopened] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState(false);
  const [ga, setGa] = useState(false);
  const t = useT(commonDict);
  const localize = useLocalizeHref();

  useEffect(() => {
    function openSettings() {
      // Opened again later: the switches show the choice in force.
      const current = readCookieChoice();
      setStats(current?.stats ?? false);
      setGa(current?.ga ?? false);
      setShowDetails(true);
      setReopened(true);
    }

    window.addEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  function choose(nextStats: boolean, nextGa: boolean) {
    saveCookieChoice(nextStats, analyticsEnabled && nextGa);
    // Signed in: the account's consent follows at once; otherwise right
    // after the next sign-in (PrivacyGate).
    void syncCookieChoice();
    setShowDetails(false);
    setReopened(false);
    setDismissed(true);
    document.documentElement.removeAttribute('data-cookie-ask');
  }

  // No floating button once a choice is made. Consent stays revocable through
  // the "Cookie-Einstellungen öffnen" button on the Cookie-Richtlinie page
  // (reachable via Rechtliches and the "Cookies" footer link), which dispatches
  // COOKIE_SETTINGS_EVENT to reopen this banner, and in the profile.
  const pending = needed === null && !reopened;
  if (!pending && !reopened && (dismissed || !needed)) return null;

  const buttonBase = 'min-w-[9rem] flex-1 h-12 rounded-full text-[15px] font-semibold press transition-colors';

  return (
    <div
      role="dialog"
      aria-label={t('cookieDialog')}
      data-cookie-banner={pending ? 'pending' : 'open'}
      className="fixed inset-x-0 bottom-0 z-[999] p-3 sm:p-6 sm:right-auto sm:max-w-[480px]"
      style={{ paddingBottom: 'max(12px, var(--safe-bottom))' }}
    >
      <div className="squircle max-h-[85dvh] overflow-y-auto rounded-[28px] bg-surface p-5 sm:p-6 text-ink shadow-[var(--shadow-float)]">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[19px] font-extrabold leading-tight tracking-[-0.025em]">{t('cookieTitle')}</p>
          <button
            type="button"
            onClick={() => choose(false, false)}
            className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-inset hover:text-ink transition-colors"
            aria-label={t('cookieCloseNecessary')}
          >
            <X size={18} weight="bold" />
          </button>
        </div>
        <p className="mt-2 text-[14px] leading-[1.55] text-ink-2">
          {analyticsEnabled ? t('cookieTextAnalytics') : t('cookieText')}
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] font-semibold">
          {/* Fetched on hover, not as soon as the banner shows: on a first
              visit it is on every page, and the pages behind are rarely opened. */}
          <Link href={localize('/legal/cookies')} prefetch={false} className="text-accent-ink underline-offset-4 hover:underline">
            {t('cookiePolicyLink')}
          </Link>
          <Link href={localize('/legal/datenschutz')} prefetch={false} className="text-accent-ink underline-offset-4 hover:underline">
            {t('cookiePrivacyLink')}
          </Link>
        </p>

        {showDetails && (
          <div className="mt-4 divide-y divide-line border-y border-line">
            <Purpose title={t('cookieNecessaryTitle')} desc={t('cookieNecessaryDesc')}>
              <span className="text-[12px] font-semibold text-ink-3">{t('cookieAlwaysOn')}</span>
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

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => (showDetails ? choose(stats, ga) : choose(false, false))}
            className={`${buttonBase} bg-ink text-canvas hover:bg-[color-mix(in_srgb,var(--ink)_86%,var(--canvas))]`}
          >
            {showDetails ? t('cookieSaveSelection') : t('cookieNecessaryOnly')}
          </button>
          <button
            type="button"
            onClick={() => choose(true, true)}
            className={`${buttonBase} bg-accent text-on-accent hover:bg-[color-mix(in_srgb,var(--accent)_88%,#000)]`}
          >
            {t('cookieAcceptAll')}
          </button>
        </div>
        {!showDetails && (
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="mt-3 text-[14px] font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline"
          >
            {t('cookieSettings')}
          </button>
        )}
      </div>
    </div>
  );
}

function Purpose({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold leading-snug text-ink">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{desc}</p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
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
      className={`relative h-[30px] w-[50px] rounded-full transition-colors duration-200 ${checked ? 'bg-accent' : 'bg-inset'}`}
    >
      <span
        className="absolute top-[3px] size-6 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)] transition-[left] duration-200 ease-[var(--ease-out)]"
        style={{ left: checked ? 23 : 3 }}
      />
    </button>
  );
}
