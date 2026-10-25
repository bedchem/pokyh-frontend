import type { Theme } from '@/lib/recap-story';

// The backgrounds of the recap's pages: a deep base with three soft lights
// over it, the same in both themes (nothing white, the story is its own
// space). `accent` fills the "Weiter" button, `accentInk` is its text.

export interface ThemeColors {
  base: string;
  a: string;
  b: string;
  c: string;
  accent: string;
  accentInk: string;
}

export const THEMES: Record<Theme, ThemeColors> = {
  night: { base: '#120f2e', a: '#4f46e5', b: '#db2777', c: '#0ea5e9', accent: '#a5b4fc', accentInk: '#14112e' },
  brand: { base: '#17134a', a: '#6366f1', b: '#8b5cf6', c: '#22d3ee', accent: '#a5b4fc', accentInk: '#17134a' },
  ocean: { base: '#062a4d', a: '#0284c7', b: '#14b8a6', c: '#6366f1', accent: '#67e8f9', accentInk: '#062a4d' },
  sky: { base: '#0c2a52', a: '#3b82f6', b: '#38bdf8', c: '#a78bfa', accent: '#7dd3fc', accentInk: '#0c2a52' },
  teal: { base: '#042f35', a: '#0891b2', b: '#14b8a6', c: '#3b82f6', accent: '#5eead4', accentInk: '#042f35' },
  mint: { base: '#05302b', a: '#10b981', b: '#22d3ee', c: '#84cc16', accent: '#6ee7b7', accentInk: '#05302b' },
  forest: { base: '#0b2a1d', a: '#16a34a', b: '#65a30d', c: '#0d9488', accent: '#86efac', accentInk: '#0b2a1d' },
  gold: { base: '#3a2302', a: '#f59e0b', b: '#eab308', c: '#f97316', accent: '#fcd34d', accentInk: '#3a2302' },
  sunset: { base: '#3b0d2c', a: '#f97316', b: '#e11d48', c: '#a855f7', accent: '#fdba74', accentInk: '#3b0d2c' },
  candy: { base: '#3a0b3f', a: '#ec4899', b: '#8b5cf6', c: '#f59e0b', accent: '#f9a8d4', accentInk: '#3a0b3f' },
  rose: { base: '#3d0a24', a: '#f43f5e', b: '#c026d3', c: '#fb923c', accent: '#fda4af', accentInk: '#3d0a24' },
  grape: { base: '#2a0b45', a: '#9333ea', b: '#c026d3', c: '#4f46e5', accent: '#d8b4fe', accentInk: '#2a0b45' },
  dusk: { base: '#1e1537', a: '#7c3aed', b: '#f472b6', c: '#2563eb', accent: '#c4b5fd', accentInk: '#1e1537' },
  ember: { base: '#3a1204', a: '#ea580c', b: '#dc2626', c: '#f59e0b', accent: '#fdba74', accentInk: '#3a1204' },
  alarm: { base: '#3b0610', a: '#dc2626', b: '#9f1239', c: '#f97316', accent: '#fca5a5', accentInk: '#3b0610' },
};

/** The page's background as CSS. */
export function themeBackground(t: ThemeColors): string {
  return [
    `radial-gradient(70% 48% at 12% 8%, color-mix(in srgb, ${t.a} 85%, transparent) 0%, transparent 70%)`,
    `radial-gradient(60% 42% at 92% 28%, color-mix(in srgb, ${t.b} 70%, transparent) 0%, transparent 72%)`,
    `radial-gradient(85% 55% at 50% 108%, color-mix(in srgb, ${t.c} 75%, transparent) 0%, transparent 70%)`,
    t.base,
  ].join(', ');
}
