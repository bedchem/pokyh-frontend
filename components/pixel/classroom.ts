import { FEET } from './mascot';
import { clockFace } from './hallway';
import { Sprite, dither, disc, ellipse, grid, line, minus, rect, soft, textPixels, type Pt } from './sprite';

// Room A+2/05, behind the door of the sign-in hallway (./hallway.ts): the
// warm classroom of a tiny school game. A window with curtains and the sky
// outside (sun, clouds, rain or snow; the night in the dark theme), a space
// poster with a rocket on it, the chalkboard with the day's chalk, the clock,
// a bookshelf with a globe, a vending machine, the teacher's desk with an
// apple, a bin, rows of desks (a notebook on one, a game console on
// another). The mascot (./mascot.ts) stands by the board. What moves
// when it is clicked (the curtains, the clock, the bin, the notebook, the
// rocket) is drawn on its own.
//
// Everything that can be clicked lies inside a core of ROOM_W × ROOM_H
// pixels of the drawing; the scene is built a little wider than its panel
// (so the view can move to a thing at its edge without running out of
// room), the wall and the floor growing around the core (the core keeps to
// the bottom, in the middle). `spots` are the clickable areas in pixels of
// the drawing.

export const ROOM_W = 240;
export const ROOM_H = 127;
/** The floor's first row in the core. */
const FLOOR = 82;
/** Clouds and weather repeat after this many pixels (their drift loops). */
export const SKY_LOOP = 96;

export type Box = [number, number, number, number];

export const SPOTS = ['window', 'poster', 'switch', 'board', 'clock', 'globe', 'shelf', 'vending', 'apple', 'bin', 'notebook', 'console', 'mascot'] as const;
export type Spot = (typeof SPOTS)[number];

/** Room decorations, each with its place (./collectibles.ts draws them). */
export type DecorSpot = 'plant' | 'lamp' | 'lights' | 'disco' | 'trophy' | 'duck' | 'can';

export interface Classroom {
  w: number;
  h: number;
  /** Top left of the core in the scene. */
  ox: number;
  oy: number;
  floor: number;
  /** Wall, floor and what stands behind the mascot. */
  back: Sprite;
  /** The front row of desks, in front of the mascot. */
  front: Sprite;
  /** The window's panes, for clipping the sky: [x, y, w, h]. */
  panes: Box[];
  sky: { day: Sprite; grey: Sprite; night: Sprite; sun: Sprite; moon: Sprite; stars: Sprite; scenery: Sprite; sceneryNight: Sprite };
  /** Drifting clouds, rain and snow, twice as tall or wide as the window (they loop). */
  clouds: Sprite;
  rain: Sprite;
  snow: Sprite;
  /** The window's curtains, hanging and blown into the room. */
  curtains: [Sprite, Sprite];
  /** The rocket on the poster (it flies off and lands again), its flame in two frames, puffs of smoke at its foot. */
  rocket: { at: Pt; body: Sprite; flame: [Sprite, Sprite]; smoke: Sprite };
  /** The light switch, up and down. */
  switchOn: Sprite;
  switchOff: Sprite;
  /** The chalkboard's writing area: [x, y, w, h]. */
  board: Box;
  clock: Pt;
  /** The clock's face (it rings), the bin (it wobbles), drawn apart from the wall. */
  clockFace: Sprite;
  bin: Sprite;
  /** Where things thrown into the bin go, and its middle at the top. */
  binTop: Pt;
  /** The notebook lying shut, and its pages flipping in two frames. */
  notebook: [Sprite, Sprite, Sprite];
  /** The globe in four turns. */
  globe: Sprite[];
  /** The red book that can be pulled out of the shelf. */
  book: { in: Sprite; out: Sprite };
  /** The vending machine's lit sign, on and flickering. */
  sign: [Sprite, Sprite];
  /** The console's screen, two frames of a little game playing by itself. */
  screen: [Sprite, Sprite];
  apple: Sprite;
  /** Where the apple lies (its top left) and where the red book stands. */
  appleAt: Pt;
  bookAt: Pt;
  /** Where the note from the red book lands on the floor. */
  noteAt: Pt;
  /**
   * Where something on the floor would be drawn wrongly or hidden: the back
   * row's desks (drawn behind it), the front row (drawn in front of it), the
   * bin. [x, y, w, h].
   */
  floorBlocks: Box[];
  /** Top left of the mascot. */
  mascot: Pt;
  /** What glows when the light is off, and the lamps' light in the evening. */
  glow: Sprite;
  lampLight: Sprite;
  /** What stays bright with the light off: the window, the machine's glass and sign, the console's screen. */
  bright: Box[];
  spots: Record<Spot, Box>;
  decor: Record<DecorSpot, Pt>;
}

/** A small deterministic noise, so textures look the same every time. */
const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

// ── Wall and floor ───────────────────────────────────────────────────────

function wall(s: Sprite, w: number, floor: number) {
  s.fill(rect(0, 0, w, floor), 'cw2');
  s.fill(dither(rect(0, 0, w, 2)), 'cw1');
  // A wooden rail, the sage band below it, the skirting.
  const band = floor - 26;
  s.fill(rect(0, band, w, 26), 'cl2');
  s.fill(rect(0, band - 3, w, 1), 'wd3').fill(rect(0, band - 2, w, 1), 'wd2').fill(rect(0, band - 1, w, 1), 'wd1');
  s.fill(dither(rect(0, band, w, 1)), 'cl1');
  s.fill(rect(0, floor - 3, w, 1), 'cl3').fill(rect(0, floor - 2, w, 1), 'cl1').fill(rect(0, floor - 1, w, 1), 'cl0');
}

function parquet(s: Sprite, w: number, h: number, floor: number, cx: number) {
  const rows = [0, 4, 9, 15, 22, 30, 39, 49, 60, 72];
  for (let y = floor; y < h; y++) {
    const rel = y - floor;
    const scale = 8 + rel * 0.6;
    for (let x = 0; x < w; x++) {
      const u = (x - cx + 0.5) / scale;
      const col = Math.floor(u);
      // Planks end at different rows, column by column.
      const stagger = ((col % 2) + 2) % 2 ? 2 : 0;
      const band = rows.findIndex((r, i) => rel >= r + stagger && rel < (rows[i + 1] ?? 999) + stagger);
      let tone = (col + band) % 3 === 0 ? 'pq3' : 'pq2';
      const n = noise(x, y);
      if (n > 0.95) tone = 'pq1';
      else if (n < 0.03) tone = 'pq4';
      if (rows.some((r) => rel === r + stagger) || u - col < 1 / scale) tone = 'pq1';
      s.set(x, y, tone);
    }
  }
  // The wall's shadow on the floor.
  s.fill(dither(rect(0, floor, w, 2)), 'sh');
}

