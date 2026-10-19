'use client';

import { useEffect, useRef, useState } from 'react';

// A dish served as pixel art: a glazed plate, lit from the top left, with its
// shadow dithered onto the table. The dish photo lies sharp in the well, cut
// to the plate's pixel edge; without a photo a small pixel meal in the dish's
// style stands in. Two sizes: 'table' for the next dish (between fork and
// knife, steam rising in steps, rim and blade glinting now and then) and
// 'plate' for the plan's rows (the plate alone, a glint on hover). Both build
// themselves line by line when they arrive (CSS in globals.css, .pxp-*). Drawn
// on the spot: nothing to download but the photo.

export type PlateSize = 'table' | 'plate';

interface Geometry {
  w: number;
  h: number;
  cx: number;
  cy: number;
  rOut: number;
  rRim: number;
  rFood: number;
  /** Offsets of the plate's shadow on the table: the solid and the dithered one. */
  shadow: [number, number];
  shadowSoft: [number, number];
}

const GEOMETRY: Record<PlateSize, Geometry> = {
  table: { w: 112, h: 64, cx: 56, cy: 31, rOut: 28.5, rRim: 23, rFood: 19.5, shadow: [2, 3], shadowSoft: [3, 5] },
  plate: { w: 36, h: 36, cx: 17, cy: 17, rOut: 15.5, rRim: 12.5, rFood: 10.5, shadow: [1, 2], shadowSoft: [2, 3] },
};

/** The food's square on the scene, in whole pixels, centred on the plate. */
function foodBox(g: Geometry) {
  const x = Math.floor(g.cx - g.rFood);
  const y = Math.floor(g.cy - g.rFood);
  return { x, y, n: Math.ceil(g.cx + g.rFood) - x };
}

/** Light from the top left. */
const LX = -0.61;
const LY = -0.79;

/** The pixels of one tone, as x, y pairs. */
type Layer = number[];

function add(layer: Layer, x: number, y: number) {
  layer.push(x, y);
}

const dist = (x: number, y: number, cx: number, cy: number) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy);

/** How much a point on the plate faces the light (-1 … 1). */
function facing(g: Geometry, x: number, y: number): number {
  const dx = x + 0.5 - g.cx;
  const dy = y + 0.5 - g.cy;
  const d = Math.hypot(dx, dy) || 1;
  return (dx / d) * LX + (dy / d) * LY;
}

interface Steel {
  shadow: Layer;
  base: Layer;
  hi: Layer;
  lo: Layer;
}

interface Scene {
  shadow: Layer;
  shadowSoft: Layer;
  rim: Layer;
  rimHi: Layer;
  rimLo: Layer;
  edge: Layer;
  well: Layer;
  wellLo: Layer;
  fork: Steel;
  knife: Steel;
}

/** Rows of a piece of cutlery: [y, first x, last x]. */
type Rows = Array<[number, number, number]>;

function span(rows: Rows, y0: number, y1: number, x0: number, x1: number) {
  for (let y = y0; y <= y1; y++) rows.push([y, x0, x1]);
}

function forkRows(): { rows: Rows; gaps: Set<string> } {
  const rows: Rows = [];
  const gaps = new Set<string>();
  // Four tines with three gaps, rounded tips.
  rows.push([4, 8, 8], [4, 10, 10], [4, 12, 12], [4, 14, 14]);
  span(rows, 5, 15, 8, 14);
  for (let y = 5; y <= 15; y++) for (const x of [9, 11, 13]) gaps.add(`${x},${y}`);
  span(rows, 16, 18, 8, 14);
  span(rows, 19, 20, 9, 13);
  span(rows, 21, 23, 10, 12);
  span(rows, 24, 36, 10, 12);
  span(rows, 37, 38, 9, 13);
  span(rows, 39, 57, 9, 13);
  rows.push([58, 10, 12]);
  return { rows, gaps };
}

