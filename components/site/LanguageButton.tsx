'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';
import { useLocale, useT } from '@/providers/LocaleProvider';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import { ACTIVE_LOCALES, LOCALE_LABELS, LOCALE_NAMES, type Locale } from '@/lib/i18n/locale';
import FlagIcon from '@/components/FlagIcon';

// The language of the public pages: a round flag and the code in the header;
// a small menu lists the languages by their own names. Arrow keys, Home/End
// and Escape work as in a native menu. Switching loads the same page in the
// other language (LocaleProvider).

/** A flag cropped to a circle, with a hairline so white stripes keep an edge. */
export function RoundFlag({ locale, size = 20 }: { locale: Locale; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="relative block shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <FlagIcon locale={locale} size={Math.round(size * 1.5)} className="absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2" />
      <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]" />
    </span>
  );
}

export default function LanguageButton({
  className = '',
  align = 'right',
  placement = 'below',
  compact = false,
  buttonClassName,
}: {
  className?: string;
  align?: 'left' | 'right';
  /** Where the menu opens; 'above' for a button at the bottom of the screen. */
  placement?: 'below' | 'above';
  /** Only the flag. */
  compact?: boolean;
  /** Replaces the button's own look. */
  buttonClassName?: string;
}) {
  const t = useT(siteDict);
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, ACTIVE_LOCALES.indexOf(locale)));
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const close = useCallback((focusButton: boolean) => {
    setOpen(false);
    if (focusButton) button.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) close(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, close]);

  useEffect(() => {
    if (open) items.current[active]?.focus({ preventScroll: true });
  }, [open, active]);

  const pick = (l: Locale) => {
    setOpen(false);
    if (l !== locale) setLocale(l);
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    const last = ACTIVE_LOCALES.length - 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i >= last ? 0 : i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i <= 0 ? last : i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(last); }
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') close(false);
  };

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={button}
        type="button"
        onClick={() => { setActive(Math.max(0, ACTIVE_LOCALES.indexOf(locale))); setOpen((o) => !o); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        // The visible abbreviation (EN) is part of the name, as screen reader and voice control users hear and say it.
        aria-label={compact ? `${t('language')}: ${LOCALE_NAMES[locale]}` : `${t('language')}: ${LOCALE_NAMES[locale]}, ${LOCALE_LABELS[locale]}`}
        title={compact ? `${t('language')}: ${LOCALE_NAMES[locale]}` : undefined}
        className={buttonClassName ?? 'flex h-10 items-center gap-2 rounded-full px-2.5 text-[14px] font-semibold opacity-85 transition-[opacity,background-color] hover:bg-current/[0.06] hover:opacity-100 aria-expanded:opacity-100'}
      >
        <RoundFlag locale={locale} size={20} />
        {!compact && <span>{LOCALE_LABELS[locale]}</span>}
        {!compact && (
          <CaretDown
            size={12}
            weight="bold"
            aria-hidden="true"
            className={`transition-transform duration-300 ${(placement === 'above') !== open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={t('languageTitle')}
          onKeyDown={onMenuKey}
          className={`lang-menu absolute z-50 w-[208px] rounded-[18px] bg-[var(--surface)] p-1.5 text-ink shadow-[0_18px_44px_-16px_rgb(0_0_0/0.35)] ${
            placement === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${
            align === 'right'
              ? placement === 'above' ? 'right-0 origin-bottom-right' : 'right-0 origin-top-right'
              : placement === 'above' ? 'left-0 origin-bottom-left' : 'left-0 origin-top-left'
          }`}
        >
          {ACTIVE_LOCALES.map((l, i) => {
            const current = l === locale;
            return (
              <button
                key={l}
                ref={(el) => { items.current[i] = el; }}
                type="button"
                role="menuitemradio"
                aria-checked={current}
                lang={l}
                tabIndex={i === active ? 0 : -1}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => pick(l)}
                className={`flex h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[15px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent-ink)] ${
                  i === active ? 'bg-inset' : ''
                } ${current ? 'font-semibold' : 'font-medium text-ink-2'}`}
              >
                <RoundFlag locale={l} size={20} />
                <span className="flex-1">{LOCALE_NAMES[l]}</span>
                {current && <Check size={15} weight="bold" aria-label={t('languageNow')} className="text-[var(--accent-ink)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** The three languages as one segmented control (menu on phones and footer, dark). */
export function LanguageSegments({ className = '' }: { className?: string }) {
  const t = useT(siteDict);
  const { locale, setLocale } = useLocale();
  const index = Math.max(0, ACTIVE_LOCALES.indexOf(locale));

  return (
    <div role="radiogroup" aria-label={t('language')} className={`relative inline-grid grid-flow-col auto-cols-fr rounded-full bg-white/8 p-1 ${className}`}>
      <span
        aria-hidden="true"
        className="absolute bottom-1 left-1 top-1 rounded-full bg-white/16 transition-transform duration-500 ease-[var(--ease-out)]"
        style={{ width: `calc((100% - 8px) / ${ACTIVE_LOCALES.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {ACTIVE_LOCALES.map((l) => {
        const current = l === locale;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={current}
            lang={l}
            aria-label={LOCALE_NAMES[l]}
            onClick={() => { if (!current) setLocale(l); }}
            className={`relative flex h-9 items-center justify-center gap-2 rounded-full px-3.5 text-[14px] font-semibold transition-colors duration-300 ${current ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            <RoundFlag locale={l} size={16} />
            {LOCALE_LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}