/** Lamps hanging from the ceiling when there is room above the core. */
function lamps(s: Sprite, light: Sprite, xs: number[], top: number) {
  for (const x of xs) {
    s.fill(rect(x, 0, 1, top), 'st1');
    s.mass([...rect(x - 3, top, 7, 2), ...rect(x - 4, top + 2, 9, 2)], 'wf', { deep: true });
    s.fill(rect(x - 2, top + 4, 5, 1), 'gd4');
    light.fill(dither([...rect(x - 5, top + 5, 11, 2), ...rect(x - 7, top + 7, 15, 3)]), 'lit');
  }
}

// ── The window ───────────────────────────────────────────────────────────

function curtain(s: Sprite, x: number, y: number, h: number, mirror: boolean, blow = 0) {
  const shape: Pt[] = [];
  for (let j = 0; j < h; j++) {
    // Gathered at the top, falling wider, tied in at two thirds; a draught
    // blows the bottom in over the window.
    const tie = Math.abs(j - Math.round(h * 0.62)) < 2 ? -2 : 0;
    const width = Math.min(8, 5 + Math.floor(j / 6)) + tie + Math.round(blow * (j / h) ** 2);
    for (let i = 0; i < width; i++) shape.push([mirror ? x + 7 - i : x + i, y + j]);
  }
  s.mass(shape, 'ld', { deep: true });
  // Folds.
  for (const [px, py] of shape) if ((mirror ? x + 7 - px : px - x) % 3 === 1 && noise(px, py) > 0.2) s.set(px, py, 'ld1');
  const ty = y + Math.round(h * 0.62);
  s.fill(rect(mirror ? x + 2 : x + 1, ty, 5, 1), 'lb3');
}

/** A window; its curtains go into `drapes` (hanging, blown) when given, otherwise into `s`. */
function windowAt(s: Sprite, x: number, y: number, drapes?: [Sprite, Sprite]): Box[] {
  s.mass(rect(x, y, 42, 36), 'wf', { deep: true });
  const panes: Box[] = [[x + 2, y + 2, 18, 11], [x + 22, y + 2, 18, 11], [x + 2, y + 15, 18, 19], [x + 22, y + 15, 18, 19]];
  // The sill, and its shadow on the wall.
  s.mass(rect(x - 3, y + 36, 48, 2), 'wf', { deep: true });
  s.fill(dither(rect(x - 2, y + 39, 46, 1)), 'sh');
  // The rod and the curtains.
  s.fill(rect(x - 7, y - 4, 56, 1), 'wd1').set(x - 8, y - 4, 'wd0').set(x + 49, y - 4, 'wd0');
  if (drapes) {
    drapes.forEach((d, i) => {
      curtain(d, x - 7, y - 3, 41, false, i * 4);
      curtain(d, x + 41, y - 3, 41, true, i * 4);
    });
  } else {
    curtain(s, x - 7, y - 3, 41, false);
    curtain(s, x + 41, y - 3, 41, true);
  }
  return panes;
}

/** Outside: the sky by day and by night, the sun, the moon, stars, hills and a tree. */
function skyOf(panes: Box[], winY: number) {
  const day = new Sprite();
  const grey = new Sprite();
  const night = new Sprite();
  const stars = new Sprite();
  const scenery = new Sprite();
  const sceneryNight = new Sprite();
  for (const [px, py, pw, ph] of panes) {
    for (let y = py; y < py + ph; y++) {
      const t = (y - winY) / 34;
      day.fill(rect(px, y, pw, 1), t < 0.3 ? 'sk2' : t < 0.7 ? 'sk3' : 'sk4');
      grey.fill(rect(px, y, pw, 1), t < 0.4 ? 'st2' : 'st3');
      night.fill(rect(px, y, pw, 1), t < 0.45 ? 'nt1' : 'nt2');
    }
    for (let i = 0; i < 4; i++) {
      const sx = px + Math.floor(noise(px, i) * pw);
      const sy = py + Math.floor(noise(i, px + py) * Math.max(1, ph - 7));
      stars.set(sx, sy, i % 2 ? 'pp4' : 'gd4');
    }
  }
  // Hills and a tree along the bottom of the lower panes.
  const [lx, ly, , lh] = panes[2];
  const right = panes[3][0] + panes[3][2];
  const ground = ly + lh;
  for (let x = lx; x < right; x++) {
    const top = ground - 4 - Math.round(2 * Math.sin((x - lx) * 0.16) + noise(x, 7) * 1.1);
    for (let y = top; y < ground; y++) {
      scenery.set(x, y, y === top ? 'gn3' : y > ground - 2 ? 'gn1' : 'gn2');
      sceneryNight.set(x, y, 'nt0');
    }
  }
  const tx = panes[3][0] + 11;
  const crown = [...disc(tx, ground - 11, 4.6), ...disc(tx - 3, ground - 8, 3.4), ...disc(tx + 3, ground - 8, 3.6)];
  scenery.mass(rect(tx - 1, ground - 7, 2, 6), 'wd', { outline: false });
  scenery.mass(crown, 'gn', { round: [tx - 1, ground - 12] });
  sceneryNight.fill(rect(tx - 1, ground - 7, 2, 6), 'nt0').fill(crown, 'nt0');
  // A roof of the school's other wing on the left.
  const roof = [...rect(lx + 2, ground - 9, 9, 6)];
  scenery.mass(roof, 'wf', { outline: false }).fill(rect(lx + 1, ground - 11, 11, 2), 'ld2').fill(rect(lx + 4, ground - 7, 2, 2), 'sk1').fill(rect(lx + 7, ground - 7, 2, 2), 'sk1');
  sceneryNight.fill([...roof, ...rect(lx + 1, ground - 11, 11, 2)], 'nt0').fill(rect(lx + 4, ground - 7, 2, 2), 'gd3');

  const [sx, sy] = panes[1];
  const sun = new Sprite().mass(disc(sx + 12, sy + 5, 3.2), 'gd', { round: [sx + 12, sy + 5] });
  const moon = new Sprite().fill(minus(disc(sx + 12, sy + 5, 3), disc(sx + 13.4, sy + 4.2, 2.6)), 'gd3');
  return { day, grey, night, sun, moon, stars, scenery, sceneryNight };
}

