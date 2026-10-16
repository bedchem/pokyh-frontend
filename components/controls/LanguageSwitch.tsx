'use client';

import { useLocale, useT } from '@/providers/LocaleProvider';
import { ACTIVE_LOCALES, LOCALE_LABELS, LOCALE_NAMES } from '@/lib/i18n/locale';
import { siteDict } from '@/lib/i18n/dictionaries/site';

// DE · IT · EN as plain text buttons: all options visible at once, the current
// one in full ink. Switching is a full page load under the new prefix
// (see LocaleProvider).
export default function LanguageSwitch({ className, size = 'sm' }: { className?: string; size?: 'sm' | 'lg' }) {
  const { locale, setLocale } = useLocale();
  const t = useT(siteDict);
  const text = size === 'lg' ? 'text-[17px] h-11 px-3' : 'text-[13px] h-9 px-2';

  return (
    <div role="group" aria-label={t('language')} className={`flex items-center ${className ?? ''}`}>
      {ACTIVE_LOCALES.map((l, i) => {
        const current = l === locale;
        return (
          <span key={l} className="flex items-center">
            {i > 0 && <span aria-hidden="true" className="text-ink-3/60 select-none">/</span>}
            <button
              type="button"
              lang={l}
              onClick={() => setLocale(l)}
              aria-pressed={current}
              aria-label={LOCALE_NAMES[l]}
              className={`${text} font-semibold tracking-wide rounded-md transition-colors ${
                current ? 'text-ink' : 'text-ink-3 hover:text-ink'
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          </span>
        );
      })}
    </div>
  );
}
