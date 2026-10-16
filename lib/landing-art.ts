'use client';

// Artwork of the homepage carousel, drawn on canvases that become three.js
// textures. Large items: one per POKYH function, a deep field and a light
// tone, the middle kept calm for the word on top. Small items: school-day
// tiles (sample content only). All drawing happens in a 400 × 496 design box.

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
}

const BOX_W = 400;
const BOX_H = 496;

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

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

/** A canvas of the given size with the design box mapped onto it and the corners rounded. */
function canvasFor(w: number, h: number, radius: number, bg: string, boxW = BOX_W, boxH = BOX_H) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(w / boxW, h / boxH);
  rounded(ctx, 0, 0, boxW, boxH, radius);
  ctx.clip();
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, boxW, boxH);
  return { canvas, ctx };
}

const PERIODS = [210, 300, 250, 170, 0, 280, 230, 150];
const GRADES = [
  { v: '8', x: 34, y: 120, s: 120, o: 0.5 },
  { v: '7', x: 250, y: 96, s: 84, o: 0.28 },
  { v: '9', x: 316, y: 176, s: 64, o: 0.4 },
  { v: '10', x: 150, y: 70, s: 54, o: 0.24 },
  { v: '6', x: 40, y: 446, s: 72, o: 0.26 },
  { v: '8', x: 296, y: 452, s: 110, o: 0.5 },
  { v: '9', x: 170, y: 466, s: 60, o: 0.3 },
];
const ABSENT = new Set([9, 10, 23]);