/** Clouds, rain and snow over the whole window, repeating every SKY_LOOP pixels. */
function weather(x: number, y: number, w: number, h: number) {
  const clouds = new Sprite();
  for (let i = 0, cx = x - 8; cx < x + w + SKY_LOOP + 8; i++, cx += SKY_LOOP / 3) {
    const cy = y + 3 + Math.floor(noise(i % 3, 5) * 9);
    clouds.mass([...disc(cx + 3, cy + 1.5, 2.1), ...disc(cx + 7, cy, 2.9), ...disc(cx + 11, cy + 1.5, 2.1), ...rect(cx + 2, cy + 1, 10, 3)], 'pp', { outline: false });
  }
  // Rain falls straight in short streaks; snow drifts in flakes. Both are
  // drawn twice as tall as the window and slide down by one window.
  const rain = new Sprite();
  const snow = new Sprite();
  for (let j = 0; j < h * 2; j += 1) {
    for (let i = 0; i < w; i += 1) {
      const n = noise(i + 11, j + 3);
      if (n > 0.965) rain.fill([[x + i, y - h + j], [x + i, y - h + j + 1]], 'wt4');
      if (n < 0.022) snow.set(x + i, y - h + j, 'pp4');
      else if (n < 0.026) snow.fill([[x + i, y - h + j], [x + i - 1, y - h + j + 1], [x + i + 1, y - h + j + 1], [x + i, y - h + j + 2]], 'pp3');
    }
  }
  return { clouds, rain, snow };
}

// ── On the wall ──────────────────────────────────────────────────────────

/** The space poster: stars, a ringed planet, a launch pad (its rocket is drawn apart). */
function poster(s: Sprite, x: number, y: number) {
  s.fill(dither(rect(x + 1, y + 1, 16, 22)), 'sh');
  s.mass(rect(x, y, 16, 22), 'pp');
  s.fill(rect(x + 2, y + 2, 12, 14), 'nt1');
  s.fill(dither(rect(x + 2, y + 2, 12, 5), 1), 'nt0');
  for (const [px, py] of [[x + 3, y + 3], [x + 7, y + 4], [x + 12, y + 3], [x + 3, y + 12], [x + 6, y + 10]] as Pt[]) s.set(px, py, 'pp4');
  // A ringed planet top left, the pad bottom right.
  s.mass(disc(x + 5, y + 6.5, 2.4), 'or', { round: [x + 5, y + 6.5] });
  s.fill([[x + 2, y + 8], [x + 3, y + 8], [x + 7, y + 6], [x + 8, y + 5]], 'gd3');
  s.fill(rect(x + 8, y + 15, 6, 1), 'st2').fill(rect(x + 9, y + 15, 4, 1), 'st3');
  // Its title in two bars of print, a pin in each top corner.
  s.fill(rect(x + 3, y + 18, 10, 1), 'ik3').fill(rect(x + 5, y + 20, 6, 1), 'ik3');
  s.set(x + 1, y + 1, 'rd2').set(x + 14, y + 1, 'rd2');
}

/** The poster's rocket (7 × 9, its feet on row 8), the flame under it in two frames, smoke for the start. */
function rocketAt(x: number, y: number): { at: Pt; body: Sprite; flame: [Sprite, Sprite]; smoke: Sprite } {
  const body = new Sprite().rows([
    '...O...',
    '..ORO..',
    '.ORRRO.',
    '.OPPPO.',
    '.OPWPO.',
    '.OPPPO.',
    'ORPPPRO',
    'ORPSPRO',
    'OO.O.OO',
  ], x, y, { O: 'ik2', R: 'rd2', P: 'pp3', W: 'wt3', S: 'st1' });
  body.set(x + 2, y + 3, 'pp4').set(x + 4, y + 4, 'wt4');
  const flame = [
    ['..Y..', '.YOY.', '..O..'],
    ['..Y..', '..Y..', '.YOY.', '..O..'],
  ].map((rows) => new Sprite().rows(rows, x + 1, y + 9, { Y: 'gd3', O: 'or2' })) as [Sprite, Sprite];
  const smoke = new Sprite();
  for (const [cx, r] of [[-1, 1.6], [3.5, 1.3], [8, 1.6]] as Pt[]) smoke.fill(disc(x + cx, y + 9.5, r), 'pp2');
  return { at: [x, y], body, flame, smoke };
}

function lightSwitch(x: number, y: number, on: boolean): Sprite {
  const s = new Sprite().mass(rect(x, y, 4, 6), 'pp');
  return s.fill(rect(x + 1, on ? y + 1 : y + 3, 2, 2), 'st1');
}

function chalkboard(s: Sprite, x: number, y: number): Box {
  const w = 84;
  const h = 42;
  s.fill(dither(rect(x + 2, y + h, w, 2)), 'sh');
  s.mass(rect(x, y, w, h), 'wd', { deep: true });
  const inner = rect(x + 2, y + 2, w - 4, h - 4);
  s.fill(inner, 'cb2');
  // Old chalk wiped across it, darker near the frame.
  for (const [px, py] of inner) {
    const n = noise(px * 0.7, py * 1.3);
    if (n > 0.9 && (px + py) % 2) s.set(px, py, 'cb3');
    else if (n < 0.05) s.set(px, py, 'cb1');
  }
  s.fill([...rect(x + 2, y + 2, w - 4, 1), ...rect(x + 2, y + 3, 1, h - 5)], 'cb1');
  // The tray, with chalk and the sponge.
  s.mass(rect(x - 1, y + h, w + 2, 2), 'wd', { deep: true });
  s.fill(rect(x + 8, y + h - 1, 4, 1), 'pp4').fill(rect(x + 14, y + h - 1, 3, 1), 'gd3').fill(rect(x + 19, y + h - 1, 2, 1), 'ld3');
  s.mass(rect(x + w - 16, y + h - 3, 7, 3), 'lb', { deep: true });
  s.fill(rect(x + w - 16, y + h - 1, 7, 1), 'wd1');
  return [x + 3, y + 3, w - 6, h - 6];
}

