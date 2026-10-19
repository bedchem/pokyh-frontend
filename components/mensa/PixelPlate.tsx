'use client';

import { useEffect, useRef } from 'react';

// The next dish, served as pixel art: a glazed plate between fork and knife,
// lit from the top left, with its shadow dithered onto the table. The dish
// photo lies in the well, scaled down to the scene's pixels; without a photo
// a small pixel meal in the dish's style stands in. Steam rises in steps, the
// rim and the blade glint now and then, and the scene builds itself line by
// line when it arrives (CSS in globals.css, .pxp-*). It is drawn on the spot:
// nothing to download but the photo.

const W = 112;
const H = 64;
const CX = 56;
const CY = 31;
const R_OUT = 28.5;
const R_RIM = 23;
const R_FOOD = 19.5;
/** Food canvas: one canvas pixel per scene pixel. */
const FOOD_X = Math.floor(CX - R_FOOD);
const FOOD_Y = Math.floor(CY - R_FOOD);
const FOOD_N = Math.ceil(R_FOOD * 2);

/** Light from the top left. */
const LX = -0.61;
const LY = -0.79;

type Layer = string[];

function add(layer: Layer, x: number, y: number) {
  layer.push(`M${x} ${y}h1v1h-1z`);
}

const dist = (x: number, y: number, cx = CX, cy = CY) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy);

