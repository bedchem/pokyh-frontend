import type { Theme } from '@/lib/recap-story';

// The recap's pages as flat pixel scenes: a sky (`bg`) with a dotted
// pattern (`dot`), and the ground the mascot stands on (`ground`, its top
// edge `edge`, its tiles alternating with `dot`). `chip` fills the quiet
// buttons and tracks, `accent` the main button, the bubble and the bars,
// `accentInk` the text on it, `soft` the sentences. Solid colours only — no
// gradients, no glass, no glow — the same in both themes.

export interface ThemeColors {
  bg: string;
  dot: string;
  ground: string;
  edge: string;
  chip: string;
  soft: string;
  accent: string;
  accentInk: string;
}

export const THEMES: Record<Theme, ThemeColors> = {
  night: { bg: '#1b1640', dot: '#231d52', ground: '#2c2566', edge: '#3d3488', chip: '#2f2870', soft: '#d4cffb', accent: '#ffd166', accentInk: '#1b1640' },
  brand: { bg: '#312a92', dot: '#3a32a6', ground: '#262079', edge: '#4f46e5', chip: '#3d35b0', soft: '#e0e7ff', accent: '#7ee8fa', accentInk: '#1e1b4b' },
  ocean: { bg: '#0b3b66', dot: '#0e4677', ground: '#0e5289', edge: '#1769aa', chip: '#0f4a7d', soft: '#d3e9ff', accent: '#ffd166', accentInk: '#0b3b66' },
  sky: { bg: '#1d4f91', dot: '#2259a1', ground: '#173f74', edge: '#3b82d6', chip: '#255ea8', soft: '#dbeafe', accent: '#fde68a', accentInk: '#16365f' },
  teal: { bg: '#0d4d4d', dot: '#105858', ground: '#116363', edge: '#178080', chip: '#125d5d', soft: '#ccfbf1', accent: '#fde047', accentInk: '#0b3b3b' },
  mint: { bg: '#0f5132', dot: '#125c3a', ground: '#146c43', edge: '#1b8a56', chip: '#156240', soft: '#d1fae5', accent: '#fef08a', accentInk: '#0d3b25' },
  forest: { bg: '#1f3d1a', dot: '#25481f', ground: '#2d5a26', edge: '#3b7532', chip: '#2a5223', soft: '#dcfce7', accent: '#fdba74', accentInk: '#1f3d1a' },
  gold: { bg: '#6b4300', dot: '#7a4d00', ground: '#8a5800', edge: '#a86c00', chip: '#7d4f00', soft: '#fef3c7', accent: '#ffe066', accentInk: '#3f2700' },
  sunset: { bg: '#7c2d12', dot: '#883214', ground: '#9a3412', edge: '#c2410c', chip: '#8f3313', soft: '#ffedd5', accent: '#fde047', accentInk: '#45180a' },
  candy: { bg: '#831843', dot: '#8f1b4a', ground: '#9d174d', edge: '#be185d', chip: '#921a4b', soft: '#fce7f3', accent: '#fde68a', accentInk: '#4a0d26' },
  rose: { bg: '#881337', dot: '#94163d', ground: '#9f1239', edge: '#be123c', chip: '#97163e', soft: '#ffe4e6', accent: '#fed7aa', accentInk: '#4c0a1f' },
  grape: { bg: '#4c1d95', dot: '#5521a6', ground: '#5b21b6', edge: '#6d28d9', chip: '#5622ab', soft: '#ede9fe', accent: '#f9a8d4', accentInk: '#2e1065' },
  dusk: { bg: '#2a2770', dot: '#302c7e', ground: '#3730a3', edge: '#4338ca', chip: '#332f8c', soft: '#e0e7ff', accent: '#f0abfc', accentInk: '#1e1b4b' },
  ember: { bg: '#8a3a0c', dot: '#97400e', ground: '#a54a0f', edge: '#c2570c', chip: '#9a440e', soft: '#ffedd5', accent: '#fcd34d', accentInk: '#451a03' },
  alarm: { bg: '#7f1d1d', dot: '#8c2020', ground: '#991b1b', edge: '#b91c1c', chip: '#922020', soft: '#fee2e2', accent: '#fde047', accentInk: '#450a0a' },
};

/** The sky's dotted pattern: one 2 × 2 dot every 12 px, as a small SVG. */
export function dotPattern(t: ThemeColors): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' shape-rendering='crispEdges'><rect x='5' y='5' width='2' height='2' fill='${t.dot}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** The ground's tiles: a 16 px checker of two colours. */
export function tilePattern(t: ThemeColors): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' shape-rendering='crispEdges'><rect width='16' height='16' fill='${t.ground}'/><rect width='8' height='8' fill='${t.chip}'/><rect x='8' y='8' width='8' height='8' fill='${t.chip}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