function shelf(s: Sprite, x: number, y: number) {
  const w = 28;
  const h = 50;
  s.mass(rect(x, y, w, h), 'wd', { deep: true });
  s.fill(rect(x + 2, y + 2, w - 4, h - 5), 'wd1');
  s.fill(dither(rect(x + 2, y + 2, w - 4, h - 5)), 'wd0');
  const tops = [y + 2, y + 17, y + 32];
  for (const top of tops.slice(1)) s.fill(rect(x + 2, top - 2, w - 4, 1), 'wd3').fill(rect(x + 2, top - 1, w - 4, 1), 'wd2');
  s.fill(rect(x + 2, y + h - 3, w - 4, 1), 'wd3');
  const tones = ['rd', 'gd', 'wt', 'gn', 'ac', 'ld', 'lb', 'la', 'lc'];
  const books = (top: number, from: number, to: number, seed: number) => {
    let bx = from;
    let i = 0;
    while (bx < to) {
      const bw = 2 + Math.floor(noise(seed, i) * 2);
      const bh = 8 + Math.floor(noise(i, seed) * 4);
      if (bx + bw > to) break;
      const m = tones[Math.floor(noise(seed + i, 3) * tones.length)];
      const by = top + 13 - bh;
      s.fill(rect(bx, by, bw, bh), `${m}2`).fill(rect(bx, by, 1, bh), `${m}3`).fill(rect(bx + bw - 1, by, 1, bh), `${m}1`);
      s.fill(rect(bx, by + 2, bw, 1), `${m}4`);
      bx += bw;
      i += 1;
    }
  };
  books(tops[0], x + 2, x + 18, 1);
  // The middle shelf leaves room for the red book (drawn on its own).
  books(tops[1], x + 2, x + 13, 2);
  books(tops[1], x + 16, x + 26, 5);
  // A box of board games and stacked folders on the bottom shelf.
  s.mass(rect(x + 3, tops[2] + 6, 10, 7), 'lb', { deep: true });
  s.fill(rect(x + 5, tops[2] + 8, 6, 1), 'lb1');
  for (let i = 0; i < 4; i++) s.fill(rect(x + 15, tops[2] + 12 - i * 2, 10, 2), i % 2 ? 'la2' : 'lc2').fill(rect(x + 15, tops[2] + 12 - i * 2, 10, 1), i % 2 ? 'la3' : 'lc3');
}

/**
 * The red book in its gap on the middle shelf (3 × 10, its top at y),
 * standing like the others or pulled up by its top, the empty slot dark
 * below it.
 */
function bookAt(x: number, y: number, out: boolean): Sprite {
  const s = new Sprite();
  const by = out ? y - 4 : y;
  if (out) s.fill(rect(x, y + 6, 3, 4), 'wd0');
  const pts = rect(x, by, 3, 10);
  s.mass(pts, 'rd', { outline: false });
  s.fill(rect(x, by, 1, 10), 'rd3').fill(rect(x + 2, by, 1, 10), 'rd1');
  s.fill([...rect(x, by + 2, 3, 1), ...rect(x, by + 7, 3, 1)], 'gd3');
  return s;
}

function globeFrames(cx: number, cy: number): Sprite[] {
  const base = new Sprite();
  base.mass(rect(cx - 3, cy + 7, 7, 2), 'wd', { deep: true });
  base.fill(rect(cx, cy + 6, 1, 1), 'gd1');
  return [0, 1, 2, 3].map((turn) => {
    const s = new Sprite().paste(base);
    const ball = disc(cx + 0.5, cy + 0.5, 5.2);
    s.mass(ball, 'wt', { round: [cx + 0.5, cy + 0.5] });
    for (const [px, py] of ball) {
      const u = px - cx + turn * 3;
      if (noise(Math.floor(u / 3) * 3.1, Math.floor((py - cy) / 2)) > 0.55 && Math.abs(px + 0.5 - cx - 0.5) < 4.6) s.set(px, py, (px + py) % 3 ? 'gn2' : 'gn3');
    }
    // The brass arc around it.
    s.fill([[cx - 6, cy - 1], [cx - 6, cy], [cx - 6, cy + 1], [cx - 5, cy + 3], [cx - 4, cy + 4], [cx - 5, cy - 3], [cx - 4, cy - 5]], 'gd2');
    s.fill([[cx - 3, cy - 6], [cx - 2, cy - 7]], 'gd3');
    return s;
  });
}

function vendingMachine(s: Sprite, x: number, y: number) {
  const w = 27;
  const h = 60;
  s.fill(dither(ellipse(x + w / 2, y + h + 1.5, w / 2 + 2, 1.4)), 'sh');
  s.mass(rect(x, y, w, h), 'ac', { deep: true });
  s.fill(rect(x + 2, y + h, 3, 2), 'st0').fill(rect(x + w - 5, y + h, 3, 2), 'st0');
  // The sign at the top (lit, drawn apart) and the glass front.
  s.fill(rect(x + 2, y + 2, w - 4, 8), 'nt0');
  const gx = x + 2;
  const gy = y + 12;
  s.fill(rect(gx, gy, 16, 37), 'nt1');
  s.fill(rect(gx, gy, 16, 1), 'nt0');
  // Five rows as in the machine up close (./vending.ts); the drinks at the
  // bottom, the white energy can in the middle of them, in the cold.
  const tones = [['gd', 'pk', 'rd'], ['ld', 'ik', 'ld'], ['ik', 'pp', 'rd'], ['gn', 'ld', 'lb'], ['lc', 'gh', 'ck']];
  s.fill(rect(gx, gy + 29, 16, 8), 'nt2').fill(rect(gx, gy + 29, 16, 1), 'wt3');
  tones.forEach((row, r) => {
    const sy = gy + 1 + r * 7;
    row.forEach((m, c) => {
      const sx = gx + 1 + c * 5;
      s.mass(rect(sx + 1, sy + 1, 3, 4), m, { outline: false });
      s.fill(rect(sx, sy + 6, 5, 1), 'st1');
    });
  });
  s.set(gx + 8, gy + 31, 'st1').set(gx + 8, gy + 32, 'st1');
  // A sheen across the glass.
  s.fill(dither([...line(gx + 2, gy + 36, gx + 15, gy + 6), ...line(gx + 3, gy + 36, gx + 15, gy + 8)]), 'gl');
  // Controls: the display, the keypad, the slot for stars.
  s.fill(rect(x + 20, y + 13, 5, 3), 'gn3');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) s.set(x + 20 + c * 3, y + 19 + r * 2, 'st3');
  s.fill(rect(x + 21, y + 27, 3, 5), 'nt0').fill(rect(x + 22, y + 28, 1, 3), 'gd2');
  // The flap at the bottom.
  s.fill(rect(x + 3, y + 51, w - 6, 7), 'nt0');
  s.fill(rect(x + 4, y + 52, w - 8, 3), 'ac1');
  s.fill(rect(x + 4, y + 52, w - 8, 1), 'ac3');
}

function vendingSign(x: number, y: number, on: boolean): Sprite {
  const s = new Sprite();
  const t = textPixels('SHOP', 0, 0);
  const tx = x + 2 + Math.floor((23 - t.width) / 2);
  s.fill(t.points.map(([px, py]) => [px + tx, py + y + 3] as Pt), on ? 'gd3' : 'gd1');
  return s;
}

// ── On the floor ─────────────────────────────────────────────────────────

