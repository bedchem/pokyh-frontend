// The recap's page turns: the card fills with blocks in the next page's
// colours, in one of several patterns (a sweep, a dissolve, a spiral, an
// iris, blinds, rain, a snake, a checker, a diamond), and the new page
// appears as the blocks clear in the same order — the screen wipes of old
// handheld games. Each block grows in two steps, as pixels would. Drawn on
// one canvas over the card; a page turn takes about 0.65 s.

export const WIPE_PATTERNS = ['diagonal', 'dissolve', 'spiral', 'iris', 'blinds', 'rain', 'snake', 'checker', 'diamond'] as const;
export type WipePattern = (typeof WIPE_PATTERNS)[number];

const COVER_MS = 310;
const REVEAL_MS = 350;
/** Blocks across the card. */
const ACROSS = 11;

function seeded(seed: number) {
  let h = seed >>> 0 || 1;
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

/** When each block turns, 0 … 1, in reading order. */
export function wipeOrder(pattern: WipePattern, cols: number, rows: number, seed = 7): number[] {
  const r = seeded(seed);
  const out: number[] = [];
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxDist = Math.hypot(cx, cy) || 1;
  if (pattern === 'spiral') {
    // From the outside in, round and round.
    const order = new Map<number, number>();
    let top = 0, left = 0, bottom = rows - 1, right = cols - 1, n = 0;
    while (top <= bottom && left <= right) {
      for (let c = left; c <= right; c++) order.set(top * cols + c, n++);
      for (let y = top + 1; y <= bottom; y++) order.set(y * cols + right, n++);
      if (top < bottom) for (let c = right - 1; c >= left; c--) order.set(bottom * cols + c, n++);
      if (left < right) for (let y = bottom - 1; y > top; y--) order.set(y * cols + left, n++);
      top++; left++; bottom--; right--;
    }
    for (let i = 0; i < cols * rows; i++) out.push((order.get(i) ?? 0) / Math.max(1, n - 1));
    return out;
  }
  const colDelay = Array.from({ length: cols }, () => r());
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let v: number;
      switch (pattern) {
        case 'diagonal': v = (x / Math.max(1, cols - 1) + y / Math.max(1, rows - 1)) / 2; break;
        case 'dissolve': v = r(); break;
        case 'iris': v = 1 - Math.hypot(x - cx, (y - cy) * 0.9) / maxDist; break;
        case 'blinds': v = ((y % 2 ? x : cols - 1 - x) / Math.max(1, cols - 1)) * 0.55 + (y / Math.max(1, rows - 1)) * 0.45; break;
        case 'rain': v = colDelay[x]! * 0.45 + (y / Math.max(1, rows - 1)) * 0.55; break;
        case 'snake': v = (y * cols + (y % 2 ? cols - 1 - x : x)) / Math.max(1, cols * rows - 1); break;
        case 'checker': v = ((x + y) % 2) * 0.5 + r() * 0.45; break;
        case 'diamond': v = (Math.abs(x - cx) / Math.max(1, cx) + Math.abs(y - cy) / Math.max(1, cy)) / 2; break;
        default: v = 0;
      }
      out.push(Math.min(1, Math.max(0, v)));
    }
  }
  return out;
}

export interface WipeColors {
  /** The blocks; every other one in `alt`, so they read as tiles. */
  fill: string;
  alt: string;
}

interface Grid {
  cols: number;
  rows: number;
  cell: number;
  order: number[];
}

function prepare(canvas: HTMLCanvasElement, pattern: WipePattern, seed: number): { ctx: CanvasRenderingContext2D; grid: Grid } | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const cell = Math.ceil(w / ACROSS);
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  return { ctx, grid: { cols, rows, cell, order: wipeOrder(pattern, cols, rows, seed) } };
}

// A block 0 … 1 of the way to full: nothing, half, full (from its middle).
function block(ctx: CanvasRenderingContext2D, grid: Grid, i: number, amount: number, colors: WipeColors) {
  if (amount <= 0) return;
  const x = (i % grid.cols) * grid.cell;
  const y = Math.floor(i / grid.cols) * grid.cell;
  const step = amount >= 0.66 ? 1 : 0.5;
  const size = Math.ceil(grid.cell * step);
  const inset = Math.floor((grid.cell - size) / 2);
  ctx.fillStyle = (i % grid.cols + Math.floor(i / grid.cols)) % 2 ? colors.alt : colors.fill;
  ctx.fillRect(x + inset, y + inset, size, size);
}

function animate(duration: number, frame: (p: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      frame(p);
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

// A block's own progress at the wipe's progress p: blocks turn in order,
// each over the last 30 % of the time from its turn.
const local = (p: number, v: number) => Math.min(1, Math.max(0, (p - v * 0.7) / 0.3));

/** The card full of blocks at once (before the first paint, for the story's opening). */
export function fillAll(canvas: HTMLCanvasElement, colors: WipeColors): void {
  const prepared = prepare(canvas, 'diagonal', 1);
  if (!prepared) return;
  const { ctx, grid } = prepared;
  canvas.style.visibility = 'visible';
  for (let i = 0; i < grid.order.length; i++) block(ctx, grid, i, 1, colors);
}

/** Fills the card with blocks; it stays filled until reveal(). */
export async function cover(canvas: HTMLCanvasElement, pattern: WipePattern, colors: WipeColors, seed = 7): Promise<void> {
  const prepared = prepare(canvas, pattern, seed);
  if (!prepared) return;
  const { ctx, grid } = prepared;
  canvas.style.visibility = 'visible';
  await animate(COVER_MS, (p) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < grid.order.length; i++) block(ctx, grid, i, local(p, grid.order[i]!), colors);
  });
}

/** Clears the blocks in the same order they came, showing what is now below. */
export async function reveal(canvas: HTMLCanvasElement, pattern: WipePattern, colors: WipeColors, seed = 7): Promise<void> {
  const prepared = prepare(canvas, pattern, seed);
  if (!prepared) return;
  const { ctx, grid } = prepared;
  canvas.style.visibility = 'visible';
  await animate(REVEAL_MS, (p) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < grid.order.length; i++) block(ctx, grid, i, 1 - local(p, grid.order[i]!), colors);
  });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.visibility = 'hidden';
}

/** The pattern for turning to a page: a different one each time, the same for the same page. */
export function patternFor(pageId: string, index: number): WipePattern {
  let h = 0;
  for (const c of pageId) h = (h * 31 + c.charCodeAt(0)) | 0;
  return WIPE_PATTERNS[Math.abs(h + index * 5) % WIPE_PATTERNS.length]!;
}
