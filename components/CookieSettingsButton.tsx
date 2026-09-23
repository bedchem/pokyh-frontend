'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useT } from '@/providers/LocaleProvider';
import { commonDict } from '@/lib/i18n/dictionaries/common';

export const COOKIE_SETTINGS_EVENT = 'pokyh-open-cookie-settings';

export function CookieSettingsButton({
  label,
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  const t = useT(commonDict);
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}
      className={compact ? 'inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70' : 'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold transition-opacity hover:opacity-70'}
      style={compact ? { color: 'var(--accent)' } : { color: 'var(--app-text-secondary)', background: 'var(--app-card)', border: '1px solid var(--app-border)' }}
    >
      <SlidersHorizontal size={compact ? 14 : 15} />
      {label ?? t('cookieOpenSettings')}
    </button>
  );
}