function teacherDesk(s: Sprite, x: number, feet: number) {
  const top = feet - 24;
  s.fill(dither(ellipse(x + 23, feet + 0.5, 26, 1.6)), 'sh');
  s.mass(rect(x + 1, top + 3, 44, 19), 'dr', { deep: true });
  s.fill([...rect(x + 4, top + 6, 22, 1), ...rect(x + 4, top + 6, 1, 13)], 'dr1');
  s.fill([...rect(x + 4, top + 19, 22, 1), ...rect(x + 26, top + 6, 1, 14)], 'dr3');
  s.fill([...rect(x + 29, top + 6, 13, 1), ...rect(x + 29, top + 6, 1, 5)], 'dr1');
  s.fill([...rect(x + 29, top + 11, 13, 1), ...rect(x + 42, top + 6, 1, 6)], 'dr3');
  s.mass(rect(x + 34, top + 8, 3, 1), 'gd');
  s.mass(rect(x + 1, top + 22, 3, 2), 'dr').mass(rect(x + 42, top + 22, 3, 2), 'dr');
  s.mass(rect(x - 1, top, 48, 3), 'wd', { deep: true });
  s.fill(rect(x, top, 46, 1), 'wd3');
  // Papers and books on the left, a cup of pencils.
  s.mass(rect(x + 4, top - 2, 10, 2), 'pp');
  s.mass(rect(x + 5, top - 5, 9, 3), 'la').fill(rect(x + 5, top - 4, 9, 1), 'pp3');
  s.mass(rect(x + 6, top - 7, 7, 2), 'lc');
  s.fill([[x + 18, top - 8], [x + 18, top - 7], [x + 20, top - 9], [x + 20, top - 8], [x + 21, top - 7]], 'gd2').set(x + 18, top - 9, 'ik2').set(x + 20, top - 10, 'rd2');
  s.mass(rect(x + 17, top - 6, 5, 6), 'ac', { deep: true });
}

function appleAt(x: number, y: number): Sprite {
  const s = new Sprite();
  s.mass([...disc(x + 2, y + 3, 2.6), ...disc(x + 4, y + 3, 2.6)], 'rd', { round: [x + 2, y + 2] });
  s.fill([[x + 3, y], [x + 3, y - 1]], 'wd1');
  s.fill([[x + 4, y - 1], [x + 5, y - 2], [x + 5, y - 1]], 'gn2');
  return s;
}

/** A paper ball out of the bin (4 × 4). */
export const PAPER_BALL = new Sprite().mass([...rect(1, 0, 2, 4), ...rect(0, 1, 4, 2)], 'pp').set(1, 1, 'pp1').set(2, 2, 'pp1');

/** The note from the red book (as wide as its writing, 9 high): the keypad's secret code. */
export function noteSprite(code: string): Sprite {
  const t = textPixels(code, 0, 0);
  const w = t.width + 6;
  const s = new Sprite().fill(dither(rect(1, 9, w, 1)), 'sh').mass(rect(0, 0, w, 9), 'pp');
  s.fill(rect(0, 0, w, 1), 'pp3').fill([[w - 1, 0], [w - 2, 0], [w - 1, 1]], 'pp1');
  return s.fill(t.points.map(([px, py]) => [px + 3, py + 2] as Pt), 'rd2');
}

function bin(s: Sprite, x: number, feet: number) {
  const top = feet - 11;
  s.fill(dither(ellipse(x + 4.5, feet + 0.5, 6, 1.2)), 'sh');
  const body = rect(x, top, 9, 11).filter(([px, py]) => !(py > top + 7 && (px === x || px === x + 8)));
  s.mass(body, 'st', { deep: true });
  for (const [px, py] of body) if ((px + py) % 2 === 0 && py > top + 1 && px > x && px < x + 8) s.set(px, py, 'st1');
  s.fill(rect(x, top, 9, 1), 'st3');
  s.mass([...disc(x + 3, top - 1, 1.8), ...disc(x + 6, top - 0.5, 1.6)], 'pp');
}

/**
 * A school desk seen from the back of the room, its chair in front of it
 * (the back of the chair towards us, a little to the left, so what lies on
 * the right of the desk stays in view). Returns the desk top's row.
 */
function desk(s: Sprite, x: number, feet: number, chair: string): number {
  const w = 30;
  const top = feet - 20;
  s.fill(dither(ellipse(x + w / 2, feet + 0.5, w / 2 + 1, 1.3)), 'sh');
  // Legs, the shelf for bags, the top.
  s.mass(rect(x + 2, top + 2, 2, feet - top - 2), 'st').mass(rect(x + w - 4, top + 2, 2, feet - top - 2), 'st');
  s.mass(rect(x + 3, top + 3, w - 6, 4), 'wd', { deep: true });
  s.fill(rect(x + 4, top + 4, w - 8, 2), 'wd0');
  s.mass(rect(x, top, w, 3), 'wd', { deep: true });
  s.fill(rect(x + 1, top, w - 2, 1), 'wd3');
  // The chair: steel legs, the seat's edge, the shell of its back with a grip.
  const cx = x + 4;
  const cf = feet + 2;
  s.fill(dither(ellipse(cx + 7, cf + 0.5, 8, 1.1)), 'sh');
  s.mass([...rect(cx + 1, cf - 9, 1, 9), ...rect(cx + 12, cf - 9, 1, 9)], 'st');
  s.mass(rect(cx - 1, cf - 11, 16, 2), chair, { deep: true });
  s.mass([...rect(cx + 2, cf - 14, 1, 3), ...rect(cx + 11, cf - 14, 1, 3)], 'st');
  s.mass(soft(cx, cf - 22, 14, 9, 2), chair, { deep: true });
  s.fill(rect(cx + 5, cf - 20, 4, 1), `${chair}0`);
  return top;
}

/** The notebook on a desk: lying shut, and two frames of its pages flipping (a flip book). */
function notebookFrames(x: number, y: number): [Sprite, Sprite, Sprite] {
  const base = () => {
    const s = new Sprite().mass(rect(x, y, 10, 2), 'pp');
    s.fill(rect(x + 5, y, 1, 2), 'pp1');
    s.fill(line(x + 10, y + 1, x + 14, y - 1), 'gd2').set(x + 14, y - 1, 'ik2');
    return s;
  };
  const shut = base().fill([[x + 1, y], [x + 3, y], [x + 7, y], [x + 8, y]], 'wt3');
  // A page standing up at the spine, then falling over to the right.
  const up = base().mass([...rect(x + 5, y - 5, 1, 5), [x + 4, y - 4], [x + 4, y - 3]], 'pp');
  const over = base().mass([...line(x + 5, y - 1, x + 9, y - 4), ...line(x + 6, y - 1, x + 9, y - 3)], 'pp');
  return [shut, up, over];
}