function knifeRows(): Rows {
  const rows: Rows = [];
  // A table knife from above: a curved edge on the left, a straight back.
  rows.push([4, 101, 102], [5, 100, 102], [6, 99, 102]);
  span(rows, 7, 30, 98, 102);
  span(rows, 31, 32, 97, 103);
  span(rows, 33, 57, 98, 102);
  rows.push([58, 99, 101]);
  return rows;
}

function buildScene(g: Geometry, cutlery: boolean): Scene {
  const s: Scene = {
    shadow: [], shadowSoft: [], rim: [], rimHi: [], rimLo: [], edge: [], well: [], wellLo: [],
    fork: { shadow: [], base: [], hi: [], lo: [] },
    knife: { shadow: [], base: [], hi: [], lo: [] },
  };
  // Widths on the plate grow with its size.
  const k = g.rOut / 28.5;

  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      const d = dist(x, y, g.cx, g.cy);
      if (d <= g.rOut) {
        const f = facing(g, x, y);
        if (d > g.rRim) {
          // The rim: an outline, the lit and the shaded side, a glaze line.
          if (d > g.rOut - 1) add(f > 0.3 ? s.rimLo : s.edge, x, y);
          else if (f > 0.42 && d > g.rOut - 3.6 * k) add(s.rimHi, x, y);
          else if (f < -0.38) add(s.rimLo, x, y);
          else add(s.rim, x, y);
        } else if (d > g.rRim - 1) {
          // The step down into the well: shaded where the rim faces the light.
          add(f > 0 ? s.rimLo : s.rimHi, x, y);
        } else if (d <= g.rFood) {
          // Under the food: the plate shows around a pixel meal's heap.
          add(s.well, x, y);
        } else if (d <= g.rFood + 1.5 * k && f < -0.2) {
          // The food's own shadow on the plate.
          add(s.wellLo, x, y);
        } else if (f > 0.3 && d > g.rRim - 3 * k) {
          add(s.wellLo, x, y);
        } else {
          add(s.well, x, y);
        }
      } else if (dist(x, y, g.cx + g.shadow[0], g.cy + g.shadow[1]) <= g.rOut) {
        add(s.shadow, x, y);
      } else if (dist(x, y, g.cx + g.shadowSoft[0], g.cy + g.shadowSoft[1]) <= g.rOut + 0.5 && (x + y) % 2 === 0) {
        add(s.shadowSoft, x, y);
      }
    }
  }
  if (!cutlery) return s;

  const piece = (out: Steel, rows: Rows, gaps: Set<string> = new Set()) => {
    const filled = new Set<string>();
    for (const [y, x0, x1] of rows) for (let x = x0; x <= x1; x++) if (!gaps.has(`${x},${y}`)) filled.add(`${x},${y}`);
    for (const key of filled) {
      const [x, y] = key.split(',').map(Number);
      const left = !filled.has(`${x - 1},${y}`);
      const right = !filled.has(`${x + 1},${y}`);
      if (left) add(out.hi, x, y);
      else if (right) add(out.lo, x, y);
      else add(out.base, x, y);
      if (!filled.has(`${x + 1},${y + 1}`)) add(out.shadow, x + 1, y + 1);
    }
  };
  const fork = forkRows();
  piece(s.fork, fork.rows, fork.gaps);
  piece(s.knife, knifeRows());
  // A long light along the blade and one down the fork's handle.
  for (let y = 9; y <= 27; y++) add(s.knife.hi, 100, y);
  for (let y = 41; y <= 54; y++) add(s.fork.hi, 11, y);
  return s;
}

/** Whether a pixel of the food's square lies on the food. */
function inFood(g: Geometry, x: number, y: number) {
  const box = foodBox(g);
  return dist(x, y, g.cx - box.x, g.cy - box.y) <= g.rFood;
}

