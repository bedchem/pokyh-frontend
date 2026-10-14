'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { useDateLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { privacyDict } from '@/lib/i18n/dictionaries/privacy';
import { fetchPrivacyStatus, setUsageStatsConsent, type PrivacyStatus } from '@/lib/privacy-consent';

// The profile's privacy block: the usage-statistics consent as a switch
// (withdrawing deletes what was measured), when the notice was acknowledged,
// and the notice itself.
export default function PrivacySettings() {
  const t = useT(privacyDict);
  const localize = useLocalizeHref();
  const { tag } = useDateLocale();
  const [status, setStatus] = useState<PrivacyStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetchPrivacyStatus().then((next) => { if (alive) setStatus(next); });
    return () => { alive = false; };
  }, []);

  async function toggle() {
    if (!status || saving) return;
    const enabled = !status.usageStats;
    setSaving(true);
    setError('');
    const ok = await setUsageStatsConsent(enabled);
    setSaving(false);
    if (ok) setStatus({ ...status, usageStats: enabled, usageStatsAt: new Date().toISOString() });
    else setError(t('saveError'));
  }

  const acknowledged = status?.acknowledgedAt
    ? new Date(status.acknowledgedAt).toLocaleDateString(tag === 'lld' ? 'de-AT' : tag)
    : t('profileAckNever');

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--app-surface)' }}>
      <div className="px-4 py-3 flex items-start gap-3" style={{ borderBottom: '1px solid var(--app-separator)' }}>
        <div className="flex-1 min-w-0">
          <p className="text-[15px]" style={{ color: 'var(--app-text-primary)' }}>{t('profileUsage')}</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--app-text-tertiary)' }}>{t('profileUsageHint')}</p>
          {error && <p className="mt-1 text-[12.5px]" role="alert" style={{ color: 'var(--warning)' }}>{error}</p>}
        </div>
        {status === null ? (
          <span className="mt-1 flex-shrink-0"><Spinner size={18} /></span>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={status.usageStats}
            aria-label={t('profileUsage')}
            onClick={() => void toggle()}
            disabled={saving}
            className="relative mt-0.5 h-[31px] w-[51px] flex-shrink-0 rounded-full transition-colors disabled:opacity-60"
            style={{ background: status.usageStats ? 'var(--accent)' : 'var(--app-card-alt)' }}
          >
            <span
              className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-[left] duration-200"
              style={{ left: status.usageStats ? 22 : 2 }}
            />
          </button>
        )}
      </div>
      <div className="px-4 flex items-center justify-between gap-3" style={{ minHeight: 44, borderBottom: '1px solid var(--app-separator)' }}>
        <span className="text-[15px]" style={{ color: 'var(--app-text-primary)' }}>{t('profileAck')}</span>
        <span className="text-[15px]" style={{ color: 'var(--app-text-secondary)' }}>{acknowledged}</span>
      </div>
      <Link
        href={localize('/legal?view=datenschutz')}
        className="px-4 flex items-center justify-between gap-3"
        style={{ minHeight: 44 }}
      >
        <span className="text-[15px]" style={{ color: 'var(--app-text-primary)' }}>{t('profilePolicy')}</span>
        <ChevronRight size={18} style={{ color: 'var(--app-text-tertiary)' }} />
      </Link>
    </div>
  );
}
