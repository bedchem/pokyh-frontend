'use client';

// Artwork of the homepage's 3D scenes (hero tunnel and carousel), drawn on
// canvases that become three.js textures. Everything on them is POKYH as it
// looks in the app, in its light theme: lesson cells in the timetable's
// subject tones with an Entfall and an exam, grade chips and the trend line,
// the inbox, the exam card of the dashboard, the absence rate, to-dos,
// reminders and the Mensa's pixel plate. Content is sample content.
//
// Large items ("posters", one per function) are drawn in a 400 × 496 design
// box: the function's deep colour around a piece of the app. Small tiles in a
// 200-wide box, portrait (200 × 256) or landscape (200 × 164).

import { BRAND, examTone, statusTone, subjectTone } from '@/lib/timetable-logic';
import { paintPixelPlate, plateSceneSize } from '@/components/mensa/PixelPlate';

export type PosterKind = 'timetable' | 'mensa' | 'grades' | 'messages' | 'reminders' | 'exams' | 'absences' | 'todos';
export type TileKind = 'time' | 'plate' | 'grade' | 'message' | 'cancel' | 'week' | 'exam';

export const POSTER_BG: Record<PosterKind, string> = {
  timetable: '#4A46A6',
  mensa: '#C2410C',
  grades: '#44653F',
  messages: '#94493E',
  reminders: '#1E1E1E',
  exams: '#7A5B14',
  absences: '#6366F1',
  todos: '#047857',
};

export interface ArtFonts {
  display: string;
  sans: string;
}

export interface TileText {
  period: string;
  subject: string;
  room: string;
  gradeSubject: string;
  average: string;
  cancel: string;
  cancelSub: string;
  msgFrom: string;
  msgText: string;
  examDay: string;
  exam: string;
  weekdays: string[];
  now: string;
  examIn: string;
  dish: string;
  rate: string;
  excused: string;
  open: string;
  overdue: string;
  todos: string[];
  reminders: string[];
  subjects: string[];
  senders: string[];
  topics: string[];
  examList: string[];
  months: string[];
  /** The functions' names, as the posters' titles. */
  titles: Record<Exclude<PosterKind, 'mensa'>, string> & { mensa: string };
}

const BOX_W = 400;
const BOX_H = 496;

// The app's light theme (globals.css).
const C = {
  canvas: '#F5F2ED',
  surface: '#FFFFFF',
  inset: '#EEEAE3',
  line: '#E2DCD2',
  ink: '#1C1A17',
  ink2: '#625B52',
  ink3: '#8C8478',
  accent: BRAND.accent,
  success: BRAND.success,
  successInk: '#047857',
  danger: BRAND.danger,
  dangerInk: '#B91C1C',
  warning: BRAND.warning,
  periwinkle: '#DEDDFB',
  periwinkleInk: '#4A46A6',
  butter: '#F7E7AC',
  butterInk: '#7A5B14',
  sage: '#D5E4D0',
  sageInk: '#44653F',
  blush: '#F7D9D3',
  blushInk: '#94493E',
  star: '#F5B301',
};

/** Font families as the page resolved them (next/font hashes the names). */
export function resolveFonts(): ArtFonts {
  const probe = document.createElement('span');
  probe.className = 'font-display';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  document.querySelector('.site')?.appendChild(probe);
  const display = getComputedStyle(probe).fontFamily || 'serif';
  probe.remove();
  const sans = getComputedStyle(document.body).fontFamily || 'sans-serif';
  return { display, sans };
}

// ── Drawing helpers (design-box units) ────────────────────────────────────

type Ctx = CanvasRenderingContext2D;

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number | number[]) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function box(ctx: Ctx, x: number, y: number, w: number, h: number, r: number | number[], fill: string) {
  ctx.fillStyle = fill;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
}