/** The food's outline in whole pixels as a CSS polygon, so the photo keeps the plate's edge. */
function foodClip(g: Geometry): string {
  const { n } = foodBox(g);
  const right: string[] = [];
  const left: string[] = [];
  const p = (x: number, y: number) => `${+((x / n) * 100).toFixed(3)}% ${+((y / n) * 100).toFixed(3)}%`;
  for (let y = 0; y < n; y++) {
    let x0 = -1;
    let x1 = -1;
    for (let x = 0; x < n; x++) if (inFood(g, x, y)) { if (x0 < 0) x0 = x; x1 = x; }
    if (x0 < 0) continue;
    right.push(p(x1 + 1, y), p(x1 + 1, y + 1));
    left.unshift(p(x0, y + 1), p(x0, y));
  }
  return `polygon(${[...right, ...left].join(',')})`;
}

interface Built {
  scene: Scene;
  clip: string;
}

const built: Partial<Record<PlateSize, Built>> = {};
/** A layer as one SVG path of unit squares. */
function d(layer: Layer): string {
  let out = '';
  for (let i = 0; i < layer.length; i += 2) out += `M${layer[i]} ${layer[i + 1]}h1v1h-1z`;
  return out;
}

function sceneFor(size: PlateSize): Built {
  const g = GEOMETRY[size];
  return (built[size] ??= { scene: buildScene(g, size === 'table'), clip: foodClip(g) });
}

// ── Food ──────────────────────────────────────────────────────────────────

export type FoodStyle = 'pasta' | 'salad' | 'meat' | 'fish';

const FOOD_COLORS: Record<FoodStyle, { base: string; spots: string[] }> = {
  pasta: { base: '#E9B54A', spots: ['#F6D27A', '#C98F2A', '#C2412D', '#3F8F3A', '#F6D27A'] },
  salad: { base: '#6FAE45', spots: ['#3E7F2C', '#9CCB62', '#D9472F', '#F2C744', '#3E7F2C'] },
  meat: { base: '#9A5530', spots: ['#7A3A1E', '#B8703F', '#E8C25A', '#4F8F3A', '#5E2614'] },
  fish: { base: '#EADBC2', spots: ['#D6BF9B', '#F4D43A', '#F7F3EA', '#4F8F3A', '#C9A97E'] },
};

