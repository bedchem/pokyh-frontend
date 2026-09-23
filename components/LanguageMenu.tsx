'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocale } from '@/providers/LocaleProvider';
import { ACTIVE_LOCALES, LOCALE_LABELS } from '@/lib/i18n/locale';
import FlagIcon from '@/components/FlagIcon';
import LadinWarningBadge from '@/components/LadinWarningBadge';

export default function LanguageMenu({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
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
    <div className={`relative ${className ?? ''}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="press-scale cursor-pointer flex items-center gap-1.5 rounded-full px-2.5 py-1.5"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Language"
      >
        <FlagIcon locale={locale} size={18} className="rounded-[2px]" />
        <span className="text-[11px] font-bold" style={{ color: 'var(--app-text-secondary)' }}>
          {LOCALE_LABELS[locale]}
        </span>
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
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', minWidth: 120 }}
        >
          {ACTIVE_LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setLocale(l); setOpen(false); }}
                className="w-full cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-left transition-opacity hover:opacity-70"
                style={{ color: l === locale ? 'var(--accent)' : 'var(--app-text-primary)' }}
              >
                <FlagIcon locale={l} size={18} className="rounded-[2px]" />
                {LOCALE_LABELS[l]}
                {l === 'lld' && <LadinWarningBadge />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
