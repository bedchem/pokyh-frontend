'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowSquareOut, ShieldCheck } from '@phosphor-icons/react';
import Spinner from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/providers/SessionProvider';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { privacyDict } from '@/lib/i18n/dictionaries/privacy';
import { COOKIE_CONSENT_EVENT, cookieChoiceNeeded } from '@/lib/cookie-consent';
import {
  PRIVACY_NOTICE_DATE,
  acknowledgePrivacy,
  clearPendingAck,
  fetchPrivacyStatus,
  forgetOpenGate,
  hasPendingAck,
  isGateOpen,
  rememberOpenGate,
  syncCookieChoice,
} from '@/lib/privacy-consent';
import { noticeCovers } from '@/lib/privacy-notice';

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
          const due = !noticeCovers(status.acknowledgedVersion);
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
      <div className="squircle mx-auto flex max-w-2xl flex-col gap-4 rounded-[24px] bg-surface p-5 text-ink shadow-[var(--shadow-float)] sm:flex-row sm:items-center sm:p-6">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <span aria-hidden="true" className="grid size-10 flex-shrink-0 place-items-center rounded-full bg-periwinkle text-periwinkle-ink">
            <ShieldCheck size={19} weight="bold" />
          </span>
          <div className="min-w-0">
            <p id="privacy-banner-title" className="text-[16px] font-bold leading-snug tracking-[-0.015em]">
              {t('gateTitle')}
            </p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
              {t('gateIntro', { date: PRIVACY_NOTICE_DATE.toLocaleDateString('de-AT') })}{' '}
              <Link
                href={localize('/legal/datenschutz')}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 font-semibold text-accent-ink underline-offset-4 hover:underline"
              >
                {t('readPolicy')}
                <ArrowSquareOut size={13} weight="bold" aria-hidden="true" />
              </Link>
            </p>
            {error && (
              <p className="mt-1.5 text-[13px]" role="alert" style={{ color: 'var(--warning)' }}>{error}</p>
            )}
          </div>
        </div>
        <Button onClick={() => void confirm()} disabled={saving} className="flex-shrink-0">
          {saving && <Spinner size={16} />}
          {saving ? t('saving') : t('confirm')}
        </Button>
      </div>
    </div>
  );
}
