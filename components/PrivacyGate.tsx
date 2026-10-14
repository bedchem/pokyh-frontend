'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import PrivacyChoices from '@/components/PrivacyChoices';
import { useSession } from '@/providers/SessionProvider';
import { useT } from '@/providers/LocaleProvider';
import { privacyDict } from '@/lib/i18n/dictionaries/privacy';
import {
  PRIVACY_NOTICE_DATE,
  PRIVACY_NOTICE_VERSION,
  acknowledgePrivacy,
  clearPendingAck,
  fetchPrivacyStatus,
  takePendingAck,
} from '@/lib/privacy-consent';

// Inside the app: the account must have acknowledged the current privacy
// notice. A choice made on the sign-in form is sent here first (the backend
// token only exists after signing in); otherwise, when the server has no
// acknowledgement of this version — first sign-in from another device, or the
// notice changed — this asks for it before the app can be used. The usage
// statistics are offered again, unticked; not ticking them withdraws consent.
//
// When the backend cannot be reached nothing is blocked: the app keeps
// working and the question comes back on the next visit.
export default function PrivacyGate() {
  const { user, logout } = useSession();
  const t = useT(privacyDict);
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [usageStats, setUsageStats] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const account = user?.username ?? null;

  useEffect(() => {
    if (!account) return;
    let alive = true;
    (async () => {
      const pending = takePendingAck();
      if (pending && await acknowledgePrivacy(pending.usageStats)) {
        clearPendingAck();
        return;
      }
      const status = await fetchPrivacyStatus();
      if (alive && status && status.acknowledgedVersion !== PRIVACY_NOTICE_VERSION) setOpen(true);
    })();
    return () => { alive = false; };
  }, [account]);

  async function confirm() {
    if (!acknowledged) {
      setHighlight(true);
      setError(t('ackRequired'));
      return;
    }
    setSaving(true);
    setError('');
    const ok = await acknowledgePrivacy(usageStats);
    setSaving(false);
    if (ok) {
      clearPendingAck();
      setOpen(false);
    } else {
      setError(t('saveError'));
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:px-4 sm:py-8 fade-backdrop"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-gate-title"
        className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] slide-up"
        style={{ background: 'var(--app-surface)', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}
      >
        <div className="px-5 pt-5" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>
            <ShieldCheck size={12} /> POKYH
          </p>
          <h2 id="privacy-gate-title" className="text-[19px] font-bold leading-snug" style={{ color: 'var(--app-text-primary)' }}>
            {t('gateTitle')}
          </h2>
          <p className="mt-2 mb-4 text-[14px] leading-relaxed" style={{ color: 'var(--app-text-secondary)' }}>
            {t('gateIntro', { date: PRIVACY_NOTICE_DATE.toLocaleDateString('de-AT') })}
          </p>

          <PrivacyChoices
            acknowledged={acknowledged}
            onAcknowledged={(next) => { setAcknowledged(next); if (next) setError(''); }}
            usageStats={usageStats}
            onUsageStats={setUsageStats}
            highlightAck={highlight}
          />

          {error && (
            <p className="mt-3 text-[13px]" role="alert" style={{ color: 'var(--warning)' }}>{error}</p>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void logout()}
              className="popup-ghost-btn h-11 px-3 rounded-xl text-[14px] font-semibold"
            >
              {t('logout')}
            </button>
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={saving}
              className="popup-primary-btn h-11 px-5 rounded-xl inline-flex items-center gap-2 text-[15px] font-semibold"
            >
              {saving && <Spinner size={16} />}
              {saving ? t('saving') : t('confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
