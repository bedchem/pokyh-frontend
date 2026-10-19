import { FEET, MW } from './mascot';
import { Sprite, dither, disc, grid, line, minus, rect, rounded, soft, textPixels, type Pt } from './sprite';

// The school hallway beside the sign-in form (app/[lang]/login): a row of
// lockers in the tones of the site's tiles, one of them open, a window
// above them with sky by day and stars by night (the dark theme); a cork
// board with the timetable and the Mensa menu, a clock above it; the door
// of room 2B; a tiled floor running towards the viewer. The mascot
// (./mascot.ts) stands in front. The scene is built for the size of its
// panel in pixels of the drawing, around a centre `cx`; what doesn't fit is
// cut off at the sides or the top.

export const FLOOR = 24;
/** The clouds' pattern repeats after this many pixels (their drift loops). */
export const CLOUD_LOOP = 148;
const LW = 13;
const LH = 50;
const LOCKER_TONES = ['la', 'lb', 'lc', 'ld'];

export interface Hallway {
  w: number;
  h: number;
  /** First row of the floor. */
  floor: number;
  cx: number;
  /** Top left of the mascot. */
  mascot: Pt;
  back: Sprite;
  day: Sprite;
  night: Sprite;
  /** Clouds for the day window, twice as wide as the scene (they drift). */
  clouds: Sprite;
  stars: Sprite;
  /** The window's panes, for clipping the clouds: [x, y, w, h]. */
  panes: Array<[number, number, number, number]>;
  lockerOpen: Sprite;
  lockerShut: Sprite;
  clock: Pt;
  /** The door of room 2B: it opens into the room (components/room). */
  door: Doorway;
}

export interface Doorway {
  /** The door with its frame: [x, y, w, h] (what is clicked). */
  box: [number, number, number, number];
  /** The middle of the doorway, where the view goes in. */
  centre: Pt;
  shut: Sprite;
  /** Shut, the handle pressed and a line of light at its edge. */
  hover: Sprite;
  /** Opening: two steps, then open. */
  ajar: [Sprite, Sprite];
  open: Sprite;
  /** Light falling from the open door onto the hallway's floor. */
  spill: Sprite;
}

/** A small deterministic noise, so textures look the same every time. */
const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

// ── Lockers ───────────────────────────────────────────────────────────────

function lockerDoor(s: Sprite, x: number, top: number, mat: string) {
  s.mass(rect(x, top, LW, LH), mat, { deep: true });
  // Vents at the top and the bottom.
  for (const dy of [4, 6, 8, LH - 8, LH - 6]) {
    s.fill(rect(x + 3, top + dy, 7, 1), `${mat}0`);
    s.fill(rect(x + 3, top + dy + 1, 7, 1), `${mat}3`);
  }
  // A name plate and the handle.
  s.fill(rect(x + 4, top + 13, 5, 3), 'pp3').fill(rect(x + 4, top + 15, 5, 1), 'pp1');
  s.mass(rect(x + 9, top + 24, 2, 7), 'st');
}

function lockerOpenAt(x: number, top: number, mat: string): Sprite {
  const s = new Sprite();
  // Inside: the back wall, a shelf, books, a POKYH sticker.
  s.mass(rect(x, top, LW, LH), mat);
  s.fill(rect(x + 1, top + 1, LW - 2, LH - 2), 'ik2');
  s.fill(rect(x + 2, top + 2, LW - 4, LH - 4), 'ik3');
  s.fill(rect(x + 1, top + 18, LW - 2, 2), 'st2').fill(rect(x + 1, top + 20, LW - 2, 1), 'st0');
  const books: Array<[string, number]> = [['rd', 9], ['gd', 7], ['wt', 10], ['gn', 8], ['ac', 9]];
  let bx = x + 2;
  for (const [m, hgt] of books) {
    s.fill(rect(bx, top + 18 - hgt, 2, hgt), `${m}2`).fill(rect(bx, top + 18 - hgt, 1, hgt), `${m}3`);
    bx += 2;
  }
  // A bag hanging from a hook.
  s.fill(rect(x + 6, top + 23, 1, 2), 'st2');
  s.mass(soft(x + 3, top + 25, 8, 10, 2.5), 'tc');
  s.fill(rect(x + 4, top + 29, 6, 1), 'tc1');
  // The sticker on the back wall.
  s.fill(rect(x + 3, top + 40, 6, 6), 'ac2').fill(textPixels('P', x + 5, top + 40).points, 'pp4');
  // The door stands open towards us on the left, seen nearly edge-on.
  const strip: Pt[] = [];
  for (let i = 0; i < 4; i++) for (let y = top - 1 - i; y <= top + LH + i; y++) strip.push([x - 4 + i, y]);
  s.mass(strip, mat, { deep: true });
  for (const dy of [4, 8, LH - 8]) s.fill(rect(x - 3, top + dy, 2, 1), `${mat}0`);
  return s;
}

