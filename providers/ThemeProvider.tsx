'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeCtx {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
  toggleWithRipple: (e: { clientX: number; clientY: number }, explicit?: Theme) => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: 'system',
  resolved: 'dark',
  setTheme: () => {},
  toggleWithRipple: () => {},
});

function resolveTheme(t: Theme): 'light' | 'dark' {
  if (t === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return t;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark');
  const pendingRef = useRef<'light' | 'dark'>('dark');
  const activeCountRef = useRef(0);

  useEffect(() => {
    const saved = (localStorage.getItem('pockyh_theme') as Theme) ?? 'system';
    setThemeState(saved);
    pendingRef.current = resolveTheme(saved);
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
    const isDark = resolveTheme(t) === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  };

  const toggleWithRipple = (e: { clientX: number; clientY: number }, explicit?: Theme) => {
    const oldResolved = pendingRef.current;
    let next: Theme;
    let nextResolved: 'light' | 'dark';
    if (explicit !== undefined) {
      next = explicit;
      nextResolved = resolveTheme(explicit);
    } else {
      nextResolved = pendingRef.current === 'dark' ? 'light' : 'dark';
      next = nextResolved;
    }
    pendingRef.current = nextResolved;

    const { clientX: x, clientY: y } = e;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const isDark = nextResolved === 'dark';
    const oldBgColor = oldResolved === 'dark' ? '#09090C' : '#F1F0F8';
    const newBg = nextResolved === 'dark' ? '#09090C' : '#F1F0F8';

    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('pockyh_theme', next);
    setThemeState(next);
    setResolved(nextResolved);

    // Pin html background to the old color so the new-color circle has contrast
    activeCountRef.current++;
    document.documentElement.style.backgroundColor = oldBgColor;

    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;z-index:1;pointer-events:none;background:${newBg};clip-path:circle(0px at ${x}px ${y}px)`;
    document.documentElement.appendChild(overlay);

    const duration = 700;
    const start = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    function frame(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const cr = r * easeOut(t);
      overlay.style.clipPath = `circle(${cr}px at ${x}px ${y}px)`;
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        // Release the pinned background when all animations are done
        activeCountRef.current--;
        if (activeCountRef.current === 0) {
          document.documentElement.style.backgroundColor = '';
        }
        overlay.style.transition = 'opacity 0.2s ease';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 220);
      }
    }
    requestAnimationFrame(frame);
  };

  return <Ctx.Provider value={{ theme, resolved, setTheme, toggleWithRipple }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
