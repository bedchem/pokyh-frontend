import { Sprite, disc, dither, ellipse, grid, outlineOf, rect, shift, type Pt } from './sprite';

// The 404 as sprites (components/site/Pixel404.tsx): three chunky digits
// standing out of the page towards the bottom right, and beside them the
// missing page as a little ghost. 122 × 40 pixels;
// the ground is row 36.

export const W = 122;
export const H = 40;

const FOUR = ['....##.', '...###.', '..####.', '.##.##.', '##..##.', '#######', '#######', '....##.', '....##.'];
const ZERO = ['.#####.', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '.#####.'];

/** A small glyph drawn three times as large. */
function big(rows: string[], ox: number, oy: number): Pt[] {
  const out: Pt[] = [];
  for (const [x, y] of grid(rows)) for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) out.push([ox + x * 3 + i, oy + y * 3 + j]);
  // Round the outer corners of each stroke a little.
  const on = new Set(out.map(([x, y]) => `${x},${y}`));
  return out.filter(([x, y]) => {
    const n = (dx: number, dy: number) => on.has(`${x + dx},${y + dy}`);
    return !((!n(-1, 0) && !n(0, -1)) || (!n(1, 0) && !n(0, -1)) || (!n(-1, 0) && !n(0, 1)) || (!n(1, 0) && !n(0, 1)));
  });
}

function digit(rows: string[], ox: number): Sprite {
  const front = big(rows, ox, 5);
  const s = new Sprite();
  // The sides: the front pushed down and to the right, darker the deeper.
  for (let k = 3; k >= 1; k--) s.fill(shift(front, k, k), k === 3 ? 'ac0' : 'ac1');
  s.fill(outlineOf(shift(front, 3, 3)).filter(([x, y]) => !s.get(x, y)), 'ac0');
  s.mass(front, 'ac', { deep: true });
  // Light catches the top left corners.
  for (const [x, y] of front) if (!front.some(([a, b]) => a === x - 1 && b === y) && !front.some(([a, b]) => a === x && b === y - 1)) s.set(x, y, 'ac4');
  return s;
}

export const DIGITS = [digit(FOUR, 6), digit(ZERO, 33), digit(FOUR, 60)];

export const GROUND = new Sprite()
  .fill(dither(rect(0, 36, W, 1), 1), 'fn')
  .fill(dither(ellipse(19, 36, 15, 1.6)), 'sh')
  .fill(dither(ellipse(46, 36, 15, 1.6)), 'sh')
  .fill(dither(ellipse(73, 36, 15, 1.6)), 'sh');

// ── The ghost ─────────────────────────────────────────────────────────────
// A round little ghost: a dome lit from the top left, big shiny eyes, pink
// cheeks, a smile with a tongue, two waving stubs and a hem of round
// scallops. Two frames: stubs and scallops swap between them.

const GX = 91;
const GY = 3;
const CX = GX + 13;

function ghostShape(frame: 0 | 1): Pt[] {
  const dome = disc(CX, GY + 12.5, 12.6).filter(([, y]) => y <= GY + 12);
  const body = rect(GX, GY + 12, 26, 14);
  const hem: Pt[] = [];
  for (let i = 0; i < 4; i++) {
    const cx = GX + 3.25 + i * 6.5 + (frame ? 2 : 0);
    hem.push(...disc(cx, GY + 25.5, 3.3).filter(([x, y]) => y >= GY + 26 && x >= GX && x < GX + 26));
  }
  // The stubs: low and level in one frame, raised a little in the other.
  const lift = frame ? -2 : 0;
  const stubs = [...ellipse(GX - 0.5, GY + 18.5 + lift, 2.6, 2.1), ...ellipse(GX + 26.5, GY + 18.5 - lift - 2, 2.6, 2.1)];
  return [...dome, ...body, ...hem, ...stubs];
}

function ghost(frame: 0 | 1): Sprite {
  const shape = ghostShape(frame);
  const s = new Sprite().mass(shape, 'gh', { deep: true });
  // A sheen on the dome.
  s.fill([[GX + 8, GY + 2], [GX + 9, GY + 2], [GX + 10, GY + 2], [GX + 6, GY + 3], [GX + 7, GY + 3], [GX + 5, GY + 4], [GX + 5, GY + 5]], 'gh4');
  return s;
}

export const GHOST_A = ghost(0);
export const GHOST_B = ghost(1);

// The face is turned to the left: it looks at the 404.
const FX = GX - 3;
const EYE_L: Pt = [FX + 8, GY + 11];
const EYE_R: Pt = [FX + 16, GY + 11];

export const EYES = (() => {
  const s = new Sprite();
  for (const [x, y] of [EYE_L, EYE_R]) {
    s.fill([...rect(x, y, 4, 5), ...rect(x + 1, y - 1, 2, 1), ...rect(x + 1, y + 5, 2, 1)], 'ik2');
    s.fill(rect(x + 2, y + 3, 2, 2), 'ik3');
    s.fill([[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]], 'pp4');
    s.set(x + 3, y + 4, 'pp3');
  }
  return s;
})();
export const EYES_SHUT = (() => {
  const s = new Sprite();
  // Happy shut eyes: two little arches.
  for (const [x, y] of [EYE_L, EYE_R]) s.fill([[x, y + 3], [x + 1, y + 2], [x + 2, y + 2], [x + 3, y + 3]], 'ik2');
  return s;
})();
export const FACE = new Sprite()
  .fill([...rect(FX + 6, GY + 17, 3, 2), ...rect(FX + 20, GY + 17, 3, 2)], 'pk2')
  .fill([[FX + 6, GY + 17], [FX + 20, GY + 17]], 'pk3')
  .fill([...rect(FX + 12, GY + 17, 4, 1), [FX + 12, GY + 18], [FX + 15, GY + 18], [FX + 13, GY + 19], [FX + 14, GY + 19]], 'ik2')
  .fill([[FX + 13, GY + 18], [FX + 14, GY + 18]], 'pk1');

export const SHADOW_WIDE = new Sprite().fill(dither(ellipse(CX, 36, 11, 1.4)), 'sh').fill(dither(ellipse(CX, 36, 6, 1)), 'shd');
export const SHADOW_NARROW = new Sprite().fill(dither(ellipse(CX, 36, 8, 1.2)), 'sh');

/** The whole drawing at rest, for previews. */
export function notFoundScene() {
  return {
    w: W, h: H,
    layers: [
      { name: 'ground', sprite: GROUND },
      ...DIGITS.map((sprite, i) => ({ name: `digit-${i}`, sprite })),
      { name: 'shadow', sprite: SHADOW_WIDE },
      { name: 'shadow-high', sprite: SHADOW_NARROW, alt: true },
      { name: 'ghost', sprite: GHOST_A },
      { name: 'ghost-alt', sprite: GHOST_B, alt: true },
      { name: 'face', sprite: FACE },
      { name: 'eyes', sprite: EYES },
      { name: 'eyes-shut', sprite: EYES_SHUT, alt: true },
    ],
  };
}