/** The game console on its desk, standing on a little stand with its screen towards the room. */
function consoleAt(s: Sprite, x: number, y: number) {
  s.mass(rect(x + 5, y + 9, 5, 1), 'st');
  s.mass(soft(x, y, 15, 9, 2), 'la', { deep: true });
  s.fill(rect(x + 4, y + 2, 7, 5), 'nt0');
  s.fill([[x + 2, y + 3], [x + 1, y + 4], [x + 2, y + 4], [x + 3, y + 4], [x + 2, y + 5]], 'ik2');
  s.set(x + 13, y + 3, 'ld2').set(x + 12, y + 5, 'lb2');
}

/** The console's screen: a tiny game playing by itself, in two frames. */
function screenFrames(x: number, y: number): [Sprite, Sprite] {
  const frame = (f: number) => {
    const s = new Sprite();
    s.fill(rect(x + 4, y + 2, 7, 5), 'nt2');
    s.fill(rect(x + 4, y + 6, 7, 1), 'gn2');
    s.fill(rect(x + 5 + f * 2, y + 4, 2, 2), 'ac3');
    s.set(x + 9 - f * 2, y + 2 + f, 'gd3');
    return s;
  };
  return [frame(0), frame(1)];
}

/** The backpack (11 × 17, its feet on row 16): the icon of the inventory in the bar on top. */
export const BACKPACK = (() => { const s = new Sprite(); backpack(s, 0, 16); return s; })();

function backpack(s: Sprite, x: number, feet: number) {
  s.fill(dither(ellipse(x + 5, feet + 0.5, 7, 1.2)), 'sh');
  s.mass(soft(x, feet - 13, 11, 13, 3), 'lb', { deep: true });
  s.mass(soft(x + 1, feet - 13, 9, 6, 2.5), 'lb', { deep: true });
  s.fill(rect(x + 2, feet - 8, 7, 1), 'lb1');
  s.mass(rect(x + 3, feet - 5, 5, 3), 'lb');
  s.fill(rect(x + 5, feet - 11, 2, 2), 'ac2');
  s.fill([[x + 3, feet - 15], [x + 4, feet - 16], [x + 5, feet - 16], [x + 6, feet - 16], [x + 7, feet - 15]], 'wd1');
}

/** A low cupboard with a big plant on it, for room beside the core. */
/**
 * A pointed leaf from (x, y) towards `deg` (0 is straight up, positive to
 * the right), `len` long and `wide` across at its widest.
 */
