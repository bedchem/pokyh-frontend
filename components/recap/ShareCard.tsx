'use client';

import { forwardRef, type ReactNode } from 'react';
import { Paths } from '@/components/pixel/SceneSvg';
import { LENS_GLASS, MASCOT_SHADOW, mascot } from '@/components/pixel/mascot';
import { wearSprite } from '@/components/pixel/collectibles';
import type { Sprite } from '@/components/pixel/sprite';
import { GLYPH_HEIGHT, pixelClip, pixelLines, pixelPath, pixelWidth } from './pixelFont';
import { REACTIONS } from './reactions';

// The recap's last card, to keep and to share: five designs in pixel art,
// each with the mascot in a pose of the student's choice and the figures
// they picked. Drawn as one SVG of 180 × 320 card pixels — the page shows it
// and the picture to share is exactly this drawing at six times the size
// (./share.ts), text included (the pixel font, ./pixelFont.ts).
//
//   report    a report card on paper, rows with dotted leaders, a stamp
//   arcade    a high-score screen, stars, the mascot on a brick platform
//   card      a trading card: "KP" for the first figure, the others as attacks
//   handheld  a pocket console, the mascot and figures on its green screen
//   poster    one huge figure on a bold colour, the mascot peeking in

export const CARD_DESIGNS = ['report', 'arcade', 'card', 'handheld', 'poster'] as const;
export type CardDesign = (typeof CARD_DESIGNS)[number];

export const CARD_POSES = ['proud', 'legend', 'wave', 'cool', 'party', 'love', 'cheer', 'zap', 'sleepy', 'angel'] as const;
export type CardPose = (typeof CARD_POSES)[number];

/** How many figures each design has room for. */
export const CARD_SLOTS: Record<CardDesign, number> = { report: 6, arcade: 5, card: 4, handheld: 4, poster: 5 };
export const DEFAULT_POSE: Record<CardDesign, CardPose> = { report: 'proud', arcade: 'legend', card: 'cheer', handheld: 'wave', poster: 'cool' };
export const POSTER_COLORS = ['#ff5d3a', '#2f6bff', '#0f9d63', '#ffbf1f', '#8b3dff'] as const;

export interface CardWords {
  report: string;
  highScore: string;
  pressStart: string;
  player: string;
  hp: string;
  student: string;
}

export interface CardData {
  title: string;
  /** "1.9.2025 – 30.6.2026" */
  period: string;
  /** "2025/26" */
  year: string;
  name: string;
  items: Array<{ label: string; value: string }>;
  pose: CardPose;
  posterColor: string;
  words: CardWords;
}

export const CARD_W = 180;
export const CARD_H = 320;

// ── Drawing helpers (card pixels) ───────────────────────────────────────────

/** The size `text` is set in at most `size`, to fit `max`. */
function fitSize(text: string, size: number, max?: number): number {
  let s = size;
  if (max) while (s > 1 && pixelWidth(text) * s > max) s--;
  return s;
}

/** The width `text` takes at most `size`, within `max`. */
function fitWidth(text: string, size: number, max: number): number {
  return Math.min(max, pixelWidth(text) * fitSize(text, size, max));
}

/**
 * Text in the pixel font at (x, y), shrunk to `max` (then cut off). A
 * shrunk text keeps its bottom where the full size would have it, so a row's
 * figures stand on one line.
 */
function T({ text, x, y, size = 1, fill, align = 'left', max }: { text: string; x: number; y: number; size?: number; fill: string; align?: 'left' | 'center' | 'right'; max?: number }) {
  const s = fitSize(text, size, max);
  const t = max ? pixelClip(text, Math.floor(max / s)) : text;
  const p = pixelPath(t, s);
  const left = align === 'center' ? x - p.width / 2 : align === 'right' ? x - p.width : x;
  const top = y + (size - s) * GLYPH_HEIGHT;
  return <path d={p.d} fill={fill} transform={`translate(${Math.round(left)} ${Math.round(top)})`} />;
}

