// The sprites' palette (see ./sprite.ts): five tones per material, worked out
// from the site's own colours. Shades lean towards a cool violet and lights
// towards a warm white, as hand-drawn sprites do, instead of plain black and
// white. Tones that differ between the themes use light-dark(), so the same
// rules serve the site (.dark sets the colour scheme) and the standalone 404
// document (which follows the system).

interface Material {
  /** The base tone, as CSS. */
  base: string;
  /** The base tone in the light theme, for previews of the drawings. */
  hex: string;
  /** What the shade and the outline lean towards. */
  shade?: string;
  out?: string;
  light?: string;
  /** Tones set by hand, by step. */
  fixed?: Partial<Record<0 | 1 | 2 | 3 | 4, string>>;
}

const SHADE = '#2a1f55';
const OUT = '#140d2b';
const LIGHT = '#fff8e6';

export const MATERIALS: Record<string, Material> = {
  // The accent: indigo.
  ac: { base: 'var(--accent)', hex: '#6366F1' },
  // Gold: the sun, sparks, keys.
  gd: { base: 'var(--star)', hex: '#F5B301', shade: '#a2400f', out: '#4a1c06' },
  // Red: crosses, stripes, pins.
  rd: { base: 'var(--danger)', hex: '#EF4444', shade: '#5a1236', out: '#2e0718' },
  // Green: plants.
  gn: { base: 'var(--success)', hex: '#10B981', shade: '#0b3b4a', out: '#05202a' },
  // Steel: prongs, poles, hinges.
  st: { base: '#bcc1cc', hex: '#bcc1cc', shade: '#3b4160', out: '#262a3d', light: '#ffffff' },
  // Paper: soft outlines, as the Mensa plate's glaze.
  pp: {
    base: 'light-dark(#f4f1eb, #dcd8d0)',
    hex: '#f4f1eb',
    fixed: { 0: 'light-dark(#bdb3a4, #2a2830)', 1: 'light-dark(#ddd6cb, #b4afa6)', 3: 'light-dark(#ffffff, #ece9e3)', 4: '#ffffff' },
  },
  // The 404's ghost: white, a firm dark outline, cool blue shade.
  gh: {
    base: '#eef2fb',
    hex: '#eef2fb',
    fixed: { 0: '#28234d', 1: '#a9b5db', 3: '#ffffff', 4: '#ffffff' },
  },
  // Wood and dry grass.
  wd: { base: '#a8693a', hex: '#a8693a', shade: '#3d1d2a', out: '#24100f' },
  // Sand.
  sd: { base: '#efd790', hex: '#efd790', shade: '#9a5a2a', out: '#5a3416' },
  // Water and sky.
  wt: { base: '#5aa9e6', hex: '#5aa9e6', shade: '#1d2f73', out: '#0f1a45' },
  // Cheeks.
  pk: { base: '#f59ab0', hex: '#f59ab0', shade: '#b0446a' },
  // The sign-in hallway (components/pixel/hallway.ts): wall, the band below
  // the rail, floor tiles, the door, the cork board, lockers in the tones
  // of the site's tiles, a terracotta pot. Darker at night (dark theme).
  wl: {
    base: 'light-dark(#efe9df, #1c1c22)', hex: '#efe9df',
    fixed: { 0: 'light-dark(#c9bfae, #0c0c10)', 1: 'light-dark(#e3dccf, #17171c)', 3: 'light-dark(#f8f4ee, #24242b)', 4: 'light-dark(#ffffff, #2c2c35)' },
  },
  ws: {
    base: 'light-dark(#d8dbea, #22232d)', hex: '#d8dbea',
    fixed: { 0: 'light-dark(#a9aec8, #0f1017)', 1: 'light-dark(#c9cde0, #1b1c25)', 3: 'light-dark(#e6e8f2, #2b2c38)', 4: 'light-dark(#f2f3f8, #333443)' },
  },
  fl: {
    base: 'light-dark(#e6dfd3, #1d1d23)', hex: '#e6dfd3',
    fixed: { 0: 'light-dark(#c4baa9, #0e0e12)', 1: 'light-dark(#d4cbbc, #121216)', 3: 'light-dark(#ddd5c7, #18181d)', 4: 'light-dark(#f1ece4, #26262d)' },
  },
  // Window frames and sills: white by day, dim at night.
  wf: {
    base: 'light-dark(#f7f5f0, #34343e)', hex: '#f7f5f0',
    fixed: { 0: 'light-dark(#b9b0a1, #121216)', 1: 'light-dark(#dcd5c9, #26262e)', 3: 'light-dark(#ffffff, #3f3f4b)', 4: 'light-dark(#ffffff, #474755)' },
  },
  dr: { base: 'light-dark(#b97f4d, #4f3524)', hex: '#b97f4d', shade: '#3d1d2a', out: '#24100f' },
  ck: { base: 'light-dark(#cf9a62, #5e4127)', hex: '#cf9a62', shade: '#6b3418', out: '#3a1a0c' },
  la: { base: 'light-dark(#9a9cf0, #3a3c78)', hex: '#9a9cf0' },
  lb: { base: 'light-dark(#ecc86e, #6a5521)', hex: '#ecc86e', shade: '#a2400f', out: '#4a1c06' },
  lc: { base: 'light-dark(#97c592, #2f5232)', hex: '#97c592', shade: '#0b3b4a', out: '#05202a' },
  ld: { base: 'light-dark(#eba092, #6e3530)', hex: '#eba092', shade: '#5a1236', out: '#2e0718' },
  tc: { base: '#c96f4a', hex: '#c96f4a', shade: '#5a1236', out: '#2e0718' },
  // The sky in the windows: by day and by night.
  sk: { base: '#8fcdf3', hex: '#8fcdf3', shade: '#1d2f73', out: '#0f1a45' },
  nt: { base: '#1d2652', hex: '#1d2652', shade: '#05081f', out: '#03040f', light: '#6d7fd0' },
  // Eyes and dark details.
  ik: { base: '#1d1730', hex: '#1d1730', fixed: { 3: '#3d3460', 4: '#ffffff' } },
  // The mascot's pupils: indigo, from deep at the top to lighter low down
  // (light caught in the eye), with a white catch-light. Never black.
  pu: { base: '#3b3494', hex: '#3b3494', fixed: { 0: '#1f1a52', 1: '#2c2672', 3: '#5a52c4', 4: '#ffffff' } },
};