// ── The board ─────────────────────────────────────────────────────────────

function pin(s: Sprite, x: number, y: number, mat: string) {
  s.fill(rect(x, y, 2, 2), `${mat}2`).set(x, y, `${mat}4`).set(x + 1, y + 1, `${mat}0`);
}

function board(s: Sprite, x: number, y: number) {
  const w = 36;
  const h = 25;
  s.fill(dither(rect(x + 2, y + h, w, 2)), 'sh');
  s.mass(rect(x, y, w, h), 'dr', { deep: true });
  const inner = rect(x + 2, y + 2, w - 4, h - 4);
  s.fill(inner, 'ck2');
  for (const [px, py] of inner) {
    const n = noise(px, py);
    if (n < 0.12) s.set(px, py, 'ck1');
    else if (n > 0.92) s.set(px, py, 'ck3');
  }
  s.fill([...rect(x + 2, y + 2, w - 4, 1), ...rect(x + 2, y + 3, 1, h - 5)], 'ck1');

  // The timetable: a header and coloured lessons.
  const tx = x + 4;
  const ty = y + 5;
  s.fill(dither(rect(tx + 1, ty + 1, 17, 15)), 'sh');
  s.fill(rect(tx, ty, 17, 15), 'pp3').fill(rect(tx + 16, ty + 1, 1, 14), 'pp1').fill(rect(tx + 1, ty + 14, 16, 1), 'pp1');
  s.fill(rect(tx, ty, 17, 2), 'ac2');
  const lessons = [
    ['la', 'lb', '', 'lc'],
    ['ld', 'la', 'lb', 'la'],
    ['lc', '', 'ld', 'lb'],
    ['lb', 'lc', 'la', ''],
  ];
  lessons.forEach((row, r) => row.forEach((m, c) => {
    if (m) s.fill(rect(tx + 1 + c * 4, ty + 3 + r * 3, 3, 2), `${m}2`);
  }));
  pin(s, tx + 7, ty - 1, 'rd');

  // The Mensa menu: a plate with today's dish, fork and knife.
  const mx = x + 22;
  const my = y + 6;
  s.fill(dither(rect(mx + 1, my + 1, 12, 12)), 'sh');
  s.fill(rect(mx, my, 12, 12), 'pp3').fill(rect(mx + 11, my + 1, 1, 11), 'pp1').fill(rect(mx + 1, my + 11, 11, 1), 'pp1');
  s.fill(rect(mx + 2, my + 2, 8, 1), 'rd3');
  s.fill(disc(mx + 6, my + 7, 3.2), 'st3').fill(disc(mx + 6, my + 7, 1.9), 'gd2').set(mx + 6, my + 7, 'gn2').set(mx + 5, my + 6, 'gd4');
  s.fill(rect(mx + 1, my + 5, 1, 5), 'st1').fill(rect(mx + 10, my + 5, 1, 5), 'st1');
  pin(s, mx + 5, my - 1, 'ac');

}

// ── Door, sign, clock ───────────────────────────────────────────────

