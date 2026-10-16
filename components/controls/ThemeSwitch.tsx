'use client';

import { Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from '@/providers/ThemeProvider';
import { useT } from '@/providers/LocaleProvider';
import { siteDict } from '@/lib/i18n/dictionaries/site';

// One button that flips between light and dark, with the circular reveal the
// ThemeProvider draws from the pointer position.
export default function ThemeSwitch({ className }: { className?: string }) {
  const { resolved, toggleWithRipple } = useTheme();
  const t = useT(siteDict);
  const dark = resolved === 'dark';

  return (
    <button
      type="button"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX || rect.left + rect.width / 2;
        const y = e.clientY || rect.top + rect.height / 2;
        toggleWithRipple({ clientX: x, clientY: y });
      }}
      aria-label={`${t('theme')}: ${dark ? t('themeLight') : t('themeDark')}`}
      title={dark ? t('themeLight') : t('themeDark')}
      className={`grid place-items-center size-9 rounded-full text-ink-2 hover:text-ink hover:bg-inset transition-colors press ${className ?? ''}`}
    >
      {dark ? <Sun size={19} weight="bold" /> : <Moon size={19} weight="bold" />}
    </button>
  );
}