/** A small seeded random, so a dish always looks the same. */
function random(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Keeps only the round food area of the canvas, cut in whole pixels. */
function cutRound(ctx: CanvasRenderingContext2D, g: Geometry) {
  const { n } = foodBox(g);
  // One path for the whole disc: 'destination-in' clears everything outside
  // each single drawing call.
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = '#000';
  ctx.beginPath();
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (inFood(g, x, y)) ctx.rect(x, y, 1, 1);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

function drawMeal(ctx: CanvasRenderingContext2D, g: Geometry, style: FoodStyle, seed: string) {
  const rnd = random(seed);
  const { base, spots } = FOOD_COLORS[style];
  const { n } = foodBox(g);
  const c = n / 2;
  // Distances on the meal grow with the plate.
  const k = g.rFood / 19.5;
  ctx.clearRect(0, 0, n, n);
  // A heap, not a disc: the meal covers the middle, the plate shows around it.
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const r = Math.hypot(x + 0.5 - c, y + 0.5 - c);
      if (r <= g.rFood - (3 + rnd() * 2.5) * k) {
        ctx.fillStyle = base;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const count = Math.round((style === 'pasta' ? 90 : 70) * k * k);
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * (g.rFood - 6 * k);
    const x = Math.round(c + Math.cos(a) * r);
    const y = Math.round(c + Math.sin(a) * r);
    const color = spots[Math.floor(rnd() * spots.length)];
    ctx.fillStyle = color;
    if (style === 'pasta') {
      // Strands: short diagonal runs.
      const dir = rnd() > 0.5 ? 1 : -1;
      for (let s = 0; s < 3; s++) ctx.fillRect(x + s, y + s * dir, 1, 1);
    } else {
      ctx.fillRect(x, y, rnd() > 0.5 ? 2 : 1, rnd() > 0.6 ? 2 : 1);
    }
  }
  // Light on the top left of the heap.
  ctx.fillStyle = 'rgb(255 255 255 / 0.22)';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = x + 0.5 - c;
    const dy = y + 0.5 - c;
    const r = Math.hypot(dx, dy);
    if (r < g.rFood - 6 * k && r > g.rFood - 9 * k && (dx * LX + dy * LY) / (r || 1) > 0.5) ctx.fillRect(x, y, 1, 1);
  }
  cutRound(ctx, g);
}

// ── On a canvas ───────────────────────────────────────────────────────────

/** The scene's tones in the light theme (as .pxp in globals.css), for canvases. */
const CANVAS_TONES = {
  shadowSoft: 'rgb(60 40 20 / 0.1)', shadow: 'rgb(60 40 20 / 0.17)', edge: '#C2B8A9', rim: '#F4F1EB',
  rimHi: '#FFFFFF', rimLo: '#DDD6CB', well: '#ECE7DF', wellLo: '#D6CEC1',
  steel: '#C9CCD3', steelHi: '#F6F7F9', steelLo: '#8E939D', spark: '#FFD86B',
};

/**
 * The same dish drawn on a canvas (the homepage's 3D tiles use it as a
 * texture): `px` canvas pixels per scene pixel, top left at x, y. With
 * `size: 'table'` fork and knife lie beside the plate.
 */
export function paintPixelPlate(
  ctx: CanvasRenderingContext2D,
  { x, y, px, size = 'table', style, seed }: { x: number; y: number; px: number; size?: PlateSize; style: FoodStyle; seed: string },
): void {
  const g = GEOMETRY[size];
  const { scene: sc } = sceneFor(size);
  const fill = (layer: Layer, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < layer.length; i += 2) ctx.rect(x + layer[i] * px, y + layer[i + 1] * px, px, px);
    ctx.fill();
  };
  const c = CANVAS_TONES;
  fill(sc.shadowSoft, c.shadowSoft);
  fill(sc.shadow, c.shadow);
  fill(sc.edge, c.edge);
  fill(sc.rim, c.rim);
  fill(sc.rimHi, c.rimHi);
  fill(sc.rimLo, c.rimLo);
  fill(sc.well, c.well);
  fill(sc.wellLo, c.wellLo);
  if (size === 'table') {
    for (const steel of [sc.fork, sc.knife]) {
      fill(steel.shadow, c.shadow);
      fill(steel.base, c.steel);
      fill(steel.hi, c.steelHi);
      fill(steel.lo, c.steelLo);
    }
    fill([35, 9, 34, 10, 35, 10, 36, 10, 35, 11], c.spark);
  }
  // The meal at one pixel per pixel, then scaled up without smoothing.
  const box = foodBox(g);
  const meal = document.createElement('canvas');
  meal.width = box.n;
  meal.height = box.n;
  const mctx = meal.getContext('2d');
  if (!mctx) return;
  drawMeal(mctx, g, style, seed);
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(meal, x + box.x * px, y + box.y * px, box.n * px, box.n * px);
  ctx.imageSmoothingEnabled = smooth;
}

/** Width and height of a plate scene in scene pixels. */
export function plateSceneSize(size: PlateSize): { w: number; h: number } {
  return { w: GEOMETRY[size].w, h: GEOMETRY[size].h };
}

// ── The scene ─────────────────────────────────────────────────────────────