/** The door's frame, and room 2B behind it (seen when the door is open). */
function doorFrame(s: Sprite, x: number, floor: number) {
  const h = 60;
  const top = floor - h;
  s.mass(rect(x - 2, top - 2, 29, h + 2), 'st', { deep: true });
  // The room beyond: its warm wall, a lamp, a bit of the chalkboard, the
  // rail, the sage band and the parquet (components/pixel/classroom.ts).
  s.fill(rect(x, top, 25, h), 'cw2');
  s.fill(dither(rect(x, top, 25, 2)), 'cw1');
  s.fill(rect(x + 12, top, 1, 3), 'st1');
  s.mass(rect(x + 9, top + 3, 7, 2), 'wf', { outline: false });
  s.fill(rect(x + 10, top + 5, 5, 1), 'gd4');
  s.fill(rect(x + 6, top + 13, 19, 18), 'wd1');
  s.fill(rect(x + 7, top + 14, 18, 16), 'cb2');
  s.fill([[x + 9, top + 17], [x + 10, top + 17], [x + 11, top + 17], [x + 13, top + 17], [x + 14, top + 17], [x + 9, top + 20], [x + 10, top + 20], [x + 12, top + 20], [x + 13, top + 20], [x + 14, top + 20], [x + 15, top + 20], [x + 16, top + 20]], 'pp3');
  s.fill(rect(x + 6, top + 31, 19, 1), 'wd2');
  s.fill(rect(x, floor - 31, 25, 1), 'wd3').fill(rect(x, floor - 30, 25, 1), 'wd1');
  s.fill(rect(x, floor - 29, 25, 17), 'cl2');
  for (let y = floor - 12; y < floor; y++) {
    for (let i = 0; i < 25; i++) {
      const joint = (y - floor) % 4 === 0 || (i + Math.floor((y - floor + 12) / 4) * 5) % 9 === 0;
      s.set(x + i, y, joint ? 'pq1' : 'pq2');
    }
  }
  // A desk in there, and its chair.
  s.mass(rect(x + 1, floor - 17, 13, 2), 'wd', { outline: false });
  s.fill([...rect(x + 2, floor - 15, 1, 8), ...rect(x + 12, floor - 15, 1, 8)], 'st1');
  s.mass(soft(x + 15, floor - 19, 7, 5, 1.2), 'lb', { outline: false });
  s.fill([...rect(x + 16, floor - 14, 1, 7), ...rect(x + 20, floor - 14, 1, 7)], 'st1');
}

/**
 * The door itself, hinged on the left. Shut it is drawn in full; opening it
 * turns away into the room, so it gets narrower and its far edge shorter.
 */
function doorLeaf(x: number, floor: number, width: number, pressed = false): Sprite {
  const s = new Sprite();
  const h = 60;
  const top = floor - h;
  if (width >= 25) {
    s.mass(rect(x, top, 25, h), 'dr', { deep: true });
    // Frosted glass above, a raised panel below.
    s.fill(rect(x + 5, top + 6, 15, 17), 'pp1');
    s.fill([...rect(x + 5, top + 6, 15, 1), ...rect(x + 5, top + 6, 1, 17)], 'dr0');
    for (let i = 0; i < 6; i++) s.fill([[x + 8 + i, top + 19 - i], [x + 9 + i, top + 19 - i]], 'pp3');
    s.fill([...rect(x + 5, top + 29, 15, 1), ...rect(x + 5, top + 29, 1, 22)], 'dr1');
    s.fill([...rect(x + 5, top + 51, 15, 1), ...rect(x + 20, top + 29, 1, 23)], 'dr3');
    if (pressed) s.mass([[x + 20, top + 32], [x + 21, top + 33], [x + 22, top + 34]], 'gd');
    else s.mass(rect(x + 20, top + 32, 3, 2), 'gd');
    s.set(x + 21, top + 36, 'ik2');
    s.mass(rect(x + 1, floor - 6, 23, 5), 'st');
    return pressed ? ajarCrack(s, x, top, floor) : s;
  }
  const inset = Math.round((25 - width) / 7);
  const pts: Pt[] = [];
  const glass: Pt[] = [];
  for (let i = 0; i < width; i++) {
    const d = Math.round((inset * i) / Math.max(1, width - 1));
    for (let y = top + d; y < floor - d; y++) pts.push([x + i, y]);
    if (width > 6 && i >= Math.round(width * 0.2) && i < Math.round(width * 0.8)) for (let y = top + 6 + d; y < top + 23 - d; y++) glass.push([x + i, y]);
  }
  s.mass(pts, 'dr', { deep: true });
  s.fill(glass, 'pp1');
  if (width > 9) s.mass(rect(x + Math.round(width * 0.8), top + 32, 2, 2), 'gd');
  return s;
}

