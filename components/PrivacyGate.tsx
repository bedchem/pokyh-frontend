'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { useSession } from '@/providers/SessionProvider';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { privacyDict } from '@/lib/i18n/dictionaries/privacy';
import { COOKIE_CONSENT_EVENT, cookieChoiceNeeded } from '@/lib/cookie-consent';
import {
  PRIVACY_NOTICE_DATE,
  PRIVACY_NOTICE_VERSION,
  acknowledgePrivacy,
  clearPendingAck,
  fetchPrivacyStatus,
  forgetOpenGate,
  hasPendingAck,
  isGateOpen,
  rememberOpenGate,
  syncCookieChoice,
} from '@/lib/privacy-consent';

// Inside the app: the account is told about the current privacy notice once.
// The sign-in form already showed it and is recorded here first (the backend
// token only exists after signing in); otherwise, when the server has no
// record of this version: first sign-in from another device, or the notice
// changed: a banner says it was updated, with the way to the notice, until
// "Verstanden". It informs (GDPR Art. 13), so it asks nothing and blocks
// nothing; the optional statistics are chosen in the cookie banner, whose
// choice reaches the account here too, and which goes first when both are due.
//
// When the backend cannot be reached nothing is shown and the notice comes
// back on the next visit. Once shown it stays until "Verstanden", whatever
// navigation or reload comes in between (rememberOpenGate); `paused` only hides
// it: on the sign-in form and on the privacy notice itself.
export default function PrivacyGate({ paused = false }: { paused?: boolean }) {
  const { user } = useSession();
  const t = useT(privacyDict);
  const localize = useLocalizeHref();
  const account = user?.username ?? null;
  // Shown before in this tab and not confirmed yet: back at once (the layout
  // keys this component by account).
  const [open, setOpen] = useState(() => (account ? isGateOpen(account) : false));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cookieBannerOpen, setCookieBannerOpen] = useState(() => cookieChoiceNeeded());

  useEffect(() => {
    if (!account) return;
    let alive = true;
    (async () => {
      if (hasPendingAck() && await acknowledgePrivacy()) {
        clearPendingAck();
        forgetOpenGate();
        if (alive) setOpen(false);
      } else {
        const status = await fetchPrivacyStatus();
        if (alive && status) {
          const due = status.acknowledgedVersion !== PRIVACY_NOTICE_VERSION;
          if (due) rememberOpenGate(account);
          else forgetOpenGate();
          setOpen(due);
        }
      }
      await syncCookieChoice();
    })();
    return () => { alive = false; };
  }, [account]);

  // One banner at a time: this one waits for the cookie choice.
  useEffect(() => {
    const chosen = () => setCookieBannerOpen(false);
    window.addEventListener(COOKIE_CONSENT_EVENT, chosen);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, chosen);
  }, []);

  async function confirm() {
    setSaving(true);
    setError('');
    const ok = await acknowledgePrivacy();
    setSaving(false);
    if (ok) {
      clearPendingAck();
      forgetOpenGate();
      setOpen(false);
    } else {
      setError(t('saveError'));
    }
  }

  if (!open || paused || cookieBannerOpen) return null;

  return (
    <div
      role="region"
      aria-labelledby="privacy-banner-title"
      className="fixed bottom-0 left-0 right-0 z-[95] px-4 pt-0 sm:px-6 slide-up"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div
        className="mx-auto max-w-2xl rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}
          >
            <ShieldCheck size={17} color="var(--accent)" />
          </div>
          <div className="min-w-0">
            <p id="privacy-banner-title" className="text-[15px] font-bold leading-snug" style={{ color: 'var(--app-text-primary)' }}>
              {t('gateTitle')}
            </p>
            <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: 'var(--app-text-secondary)' }}>
              {t('gateIntro', { date: PRIVACY_NOTICE_DATE.toLocaleDateString('de-AT') })}{' '}
              <Link
                href={localize('/legal?view=datenschutz')}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 font-semibold hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                {t('readPolicy')}
                <ExternalLink size={12} />
              </Link>
            </p>
            {error && (
              <p className="mt-1.5 text-[13px]" role="alert" style={{ color: 'var(--warning)' }}>{error}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={saving}
          className="popup-primary-btn h-11 px-5 rounded-xl inline-flex items-center justify-center gap-2 text-[15px] font-semibold flex-shrink-0"
        >
          {saving && <Spinner size={16} />}
          {saving ? t('saving') : t('confirm')}
        </button>
      </div>
    </div>
  );
}