export function drawPoster(kind: PosterKind, width: number, fonts: ArtFonts): HTMLCanvasElement {
  const height = Math.round((width * BOX_H) / BOX_W);
  const { canvas, ctx } = canvasFor(width, height, 30, POSTER_BG[kind]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (kind) {
    case 'timetable': {
      const tone = '#DEDDFB';
      PERIODS.forEach((len, i) => {
        const y = 36 + i * 54;
        if (!len) {
          ctx.globalAlpha = 0.4;
          ctx.strokeStyle = tone;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 8]);
          ctx.beginPath();
          ctx.moveTo(56, y + 18);
          ctx.lineTo(344, y + 18);
          ctx.stroke();
          ctx.setLineDash([]);
          return;
        }
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = tone;
        ctx.font = `600 15px ${fonts.sans}`;
        ctx.fillText(String(i < 4 ? i + 1 : i), 26, y + 24);
        ctx.globalAlpha = i === 2 ? 1 : 0.16;
        rounded(ctx, 56, y, len, 36, 18);
        ctx.fill();
        if (i === 2) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = POSTER_BG.timetable;
          circle(ctx, 56 + len - 18, y + 18, 6);
          ctx.fill();
        }
      });
      break;
    }
    case 'mensa': {
      const tone = '#F7E7AC';
      ctx.strokeStyle = tone;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2;
      circle(ctx, 200, 248, 150);
      ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.2;
      circle(ctx, 200, 248, 108);
      ctx.stroke();
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(200 + Math.sin(a) * 124, 248 - Math.cos(a) * 124);
        ctx.lineTo(200 + Math.sin(a) * 136, 248 - Math.cos(a) * 136);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2.4;
      ctx.stroke(new Path2D('M16 112v62M26 112v62M36 112v62M16 174q10 16 20 0M26 186v200'));
      ctx.stroke(new Path2D('M382 112c-12 10-16 40-16 82h16v192'));
      break;
    }
    case 'grades': {
      ctx.fillStyle = '#D5E4D0';
      GRADES.forEach((g) => {
        ctx.globalAlpha = g.o;
        ctx.font = `400 ${g.s}px ${fonts.display}`;
        ctx.fillText(g.v, g.x, g.y);
      });
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = '#D5E4D0';
      ctx.lineWidth = 2;
      circle(ctx, 352, 64, 26);
      ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.font = `400 24px ${fonts.display}`;
      ctx.textAlign = 'center';
      ctx.fillText('9', 352, 72);
      ctx.textAlign = 'left';
      break;
    }
    case 'messages': {
      const tone = '#F7D9D3';
      const ink = POSTER_BG.messages;
      const bubble = (x: number, y: number, w: number, h: number, o: number) => {
        ctx.globalAlpha = o;
        ctx.fillStyle = tone;
        rounded(ctx, x, y, w, h, h / 2.3);
        ctx.fill();
      };
      const line = (x: number, y: number, w: number, o: number) => {
        ctx.globalAlpha = o;
        ctx.fillStyle = ink;
        rounded(ctx, x, y, w, 9, 4.5);
        ctx.fill();
      };
      bubble(30, 46, 236, 78, 0.92);
      line(58, 72, 150, 0.45);
      line(58, 92, 100, 0.3);
      bubble(140, 146, 230, 62, 0.3);
      bubble(30, 330, 206, 62, 0.3);
      bubble(146, 412, 224, 62, 0.92);
      line(172, 438, 132, 0.45);
      break;
    }
    case 'reminders': {
      const tone = '#F7E7AC';
      ctx.strokeStyle = tone;
      ctx.fillStyle = tone;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2;
      rounded(ctx, 128, 48, 144, 146, 24);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(128, 92);
      ctx.lineTo(272, 92);
      ctx.stroke();
      ctx.globalAlpha = 1;
      rounded(ctx, 164, 36, 8, 24, 4);
      ctx.fill();
      rounded(ctx, 228, 36, 8, 24, 4);
      ctx.fill();
      ctx.font = `400 66px ${fonts.display}`;
      ctx.textAlign = 'center';
      ctx.fillText('17', 200, 168);
      ctx.textAlign = 'left';
      ['#DEDDFB', '#F7E7AC', '#D5E4D0', '#F7D9D3', '#FFFFFF'].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.strokeStyle = POSTER_BG.reminders;
        ctx.lineWidth = 5;
        circle(ctx, 112 + i * 44, 420, 28);
        ctx.fill();
        ctx.stroke();
      });
      break;
    }
    case 'exams': {
      const tone = '#F7E7AC';
      ctx.strokeStyle = tone;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.22;
      for (let i = 0; i < 13; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 54 + i * 34);
        ctx.lineTo(400, 54 + i * 34);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = '#F2A08F';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(70, 0);
      ctx.lineTo(70, 496);
      ctx.stroke();
      ctx.strokeStyle = tone;
      ctx.fillStyle = tone;
      ctx.lineWidth = 5;
      ctx.globalAlpha = 1;
      ctx.stroke(new Path2D('M96 106l14 14 30-34'));
      ctx.globalAlpha = 0.5;
      rounded(ctx, 156, 98, 150, 10, 5);
      ctx.fill();
      ctx.stroke(new Path2D('M96 412l14 14 30-34'));
      ctx.globalAlpha = 0.3;
      rounded(ctx, 156, 404, 110, 10, 5);
      ctx.fill();
      break;
    }
    case 'absences': {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#FFFFFF';
      for (let i = 0; i < 35; i++) {
        const cx = 64 + (i % 7) * 45.3;
        const cy = 104 + Math.floor(i / 7) * 76;
        ctx.globalAlpha = ABSENT.has(i) ? 0.95 : 0.2;
        circle(ctx, cx, cy, 9);
        ctx.fill();
        if (i === 23) {
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = 2;
          circle(ctx, cx, cy, 19);
          ctx.stroke();
        }
      }
      break;
    }
    case 'todos': {
      const tone = '#D5E4D0';
      [70, 146, 350, 426].forEach((y, i) => {
        const done = i !== 3;
        ctx.globalAlpha = 1;
        ctx.strokeStyle = tone;
        ctx.fillStyle = tone;
        ctx.lineWidth = 2;
        circle(ctx, 62, y, 17);
        if (done) ctx.fill();
        else ctx.stroke();
        if (done) {
          ctx.strokeStyle = POSTER_BG.todos;
          ctx.lineWidth = 3.4;
          ctx.stroke(new Path2D(`M54 ${y}l6 6 11-12`));
        }
        ctx.globalAlpha = done ? 0.35 : 0.8;
        ctx.fillStyle = tone;
        rounded(ctx, 96, y - 5, [210, 170, 190, 140][i], 10, 5);
        ctx.fill();
      });
      break;
    }
  }
  return canvas;
}

/** Wraps `text` into lines no wider than `max`. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

/** Fill and ink of each small tile. */
export const TILE_TONES: Record<TileKind, [string, string]> = {
  time: ['#DEDDFB', '#4A46A6'],
  plate: ['#F7E7AC', '#7A5B14'],
  grade: ['#D5E4D0', '#44653F'],
  message: ['#F7D9D3', '#94493E'],
  cancel: ['#1E1E1E', '#FFFFFF'],
  week: ['#4A46A6', '#FFFFFF'],
  exam: ['#FFFFFF', '#161513'],
};