/** Text over several lines (at most `lines`), each centred or left. */
function Lines({ text, x, y, size = 1, fill, align = 'left', max, lines = 2 }: { text: string; x: number; y: number; size?: number; fill: string; align?: 'left' | 'center'; max: number; lines?: number }) {
  let s = size;
  let set = pixelLines(text, Math.floor(max / s));
  while (s > 1 && set.length > lines) { s--; set = pixelLines(text, Math.floor(max / s)); }
  set = set.slice(0, lines).map((l) => pixelClip(l, Math.floor(max / s)));
  const p = pixelPath(set, s, align);
  const left = align === 'center' ? x - p.width / 2 : x;
  return <path d={p.d} fill={fill} transform={`translate(${Math.round(left)} ${Math.round(y)})`} />;
}

function rect(x: number, y: number, w: number, h: number, fill: string, key?: string | number): ReactNode {
  return <rect key={key} x={x} y={y} width={w} height={h} fill={fill} />;
}

/** A frame of `t` card pixels along the inside of a box. */
function frame(x: number, y: number, w: number, h: number, t: number, fill: string): ReactNode {
  return (
    <g fill={fill}>
      <rect x={x} y={y} width={w} height={t} />
      <rect x={x} y={y + h - t} width={w} height={t} />
      <rect x={x} y={y} width={t} height={h} />
      <rect x={x + w - t} y={y} width={t} height={h} />
    </g>
  );
}

/** A filled pixel circle (or a ring `thick` wide) as one path. */
function circle(cx: number, cy: number, r: number, fill: string, thick?: number): ReactNode {
  let d = '';
  for (let y = -r; y < r; y++) {
    let start: number | null = null;
    for (let x = -r; x <= r; x++) {
      const dist = Math.hypot(x + 0.5, y + 0.5);
      const on = x < r && dist <= r && (thick === undefined || dist > r - thick);
      if (on && start === null) start = x;
      if ((!on || x === r) && start !== null) {
        d += `M${cx + start} ${cy + y}h${x - start}v1h${start - x}z`;
        start = null;
      }
    }
  }
  return <path d={d} fill={fill} />;
}

function seeded(seed: number) {
  let h = seed;
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

// ── The mascot ──────────────────────────────────────────────────────────────

function poseSprites(pose: CardPose): { sprites: Sprite[] } {
  const r = REACTIONS[pose];
  const p = r.look.pose;
  const sprites: Sprite[] = [MASCOT_SHADOW, mascot(p)];
  if (p.arms === 'lens') sprites.push(LENS_GLASS);
  const shades = r.wear?.face === 'shades' && !['closed', 'happy'].includes(p.eyes) && !['cover', 'peek', 'lens'].includes(p.arms) ? wearSprite('shades') : null;
  if (shades) sprites.push(shades);
  const hat = r.wear?.head ? wearSprite(r.wear.head) : null;
  if (hat) sprites.push(hat);
  return { sprites };
}

/** The mascot with its top-left at (x, y), `scale` card pixels per sprite pixel. */
function Mascot({ pose, x, y, scale, recolor }: { pose: CardPose; x: number; y: number; scale: number; recolor?: (tone: string) => string }) {
  const { sprites } = poseSprites(pose);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {sprites.map((sprite, i) => recolor
        ? <g key={i}>{sprite.paths().map(([tone, d]) => <path key={tone} d={d} fill={recolor(tone)} />)}</g>
        : <Paths key={i} sprite={sprite} />)}
    </g>
  );
}

// The green screen's four shades, by a tone's step (0 outline … 4 light).
const LCD = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'];
function lcdTone(tone: string): string {
  if (tone.startsWith('sh')) return LCD[1]!;
  const step = Number(tone.slice(-1));
  if (!Number.isFinite(step)) return LCD[1]!;
  return LCD[step <= 0 ? 0 : step === 1 ? 1 : step === 2 ? 1 : step === 3 ? 2 : 3]!;
}

// ── The designs ─────────────────────────────────────────────────────────────

