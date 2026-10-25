'use client';

import type { ThemeColors } from './themes';

// The recap's last page as a picture to share (1080 × 1920, a story's
// size): its title, the period, the few figures and the mascot as it stands
// on the page. Drawn on a canvas on this device; shared through the system's
// share sheet where the browser can share files, saved as a file otherwise.

const W = 1080;
const H = 1920;

export interface ShareInput {
  title: string;
  period: string;
  items: Array<{ label: string; value: string }>;
  thanks: string;
  theme: ThemeColors;
  /** The mascot's drawing on the page, copied with its colours. */
  mascot: SVGSVGElement | null;
  fileName: string;
}

function lines(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      out.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) out.push(line);
  return out;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// The text in the largest size from `size` down to `min` that fits; cut off only below that.
function fitted(ctx: CanvasRenderingContext2D, text: string, width: number, font: (px: number) => string, size: number, min: number): string {
  let px = size;
  ctx.font = font(px);
  while (px > min && ctx.measureText(text).width > width) {
    px -= 2;
    ctx.font = font(px);
  }
  return clip(ctx, text, width);
}

function clip(ctx: CanvasRenderingContext2D, text: string, width: number): string {
  if (ctx.measureText(text).width <= width) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > width) t = t.slice(0, -1);
  return `${t}…`;
}

// The drawing with every colour written out (they are CSS variables on the
// page) and the hidden animation frames left out.
async function mascotImage(svg: SVGSVGElement): Promise<HTMLImageElement | null> {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const originals = svg.querySelectorAll('*');
  const copies = copy.querySelectorAll('*');
  originals.forEach((el, i) => {
    const target = copies[i] as Element | undefined;
    if (!target) return;
    const style = getComputedStyle(el);
    if (style.opacity === '0' || style.display === 'none') {
      target.setAttribute('data-drop', '');
      return;
    }
    if (el.tagName.toLowerCase() === 'path') target.setAttribute('fill', style.fill);
    target.removeAttribute('class');
  });
  copy.querySelectorAll('[data-drop]').forEach((el) => el.remove());
  copy.querySelectorAll('style').forEach((el) => el.remove());
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', '600');
  copy.setAttribute('height', String(Math.round(600 * (svg.viewBox.baseVal.height / svg.viewBox.baseVal.width || 1))));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('mascot')); img.src = url; });
    return img;
  } catch {
    return null;
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

async function draw(input: ShareInput): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const family = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  const t = input.theme;

  // The page's background: the base and its three lights.
  ctx.fillStyle = t.base;
  ctx.fillRect(0, 0, W, H);
  for (const [color, x, y, r] of [[t.a, 0.12, 0.08, 0.75], [t.b, 0.92, 0.3, 0.6], [t.c, 0.5, 1.05, 0.85]] as const) {
    const g = ctx.createRadialGradient(W * x, H * y, 0, W * x, H * y, W * r);
    g.addColorStop(0, `${color}d0`);
    g.addColorStop(1, `${color}00`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let x = 0; x < W; x += 16) ctx.fillRect(x, 0, 2, H);
  for (let y = 0; y < H; y += 16) ctx.fillRect(0, y, W, 2);

  const left = 96;
  const width = W - left * 2;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `700 40px ${family}`;
  ctx.fillText(input.period, left, 210);

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 104px ${family}`;
  let y = 330;
  for (const line of lines(ctx, input.title, width).slice(0, 3)) {
    ctx.fillText(line, left, y);
    y += 112;
  }

  // The figures, two to a row.
  y += 40;
  const gap = 28;
  const cellW = (width - gap) / 2;
  const cellH = 220;
  input.items.forEach((item, i) => {
    const x = left + (i % 2) * (cellW + gap);
    const top = y + Math.floor(i / 2) * (cellH + gap);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, x, top, cellW, cellH, 44);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(fitted(ctx, item.value, cellW - 72, (px) => `800 ${px}px ${family}`, 76, 48), x + 36, top + 112);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(fitted(ctx, item.label, cellW - 72, (px) => `650 ${px}px ${family}`, 36, 26), x + 36, top + 172);
  });

  const mascot = input.mascot ? await mascotImage(input.mascot) : null;
  if (mascot) {
    const mw = 400;
    const mh = mw * (mascot.height / mascot.width || 1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mascot, W - mw - 70, H - mh - 150, mw, mh);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = `600 38px ${family}`;
  lines(ctx, input.thanks, 560).forEach((line, i) => ctx.fillText(line, left, H - 290 + i * 50));
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 54px ${family}`;
  ctx.fillText('POKYH', left, H - 130);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

/** Shares the picture, or saves it; 'failed' when neither worked (or sharing was cancelled). */
export async function shareSummary(input: ShareInput): Promise<'shared' | 'saved' | 'failed'> {
  try {
    const blob = await draw(input);
    if (!blob) return 'failed';
    const file = new File([blob], input.fileName, { type: 'image/png' });
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: input.title });
        return 'shared';
      } catch {
        return 'failed';
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = input.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    return 'saved';
  } catch {
    return 'failed';
  }
}