// Small tiles: drawn in a 200-wide box, portrait (200 × 256) or landscape (200 × 164).
export function drawTile(kind: TileKind, width: number, portrait: boolean, text: TileText, fonts: ArtFonts): HTMLCanvasElement {
  const bw = 200;
  const bh = portrait ? 256 : 164;
  const height = Math.round((width * bh) / bw);
  const [bg, ink] = TILE_TONES[kind];
  const { canvas, ctx } = canvasFor(width, height, 22, bg, bw, bh);
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.textBaseline = 'alphabetic';
  const pad = 18;

  switch (kind) {
    case 'time':
      ctx.font = `600 17px ${fonts.sans}`;
      ctx.fillText(text.period, pad, pad + 16);
      ctx.font = `400 ${portrait ? 72 : 60}px ${fonts.display}`;
      ctx.fillText('07:55', pad - 2, bh * 0.62);
      ctx.font = `500 16px ${fonts.sans}`;
      ctx.fillText(text.subject, pad, bh - pad - 20);
      ctx.globalAlpha = 0.6;
      ctx.fillText(text.room, pad, bh - pad);
      break;
    case 'plate': {
      const cx = bw / 2;
      const cy = portrait ? 104 : 74;
      const r = portrait ? 70 : 52;
      ctx.fillStyle = '#FFFDF5';
      circle(ctx, cx, cy, r);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 0.35;
      circle(ctx, cx, cy, r * 0.7);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#D9863B';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * Math.PI * 2 * 4.2;
        const rr = 4 + (i / 120) * r * 0.5;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = ink;
      ctx.font = `600 17px ${fonts.sans}`;
      ctx.fillText('Pasta al ragù', pad, bh - pad);
      break;
    }
    case 'grade':
      ctx.font = `600 17px ${fonts.sans}`;
      ctx.fillText(text.gradeSubject, pad, pad + 16);
      ctx.font = `400 ${portrait ? 190 : 130}px ${fonts.display}`;
      ctx.textAlign = 'right';
      ctx.fillText('9', bw - pad, bh * (portrait ? 0.8 : 0.86));
      ctx.textAlign = 'left';
      ctx.globalAlpha = 0.7;
      ctx.font = `500 15px ${fonts.sans}`;
      ctx.fillText(text.average, pad, bh - pad);
      break;
    case 'message': {
      ctx.font = `600 15px ${fonts.sans}`;
      ctx.fillText(text.msgFrom, pad, pad + 14);
      ctx.font = `500 15px ${fonts.sans}`;
      const lines = wrap(ctx, text.msgText, bw - pad * 2 - 24).slice(0, portrait ? 4 : 2);
      const boxH = lines.length * 20 + 22;
      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      rounded(ctx, pad, pad + 30, bw - pad * 2, boxH, [16, 16, 16, 5]);
      ctx.fill();
      ctx.fillStyle = '#161513';
      lines.forEach((l, i) => ctx.fillText(l, pad + 12, pad + 30 + 26 + i * 20));
      break;
    }
    case 'cancel':
      ctx.textAlign = 'center';
      ctx.font = `400 ${portrait ? 44 : 48}px ${fonts.display}`;
      ctx.fillText(text.cancel, bw / 2, bh / 2 + 6);
      ctx.strokeStyle = '#FF8D7A';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bw * 0.18, bh / 2 + 4);
      ctx.lineTo(bw * 0.82, bh / 2 - 6);
      ctx.stroke();
      ctx.globalAlpha = 0.6;
      ctx.font = `500 13px ${fonts.sans}`;
      ctx.fillText(text.cancelSub, bw / 2, bh / 2 + 34);
      ctx.textAlign = 'left';
      break;
    case 'week': {
      const colW = (bw - pad * 2 - 4 * 6) / 5;
      const fills = ['#DEDDFB', '#F7E7AC', '#D5E4D0', '#F7D9D3', '#FFFFFF'];
      text.weekdays.forEach((d, i) => {
        const x = pad + i * (colW + 6);
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `600 11px ${fonts.sans}`;
        ctx.fillText(d, x, pad + 8);
        let y = pad + 18;
        [0.24, 0.16, 0.3].forEach((h, j) => {
          const hh = (bh - pad * 2 - 30) * h;
          ctx.globalAlpha = 0.92;
          ctx.fillStyle = fills[(i + j) % fills.length];
          rounded(ctx, x, y, colW, hh, 5);
          ctx.fill();
          y += hh + 5;
        });
      });
      break;
    }
    case 'exam':
      ctx.fillStyle = '#E5553F';
      ctx.fillRect(0, 0, bw, 38);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `600 15px ${fonts.sans}`;
      ctx.fillText(text.examDay, pad, 25);
      ctx.fillStyle = ink;
      ctx.font = `400 ${portrait ? 120 : 76}px ${fonts.display}`;
      ctx.fillText('23', pad - 4, portrait ? 170 : 118);
      ctx.fillStyle = '#5F5A53';
      ctx.font = `500 14px ${fonts.sans}`;
      ctx.fillText(text.exam, pad, bh - pad);
      break;
  }
  return canvas;
}
