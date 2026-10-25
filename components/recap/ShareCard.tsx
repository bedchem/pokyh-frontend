'use client';

import { forwardRef } from 'react';
import { Paths } from '@/components/pixel/SceneSvg';
import { LENS_GLASS, MASCOT_SHADOW, mascot } from '@/components/pixel/mascot';
import { wearSprite } from '@/components/pixel/collectibles';
import type { Sprite } from '@/components/pixel/sprite';
import { GLYPH_HEIGHT, pixelClip, pixelLines, pixelPath, pixelWidth } from './pixelFont';
import { REACTIONS } from './reactions';

// The recap's last card, to keep and to share: a poster in pixel art — the
// title, the first figure huge, the others each on a row of its own (the
// label small above, the figure large below, so nothing is cut short), the
// mascot peeking in at the bottom in the pose the student picked, on a bold
// colour of their choice. Drawn as one SVG of 180 × 320 card pixels — the
// page shows it and the picture to share is exactly this drawing at six
// times the size (./share.ts), text included (the pixel font, ./pixelFont.ts).

export const CARD_POSES = ['cool', 'legend', 'wave', 'proud', 'party', 'love', 'cheer', 'zap', 'sleepy', 'angel'] as const;
export type CardPose = (typeof CARD_POSES)[number];

/** How many figures the poster takes at most: one huge, four on rows. */
export const CARD_SLOTS = 5;
export const POSTER_COLORS = ['#ff5d3a', '#2f6bff', '#0f9d63', '#ffbf1f', '#8b3dff', '#ff4f9a', '#1b1640'] as const;

export interface CardData {
  title: string;
  name: string;
  items: Array<{ label: string; value: string }>;
  pose: CardPose;
  color: string;
}

export const CARD_W = 180;
export const CARD_H = 320;
const LINE = GLYPH_HEIGHT + 3;

// ── Drawing helpers (card pixels) ───────────────────────────────────────────

/** The size `text` is set in at most `size`, to fit `max`. */
function fitSize(text: string, size: number, max: number): number {
  let s = size;
  while (s > 1 && pixelWidth(text) * s > max) s--;
  return s;
}

/**
 * Text in the pixel font at (x, y), shrunk to `max` (cut off only below
 * size 1). A shrunk text keeps its bottom where the full size would have it.
 */
function T({ text, x, y, size = 1, fill, align = 'left', max }: { text: string; x: number; y: number; size?: number; fill: string; align?: 'left' | 'center' | 'right'; max: number }) {
  const s = fitSize(text, size, max);
  const p = pixelPath(pixelClip(text, Math.floor(max / s)), s);
  const left = align === 'center' ? x - p.width / 2 : align === 'right' ? x - p.width : x;
  return <path d={p.d} fill={fill} transform={`translate(${Math.round(left)} ${Math.round(y + (size - s) * GLYPH_HEIGHT)})`} />;
}

/** Text over up to `lines` lines, as large as fits; its height in card pixels. */
function wrapped(text: string, size: number, max: number, lines: number): { set: string[]; size: number; height: number } {
  let s = size;
  let set = pixelLines(text, Math.floor(max / s));
  while (s > 1 && (set.length > lines || set.some((l) => pixelWidth(l) * s > max))) { s--; set = pixelLines(text, Math.floor(max / s)); }
  set = set.slice(0, lines).map((l) => pixelClip(l, Math.floor(max / s)));
  return { set, size: s, height: (set.length * LINE - 3) * s };
}

function Lines({ text, x, y, fill, align = 'left', layout }: { text: string; x: number; y: number; fill: string; align?: 'left' | 'center'; layout: { set: string[]; size: number } }) {
  const p = pixelPath(layout.set, layout.size, align);
  const left = align === 'center' ? x - p.width / 2 : x;
  return <path d={p.d} fill={fill} transform={`translate(${Math.round(left)} ${Math.round(y)})`} aria-label={text} />;
}

// ── The mascot ──────────────────────────────────────────────────────────────

function poseSprites(pose: CardPose): Sprite[] {
  const r = REACTIONS[pose];
  const p = r.look.pose;
  const sprites: Sprite[] = [MASCOT_SHADOW, mascot(p)];
  if (p.arms === 'lens') sprites.push(LENS_GLASS);
  const shades = r.wear?.face === 'shades' && !['closed', 'happy'].includes(p.eyes) && !['cover', 'peek', 'lens'].includes(p.arms) ? wearSprite('shades') : null;
  if (shades) sprites.push(shades);
  const hat = r.wear?.head ? wearSprite(r.wear.head) : null;
  if (hat) sprites.push(hat);
  return sprites;
}