/**
 * The shut door turned a crack into the room: its face three columns
 * narrower, the far edge a pixel shorter at the top and the bottom (it is
 * further away now), the edge of the door itself showing, and the lit room
 * through the slit, its light on the hallway's floor.
 */
function ajarCrack(shut: Sprite, x: number, top: number, floor: number): Sprite {
  const s = new Sprite();
  // Three columns of the face drop out (between the details), the rest closes up.
  const drop = [x + 3, x + 12, x + 24];
  for (const [k, tone] of shut.cells) {
    const [px, py] = k.split(',').map(Number);
    if (drop.includes(px) || px > x + 24) continue;
    s.set(px - drop.filter((d) => d < px).length, py, tone);
  }
  const edge = x + 22;
  // Further away, the far end is shorter: a pixel off its top and its bottom.
  for (let px = x + 17; px <= edge; px++) {
    s.set(px, top - 1, null).set(px, top, 'dr0');
    s.set(px, floor, null).set(px, floor - 1, 'dr0');
  }
  // The edge of the door itself, then the slit with the lit room behind it.
  s.fill(rect(edge, top + 1, 1, floor - top - 2), 'dr1');
  s.fill(rect(edge + 1, top + 1, 1, floor - top - 2), 'gd4');
  s.fill(rect(edge + 2, top + 1, 1, floor - top - 2), 'gd3');
  // Its light on the hallway's floor, widening towards us.
  s.fill(rect(edge, floor, 4, 1), 'lit');
  s.fill(dither(rect(edge - 1, floor + 1, 6, 1)), 'lit');
  s.fill(dither(rect(edge - 2, floor + 2, 8, 1), 1), 'lit');
  return s;
}

function lightSpill(x: number, floor: number, h: number): Sprite {
  const s = new Sprite();
  for (let y = floor; y < Math.min(h, floor + 14); y++) {
    const grow = Math.floor((y - floor) / 1.6);
    s.fill(dither(rect(x - grow, y, 25 + grow * 2, 1)), 'lit');
  }
  return s;
}

/** The door of room 2B with its frame drawn into `back`, its floor at row `floor`. */
export function doorway(back: Sprite, x: number, floor: number, h: number): Doorway {
  doorFrame(back, x, floor);
  return {
    box: [x - 2, floor - 62, 29, 62],
    centre: [x + 12.5, floor - 30],
    shut: doorLeaf(x, floor, 25),
    hover: doorLeaf(x, floor, 25, true),
    ajar: [doorLeaf(x, floor, 17), doorLeaf(x, floor, 9)],
    open: doorLeaf(x, floor, 3),
    spill: lightSpill(x, floor, h),
  };
}

function sign(s: Sprite, x: number, y: number, text: string) {
  const t = textPixels(text, x + 3, y + 2);
  s.mass(soft(x, y, t.width + 6, 9, 1.5), 'pp');
  s.fill(t.points, 'ac2');
}

export function clockFace(s: Sprite, cx: number, cy: number) {
  s.mass(minus(disc(cx, cy, 7), disc(cx, cy, 5.6)), 'ik', { round: [cx, cy] });
  s.fill(disc(cx, cy, 5.6), 'pp3');
  s.fill(minus(disc(cx, cy, 5.6), disc(cx - 0.6, cy - 0.6, 5.2)), 'pp1');
  for (const [dx, dy] of [[0, -5], [4, -0.5], [0, 4], [-5, -0.5]]) s.set(Math.floor(cx + dx), Math.floor(cy + dy), 'ik2');
}

