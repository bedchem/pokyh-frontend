// Pixel sprites drawn in code, the way the Mensa plate is drawn
// (components/mensa/PixelPlate.tsx): square pixels, a few flat tones per
// material, light from the top left, an outline in the material's darkest
// tone and dithered shadows. A sprite is a grid of tones; every tone becomes
// one SVG path (runs of pixels per row), filled from `--s-<tone>` (the
// palette in ./palette.ts), so the colours come from the site's tokens and
// follow the theme.
//
// A tone is a material and a step: 0 outline, 1 shade, 2 base, 3 light,
// 4 highlight, e.g. 'ac2' (the accent) or 'pp3' (lit paper).

export type Pt = [number, number];

/**
 * A drawing in layers. Each layer is drawn in its own group; `cls` are the
 * classes of nested groups around it, outermost first (for animations that
 * combine, e.g. rolling, hopping and turning).
 */
export interface SceneLayer {
  name: string;
  sprite: Sprite;
  cls?: string[];
  /** An alternative frame: hidden until its animation shows it. */
  alt?: boolean;
}
export interface Scene {
  w: number;
  h: number;
  layers: SceneLayer[];
}

const key = (x: number, y: number) => `${x},${y}`;

export class Sprite {
  readonly cells = new Map<string, string>();
  private cached: Array<[string, string]> | null = null;

  set(x: number, y: number, tone: string | null) {
    this.cached = null;
    if (tone) this.cells.set(key(x, y), tone);
    else this.cells.delete(key(x, y));
    return this;
  }

  get(x: number, y: number): string | undefined {
    return this.cells.get(key(x, y));
  }

  fill(points: Iterable<Pt>, tone: string | null) {
    for (const [x, y] of points) this.set(x, y, tone);
    return this;
  }

  /** Rows of characters at (ox, oy); `legend` names each character's tone, '.' and ' ' stay empty. */
  rows(rows: string[], ox: number, oy: number, legend: Record<string, string | null>) {
    rows.forEach((row, y) => [...row].forEach((c, x) => {
      if (c === '.' || c === ' ') return;
      const tone = legend[c];
      if (tone !== undefined) this.set(ox + x, oy + y, tone);
    }));
    return this;
  }

  /** Another sprite on top of this one. */
  paste(other: Sprite, dx = 0, dy = 0) {
    for (const [k, tone] of other.cells) {
      const [x, y] = k.split(',').map(Number);
      this.set(x + dx, y + dy, tone);
    }
    return this;
  }

  /**
   * A shape in a material: lit where it faces the top left, shaded where it
   * faces away, outlined in the material's darkest tone. With `round` the
   * light follows the direction from that centre (balls, rings); `outline:
   * false` leaves the outline off (shapes inside others).
   */
  mass(mask: Pt[], mat: string, { outline = true, round, deep = false }: { outline?: boolean; round?: Pt; deep?: boolean } = {}) {
    const on = new Set(mask.map(([x, y]) => key(x, y)));
    const m = (x: number, y: number) => on.has(key(x, y));
    if (outline) for (const [x, y] of outlineOf(mask)) this.set(x, y, `${mat}0`);
    for (const [x, y] of mask) {
      let step = 2;
      if (round) {
        const f = facing(round, x, y);
        const edge = !m(x - 1, y) || !m(x + 1, y) || !m(x, y - 1) || !m(x, y + 1)
          || !m(x - 2, y) || !m(x + 2, y) || !m(x, y - 2) || !m(x, y + 2);
        if (edge && f > 0.35) step = 3;
        else if (f < -0.3 && (edge || deep)) step = 1;
      } else if (!m(x, y - 1) || !m(x - 1, y)) step = 3;
      else if (!m(x, y + 1) || !m(x + 1, y) || (deep && (!m(x + 1, y + 1) || !m(x, y + 2) || !m(x + 2, y)))) step = 1;
      this.set(x, y, `${mat}${step}`);
    }
    return this;
  }