function Report({ d }: { d: CardData }) {
  const ink = '#2a2035';
  const faint = '#b8a98a';
  const muted = '#6b5d7e';
  const rows = d.items.slice(0, CARD_SLOTS.report);
  return (
    <>
      {rect(0, 0, CARD_W, CARD_H, ink)}
      {rect(6, 6, 168, 308, '#f1e6cf')}
      {frame(10, 10, 160, 300, 2, ink)}
      {frame(14, 14, 152, 292, 1, faint)}
      <T text="POKYH" x={90} y={22} fill="#5b52e6" align="center" />
      <T text={d.words.report} x={90} y={34} size={2} fill={ink} align="center" max={148} />
      <T text={d.title} x={90} y={54} fill={muted} align="center" max={148} />
      <T text={d.period} x={90} y={64} fill={muted} align="center" max={148} />
      {d.name && <T text={d.name} x={90} y={78} size={2} fill={ink} align="center" max={148} />}
      {rect(22, 96, 136, 1, ink)}
      {rows.map((row, i) => {
        const y = 106 + i * 24;
        // Label, at least a few dots, the figure: 136 card pixels in all.
        const valueW = fitWidth(row.value, 2, 76);
        const labelMax = 136 - valueW - 10;
        const labelW = Math.min(labelMax, pixelWidth(row.label));
        const dotsFrom = 22 + labelW + 3;
        const dotsTo = 158 - valueW - 3;
        return (
          <g key={i}>
            <T text={row.label} x={22} y={y + 7} fill={muted} max={labelMax} />
            {Array.from({ length: Math.max(0, Math.floor((dotsTo - dotsFrom) / 3)) }, (_, k) => rect(dotsFrom + k * 3, y + 13, 1, 1, faint, k))}
            <T text={row.value} x={158} y={y} size={2} fill={ink} align="right" max={76} />
          </g>
        );
      })}
      <Mascot pose={d.pose} x={20} y={252} scale={1.25} />
      {circle(138, 276, 19, '#c0392b', 3)}
      {circle(138, 276, 14, '#c0392b', 1)}
      <T text="POKYH" x={138} y={269} fill="#c0392b" align="center" />
      <T text="*" x={138} y={279} fill="#c0392b" align="center" />
      <T text="POKYH.COM" x={90} y={300} fill={muted} align="center" />
    </>
  );
}

function Arcade({ d }: { d: CardData }) {
  const colors = ['#ffd23f', '#3ee6ff', '#ff4fa3', '#5df27a', '#ff9f43'];
  const ranks = ['1ST', '2ND', '3RD', '4TH', '5TH'];
  const r = seeded(11);
  const stars = Array.from({ length: 46 }, () => [Math.floor(r() * 176) + 2, Math.floor(r() * 316) + 2, r()] as const);
  const rows = d.items.slice(0, CARD_SLOTS.arcade);
  return (
    <>
      {rect(0, 0, CARD_W, CARD_H, '#0b0b18')}
      {stars.map(([x, y, b], i) => rect(x, y, 1, 1, b > 0.85 ? '#f2f2ff' : '#3a3a6a', i))}
      {frame(6, 6, 168, 308, 2, '#3ee6ff')}
      {frame(10, 10, 160, 300, 1, '#1d4a66')}
      <T text={d.words.highScore} x={90} y={20} size={2} fill="#ffd23f" align="center" max={150} />
      <T text={d.title} x={90} y={42} fill="#3ee6ff" align="center" max={150} />
      {d.name && <T text={`${d.words.player} ${d.name}`} x={90} y={54} fill="#ff4fa3" align="center" max={150} />}
      {rows.map((row, i) => {
        const y = 72 + i * 22;
        const color = colors[i % colors.length]!;
        const valueW = fitWidth(row.value, 2, 64);
        return (
          <g key={i}>
            <T text={ranks[i]!} x={18} y={y + 4} fill={color} />
            <T text={row.label} x={40} y={y + 4} fill={color} max={160 - 40 - valueW - 6} />
            <T text={row.value} x={162} y={y} size={2} fill="#f2f2ff" align="right" max={64} />
          </g>
        );
      })}
      <Mascot pose={d.pose} x={50} y={194} scale={2} />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          {rect(26 + i * 16, 262, 15, 6, '#b4532a')}
          {rect(26 + i * 16, 268, 15, 1, '#7a3018')}
          {rect(34 + i * 16 - (i === 7 ? 8 : 0), 269, i === 7 ? 7 : 15, 5, '#b4532a')}
        </g>
      ))}
      <T text={d.words.pressStart} x={90} y={284} fill="#f2f2ff" align="center" max={150} />
      <T text="POKYH.COM" x={90} y={298} fill="#5df27a" align="center" />
    </>
  );
}