/** The hands of the clock at the given time. */
export function clockHands(cx: number, cy: number, hours: number, minutes: number): Sprite {
  const s = new Sprite();
  const hand = (turn: number, len: number) => {
    const a = turn * Math.PI * 2 - Math.PI / 2;
    return line(Math.floor(cx), Math.floor(cy), Math.floor(cx) + Math.round(Math.cos(a) * len), Math.floor(cy) + Math.round(Math.sin(a) * len));
  };
  s.fill(hand(((hours % 12) + minutes / 60) / 12, 2.6), 'ik2');
  s.fill(hand(minutes / 60, 4.2), 'ik2');
  s.set(Math.floor(cx), Math.floor(cy), 'rd2');
  return s;
}

// ── Windows ──────────────────────────────────────────────────────────────

function windowFrame(s: Sprite, x: number, y: number) {
  s.mass(rect(x, y, 30, 24), 'wf', { deep: true });
  s.mass(rect(x - 2, y + 24, 34, 2), 'wf', { deep: true });
  s.fill(dither(rect(x - 1, y + 27, 33, 1)), 'sh');
}

function panesOf(x: number, y: number): Array<[number, number, number, number]> {
  return [[x + 2, y + 2, 12, 6], [x + 16, y + 2, 12, 6], [x + 2, y + 10, 12, 12], [x + 16, y + 10, 12, 12]];
}

// ── The scene ────────────────────────────────────────────────────────────

export function buildHallway(w: number, h: number): Hallway {
  const floor = h - FLOOR;
  // The door (from cx + 50 to cx + 80) always stays in view.
  const cx = Math.max(24, Math.min(Math.round(w * 0.4), w - 84));
  const back = new Sprite();

  // The wall, the band below the rail, the skirting.
  back.fill(rect(0, 0, w, floor), 'wl2');
  back.fill(rect(0, floor - 28, w, 28), 'ws2');
  back.fill(rect(0, floor - 30, w, 1), 'wl3').fill(rect(0, floor - 29, w, 1), 'ws0').fill(rect(0, floor - 28, w, 1), 'ws3');
  back.fill(rect(0, floor - 2, w, 1), 'ws1').fill(rect(0, floor - 1, w, 1), 'ws0');

  // The floor: tiles growing towards the viewer, their joints running to a point far above.
  const rows = [0, 3, 7, 12, 18, 25, 33];
  for (let y = floor; y < h; y++) {
    const rel = y - floor;
    const band = rows.findIndex((r, i) => rel >= r && rel < (rows[i + 1] ?? 999));
    const scale = 10 + rel * 0.55;
    for (let x = 0; x < w; x++) {
      const u = (x - cx + 0.5) / scale;
      const col = Math.floor(u);
      let tone = (col + band) % 2 === 0 ? 'fl2' : 'fl3';
      if (rows.includes(rel) || u - col < 1 / scale) tone = 'fl0';
      back.set(x, y, tone);
    }
  }

  // Lockers from just left of the mascot to the left edge; the one nearest it is the open one.
  const lockerTop = floor - 3 - LH;
  // One window above them.
  const winY = lockerTop - 32;
  const winX = cx - 62;
  windowFrame(back, winX, winY);
  const panes = panesOf(winX, winY);
  const lockerRight = cx - 12;
  const count = Math.ceil((lockerRight + LW) / (LW + 1)) + 1;
  const firstX = lockerRight - LW - (count - 1) * (LW + 1);
  back.mass(rect(firstX - 1, floor - 3, lockerRight - firstX + 1, 3), 'st', { deep: true });
  let special: { x: number; mat: string } | null = null;
  for (let i = 0; i < count; i++) {
    const x = firstX + i * (LW + 1);
    const mat = LOCKER_TONES[(i + 400) % LOCKER_TONES.length];
    if (i === count - 1) special = { x, mat };
    lockerDoor(back, x, lockerTop, mat);
  }
  const lockerShut = new Sprite();
  lockerDoor(lockerShut, special!.x, lockerTop, special!.mat);
  const lockerOpen = lockerOpenAt(special!.x, lockerTop, special!.mat);

  board(back, cx + 8, floor - 66);
  const doorX = cx + 52;
  const doorParts = doorway(back, doorX, floor, h);
  sign(back, doorX + 6, floor - 73, '2B');
  const clock: Pt = [cx + 26.5, floor - 76];
  clockFace(back, clock[0], clock[1]);

  // The window by day: sky getting lighter downwards, tree tops below.
  const day = new Sprite();
  const night = new Sprite();
  const stars = new Sprite();
  for (const [px, py, pw, ph] of panes) {
    for (let y = py; y < py + ph; y++) {
      const t = (y - winY) / 22;
      day.fill(rect(px, y, pw, 1), t < 0.3 ? 'sk2' : t < 0.75 ? 'sk3' : 'sk4');
      night.fill(rect(px, y, pw, 1), t < 0.45 ? 'nt1' : 'nt2');
    }
    if (ph > 8) {
      for (let x = px; x < px + pw; x++) {
        const top = py + ph - 3 - Math.round(1.6 * Math.abs(Math.sin(x * 0.55)) + noise(x, 3) * 1.2);
        for (let y = top; y < py + ph; y++) {
          day.set(x, y, y === top ? 'gn3' : 'gn2');
          night.set(x, y, 'nt0');
        }
      }
    }
    for (let i = 0; i < 3; i++) {
      const sx = px + Math.floor(noise(px, i) * pw);
      const sy = py + Math.floor(noise(i, px) * Math.max(1, ph - 5));
      (i === 0 ? stars : night).set(sx, sy, 'pp4');
    }
  }
  // The moon in the top right pane.
  const [mx, my] = panes[1];
  night.fill(minus(disc(mx + 8, my + 3.5, 2.6), disc(mx + 9.2, my + 2.8, 2.2)), 'gd3');

  const clouds = new Sprite();
  for (let i = 0, x = 0; x < w * 2 + CLOUD_LOOP; i++, x += CLOUD_LOOP / 4) {
    const cy = winY + 4 + Math.floor(noise(i % 4, 9) * 8);
    clouds.mass([...disc(x + 4, cy + 1.5, 2.2), ...disc(x + 8, cy, 3), ...disc(x + 12, cy + 1.5, 2.2), ...rect(x + 3, cy + 1, 10, 3)], 'pp', { outline: false });
  }

  return {
    w, h, floor, cx,
    mascot: [cx - Math.floor(MW / 2), floor + 12 - FEET],
    back, day, night, clouds, stars, panes, lockerOpen, lockerShut, clock,
    door: doorParts,
  };
}