  /** Every pixel as one path per tone: runs of the same tone along each row. */
  paths(): Array<[string, string]> {
    return (this.cached ??= this.build());
  }

  /** Replaces one material by another, step for step (stripes, recolouring). */
  recolor(points: Pt[], from: string, to: string) {
    for (const [x, y] of points) {
      const tone = this.get(x, y);
      if (tone?.startsWith(from) && /^\d$/.test(tone.slice(from.length))) this.set(x, y, to + tone.slice(from.length));
    }
    return this;
  }

  private build(): Array<[string, string]> {
    const byRow = new Map<number, Array<[number, string]>>();
    for (const [k, tone] of this.cells) {
      const [x, y] = k.split(',').map(Number);
      let row = byRow.get(y);
      if (!row) byRow.set(y, (row = []));
      row.push([x, tone]);
    }
    const out = new Map<string, string[]>();
    const push = (tone: string, x: number, y: number, n: number) => {
      let list = out.get(tone);
      if (!list) out.set(tone, (list = []));
      list.push(`M${x} ${y}h${n}v1h${-n}z`);
    };
    for (const [y, row] of byRow) {
      row.sort((a, b) => a[0] - b[0]);
      let start = row[0][0];
      let prev = start;
      let tone = row[0][1];
      for (let i = 1; i <= row.length; i++) {
        const cell = row[i];
        if (cell && cell[0] === prev + 1 && cell[1] === tone) { prev = cell[0]; continue; }
        push(tone, start, y, prev - start + 1);
        if (cell) [start, prev, tone] = [cell[0], cell[0], cell[1]];
      }
    }
    return [...out].map(([tone, list]) => [tone, list.join('')]);
  }
}

// ── Shapes (lists of pixels) ─────────────────────────────────────────────

/** The pixels marked with `ch` in rows of characters, placed at (ox, oy). */
export function grid(rows: string[], ox = 0, oy = 0, ch = '#'): Pt[] {
  const out: Pt[] = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === ch) out.push([ox + x, oy + y]); }));
  return out;
}

export function rect(x: number, y: number, w: number, h: number): Pt[] {
  const out: Pt[] = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

/** A rectangle with its corners cut by `r` steps. */
export function rounded(x: number, y: number, w: number, h: number, r = 1): Pt[] {
  return rect(x, y, w, h).filter(([px, py]) => {
    const dx = Math.max(x + r - px, px - (x + w - 1 - r), 0);
    const dy = Math.max(y + r - py, py - (y + h - 1 - r), 0);
    return dx + dy <= r;
  });
}

/** A rectangle with round corners of radius `r` (soft shapes; `rounded` cuts them straight). */
export function soft(x: number, y: number, w: number, h: number, r: number): Pt[] {
  return rect(x, y, w, h).filter(([px, py]) => {
    const cx = Math.min(Math.max(px + 0.5, x + r), x + w - r);
    const cy = Math.min(Math.max(py + 0.5, y + r), y + h - r);
    return Math.hypot(px + 0.5 - cx, py + 0.5 - cy) <= r - 0.2;
  });
}

/** A thick stroke: discs of radius `r` along a line. */
export function limb(x0: number, y0: number, x1: number, y1: number, r: number): Pt[] {
  const out = new Map<string, Pt>();
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    for (const p of disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r)) out.set(key(p[0], p[1]), p);
  }
  return [...out.values()];
}

/** Pixels whose centre lies within `r` of (cx, cy). */
export function disc(cx: number, cy: number, r: number): Pt[] {
  return ellipse(cx, cy, r, r);
}

export function ellipse(cx: number, cy: number, rx: number, ry: number): Pt[] {
  const out: Pt[] = [];
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) out.push([x, y]);
    }
  }
  return out;
}