/** Shadows on the ground, and faint lines (not materials: one tone each). */
export const EXTRA: Record<string, { css: string; hex: string }> = {
  sh: { css: 'light-dark(rgb(48 30 70 / 0.16), rgb(0 0 0 / 0.38))', hex: '#d9d3dc' },
  shd: { css: 'light-dark(rgb(48 30 70 / 0.26), rgb(0 0 0 / 0.55))', hex: '#c4bccb' },
  fn: { css: 'color-mix(in srgb, var(--ink) 16%, transparent)', hex: '#dcd8d1' },
  // Glass: what lies behind it shows through.
  gl: { css: 'light-dark(rgb(140 190 250 / 0.38), rgb(140 190 250 / 0.22))', hex: '#d6e3f2' },
};

function recipe(m: Material, step: number): [string, number] | null {
  switch (step) {
    case 0: return [m.out ?? OUT, 62];
    case 1: return [m.shade ?? SHADE, 32];
    case 3: return [m.light ?? LIGHT, 38];
    case 4: return [m.light ?? LIGHT, 76];
    default: return null;
  }
}

function css(m: Material, step: number): string {
  const fixed = m.fixed?.[step as 0];
  if (fixed) return fixed;
  const r = recipe(m, step);
  return r ? `color-mix(in oklab, ${m.base}, ${r[0]} ${r[1]}%)` : m.base;
}

/** The palette as CSS custom properties on every sprite (`.spr`). */
export const SPRITE_CSS = `.spr{${[
  ...Object.entries(MATERIALS).flatMap(([name, m]) => [0, 1, 2, 3, 4].map((step) => `--s-${name}${step}:${css(m, step)}`)),
  ...Object.entries(EXTRA).map(([name, e]) => `--s-${name}:${e.css}`),
].join(';')}}`;

// ── Previews (scripts that draw the sprites to images) ──────────────────

function mixHex(a: string, b: string, pct: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const f = pct / 100;
  const out = [16, 8, 0].map((s) => Math.round(ch(pa, s) * (1 - f) + ch(pb, s) * f));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Each tone's colour in the light theme, roughly (sRGB instead of oklab mixing). */
export function previewColors(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, m] of Object.entries(MATERIALS)) {
    for (const step of [0, 1, 2, 3, 4]) {
      const fixed = m.fixed?.[step as 0];
      const r = recipe(m, step);
      out[`${name}${step}`] = fixed ? (fixed.match(/#[0-9a-f]{6}/i)?.[0] ?? m.hex) : r ? mixHex(m.hex, r[0], r[1]) : m.hex;
    }
  }
  for (const [name, e] of Object.entries(EXTRA)) out[name] = e.hex;
  return out;
}