/** How much a point on the plate faces the light (-1 … 1). */
function facing(x: number, y: number): number {
  const dx = x + 0.5 - CX;
  const dy = y + 0.5 - CY;
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

function buildScene(): Scene {
  const s: Scene = {
    shadow: [], shadowSoft: [], rim: [], rimHi: [], rimLo: [], edge: [], well: [], wellLo: [],
    fork: { shadow: [], base: [], hi: [], lo: [] },
    knife: { shadow: [], base: [], hi: [], lo: [] },
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = dist(x, y);
      if (d <= R_OUT) {
        const f = facing(x, y);
        if (d <= R_FOOD) continue;
        if (d > R_RIM) {
          // The rim: an outline, the lit and the shaded side, a glaze line.
          if (d > R_OUT - 1) add(f > 0.3 ? s.rimLo : s.edge, x, y);
          else if (f > 0.42 && d > R_OUT - 3.6) add(s.rimHi, x, y);
          else if (f < -0.38) add(s.rimLo, x, y);
          else add(s.rim, x, y);
        } else if (d > R_RIM - 1) {
          // The step down into the well: shaded where the rim faces the light.
          add(f > 0 ? s.rimLo : s.rimHi, x, y);
        } else if (d <= R_FOOD + 1.5 && f < -0.2) {
          // The food's own shadow on the plate.
          add(s.wellLo, x, y);
        } else if (f > 0.3 && d > R_RIM - 3) {
          add(s.wellLo, x, y);
        } else {
          add(s.well, x, y);
        }
      } else if (dist(x, y, CX + 2, CY + 3) <= R_OUT) {
        add(s.shadow, x, y);
      } else if (dist(x, y, CX + 3, CY + 5) <= R_OUT + 0.5 && (x + y) % 2 === 0) {
        add(s.shadowSoft, x, y);
      }
    }
  }

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

let scene: Scene | null = null;
const d = (layer: Layer) => layer.join('');

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

function inFood(x: number, y: number) {
  return Math.hypot(x + 0.5 - FOOD_N / 2, y + 0.5 - FOOD_N / 2) <= R_FOOD;
}

/** Keeps only the round food area of the canvas, cut in whole pixels. */
function cutRound(ctx: CanvasRenderingContext2D) {
  // One path for the whole disc: 'destination-in' clears everything outside
  // each single drawing call.
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = '#000';
  ctx.beginPath();
  for (let y = 0; y < FOOD_N; y++) for (let x = 0; x < FOOD_N; x++) if (inFood(x, y)) ctx.rect(x, y, 1, 1);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

function drawMeal(ctx: CanvasRenderingContext2D, style: FoodStyle, seed: string) {
  const rnd = random(seed);
  const { base, spots } = FOOD_COLORS[style];
  ctx.clearRect(0, 0, FOOD_N, FOOD_N);
  // A heap, not a disc: the meal covers the middle, the plate shows around it.
  for (let y = 0; y < FOOD_N; y++) {
    for (let x = 0; x < FOOD_N; x++) {
      const r = Math.hypot(x + 0.5 - FOOD_N / 2, y + 0.5 - FOOD_N / 2);
      if (r <= R_FOOD - 3 - rnd() * 2.5) {
        ctx.fillStyle = base;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const count = style === 'pasta' ? 90 : 70;
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * (R_FOOD - 6);
    const x = Math.round(FOOD_N / 2 + Math.cos(a) * r);
    const y = Math.round(FOOD_N / 2 + Math.sin(a) * r);
    const color = spots[Math.floor(rnd() * spots.length)];
    ctx.fillStyle = color;
    if (style === 'pasta') {
      // Strands: short diagonal runs.
      const dir = rnd() > 0.5 ? 1 : -1;
      for (let k = 0; k < 3; k++) ctx.fillRect(x + k, y + k * dir, 1, 1);
    } else {
      ctx.fillRect(x, y, rnd() > 0.5 ? 2 : 1, rnd() > 0.6 ? 2 : 1);
    }
  }
  // Light on the top left of the heap.
  ctx.fillStyle = 'rgb(255 255 255 / 0.22)';
  for (let y = 0; y < FOOD_N; y++) for (let x = 0; x < FOOD_N; x++) {
    const dx = x + 0.5 - FOOD_N / 2;
    const dy = y + 0.5 - FOOD_N / 2;
    const r = Math.hypot(dx, dy);
    if (r < R_FOOD - 6 && r > R_FOOD - 9 && (dx * LX + dy * LY) / (r || 1) > 0.5) ctx.fillRect(x, y, 1, 1);
  }
  cutRound(ctx);
}

/** The photo scaled down to the scene's pixels, in two steps so it doesn't shimmer. */
function drawPhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const mid = document.createElement('canvas');
  mid.width = mid.height = FOOD_N * 4;
  const m = mid.getContext('2d');
  if (!m) return false;
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  m.imageSmoothingQuality = 'high';
  m.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, mid.width, mid.height);
  ctx.clearRect(0, 0, FOOD_N, FOOD_N);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(mid, 0, 0, FOOD_N, FOOD_N);
  cutRound(ctx);
  return true;
}

// ── The scene ─────────────────────────────────────────────────────────────

export default function PixelPlate({
  photo,
  style,
  seed,
  className = '',
}: {
  /** The dish photo, when there is one and the visitor allows outside pictures. */
  photo?: string | null;
  style: FoodStyle;
  /** Keeps the drawn meal the same for the same dish. */
  seed: string;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  scene ??= buildScene();
  const sc = scene;

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    drawMeal(ctx, style, seed);
    if (!photo) return;
    let alive = true;
    const img = new Image();
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      if (!alive) return;
      el.dataset.photo = drawPhoto(ctx, img) ? 'true' : 'false';
    };
    img.src = photo;
    return () => { alive = false; img.onload = null; };
  }, [photo, style, seed]);

  return (
    <span className={`pxp relative block w-full ${className}`} style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="pxp-art absolute inset-0 h-full w-full" shapeRendering="crispEdges" aria-hidden="true">
        <path d={d(sc.shadowSoft)} className="pxp-shadow-soft" />
        <path d={d(sc.shadow)} className="pxp-shadow" />
        <path d={d(sc.edge)} className="pxp-edge" />
        <path d={d(sc.rim)} className="pxp-rim" />
        <path d={d(sc.rimHi)} className="pxp-rim-hi" />
        <path d={d(sc.rimLo)} className="pxp-rim-lo" />
        <path d={d(sc.well)} className="pxp-well" />
        <path d={d(sc.wellLo)} className="pxp-well-lo" />
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
      </svg>
      <canvas
        ref={canvas}
        width={FOOD_N}
        height={FOOD_N}
        className="pxp-food absolute"
        style={{ left: `${(FOOD_X / W) * 100}%`, top: `${(FOOD_Y / H) * 100}%`, width: `${(FOOD_N / W) * 100}%`, height: `${(FOOD_N / H) * 100}%` }}
        aria-hidden="true"
      />
      <svg viewBox={`0 0 ${W} ${H}`} className="pxp-steam pointer-events-none absolute inset-0 h-full w-full" shapeRendering="crispEdges" aria-hidden="true">
        <path d="M50 13h1v1h-1zM51 11h1v1h-1zM51 9h1v1h-1zM50 7h1v1h-1z" className="pxp-wisp" />
        <path d="M56 12h1v1h-1zM55 10h1v1h-1zM56 8h1v1h-1zM57 6h1v1h-1zM56 4h1v1h-1z" className="pxp-wisp pxp-wisp-2" />
        <path d="M62 13h1v1h-1zM61 11h1v1h-1zM61 9h1v1h-1zM62 7h1v1h-1z" className="pxp-wisp pxp-wisp-3" />
      </svg>
    </span>
  );
}