export default function PixelPlate({
  photo,
  style,
  seed,
  size = 'table',
  empty = false,
  className = '',
}: {
  /** The dish photo, when there is one and the visitor allows outside pictures. */
  photo?: string | null;
  style: FoodStyle;
  /** Keeps the drawn meal the same for the same dish. */
  seed: string;
  size?: PlateSize;
  /** The plate without a meal: the table being laid while the menu loads. */
  empty?: boolean;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // The photo that has arrived, and one that could not be loaded.
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const g = GEOMETRY[size];
  const box = foodBox(g);
  const { scene: sc, clip } = sceneFor(size);
  const table = size === 'table';

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (ctx) drawMeal(ctx, GEOMETRY[size], style, seed);
  }, [size, style, seed, empty]);

  return (
    <span className={`pxp relative block ${table ? 'w-full' : ''} ${className}`} style={{ aspectRatio: `${g.w} / ${g.h}` }}>
      <svg viewBox={`0 0 ${g.w} ${g.h}`} className="pxp-art absolute inset-0 h-full w-full" shapeRendering="crispEdges" aria-hidden="true">
        <path d={d(sc.shadowSoft)} className="pxp-shadow-soft" />
        <path d={d(sc.shadow)} className="pxp-shadow" />
        <path d={d(sc.edge)} className="pxp-edge" />
        <path d={d(sc.rim)} className="pxp-rim" />
        <path d={d(sc.rimHi)} className="pxp-rim-hi" />
        <path d={d(sc.rimLo)} className="pxp-rim-lo" />
        <path d={d(sc.well)} className="pxp-well" />
        <path d={d(sc.wellLo)} className="pxp-well-lo" />
        {table ? (
          <>
            <g className="pxp-fork">
              <path d={d(sc.fork.shadow)} className="pxp-shadow" />
              <path d={d(sc.fork.base)} className="pxp-steel" />
              <path d={d(sc.fork.hi)} className="pxp-steel-hi" />
              <path d={d(sc.fork.lo)} className="pxp-steel-lo" />
            </g>
            <g className="pxp-knife">
              <path d={d(sc.knife.shadow)} className="pxp-shadow" />
              <path d={d(sc.knife.base)} className="pxp-steel" />
              <path d={d(sc.knife.hi)} className="pxp-steel-hi" />
              <path d={d(sc.knife.lo)} className="pxp-steel-lo" />
              {/* A glint that runs down the blade */}
              <path d="M100 7h1v1h-1z" className="pxp-glint-run" />
            </g>
            {/* The glaze catches the light: a small star on the rim */}
            <path d="M35 9h1v1h-1zM34 10h3v1h-3zM35 11h1v1h-1z" className="pxp-spark" />
            <path d="M76 52h1v1h-1z" className="pxp-spark pxp-spark-late" />
          </>
        ) : (
          <path d="M8 4h1v1h-1zM7 5h3v1h-3zM8 6h1v1h-1z" className="pxp-spark-hover" />
        )}
      </svg>
      {!empty && <span
        className="pxp-food absolute"
        data-photo={photo && loaded === photo ? 'true' : undefined}
        style={{ left: `${(box.x / g.w) * 100}%`, top: `${(box.y / g.h) * 100}%`, width: `${(box.n / g.w) * 100}%`, height: `${(box.n / g.h) * 100}%` }}
        aria-hidden="true"
      >
        <canvas ref={canvas} width={box.n} height={box.n} className="pxp-meal absolute inset-0 h-full w-full" />
        {photo && failed !== photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            loading={table ? 'eager' : 'lazy'}
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(photo)}
            onError={() => setFailed(photo)}
            className="pxp-photo absolute inset-0 h-full w-full object-cover"
            style={{ clipPath: clip }}
          />
        )}
      </span>}
      {table && (
        <svg viewBox={`0 0 ${g.w} ${g.h}`} className="pxp-steam pointer-events-none absolute inset-0 h-full w-full" shapeRendering="crispEdges" aria-hidden="true">
          <path d="M50 13h1v1h-1zM51 11h1v1h-1zM51 9h1v1h-1zM50 7h1v1h-1z" className="pxp-wisp" />
          <path d="M56 12h1v1h-1zM55 10h1v1h-1zM56 8h1v1h-1zM57 6h1v1h-1zM56 4h1v1h-1z" className="pxp-wisp pxp-wisp-2" />
          <path d="M62 13h1v1h-1zM61 11h1v1h-1zM61 9h1v1h-1zM62 7h1v1h-1z" className="pxp-wisp pxp-wisp-3" />
        </svg>
      )}
    </span>
  );
}