function circle(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

interface TextOpts {
  size: number;
  weight?: number;
  color: string;
  align?: CanvasTextAlign;
  font?: string;
  /** Cut with an ellipsis beyond this width. */
  max?: number;
  strike?: boolean;
  tracking?: number;
}

/** Text on the alphabetic baseline at y; returns its width. */
function text(ctx: Ctx, str: string, x: number, y: number, o: TextOpts): number {
  ctx.font = `${o.weight ?? 500} ${o.size}px ${o.font}`;
  ctx.fillStyle = o.color;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${o.tracking ?? 0}px`;
  let s = str;
  if (o.max && ctx.measureText(s).width > o.max) {
    while (s.length > 1 && ctx.measureText(`${s}…`).width > o.max) s = s.slice(0, -1);
    s = `${s.trimEnd()}…`;
  }
  ctx.fillText(s, x, y);
  const w = ctx.measureText(s).width;
  if (o.strike) {
    const left = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    ctx.fillRect(left - 1, y - o.size * 0.32, w + 2, Math.max(1.2, o.size * 0.08));
  }
  if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = '0px';
  ctx.textAlign = 'left';
  return w;
}

/** The largest size up to `size` at which `str` fits into `max`. */
function fitSize(ctx: Ctx, str: string, size: number, max: number, weight: number, font: string): number {
  let s = size;
  ctx.font = `${weight} ${s}px ${font}`;
  while (s > 10 && ctx.measureText(str).width > max) {
    s -= 1;
    ctx.font = `${weight} ${s}px ${font}`;
  }
  return s;
}

/** A pill with a label; returns its width. */
function pill(ctx: Ctx, label: string, x: number, y: number, o: { h: number; size: number; bg: string; fg: string; font: string; weight?: number; padX?: number }) {
  ctx.font = `${o.weight ?? 700} ${o.size}px ${o.font}`;
  const padX = o.padX ?? o.h * 0.42;
  const w = ctx.measureText(label).width + padX * 2;
  box(ctx, x, y, w, o.h, o.h / 2, o.bg);
  text(ctx, label, x + padX, y + o.h / 2 + o.size * 0.36, { size: o.size, weight: o.weight ?? 700, color: o.fg, font: o.font });
  return w;
}

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

/** A check mark in a circle (to-dos, excused). */
function check(ctx: Ctx, x: number, y: number, r: number, color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.45, y + r * 0.02);
  ctx.lineTo(x - r * 0.1, y + r * 0.36);
  ctx.lineTo(x + r * 0.48, y - r * 0.34);
  ctx.stroke();
}

/** A canvas of the given size with the design box mapped onto it and the corners rounded. */
function canvasFor(w: number, h: number, radius: number, bg: string, boxW = BOX_W, boxH = BOX_H) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(w / boxW, h / boxH);
  rr(ctx, 0, 0, boxW, boxH, radius);
  ctx.clip();
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, boxW, boxH);
  return { canvas, ctx };
}

// ── Pieces of the app ─────────────────────────────────────────────────────

/** A lesson cell of the timetable (WeekGrid): subject tone, or Entfall / exam with their outline. */
function lessonCell(
  ctx: Ctx,
  x: number, y: number, w: number, h: number,
  cell: { code: string; teacher?: string; kind?: 'cancel' | 'exam'; added?: string },
  font: string,
  scale = 1,
) {
  const tone = cell.kind === 'cancel' ? statusTone(BRAND.danger) : cell.kind === 'exam' ? examTone() : subjectTone(cell.code);
  const r = 9 * scale;
  box(ctx, x, y, w, h, r, tone.fill);
  if (cell.kind) {
    ctx.strokeStyle = cell.kind === 'cancel' ? C.danger : C.warning;
    ctx.lineWidth = 2 * scale;
    rr(ctx, x + scale, y + scale, w - 2 * scale, h - 2 * scale, r - scale);
    ctx.stroke();
  }
  const pad = 7 * scale;
  text(ctx, cell.code, x + pad, y + pad + 11 * scale, { size: 12.5 * scale, weight: 800, color: tone.ink, font, strike: cell.kind === 'cancel', max: w - pad * 2 });
  if (cell.added) {
    pill(ctx, cell.added, x + pad, y + pad + 16 * scale, { h: 13 * scale, size: 8.5 * scale, bg: C.accent, fg: '#FFFFFF', font, padX: 4 * scale });
  } else if (cell.teacher && h > 34 * scale) {
    ctx.globalAlpha = 0.8;
    text(ctx, cell.teacher, x + pad, y + pad + 25 * scale, { size: 10 * scale, weight: 600, color: tone.ink, font, strike: cell.kind === 'cancel', max: w - pad * 2 });
    ctx.globalAlpha = 1;
  }
}

const WEEK: Array<Array<{ code: string; teacher: string; kind?: 'cancel' | 'exam'; added?: string } | null>> = [
  [{ code: 'M', teacher: 'MUE' }, { code: 'D', teacher: 'HUB' }, { code: 'E', teacher: 'KOF' }, { code: 'IT', teacher: 'PLA' }, { code: 'GS', teacher: 'ROT' }, { code: 'BW', teacher: 'WEI' }],
  [{ code: 'IT', teacher: 'PLA' }, { code: 'GS', teacher: 'ROT' }, { code: 'BW', teacher: 'WEI', kind: 'cancel' }, { code: 'SP', teacher: 'GAS' }, { code: 'REL', teacher: 'FIN' }, { code: 'M', teacher: 'MUE' }],
  [{ code: 'SP', teacher: 'GAS' }, { code: 'REL', teacher: 'FIN' }, { code: 'M', teacher: 'MUE' }, { code: 'D', teacher: 'HUB' }, { code: 'E', teacher: 'NEU', added: 'NEU' }, { code: 'IT', teacher: 'PLA' }],
  [{ code: 'D', teacher: 'HUB' }, { code: 'E', teacher: 'KOF', kind: 'exam' }, { code: 'IT', teacher: 'PLA' }, { code: 'GS', teacher: 'ROT' }, { code: 'BW', teacher: 'WEI' }, { code: 'SP', teacher: 'GAS' }],
  [{ code: 'GS', teacher: 'ROT' }, { code: 'BW', teacher: 'WEI' }, { code: 'SP', teacher: 'GAS' }, { code: 'REL', teacher: 'FIN' }, null, null],
];

/** Grade chip colours as on the grades pages: good, just passing, failing. */
function gradeTone(v: number): [string, string] {
  return v >= 6.4 ? [C.sage, C.sageInk] : v >= 6 ? [C.butter, C.butterInk] : [C.blush, C.blushInk];
}

const comma = (v: number) => String(Math.round(v * 100) / 100).replace('.', ',');

/** The trend line of the grades page: pass mark, the grades, their running average. */
function trendLine(ctx: Ctx, x: number, y: number, w: number, h: number, values: number[], scale = 1) {
  const lo = 4;
  const hi = 10;
  const px = (i: number) => x + (i / (values.length - 1)) * w;
  const py = (v: number) => y + (1 - (v - lo) / (hi - lo)) * h;
  ctx.fillStyle = 'rgb(239 68 68 / 0.06)';
  ctx.fillRect(x, py(6), w, y + h - py(6));
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1 * scale;
  for (const g of [8, 10]) {
    ctx.beginPath();
    ctx.moveTo(x, py(g));
    ctx.lineTo(x + w, py(g));
    ctx.stroke();
  }
  ctx.setLineDash([5 * scale, 4 * scale]);
  ctx.strokeStyle = C.danger;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.moveTo(x, py(6));
  ctx.lineTo(x + w, py(6));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  // Running average.
  let sum = 0;
  ctx.strokeStyle = C.ink3;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 2 * scale;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  values.forEach((v, i) => {
    sum += v;
    const a = sum / (i + 1);
    if (i) ctx.lineTo(px(i), py(a));
    else ctx.moveTo(px(i), py(a));
  });
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Wash and line of the grades.
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, 'rgb(99 102 241 / 0.18)');
  grad.addColorStop(1, 'rgb(99 102 241 / 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  values.forEach((v, i) => (i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v))));
  ctx.lineTo(px(values.length - 1), y + h);
  ctx.lineTo(px(0), y + h);
  ctx.fill();
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2.4 * scale;
  ctx.beginPath();
  values.forEach((v, i) => (i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v))));
  ctx.stroke();
  values.forEach((v, i) => {
    circle(ctx, px(i), py(v), 5 * scale, C.surface);
    circle(ctx, px(i), py(v), 3.4 * scale, v >= 6 ? C.accent : C.danger);
  });
}

/** Five stars, filled up to `value`. */
function stars(ctx: Ctx, x: number, y: number, size: number, value: number, font: string) {
  for (let i = 0; i < 5; i++) text(ctx, '★', x + i * size * 1.02, y, { size, weight: 400, color: i < Math.round(value) ? C.star : C.line, font });
}

/** A little bell (reminders). */
function bell(ctx: Ctx, cx: number, cy: number, s: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.13;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy + s * 0.32);
  ctx.quadraticCurveTo(cx - s * 0.38, cy + s * 0.12, cx - s * 0.38, cy - s * 0.1);
  ctx.bezierCurveTo(cx - s * 0.38, cy - s * 0.62, cx + s * 0.38, cy - s * 0.62, cx + s * 0.38, cy - s * 0.1);
  ctx.quadraticCurveTo(cx + s * 0.38, cy + s * 0.12, cx + s * 0.5, cy + s * 0.32);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.13, cy + s * 0.5);
  ctx.lineTo(cx + s * 0.13, cy + s * 0.5);
  ctx.stroke();
}

// ── Posters ───────────────────────────────────────────────────────────────

/** The poster's frame: its colour, the function's name and a panel of the app (returns the panel's top). */
function frame(ctx: Ctx, title: string, font: string): number {
  text(ctx, title, 26, 56, { size: 27, weight: 800, color: '#FFFFFF', font, tracking: -0.8, max: 348 });
  box(ctx, 14, 80, 372, 402, 24, C.canvas);
  return 80;
}

export function drawPoster(kind: PosterKind, width: number, fonts: ArtFonts, t: TileText): HTMLCanvasElement {
  const height = Math.round((width * BOX_H) / BOX_W);
  const { canvas, ctx } = canvasFor(width, height, 30, POSTER_BG[kind]);
  const f = fonts.sans;
  const top = frame(ctx, t.titles[kind], f);

  switch (kind) {
    case 'timetable': {
      const x0 = 28;
      const colW = (344 - 4 * 5) / 5;
      t.weekdays.slice(0, 5).forEach((d, i) => {
        const cx = x0 + i * (colW + 5) + colW / 2;
        text(ctx, d, cx, top + 26, { size: 11, weight: 600, color: i === 0 ? C.accent : C.ink3, font: f, align: 'center' });
        if (i === 0) circle(ctx, cx, top + 41, 11, C.accent);
        text(ctx, String(19 + i), cx, top + 46, { size: 12.5, weight: 700, color: i === 0 ? '#FFFFFF' : C.ink, font: f, align: 'center' });
      });
      const y0 = top + 62;
      const cellH = 47;
      WEEK.forEach((day, i) => day.forEach((cell, j) => {
        if (!cell) return;
        const y = y0 + j * (cellH + 6) + (j >= 3 ? 8 : 0);
        lessonCell(ctx, x0 + i * (colW + 5), y, colW, cellH, cell, f);
      }));
      // Now: a faint line across the week, strong over today.
      const nowY = y0 + 1 * (cellH + 6) + 30;
      ctx.fillStyle = 'rgb(99 102 241 / 0.35)';
      ctx.fillRect(x0, nowY, 344, 1.5);
      ctx.fillStyle = C.accent;
      ctx.fillRect(x0, nowY - 0.75, colW, 3);
      circle(ctx, x0, nowY + 0.75, 4, C.accent);
      break;
    }
    case 'messages': {
      box(ctx, 26, top + 14, 348, 372, 22, C.surface);
      const tones: Array<[string, string]> = [[C.periwinkle, C.periwinkleInk], [C.butter, C.butterInk], [C.sage, C.sageInk], [C.blush, C.blushInk]];
      const times = ['08:12', '07:45', t.weekdays[4] ?? 'Fr', t.weekdays[3] ?? 'Do'];
      for (let i = 0; i < 4; i++) {
        const y = top + 26 + i * 90;
        const unread = i < 2;
        const sender = t.senders[i] ?? '';
        circle(ctx, 66, y + 40, 22, tones[i][0]);
        text(ctx, initials(sender), 66, y + 46, { size: 15, weight: 800, color: tones[i][1], font: f, align: 'center' });
        text(ctx, sender, 100, y + 34, { size: 16, weight: unread ? 800 : 600, color: C.ink, font: f, max: 190 });
        text(ctx, times[i], 356, y + 34, { size: 12, weight: 600, color: unread ? C.accent : C.ink3, font: f, align: 'right' });
        text(ctx, t.topics[i] ?? '', 100, y + 57, { size: 13.5, weight: unread ? 600 : 500, color: unread ? C.ink : C.ink2, font: f, max: 230 });
        if (unread) circle(ctx, 350, y + 52, 5, C.accent);
        if (i < 3) {
          ctx.fillStyle = C.line;
          ctx.fillRect(100, y + 82, 256, 1);
        }
      }
      break;
    }
    case 'grades': {
      box(ctx, 26, top + 14, 348, 196, 22, C.surface);
      text(ctx, t.gradeSubject, 46, top + 48, { size: 17, weight: 800, color: C.ink, font: f, max: 200 });
      text(ctx, t.average, 46, top + 68, { size: 12.5, weight: 600, color: C.ink2, font: f, max: 200 });
      const [bg, ink] = gradeTone(8.5);
      box(ctx, 296, top + 28, 60, 42, 13, bg);
      text(ctx, '8,5', 326, top + 56, { size: 19, weight: 800, color: ink, font: f, align: 'center' });
      trendLine(ctx, 46, top + 88, 310, 104, [7, 6, 8, 5.5, 9, 7.5, 8.5]);
      box(ctx, 26, top + 222, 348, 164, 22, C.surface);
      [[t.subjects[0], 8.5], [t.subjects[1], 6], [t.subjects[2], 5.5]].forEach(([name, v], i) => {
        const y = top + 234 + i * 50;
        text(ctx, String(name ?? ''), 46, y + 30, { size: 15.5, weight: 700, color: C.ink, font: f, max: 200 });
        const [cbg, cink] = gradeTone(v as number);
        box(ctx, 300, y + 8, 56, 34, 11, cbg);
        text(ctx, comma(v as number), 328, y + 31, { size: 16, weight: 800, color: cink, font: f, align: 'center' });
        if (i < 2) {
          ctx.fillStyle = C.line;
          ctx.fillRect(46, y + 49, 310, 1);
        }
      });
      break;
    }
    case 'exams': {
      box(ctx, 26, top + 14, 348, 222, 22, C.butter);
      pill(ctx, t.examDay, 46, top + 34, { h: 30, size: 13, bg: 'rgb(255 255 255 / 0.55)', fg: C.butterInk, font: f });
      text(ctx, t.examIn, 44, top + 128, { size: fitSize(ctx, t.examIn, 50, 316, 800, fonts.display), weight: 800, color: C.butterInk, font: fonts.display, tracking: -2 });
      const w = text(ctx, t.exam, 46, top + 172, { size: 18, weight: 700, color: C.butterInk, font: f, max: 310 });
      ctx.fillStyle = C.butterInk;
      ctx.fillRect(46, top + 178, w, 2);
      text(ctx, '08:40 · R107', 46, top + 206, { size: 14, weight: 600, color: C.butterInk, font: f });
      t.examList.slice(0, 2).forEach((row, i) => {
        const y = top + 250 + i * 70;
        box(ctx, 26, y, 348, 60, 18, C.surface);
        box(ctx, 40, y + 10, 40, 40, 11, C.inset);
        text(ctx, t.weekdays[(i + 1) % 5] ?? '', 60, y + 25, { size: 9.5, weight: 700, color: C.ink3, font: f, align: 'center' });
        text(ctx, String([28, 4][i]), 60, y + 43, { size: 16, weight: 800, color: C.ink, font: f, align: 'center' });
        text(ctx, row, 94, y + 36, { size: 15, weight: 700, color: C.ink, font: f, max: 260 });
      });
      break;
    }
    case 'absences': {
      box(ctx, 26, top + 14, 348, 206, 22, C.surface);
      text(ctx, t.rate, 46, top + 46, { size: 13.5, weight: 600, color: C.ink2, font: f, max: 300 });
      text(ctx, '4,2 %', 44, top + 104, { size: 52, weight: 800, color: C.successInk, font: f, tracking: -2 });
      const barY = top + 128;
      box(ctx, 46, barY, 310, 10, 5, C.inset);
      box(ctx, 46, barY, 222, 10, 5, C.success);
      box(ctx, 272, barY, 84, 10, 5, C.danger);
      circle(ctx, 52, barY + 42, 5, C.success);
      const ew = text(ctx, t.excused, 64, barY + 47, { size: 13, weight: 600, color: C.ink2, font: f });
      circle(ctx, 64 + ew + 22, barY + 42, 5, C.danger);
      text(ctx, t.open, 64 + ew + 34, barY + 47, { size: 13, weight: 600, color: C.ink2, font: f });
      box(ctx, 26, top + 232, 348, 154, 22, C.surface);
      const heights = [22, 48, 30, 64, 0, 18, 0, 0, 0, 0];
      const bw = (310 - 9 * 8) / 10;
      heights.forEach((h, i) => {
        const x = 46 + i * (bw + 8);
        const future = i > 5;
        const bh = h ? (h / 64) * 84 : 4;
        box(ctx, x, top + 344 - bh, bw, bh, 6, h ? C.accent : future ? 'rgb(238 234 227 / 0.5)' : C.inset);
        text(ctx, t.months[i] ?? '', x + bw / 2, top + 368, { size: 10.5, weight: 600, color: future ? 'rgb(140 132 120 / 0.6)' : C.ink3, font: f, align: 'center' });
      });
      break;
    }
    case 'reminders': {
      const tones: Array<[string, string]> = [[C.blush, C.blushInk], [C.periwinkle, C.periwinkleInk], [C.sage, C.sageInk]];
      t.reminders.slice(0, 3).forEach((title, i) => {
        const y = top + 14 + i * 126;
        box(ctx, 26, y, 348, 114, 22, C.surface);
        box(ctx, 42, y + 18, 78, 78, 18, tones[i][0]);
        text(ctx, t.weekdays[(i * 2) % 5] ?? '', 81, y + 46, { size: 12, weight: 700, color: tones[i][1], font: f, align: 'center' });
        text(ctx, String([24, 27, 30][i]), 81, y + 82, { size: 30, weight: 800, color: tones[i][1], font: f, align: 'center' });
        text(ctx, title, 136, y + 52, { size: 16.5, weight: 800, color: C.ink, font: f, max: 222 });
        bell(ctx, 145, y + 76, 15, C.ink3);
        text(ctx, `4AW · ${['08:00', '14:30', '10:20'][i]}`, 160, y + 82, { size: 13, weight: 600, color: C.ink2, font: f });
      });
      break;
    }
    case 'todos': {
      box(ctx, 26, top + 14, 348, 372, 22, C.surface);
      t.todos.slice(0, 4).forEach((title, i) => {
        const y = top + 26 + i * 90;
        const done = i === 0 || i === 3;
        if (done) {
          circle(ctx, 60, y + 42, 15, C.accent);
          check(ctx, 60, y + 42, 15, '#FFFFFF', 3);
        } else {
          ctx.strokeStyle = C.ink3;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(60, y + 42, 14, 0, Math.PI * 2);
          ctx.stroke();
        }
        text(ctx, title, 90, y + 40, { size: 16, weight: done ? 600 : 700, color: done ? C.ink3 : C.ink, font: f, strike: done, max: 264 });
        const due = `${t.weekdays[(i + 1) % 5] ?? ''} ${20 + i}.10.`;
        if (i === 2) {
          const pw = pill(ctx, t.overdue, 90, y + 50, { h: 22, size: 11, bg: C.blush, fg: C.blushInk, font: f });
          text(ctx, due, 98 + pw, y + 65, { size: 12.5, weight: 600, color: C.dangerInk, font: f });
        } else {
          text(ctx, due, 90, y + 64, { size: 12.5, weight: 600, color: C.ink3, font: f });
        }
        if (i < 3) {
          ctx.fillStyle = C.line;
          ctx.fillRect(90, y + 84, 266, 1);
        }
      });
      break;
    }
    case 'mensa': {
      const scene = plateSceneSize('table');
      const px = Math.floor(344 / scene.w);
      box(ctx, 26, top + 14, 348, 372, 22, C.surface);
      paintPixelPlate(ctx, { x: 200 - (scene.w * px) / 2, y: top + 44, px, size: 'table', style: 'pasta', seed: 'poster' });
      text(ctx, t.dish, 46, top + 262, { size: 22, weight: 800, color: C.ink, font: f, tracking: -0.5, max: 310 });
      stars(ctx, 46, top + 296, 18, 4, f);
      text(ctx, '4,6', 150, top + 295, { size: 15, weight: 800, color: C.ink, font: f });
      ['620 kcal', '18 g'].forEach((tag, i) => pill(ctx, tag, 46 + i * 104, top + 318, { h: 28, size: 12, bg: i ? C.butter : C.sage, fg: i ? C.butterInk : C.sageInk, font: f }));
      break;
    }
  }
  return canvas;
}

// ── Small tiles ───────────────────────────────────────────────────────────

/** Fill and ink of each small tile (its edge in 3D and its back). */
export const TILE_TONES: Record<TileKind, [string, string]> = {
  time: [subjectTone('M').fill, subjectTone('M').ink],
  plate: [C.canvas, C.butterInk],
  grade: [C.surface, C.sageInk],
  message: [C.surface, C.periwinkleInk],
  cancel: [statusTone(BRAND.danger).fill, statusTone(BRAND.danger).ink],
  week: [C.surface, C.ink],
  exam: [C.butter, C.butterInk],
};

// Drawn in a 200-wide box, portrait (200 × 256) or landscape (200 × 164).
export function drawTile(kind: TileKind, width: number, portrait: boolean, t: TileText, fonts: ArtFonts): HTMLCanvasElement {
  const bw = 200;
  const bh = portrait ? 256 : 164;
  const height = Math.round((width * bh) / bw);
  const [bg, ink] = TILE_TONES[kind];
  const { canvas, ctx } = canvasFor(width, height, 22, bg, bw, bh);
  const f = fonts.sans;
  const pad = 16;

  switch (kind) {
    case 'time': {
      // A lesson cell, happening now.
      text(ctx, t.period, pad, pad + 14, { size: 13, weight: 700, color: ink, font: f, max: 110 });
      pill(ctx, t.now, bw - pad - 52, pad, { h: 22, size: 11, bg: C.accent, fg: '#FFFFFF', font: f, padX: 10 });
      text(ctx, 'M', pad - 1, portrait ? 116 : 84, { size: portrait ? 64 : 48, weight: 800, color: ink, font: f, tracking: -2 });
      text(ctx, t.subject, pad, bh - pad - 36, { size: 15, weight: 700, color: ink, font: f, max: bw - pad * 2 });
      ctx.globalAlpha = 0.78;
      text(ctx, `MUE · ${t.room}`, pad, bh - pad - 16, { size: 13, weight: 600, color: ink, font: f, max: bw - pad * 2 });
      text(ctx, '07:50 – 08:40', pad, bh - pad + 2, { size: 12, weight: 600, color: ink, font: f });
      ctx.globalAlpha = 1;
      // The timetable's "now" line, under the period.
      ctx.fillStyle = C.accent;
      ctx.fillRect(0, pad + 34, bw, 2.5);
      circle(ctx, 4, pad + 35.25, 4, C.accent);
      break;
    }
    case 'cancel': {
      // Entfall: the cell in red with its outline, everything struck through.
      ctx.strokeStyle = C.danger;
      ctx.lineWidth = 5;
      rr(ctx, 2.5, 2.5, bw - 5, bh - 5, 20);
      ctx.stroke();
      pill(ctx, t.cancel, pad, pad, { h: 26, size: 12.5, bg: C.danger, fg: '#FFFFFF', font: f });
      text(ctx, 'PH', pad - 1, portrait ? 136 : 98, { size: portrait ? 60 : 46, weight: 800, color: ink, font: f, strike: true, tracking: -1.5 });
      ctx.globalAlpha = 0.85;
      text(ctx, 'WEI · R114', pad, bh - pad - 18, { size: 13, weight: 600, color: ink, font: f, strike: true });
      text(ctx, t.cancelSub, pad, bh - pad + 1, { size: 12, weight: 600, color: ink, font: f, max: bw - pad * 2 });
      ctx.globalAlpha = 1;
      break;
    }
    case 'grade': {
      text(ctx, t.gradeSubject, pad, pad + 16, { size: 16, weight: 800, color: C.ink, font: f, max: bw - pad * 2 });
      const [cbg, cink] = gradeTone(9);
      const chipH = portrait ? 120 : 76;
      box(ctx, pad, pad + 30, portrait ? bw - pad * 2 : 96, chipH, 18, cbg);
      text(ctx, '9', pad + (portrait ? (bw - pad * 2) / 2 : 48), pad + 30 + chipH * 0.78, { size: portrait ? 104 : 66, weight: 800, color: cink, font: f, align: 'center', tracking: -3 });
      if (!portrait) trendLine(ctx, 124, pad + 36, 60, 60, [7, 8, 6.5, 9], 0.6);
      text(ctx, t.average, pad, bh - pad, { size: 13, weight: 600, color: C.ink2, font: f, max: bw - pad * 2 });
      break;
    }
    case 'message': {
      circle(ctx, pad + 17, pad + 17, 17, C.periwinkle);
      text(ctx, initials(t.msgFrom), pad + 17, pad + 22, { size: 12.5, weight: 800, color: C.periwinkleInk, font: f, align: 'center' });
      text(ctx, t.msgFrom, pad + 42, pad + 22, { size: 13.5, weight: 800, color: C.ink, font: f, max: bw - pad * 2 - 58 });
      circle(ctx, bw - pad - 4, pad + 17, 5, C.accent);
      ctx.font = `600 14px ${f}`;
      const lines = wrap(ctx, t.msgText, bw - pad * 2 - 24).slice(0, portrait ? 5 : 2);
      const boxH = lines.length * 20 + 22;
      box(ctx, pad, pad + 46, bw - pad * 2, boxH, [6, 16, 16, 16], C.inset);
      lines.forEach((l, i) => text(ctx, l, pad + 12, pad + 46 + 26 + i * 20, { size: 14, weight: 600, color: C.ink, font: f }));
      break;
    }
    case 'week': {
      // The week at a glance, as the timetable draws it.
      const colW = (bw - pad * 2 - 4 * 5) / 5;
      t.weekdays.slice(0, 5).forEach((d, i) => {
        const cx = pad + i * (colW + 5) + colW / 2;
        text(ctx, d, cx, pad + 10, { size: 10.5, weight: 700, color: i === 0 ? C.accent : C.ink3, font: f, align: 'center' });
      });
      const rows = portrait ? 5 : 3;
      const cellH = (bh - pad * 2 - 22 - (rows - 1) * 4) / rows;
      WEEK.forEach((day, i) => day.slice(0, rows).forEach((cell, j) => {
        if (!cell) return;
        const tone = cell.kind === 'cancel' ? statusTone(BRAND.danger) : cell.kind === 'exam' ? examTone() : subjectTone(cell.code);
        const x = pad + i * (colW + 5);
        const y = pad + 22 + j * (cellH + 4);
        box(ctx, x, y, colW, cellH, 6, tone.fill);
        if (cell.kind) {
          ctx.strokeStyle = cell.kind === 'cancel' ? C.danger : C.warning;
          ctx.lineWidth = 1.6;
          rr(ctx, x + 0.8, y + 0.8, colW - 1.6, cellH - 1.6, 5.2);
          ctx.stroke();
        }
        text(ctx, cell.code, x + 4, y + 12, { size: 9, weight: 800, color: tone.ink, font: f, strike: cell.kind === 'cancel', max: colW - 6 });
      }));
      break;
    }
    case 'exam': {
      // The dashboard's next exam.
      pill(ctx, t.examDay, pad, pad, { h: 26, size: 12, bg: 'rgb(255 255 255 / 0.55)', fg: ink, font: f });
      const big = fitSize(ctx, t.examIn, portrait ? 40 : 34, bw - pad * 2 + 4, 800, fonts.display);
      text(ctx, t.examIn, pad - 1, portrait ? 130 : 92, { size: big, weight: 800, color: ink, font: fonts.display, tracking: -1.5 });
      const w = text(ctx, t.exam, pad, bh - pad - 22, { size: 14, weight: 700, color: ink, font: f, max: bw - pad * 2 });
      ctx.fillStyle = ink;
      ctx.fillRect(pad, bh - pad - 17, w, 1.6);
      ctx.globalAlpha = 0.8;
      text(ctx, '08:40 · R107', pad, bh - pad, { size: 12, weight: 600, color: ink, font: f });
      ctx.globalAlpha = 1;
      break;
    }
    case 'plate': {
      // The Mensa's next dish: its pixel plate on top in the middle, the
      // dish's name below it, then the stars and the average on one line.
      const scene = plateSceneSize('plate');
      const px = Math.floor((portrait ? 150 : 80) / scene.w);
      paintPixelPlate(ctx, { x: (bw - scene.w * px) / 2, y: portrait ? 18 : 12, px, size: 'plate', style: 'pasta', seed: 'tile' });
      const cx = bw / 2;
      text(ctx, t.dish, cx, portrait ? bh - pad - 28 : 112, { size: portrait ? 17 : 15, weight: 800, color: C.ink, font: f, align: 'center', max: bw - pad * 2 });
      const size = portrait ? 15 : 12;
      const y = portrait ? bh - pad : 138;
      ctx.font = `800 ${size + 1}px ${f}`;
      const rateW = ctx.measureText('4,6').width;
      const starsW = 5 * size * 1.02;
      const x0 = cx - (starsW + 7 + rateW) / 2;
      stars(ctx, x0, y, size, 5, f);
      text(ctx, '4,6', x0 + starsW + 7, y, { size: size + 1, weight: 800, color: C.ink, font: f });
      break;
    }
  }
  return canvas;
}

/** Wraps `str` into lines no wider than `max` (font set beforehand). */
function wrap(ctx: Ctx, str: string, max: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of str.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}
