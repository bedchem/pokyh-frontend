'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { privacyDict } from '@/lib/i18n/dictionaries/privacy';

// The two choices asked at sign-in and in PrivacyGate: that the privacy notice
// was read (required) and the usage statistics (optional, never preset). Kept
// visually apart so the optional one never reads as part of the required one.
export default function PrivacyChoices({ acknowledged, onAcknowledged, usageStats, onUsageStats, highlightAck = false }: {
  acknowledged: boolean;
  onAcknowledged: (next: boolean) => void;
  usageStats: boolean;
  onUsageStats: (next: boolean) => void;
  // Marks the required box after a submit without it.
  highlightAck?: boolean;
}) {
  const t = useT(privacyDict);
  const localize = useLocalizeHref();

  return (
    <div className="flex flex-col gap-2.5">
      <Link
        href={localize('/legal?view=datenschutz')}
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold hover:underline"
        style={{ color: 'var(--accent)' }}
      >
        {t('readPolicy')}
        <ExternalLink size={13} />
      </Link>

      <label
        className="flex items-start gap-3 rounded-xl px-3.5 py-3 cursor-pointer transition-colors"
        style={{
          background: 'var(--app-card)',
          border: `1px solid ${highlightAck && !acknowledged ? 'color-mix(in srgb, var(--warning) 45%, transparent)' : 'var(--app-border)'}`,
        }}
      >
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => onAcknowledged(e.target.checked)}
          className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 cursor-pointer"
          style={{ accentColor: 'var(--accent)' }}
          required
        />
        <span className="text-[14px] font-medium leading-snug" style={{ color: 'var(--app-text-primary)' }}>
          {t('ackLabel')}
        </span>
      </label>

      <label
        className="flex items-start gap-3 rounded-xl px-3.5 py-3 cursor-pointer"
        style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)' }}
      >
        <input
          type="checkbox"
          checked={usageStats}
          onChange={(e) => onUsageStats(e.target.checked)}
          className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 cursor-pointer"
          style={{ accentColor: 'var(--accent)' }}
        />
        <span className="min-w-0">
          <span className="block text-[14px] font-medium leading-snug" style={{ color: 'var(--app-text-primary)' }}>
            {t('usageLabel')}
          </span>
          <span className="mt-1 block text-[12.5px] leading-relaxed" style={{ color: 'var(--app-text-tertiary)' }}>
            {t('usageDesc')}
          </span>
        </span>
      </label>
    </div>
  );
}