// ── Speech bubbles and signs above the head ──────────────────────────────

/**
 * Text broken into lines of at most `maxWidth` pixels of the 3 × 5 font, at
 * the spaces; a word longer than a line (a long user name) is split over
 * lines, and after `maxLines` the rest ends in "…".
 */
export function wrapText(text: string, maxWidth: number, maxLines = 3): string[] {
  const width = (t: string) => textPixels(t).width;
  const lines: string[] = [];
  let line = '';
  const flush = () => { if (line) lines.push(line); line = ''; };
  for (const word of text.split(/\s+/).filter(Boolean)) {
    // A word breaks after its own separators first ("anna-maria." → "anna-", "maria.").
    word.split(/(?<=[-._/])/).forEach((part, i) => {
      const joined = line ? `${line}${i === 0 ? ' ' : ''}${part}` : part;
      if (width(joined) <= maxWidth) { line = joined; return; }
      flush();
      let rest = part;
      while (width(rest) > maxWidth) {
        let cut = rest.length - 1;
        while (cut > 1 && width(rest.slice(0, cut)) > maxWidth) cut -= 1;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    });
  }
  flush();
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1].replace(/[-._/]$/, '');
    while (last.length > 1 && width(`${last}…`) > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines.length ? lines : [''];
}

/** Line pitch of the bubble text: the 5-pixel font and a pixel between lines. */
const LINE = 6;

/**
 * A speech bubble with text in capitals; the tail points down-left to (x, y).
 * Text wider than `maxWidth` pixels goes on more lines and the bubble grows
 * upwards, the tail staying where it is.
 */
export function bubble(text: string, x: number, y: number, maxWidth = Infinity): Sprite {
  const lines = wrapText(text, maxWidth);
  const widths = lines.map((l) => textPixels(l).width);
  const bw = Math.max(...widths) + 8;
  const bh = lines.length * LINE + 5;
  const bx = x + 2;
  const by = y - 2 - bh;
  const s = new Sprite();
  s.mass([...soft(bx, by, bw, bh, 3), [x + 3, y - 2], [x + 4, y - 2], [x + 2, y - 1], [x + 3, y - 1], [x + 1, y]], 'pp');
  // A firm outline, so it reads over the busy wall.
  for (const [k, tone] of s.cells) {
    if (tone !== 'pp0') continue;
    const [px, py] = k.split(',').map(Number);
    s.set(px, py, 'ik2');
  }
  // Each line centred in the bubble.
  lines.forEach((l, i) => {
    const t = textPixels(l, 0, 0);
    const lx = bx + 4 + Math.floor((bw - 8 - widths[i]) / 2);
    s.fill(t.points.map(([px, py]) => [px + lx, py + by + 3 + i * LINE] as Pt), 'ik2');
  });
  return s;
}

/** The topmost row a sprite reaches (for room above it). */
export function topOf(s: Sprite): number {
  let top = Infinity;
  for (const k of s.cells.keys()) top = Math.min(top, Number(k.split(',')[1]));
  return Number.isFinite(top) ? top : 0;
}

/** A sign above the head: '!' or '?'. */
export function mark(kind: '!' | '?', x: number, y: number): Sprite {
  const rows = kind === '!'
    ? ['##', '##', '##', '##', '..', '##']
    : ['.###.', '##.##', '...##', '..##.', '.....', '..##.'];
  const pts: Pt[] = [];
  rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') pts.push([x + i, y + j]); }));
  return new Sprite().mass(pts, 'gd');
}

/** The anger sign of comics (a throbbing vein) beside the head. */
export function anger(x: number, y: number): Sprite {
  return new Sprite().mass(grid(['..#.#..', '.##.##.', '##...##', '.......', '##...##', '.##.##.', '..#.#..'], x, y), 'rd');
}

/** A puff of steam rising off the head: a bigger cloud and a small one above it. */
export function steam(x: number, y: number): Sprite {
  return new Sprite().mass([...disc(x + 2.5, y + 4, 2.6), ...disc(x + 5, y + 3.2, 2), ...disc(x + 1.2, y + 0.4, 1.3)], 'pp');
}

/** A drop of sweat beside the head. */
export function sweat(x: number, y: number): Sprite {
  return new Sprite().mass([[x + 1, y], [x, y + 1], [x + 1, y + 1], [x, y + 2], [x + 1, y + 2], [x + 2, y + 2], [x + 1, y + 3]], 'wt').set(x, y + 1, 'wt4');
}

/** "…" in a small thought bubble. */
export function thinking(x: number, y: number): Sprite {
  const s = new Sprite().mass(soft(x, y, 13, 7, 2.5), 'pp').mass(rounded(x - 2, y + 7, 2, 2, 0), 'pp');
  s.fill([[x + 3, y + 3], [x + 6, y + 3], [x + 9, y + 3]], 'ik2');
  return s;
}

/** The scene with the mascot, for previews. */
export async function hallwayPreview(w: number, h: number, dark = false) {
  const { mascot, MASCOT_SHADOW } = await import('./mascot');
  const hw = buildHallway(w, h);
  const [mx, my] = hw.mascot;
  return {
    w, h,
    layers: [
      { name: 'back', sprite: hw.back },
      { name: dark ? 'night' : 'day', sprite: dark ? hw.night : hw.day },
      ...(dark ? [{ name: 'stars', sprite: hw.stars }] : []),
      { name: 'locker', sprite: hw.lockerOpen },
      { name: 'door', sprite: hw.door.shut },
      { name: 'hands', sprite: clockHands(hw.clock[0], hw.clock[1], 10, 8) },
      { name: 'shadow', sprite: MASCOT_SHADOW, dx: mx, dy: my },
      { name: 'mascot', sprite: mascot({ eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'wave' }), dx: mx, dy: my },
      { name: 'bubble', sprite: bubble('Hallo, Pfei-Eman!', mx + 30, my + 6) },
    ],
  };
}
