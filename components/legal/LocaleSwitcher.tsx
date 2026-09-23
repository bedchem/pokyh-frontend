'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import FlagIcon from '@/components/FlagIcon';
import LadinWarningBadge from '@/components/LadinWarningBadge';
import { LEGAL_LOCALES, type LegalLocale, type LegalView } from './legalLocale';

export type { LegalLocale, LegalView };

const LOCALE_LABELS: Record<LegalLocale, string> = { it: 'IT', de: 'DE', lld: 'LD', en: 'EN' };

// Per-locale accessible name for this widget, so every view (not just
// whichever call site remembered to pass one) gets a correctly localised
// aria-label.
const SWITCHER_ARIA_LABEL: Record<LegalLocale, string> = {
  de: 'Sprache',
  it: 'Lingua',
  en: 'Language',
  lld: 'Rujeneda',
};

/**
 * Locale dropdown for the legal notice views. Reads the current locale from
 * the parent (already resolved server-side from the `?lang=` query param) and
 * writes it back via plain links, preserving the current `?view=`.
 */
export default function LocaleSwitcher({
  view,
  locale,
  ariaLabel,
}: {
  view: LegalView;
  locale: LegalLocale;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="press-scale cursor-pointer flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
        style={{ background: 'var(--app-card-alt)', color: 'var(--app-text-secondary)' }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel ?? SWITCHER_ARIA_LABEL[locale]}
      >
        <FlagIcon locale={locale} size={16} className="rounded-[2px]" />
        {LOCALE_LABELS[locale]}
        <ChevronDown
          size={13}
          strokeWidth={2.4}
          aria-hidden="true"
          style={{ color: 'var(--app-text-tertiary)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute right-0 mt-2 py-1 rounded-xl fade-in z-50"
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', minWidth: 110 }}
        >
          {LEGAL_LOCALES.map((item) => (
            <li key={item}>
              {/* Plain <a>: switching locale swaps the root layout, so do a full load */}
              <a
                href={`/${item}/legal/?view=${view}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm transition-opacity hover:opacity-70"
                style={{ color: item === locale ? 'var(--accent)' : 'var(--app-text-primary)' }}
              >
                <FlagIcon locale={item} size={16} className="rounded-[2px]" />
                {LOCALE_LABELS[item]}
                {item === 'lld' && <LadinWarningBadge />}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