/** A one-pixel line (Bresenham). */
export function line(x0: number, y0: number, x1: number, y1: number): Pt[] {
  const out: Pt[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    out.push([x0, y0]);
    if (x0 === x1 && y0 === y1) return out;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export function shift(points: Pt[], dx: number, dy: number): Pt[] {
  return points.map(([x, y]) => [x + dx, y + dy]);
}

export function minus(points: Pt[], cut: Pt[]): Pt[] {
  const gone = new Set(cut.map(([x, y]) => key(x, y)));
  return points.filter(([x, y]) => !gone.has(key(x, y)));
}

/** The pixels right around a shape (above, below, left, right). */
export function outlineOf(shape: Pt[]): Pt[] {
  const on = new Set(shape.map(([x, y]) => key(x, y)));
  const out = new Map<string, Pt>();
  for (const [x, y] of shape) {
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]] as Pt[]) {
      if (!on.has(key(nx, ny))) out.set(key(nx, ny), [nx, ny]);
    }
  }
  return [...out.values()];
}

/** Every other pixel of a shape, for dithered shadows and light. */
export function dither(points: Pt[], parity = 0): Pt[] {
  return points.filter(([x, y]) => (((x + y) % 2) + 2) % 2 === parity);
}

/** How much a pixel faces the light from the top left, seen from `centre` (-1 … 1). */
export function facing([cx, cy]: Pt, x: number, y: number): number {
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  const d = Math.hypot(dx, dy) || 1;
  return (dx / d) * -0.61 + (dy / d) * -0.79;
}

// ── A 3 × 5 pixel font (capitals, digits, a few signs) ───────────────────

const GLYPHS: Record<string, string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '.#.', '.#.'],
  W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'],
  2: ['##.', '..#', '.#.', '#..', '###'], 3: ['##.', '..#', '.#.', '..#', '##.'],
  4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'],
  8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '##.'],
  '!': ['#', '#', '#', '.', '#'], '?': ['##.', '..#', '.#.', '...', '.#.'],
  '.': ['.', '.', '.', '.', '#'], ',': ['..', '..', '..', '.#', '#.'],
  ':': ['.', '#', '.', '#', '.'], '-': ['...', '...', '###', '...', '...'],
  '_': ['...', '...', '...', '...', '###'], "'": ['#', '#', '.', '.', '.'],
  '/': ['..#', '..#', '.#.', '#..', '#..'], '@': ['###', '#.#', '#.#', '#..', '.##'],
  '+': ['...', '.#.', '###', '.#.', '...'], '…': ['.....', '.....', '.....', '.....', '#.#.#'],
  '(': ['.#', '#.', '#.', '#.', '.#'], ')': ['#.', '.#', '.#', '.#', '#.'],
  '=': ['...', '###', '...', '###', '...'], '<': ['..#', '.#.', '#..', '.#.', '..#'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'], '%': ['#.#', '..#', '.#.', '#..', '#.#'],
  '*': ['...', '#.#', '.#.', '#.#', '...'], '×': ['...', '#.#', '.#.', '#.#', '...'],
  '÷': ['.#.', '...', '###', '...', '.#.'], '♥': ['.#.#.', '#####', '#####', '.###.', '..#..'],
  '★': ['..#..', '#####', '.###.', '.#.#.', '#...#'], '#': ['#.#', '###', '#.#', '###', '#.#'],
  ' ': ['..', '..', '..', '..', '..'],
};

/** Text in capitals; letters with accents lose them, other signs become '?'. */
export function textPixels(text: string, ox = 0, oy = 0): { points: Pt[]; width: number } {
  const points: Pt[] = [];
  let x = ox;
  const plain = text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'SS').toUpperCase();
  for (const c of plain) {
    const g = GLYPHS[c] ?? GLYPHS['?'];
    points.push(...grid(g, x, oy));
    x += g[0].length + 1;
  }
  return { points, width: Math.max(0, x - ox - 1) };
}