/** Draws every pose once, ahead of time, so choosing one later doesn't stall. */
export function warmPoses(): void {
  for (const pose of CARD_POSES) poseSprites(pose);
}

// Text on a poster colour (dark on the light ones) and its rows: the colour
// a step darker, solid.
function posterInk(color: string): { ink: string; soft: string; box: string } {
  const n = parseInt(color.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  const light = 0.299 * r + 0.587 * g + 0.114 * b > 150;
  const shade = (v: number) => Math.round(v * (light ? 0.86 : 0.78)).toString(16).padStart(2, '0');
  const mix = (v: number, to: number) => Math.round(v + (to - v) * 0.7).toString(16).padStart(2, '0');
  return {
    ink: light ? '#1a1405' : '#ffffff',
    soft: light ? `#${mix(r, 26)}${mix(g, 20)}${mix(b, 5)}` : `#${mix(r, 255)}${mix(g, 255)}${mix(b, 255)}`,
    box: `#${shade(r)}${shade(g)}${shade(b)}`,
  };
}

// ── The poster ──────────────────────────────────────────────────────────────

function Poster({ d }: { d: CardData }) {
  const [big, ...rest] = d.items.slice(0, CARD_SLOTS);
  const { ink, soft, box } = posterInk(d.color);
  const sprites = poseSprites(d.pose);

  // Top down: the title (up to three lines), the name, the huge figure and
  // its label, the rows; then the mascot below them, peeking in.
  const title = wrapped(d.title, 2, 156, 3);
  let y = 12 + title.height + 6;
  const nameY = y;
  if (d.name) y += LINE + 4;
  const bigTop = y + 2;
  const bigLabelY = bigTop + 7 * 8 + 5;
  const bigLabel = big ? wrapped(big.label, 2, 160, 1) : null;
  y = bigLabelY + (bigLabel?.height ?? 0) + 8;
  // A row is the label on the left and the figure on the right when both
  // fit on one line; else the label above and the figure large below it.
  const rows = rest.map((row) => {
    const oneLine = pixelWidth(row.label) + 8 + pixelWidth(row.value) * 2 <= 144;
    const top = y;
    y += (oneLine ? 20 : 30) + 3;
    return { row, top, oneLine };
  });
  const rowsEnd = y;
  const scale = 3;
  // The mascot stands behind the rows (a hat may tuck behind one, never over a figure).
  // Never so low that its face leaves the poster: it may stand partly behind the last row.
  const mascotY = Math.max(232, Math.min(rowsEnd + 4, 262));
  // Far enough left that a raised hand stays on the poster, clear of the address.
  const mascotX = 66;

  return (
    <>
      <rect x={0} y={0} width={CARD_W} height={CARD_H} fill={d.color} />
      <g transform={`translate(${mascotX} ${mascotY}) scale(${scale})`}>
        {sprites.map((sprite, i) => <Paths key={i} sprite={sprite} />)}
      </g>
      <Lines text={d.title} x={12} y={12} fill={ink} layout={title} />
      {d.name && <T text={d.name} x={12} y={nameY} fill={soft} max={156} />}
      {big && (
        <>
          <T text={big.value} x={90} y={bigTop} size={8} fill={ink} align="center" max={164} />
          {bigLabel && <Lines text={big.label} x={90} y={bigLabelY} fill={ink} align="center" layout={bigLabel} />}
        </>
      )}
      {rows.map(({ row, top, oneLine }, i) => (
        <g key={i}>
          <rect x={12} y={top} width={156} height={oneLine ? 20 : 30} fill={box} />
          {oneLine ? (
            <>
              <T text={row.label} x={18} y={top + 10} fill={soft} max={144} />
              <T text={row.value} x={162} y={top + 3} size={2} fill={ink} align="right" max={144} />
            </>
          ) : (
            <>
              <T text={row.label} x={18} y={top + 4} fill={soft} max={144} />
              <T text={row.value} x={18} y={top + 13} size={2} fill={ink} max={144} />
            </>
          )}
        </g>
      ))}
      <T text="POKYH.COM" x={10} y={306} fill={ink} max={70} />
    </>
  );
}

const ShareCard = forwardRef<SVGSVGElement, { data: CardData; className?: string; label?: string }>(
  function ShareCard({ data, className, label }, ref) {
    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        // .spr: the sprites' colours (components/pixel/palette.ts) apply inside.
        className={`spr ${className ?? ''}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={label}
      >
        <Poster d={data} />
      </svg>
    );
  },
);

export default ShareCard;
