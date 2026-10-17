'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, Globe } from '@phosphor-icons/react';
import { useLocale, useT } from '@/providers/LocaleProvider';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import { ACTIVE_LOCALES, LOCALE_LABELS, LOCALE_NAMES } from '@/lib/i18n/locale';

// The language of the public pages, from the header: the current code next
// to a globe; a small menu lists the others by their own names. Without a
// background, like the theme button beside it.
export default function LanguageButton({ className = '' }: { className?: string }) {
  const t = useT(siteDict);
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${t('language')}: ${LOCALE_NAMES[locale]}`}
        className="flex h-11 items-center gap-1.5 rounded-full px-2 text-[14px] font-bold opacity-80 transition-opacity hover:opacity-100"
      >
        <Globe size={19} weight="bold" aria-hidden="true" />
        {LOCALE_LABELS[locale]}
      </button>
      {open && (
        <ul
          id={menuId}
          role="menu"
          className="sheet-in absolute right-0 top-full z-10 mt-2 min-w-[168px] rounded-2xl bg-[var(--surface)] p-1.5 text-ink shadow-[0_18px_40px_-12px_rgb(0_0_0/0.35),0_0_0_1px_var(--line)]"
          style={{ animationDuration: '0.2s' }}
        >
          {ACTIVE_LOCALES.map((l) => (
            <li key={l} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={l === locale}
                lang={l}
                onClick={() => { setOpen(false); setLocale(l); }}
                className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left text-[15px] font-semibold transition-colors hover:bg-inset"
              >
                <span>
                  {LOCALE_NAMES[l]}
                  <span className="ml-2 text-[12px] font-bold text-ink-3">{LOCALE_LABELS[l]}</span>
                </span>
                {l === locale && <Check size={16} weight="bold" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
