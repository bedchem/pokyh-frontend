'use client';

import { Desktop, Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from '@/providers/ThemeProvider';
import { useT } from '@/providers/LocaleProvider';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import { switchThemeFrom, useSiteDark } from '@/lib/site-theme';

// Light and dark for the public pages. The choice is saved (ThemeProvider,
// localStorage); until someone picks one, the system setting decides.

type Theme = 'light' | 'dark' | 'system';

function origin(e: React.MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  return { x: e.clientX || r.left + r.width / 2, y: e.clientY || r.top + r.height / 2 };
}

/** One button that flips between light and dark; its look comes from `className`. */
export function ThemeButton({ className = '' }: { className?: string }) {
  const { setTheme } = useTheme();
  const dark = useSiteDark();
  const t = useT(siteDict);
  const next: Theme = dark ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={(e) => {
        const { x, y } = origin(e);
        switchThemeFrom(() => setTheme(next), x, y);
      }}
      aria-label={`${t('theme')}: ${dark ? t('themeLight') : t('themeDark')}`}
      title={dark ? t('themeLight') : t('themeDark')}
      className={`grid place-items-center ${className}`}
    >
      <span className="relative block size-5">
        <Sun size={20} weight="bold" aria-hidden="true" className={`absolute inset-0 transition-[opacity,transform] duration-500 ease-[var(--ease-out)] ${dark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
        <Moon size={20} weight="bold" aria-hidden="true" className={`absolute inset-0 transition-[opacity,transform] duration-500 ease-[var(--ease-out)] ${dark ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
      </span>
    </button>
  );
}

/** System, light or dark, as three segments. */
export function ThemeSegments({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const t = useT(siteDict);
  const options: { value: Theme; label: string; Icon: typeof Sun }[] = [
    { value: 'system', label: t('themeSystem'), Icon: Desktop },
    { value: 'light', label: t('themeLight'), Icon: Sun },
    { value: 'dark', label: t('themeDark'), Icon: Moon },
  ];

  return (
    <div role="radiogroup" aria-label={t('theme')} className={`inline-flex gap-1 rounded-full bg-white/8 p-1 ${className}`}>
      {options.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={(e) => {
              if (active) return;
              const { x, y } = origin(e);
              switchThemeFrom(() => setTheme(value), x, y);
            }}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold transition-colors duration-300 ${
              active ? 'bg-white/16 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            <Icon size={15} weight="bold" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