function TradingCard({ d }: { d: CardData }) {
  const [hp, ...attacks] = d.items.slice(0, CARD_SLOTS.card);
  const energy = ['#ff6b6b', '#ffd23f', '#5ee7a0'];
  return (
    <>
      {rect(0, 0, CARD_W, CARD_H, '#f4c430')}
      {rect(8, 8, 164, 304, '#3b3f9e')}
      {frame(8, 8, 164, 304, 1, '#22266b')}
      <T text={d.name || 'POKYH'} x={14} y={15} size={2} fill="#ffffff" max={hp ? 92 : 150} />
      {hp && (
        <>
          <T text={hp.value} x={166} y={15} size={2} fill="#ff8a8a" align="right" max={56} />
          <T text={d.words.hp} x={166 - Math.min(56, pixelWidth(hp.value) * 2) - 4} y={22} fill="#ff8a8a" align="right" />
        </>
      )}
      {rect(14, 34, 152, 104, '#f4c430')}
      {rect(16, 36, 148, 100, '#8fd3ff')}
      {rect(30, 48, 16, 4, '#e8f6ff')}{rect(26, 52, 26, 4, '#e8f6ff')}
      {rect(116, 58, 20, 4, '#e8f6ff')}{rect(110, 62, 32, 4, '#e8f6ff')}
      {rect(16, 118, 148, 18, '#5fbf4a')}
      {Array.from({ length: 14 }, (_, i) => rect(20 + i * 10, 116, 2, 2, '#3f8f34', i))}
      {rect(16, 126, 148, 10, '#4aa63a')}
      <Mascot pose={d.pose} x={50} y={52} scale={2} />
      {rect(14, 141, 152, 11, '#f4c430')}
      <T text={`${d.words.student} · ${d.year}`} x={90} y={143} fill="#3b2a00" align="center" max={146} />
      {attacks.map((row, i) => {
        const y = 162 + i * 34;
        const valueW = fitWidth(row.value, 2, 64);
        return (
          <g key={i}>
            {circle(22, y + 7, 5, energy[i % energy.length]!)}
            {circle(22, y + 7, 2, '#3b3f9e')}
            <T text={row.label} x={32} y={y + 4} fill="#ffffff" max={160 - 32 - valueW - 6} />
            <T text={row.value} x={166} y={y} size={2} fill="#ffe27a" align="right" max={64} />
            {rect(14, y + 24, 152, 1, '#5a5fc0')}
          </g>
        );
      })}
      <T text="POKYH.COM" x={14} y={298} fill="#d7d9ff" />
      <T text={`001/${d.year.slice(0, 4)} *`} x={166} y={298} fill="#d7d9ff" align="right" />
    </>
  );
}