function leafShape(x: number, y: number, deg: number, len: number, wide: number): { shape: Pt[]; vein: Pt[] } {
  const a = (deg * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  const shape: Pt[] = [];
  const reach = Math.ceil(len) + 2;
  for (let py = Math.floor(y - reach); py <= y + reach; py++) {
    for (let px = Math.floor(x - reach); px <= x + reach; px++) {
      const dx = px + 0.5 - x;
      const dy = py + 0.5 - y;
      const u = dx * ux + dy * uy;
      const v = -dx * uy + dy * ux;
      // Widest a little below the middle, coming to a point at the tip.
      if (u > 0 && u < len && Math.abs(v) <= (wide / 2) * Math.sin(Math.PI * (u / len) ** 0.8)) shape.push([px, py]);
    }
  }
  const tip: Pt = [Math.round(x + ux * (len - 2)), Math.round(y + uy * (len - 2))];
  return { shape, vein: line(Math.round(x + ux * 2), Math.round(y + uy * 2), tip[0], tip[1]) };
}

/** A houseplant in a terracotta pot standing on (cx, base): pointed leaves fanned out, the back ones darker. */
function pottedPlant(s: Sprite, cx: number, base: number) {
  const top = base - 8;
  // Behind: three leaves in the shade; in front: four lit ones, the outer ones low.
  const leaves: Array<[number, number, number, boolean]> = [
    [-46, 19, 6, true], [40, 19, 6, true], [-6, 22, 6.4, true],
    [-74, 14, 5.4, false], [-24, 19, 6.2, false], [20, 21, 6.2, false], [70, 14, 5.4, false],
  ];
  for (const [deg, len, wide, back] of leaves) {
    const { shape, vein } = leafShape(cx + 0.5 + deg / 30, top + 1, deg, len, wide);
    s.mass(shape, 'gn', { deep: true });
    if (back) s.recolor(shape, 'gn', 'lc').fill(shape.filter(([px, py]) => (px + py) % 2 === 0 && s.get(px, py) === 'lc2'), 'lc1');
    const on = new Set(shape.map(([px, py]) => `${px},${py}`));
    s.fill(vein.filter(([px, py]) => on.has(`${px},${py}`)), back ? 'lc3' : 'gn3');
  }
  // The pot: a rim, a body narrowing downwards, soil inside the rim.
  s.mass(rect(cx - 6, top, 13, 2), 'tc', { deep: true });
  s.fill(rect(cx - 5, top, 11, 1), 'wd0');
  const body: Pt[] = [];
  for (let j = 0; j < 6; j++) for (let i = -5 + Math.floor(j / 3); i <= 5 - Math.floor(j / 3); i++) body.push([cx + i, top + 2 + j]);
  s.mass(body, 'tc', { deep: true });
  s.fill(rect(cx - 4, top + 2, 9, 1), 'tc1');
}

/** A low cupboard, the plant on it or (where the panel's edge would cut the plant from its pot) boxes and folders. */
function cupboard(s: Sprite, x: number, floor: number, plant: boolean) {
  s.fill(dither(rect(x + 1, floor, 30, 2)), 'sh');
  s.mass(rect(x, floor - 26, 30, 26), 'wd', { deep: true });
  s.fill([...rect(x + 14, floor - 23, 1, 20), ...rect(x + 3, floor - 13, 24, 1)], 'wd1');
  s.mass(rect(x + 11, floor - 19, 2, 1), 'gd').mass(rect(x + 17, floor - 19, 2, 1), 'gd');
  const top = floor - 26;
  if (plant) { pottedPlant(s, x + 15, top); return; }
  s.mass(rect(x + 3, top - 9, 13, 9), 'ck', { deep: true });
  s.fill(rect(x + 3, top - 6, 13, 1), 'ck1').fill(rect(x + 8, top - 9, 3, 3), 'pp3');
  for (let i = 0; i < 3; i++) s.fill(rect(x + 18, top - 2 - i * 2, 9, 2), i % 2 ? 'la2' : 'lc2').fill(rect(x + 18, top - 2 - i * 2, 9, 1), i % 2 ? 'la3' : 'lc3');
}

/** Little flags on a string under the ceiling, in the tones of the site's tiles. */
function garland(s: Sprite, w: number, y: number) {
  const tones = ['la', 'lb', 'lc', 'ld'];
  for (let x = 0; x < w; x++) s.set(x, y + Math.round(1.5 * Math.sin((x * Math.PI) / 40) ** 2), 'st1');
  for (let i = 0, x = 4; x < w - 6; i++, x += 10) {
    const top = y + 1 + Math.round(1.5 * Math.sin(((x + 3) * Math.PI) / 40) ** 2);
    const flag: Pt[] = [];
    for (let j = 0; j < 6; j++) for (let k = Math.floor(j / 2); k < 7 - Math.floor(j / 2); k++) flag.push([x + k, top + j]);
    s.mass(flag, tones[i % tones.length], { outline: false });
  }
}

// ── The scene ────────────────────────────────────────────────────────────

/** `view`: the part of the drawing's width shown in the panel when it isn't moving, [from, to). */
export function buildClassroom(w: number, h: number, view: [number, number] = [0, w]): Classroom {
  const ox = Math.floor((w - ROOM_W) / 2);
  const oy = h - ROOM_H;
  const at = (x: number, y: number): Pt => [ox + x, oy + y];
  const floor = oy + FLOOR;
  const back = new Sprite();
  const front = new Sprite();
  const glow = new Sprite();
  const lampLight = new Sprite();

  wall(back, w, floor);
  parquet(back, w, h, floor, ox + ROOM_W / 2);
  if (oy >= 10) {
    const xs: number[] = [];
    for (let x = ox + 60; x < w; x += 120) xs.push(x);
    for (let x = ox + 60 - 120; x > 0; x -= 120) xs.push(x);
    lamps(back, lampLight, xs, oy - 7);
  }

  const [wx, wy] = at(8, 14);
  const curtains: [Sprite, Sprite] = [new Sprite(), new Sprite()];
  const panes = windowAt(back, wx, wy, curtains);
  const sky = skyOf(panes, wy);
  const wet = weather(wx + 2, wy + 2, 38, 32);
  // Below the window, a radiator.
  const [rx, ry] = at(11, 58);
  back.mass(rect(rx, ry, 32, 14), 'wf', { deep: true });
  for (let i = 2; i < 32; i += 3) back.fill(rect(rx + i, ry + 2, 1, 10), 'wf1');

  const [px, py] = at(55, 17);
  poster(back, px, py);
  const rocket = rocketAt(px + 7, py + 6);
  const [sx, sy] = at(71, 52);
  const [bx, by] = at(78, 12);
  const board = chalkboard(back, bx, by);
  const clock: Pt = [ox + 172.5, oy + 19];
  const clockBody = new Sprite();
  clockFace(clockBody, clock[0], clock[1]);

  const [shx, shy] = at(182, 32);
  shelf(back, shx, shy);
  const [gx, gy] = at(195, 22);
  const book = { in: bookAt(shx + 13, shy + 20, false), out: bookAt(shx + 13, shy + 20, true) };

  const [vx, vy] = at(211, 20);
  vendingMachine(back, vx, vy);
  glow.fill(rect(vx + 2, vy + 12, 16, 37), 'glow').fill(rect(vx + 2, vy + 2, 23, 8), 'glow');

  // Where the panel is wider than the core: more windows on the left, a
  // cupboard with a plant on the right, more desks in both rows. Taller: a
  // garland of flags under the ceiling.
  for (let x = wx - 72; x > -50; x -= 72) {
    windowAt(back, x, wy).forEach(([px2, py2, pw, ph]) => back.fill(rect(px2, py2, pw, ph), 'sk3'));
    back.mass(rect(x + 3, ry, 32, 14), 'wf', { deep: true });
    for (let i = 2; i < 32; i += 3) back.fill(rect(x + 3 + i, ry + 2, 1, 10), 'wf1');
  }
  // The plant only where it is seen whole or not at all (its leaves reach 6
  // beyond the cupboard); cut by the panel's edge it would hang in the air.
  for (let x = ox + ROOM_W + 8; x < w; x += 64) {
    const plant = (x + 36 <= view[1] || x >= view[1]) && x + 36 <= w;
    cupboard(back, x, floor, plant);
  }
  if (oy >= 14) garland(back, w, oy - 9);
  const floorBlocks: Box[] = [];
  const backDesk = (x: number) => floorBlocks.push([x - 2, oy + 78, 34, 26]);
  const frontDesk = (x: number) => floorBlocks.push([x - 2, oy + 98, 34, 26]);
  [ox + 10, ox + 158].forEach(backDesk);
  for (let x = 10 - 74; ox + x > -40; x -= 74) { desk(back, ox + x, oy + 100, 'ld'); backDesk(ox + x); }
  for (let x = 158 + 74; ox + x < w + 10; x += 74) { desk(back, ox + x, oy + 100, 'lc'); backDesk(ox + x); }

  // Behind the mascot: the teacher's desk, a bin, the back row.
  const [tx] = at(102, 0);
  const deskFeet = oy + 92;
  teacherDesk(back, tx, deskFeet);
  const appleXY: Pt = [tx + 37, deskFeet - 29];
  const [nx] = at(150, 0);
  const binBody = new Sprite();
  bin(binBody, nx, oy + 94);
  const backRow: Array<[number, string]> = [[10, 'lc'], [158, 'la']];
  for (const [x, chair] of backRow) desk(back, ox + x, oy + 100, chair);

  // The front row, in front of the mascot.
  const rowFeet = oy + 121;
  const nbTop = desk(front, ox + 4, rowFeet, 'ld');
  const notebook = notebookFrames(ox + 17, nbTop - 2);
  const tabDeskX = ox + 120;
  const tabTop = desk(front, tabDeskX, rowFeet, 'lb');
  const tabXY: Pt = [tabDeskX + 15, tabTop - 10];
  consoleAt(front, tabXY[0], tabXY[1]);
  glow.fill(rect(tabXY[0] + 4, tabXY[1] + 2, 7, 5), 'glow');
  desk(front, ox + 203, rowFeet, 'la');
  for (let x = 4 - 74; ox + x > -40; x -= 74) { desk(front, ox + x, rowFeet, 'lb'); frontDesk(ox + x); }
  for (let x = 203 + 74; ox + x < w + 10; x += 74) { desk(front, ox + x, rowFeet, 'ld'); frontDesk(ox + x); }
  [ox + 4, tabDeskX, ox + 203].forEach(frontDesk);
  floorBlocks.push([nx - 3, oy + 81, 15, 16]);

  // With the light off, the machine's glass lights the floor in front of it:
  // a pool widening towards the room, thinning out, on the bare floor only
  // (not over the desks and chairs that stand in it).
  for (let j = 0; j < 9; j++) {
    const y = floor + j;
    const half = 15 + j * 1.6;
    for (let x = Math.floor(vx + 13.5 - half); x <= vx + 13.5 + half; x++) {
      const tone = back.get(x, y);
      const bare = !!tone && (tone.startsWith('pq') || tone === 'sh' || tone === 'shd') && !front.get(x, y);
      const edge = Math.abs(x - (vx + 13.5)) / half;
      if (bare && (j < 3 ? (x + y) % 2 === 0 : (x + 2 * y) % (j < 6 ? 3 : 4) === 0) && edge < 0.96 - j * 0.03) glow.set(x, y, 'lit');
    }
  }

  const mascotXY: Pt = [ox + 60, oy + 99 - FEET];

  const box = (x: number, y: number, bw: number, bh: number): Box => [x, y, bw, bh];
  const spots: Record<Spot, Box> = {
    window: box(wx - 2, wy, 46, 38),
    poster: box(px, py, 16, 22),
    switch: box(sx - 2, sy - 2, 8, 10),
    board: box(bx, by, 84, 42),
    clock: box(clock[0] - 8, clock[1] - 8, 16, 16),
    globe: box(gx - 7, gy - 8, 15, 18),
    shelf: box(shx, shy, 28, 50),
    vending: box(vx, vy, 27, 62),
    apple: box(appleXY[0] - 2, appleXY[1] - 4, 10, 10),
    bin: box(nx - 1, oy + 81, 11, 14),
    notebook: box(ox + 15, nbTop - 7, 18, 10),
    console: box(tabXY[0] - 2, tabXY[1] - 2, 19, 13),
    mascot: box(mascotXY[0] + 4, mascotXY[1], 32, 36),
  };

  return {
    w, h, ox, oy, floor, back, front, panes, sky,
    clouds: wet.clouds, rain: wet.rain, snow: wet.snow,
    curtains, rocket,
    switchOn: lightSwitch(sx, sy, true),
    switchOff: lightSwitch(sx, sy, false),
    board, clock,
    clockFace: clockBody,
    bin: binBody,
    binTop: [nx + 4, oy + 82],
    notebook,
    globe: globeFrames(gx, gy),
    book,
    sign: [vendingSign(vx, vy, true), vendingSign(vx, vy, false)],
    screen: screenFrames(tabXY[0], tabXY[1]),
    apple: appleAt(appleXY[0], appleXY[1]),
    appleAt: appleXY,
    bookAt: [shx + 13, shy + 16],
    noteAt: [shx + 6, oy + 84],
    floorBlocks,
    mascot: mascotXY,
    glow, lampLight, spots,
    bright: [...panes, [vx + 2, vy + 2, 23, 8], [vx + 2, vy + 12, 16, 37], [vx + 20, vy + 13, 5, 3], [tabXY[0] + 4, tabXY[1] + 2, 7, 5]],
    decor: {
      plant: at(37, 50),
      lamp: [tx + 27, deskFeet - 24],
      lights: [bx, by],
      disco: [ox + 152, Math.max(0, oy - 4)],
      trophy: [shx + 19, shy + 15],
      duck: [ox + 30, oy + 80],
      // Where the emptied energy can is dropped: on the floor beside the mascot.
      can: [ox + 97, oy + 99],
    },
  };
}

// ── Chalk ────────────────────────────────────────────────────────────────

/** Lines of chalk centred on the board, dusty in places, and an optional doodle at the bottom right. */
export function chalk(lines: string[], [x, y, w, h]: Box, doodle?: 'mascot' | 'heart' | 'star' | 'cat'): Sprite {
  const s = new Sprite();
  const pitch = 7;
  const top = y + Math.max(1, Math.floor((h - lines.length * pitch - (doodle ? 8 : 0)) / 2));
  lines.forEach((text, i) => {
    const t = textPixels(text, 0, 0);
    const lx = x + Math.floor((w - t.width) / 2);
    for (const [px, py] of t.points) {
      const ax = px + lx;
      const ay = py + top + i * pitch;
      s.set(ax, ay, noise(ax, ay) > 0.82 ? 'pp2' : 'pp3');
    }
  });
  if (doodle) {
    const dx = x + w - 13;
    const dy = y + h - 12;
    const rows: Record<string, string[]> = {
      mascot: ['.########.', '#........#', '#.#....#.#', '#.#....#.#', '#........#', '#..#..#..#', '#...##...#', '.########.', '..#....#..'],
      heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
      star: ['...#...', '..###..', '#######', '.#####.', '.##.##.', '#.....#'],
      cat: ['#...#..', '##.##..', '#####..', '#.#.#..', '#####.#', '.###.#.', '.#.#...'],
    };
    s.fill(grid(rows[doodle], dx, dy), 'pp3');
  }
  return s;
}

/** The sponge wiping the board: a wide streak of wet chalk dust, in three steps. */
export function wipe([x, y, w, h]: Box, step: number): Sprite {
  const s = new Sprite();
  const reach = Math.round((w * (step + 1)) / 3);
  for (const [px, py] of rect(x, y, reach, h)) if ((px + py + step) % 3 === 0) s.set(px, py, 'cb3');
  return s;
}

/** The scene for previews. */
export function classroomPreview(w = ROOM_W, h = ROOM_H + 12) {
  const r = buildClassroom(w, h);
  return {
    w, h,
    layers: [
      { name: 'back', sprite: r.back },
      { name: 'day', sprite: r.sky.day },
      { name: 'scenery', sprite: r.sky.scenery },
      { name: 'sun', sprite: r.sky.sun },
      { name: 'clouds', sprite: r.clouds },
      { name: 'curtains', sprite: r.curtains[0] },
      { name: 'rocket', sprite: r.rocket.body },
      { name: 'switch', sprite: r.switchOn },
      { name: 'clock', sprite: r.clockFace },
      { name: 'bin', sprite: r.bin },
      { name: 'book', sprite: r.book.in },
      { name: 'globe', sprite: r.globe[0] },
      { name: 'sign', sprite: r.sign[0] },
      { name: 'apple', sprite: r.apple },
      { name: 'chalk', sprite: chalk(['WIR LERNEN FUERS', 'LEBEN. DAS LEBEN', 'HAT NIE GEFRAGT.'], r.board, 'mascot') },
      { name: 'front', sprite: r.front },
      { name: 'notebook', sprite: r.notebook[0] },
      { name: 'screen', sprite: r.screen[0] },
    ],
  };
}
