'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeCtx {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
  toggleWithRipple: (e: { clientX: number; clientY: number }, next: Theme) => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: 'system',
  resolved: 'dark',
  setTheme: () => {},
  toggleWithRipple: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('pockyh_theme') as Theme) ?? 'system';
    setThemeState(saved);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mq.matches);
      setResolved(isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('pockyh_theme', t);
    // Direkt DOM-Klasse setzen — nötig damit View Transitions synchron greifen
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = t === 'dark' || (t === 'system' && mq.matches);
    document.documentElement.classList.toggle('dark', isDark);
  };

  const toggleWithRipple = (e: { clientX: number; clientY: number }, next: Theme) => {
    document.documentElement.style.setProperty('--ripple-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--ripple-y', e.clientY + 'px');
    const vt = (document as any).startViewTransition;
    if (vt) {
      vt.call(document, () => setTheme(next));
    } else {
      const { clientX: x, clientY: y } = e;
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const el = document.createElement('div');
      const bg = next === 'light' ? '#F1F0F8' : '#09090C';
      el.style.cssText = `position:fixed;top:${y}px;left:${x}px;width:0;height:0;border-radius:50%;background:${bg};z-index:99999;pointer-events:none;transform:translate(-50%,-50%);transition:width 2s cubic-bezier(.4,0,.2,1),height 2s cubic-bezier(.4,0,.2,1)`;
      document.body.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.width = el.style.height = r * 2 + 'px'; }));
      setTimeout(() => { setTheme(next); el.remove(); }, 2020);
    }
  };

  return <Ctx.Provider value={{ theme, resolved, setTheme, toggleWithRipple }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