function Handheld({ d }: { d: CardData }) {
  const rows = d.items.slice(0, CARD_SLOTS.handheld);
  const body = '#d9d3c7';
  const edge = '#b4ad9f';
  return (
    <>
      {rect(0, 0, CARD_W, CARD_H, '#4f46e5')}
      {rect(18, 14, 144, 290, edge)}
      {rect(18, 14, 142, 286, body)}
      {rect(148, 288, 12, 12, edge)}
      {rect(150, 300, 12, 4, '#4f46e5')}{rect(158, 292, 4, 12, '#4f46e5')}
      {rect(28, 26, 124, 116, '#55536b')}
      {rect(34, 66, 3, 3, '#ff3b3b')}
      {rect(42, 32, 104, 104, LCD[3]!)}
      <Lines text={d.title} x={94} y={36} fill={LCD[0]!} align="center" max={98} lines={2} />
      <Mascot pose={d.pose} x={74} y={50} scale={1} recolor={lcdTone} />
      {rows.map((row, i) => {
        const y = 91 + i * 11;
        const valueW = fitWidth(row.value, 1, 44);
        return (
          <g key={i}>
            <T text={row.label} x={46} y={y} fill={LCD[0]!} max={96 - valueW - 6} />
            <T text={row.value} x={142} y={y} fill={LCD[0]!} align="right" max={44} />
            {rect(46, y + 8, 96, 1, LCD[2]!)}
          </g>
        );
      })}
      <T text="POKYH" x={30} y={150} size={2} fill="#30307a" />
      <T text={d.year} x={150} y={157} fill="#7b7466" align="right" />
      {rect(34, 196, 30, 10, '#2b2b33')}{rect(44, 186, 10, 30, '#2b2b33')}
      {rect(46, 198, 6, 6, '#3d3d47')}
      {circle(134, 192, 9, '#a3195b')}{circle(112, 206, 9, '#a3195b')}
      <T text="A" x={134} y={205} fill="#30307a" align="center" />
      <T text="B" x={112} y={219} fill="#30307a" align="center" />
      {rect(64, 240, 18, 5, '#8c8579')}{rect(90, 240, 18, 5, '#8c8579')}
      {Array.from({ length: 5 }, (_, i) => rect(118 + i * 6, 256, 2, 22, edge, `s${i}`))}
      {d.name && <T text={d.name} x={30} y={286} fill="#7b7466" max={80} />}
      <T text="POKYH.COM" x={90} y={310} fill="#e0e7ff" align="center" />
    </>
  );
}

// Text on a poster colour (dark on the light ones) and its boxes: the colour
// a step darker, solid.
function posterInk(color: string): { ink: string; box: string } {
  const n = parseInt(color.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const dark = (v: number) => Math.round(v * 0.8).toString(16).padStart(2, '0');
  return { ink: lum > 150 ? '#1a1405' : '#ffffff', box: `#${dark(r)}${dark(g)}${dark(b)}` };
}

function Poster({ d }: { d: CardData }) {
  const [big, ...rest] = d.items.slice(0, CARD_SLOTS.poster);
  const { ink, box } = posterInk(d.posterColor);
  return (
    <>
      {rect(0, 0, CARD_W, CARD_H, d.posterColor)}
      <Lines text={d.title} x={12} y={14} size={2} fill={ink} max={156} lines={2} />
      {d.name && <T text={d.name} x={12} y={52} fill={ink} max={156} />}
      {big && (
        <>
          <T text={big.value} x={90} y={70} size={8} fill={ink} align="center" max={164} />
          <Lines text={big.label} x={90} y={132} size={2} fill={ink} align="center" max={160} lines={1} />
        </>
      )}
      {rest.map((row, i) => {
        const x = 12 + (i % 2) * 80;
        const y = 156 + Math.floor(i / 2) * 44;
        return (
          <g key={i}>
            <rect x={x} y={y} width={76} height={40} fill={box} />
            <T text={row.value} x={x + 6} y={y + 7} size={2} fill={ink} max={64} />
            <T text={row.label} x={x + 6} y={y + 27} fill={ink} max={64} />
          </g>
        );
      })}
      <Mascot pose={d.pose} x={66} y={250} scale={3} />
      <T text="POKYH.COM" x={10} y={306} fill={ink} />
    </>
  );
}

const DESIGNS: Record<CardDesign, (props: { d: CardData }) => ReactNode> = {
  report: Report,
  arcade: Arcade,
  card: TradingCard,
  handheld: Handheld,
  poster: Poster,
};

const ShareCard = forwardRef<SVGSVGElement, { design: CardDesign; data: CardData; className?: string; label?: string }>(
  function ShareCard({ design, data, className, label }, ref) {
    const Design = DESIGNS[design];
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
        <Design d={data} />
      </svg>
    );
  },
);

export default ShareCard;
