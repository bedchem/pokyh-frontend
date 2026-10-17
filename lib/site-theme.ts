'use client';

// Light and dark on the public pages. The `dark` class on <html> is the one
// source of truth (ThemeScript sets it before the first paint, ThemeProvider
// keeps it in sync with the saved choice and the system setting); the site's
// colours are CSS variables on `.site` that follow it.

import { useSyncExternalStore } from 'react';
import { prefersReducedMotion } from './motion';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains('dark');

/** True while the dark palette is showing. Re-renders the moment it flips. */
export function useSiteDark(): boolean {
  return useSyncExternalStore(subscribe, isDark, () => false);
}

/** Calls `fn` whenever the palette flips (before the next frame is drawn). */
export function onSiteThemeChange(fn: (dark: boolean) => void): () => void {
  return subscribe(() => fn(isDark()));
}

/** The current value of a site colour variable, e.g. `siteColor('--paper')`. */
export function siteColor(name: string): string {
  const site = document.querySelector('.site') ?? document.documentElement;
  return getComputedStyle(site).getPropertyValue(name).trim();
}

/**
 * Applies a theme change with the new colours growing as a circle from
 * (x, y). `apply` must switch the class synchronously (ThemeProvider's
 * setTheme does). Without View Transitions or with reduced motion it is instant.
 */
export function switchThemeFrom(apply: () => void, x: number, y: number) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
  if (!doc.startViewTransition || prefersReducedMotion()) {
    apply();
    return;
  }
  const html = document.documentElement;
  html.classList.add('theme-switching');
  const transition = doc.startViewTransition(apply);
  transition.ready
    .then(() => {
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      html.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    })
    .catch(() => undefined);
  transition.finished.finally(() => html.classList.remove('theme-switching'));
}
