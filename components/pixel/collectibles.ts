import { Sprite, dither, disc, ellipse, grid, limb, line, minus, rect, soft, type Pt } from './sprite';

// The things of room 2B (./classroom.ts) as sprites: what the vending
// machine sells (12 × 12, drawn at the origin), how the mascot wears hats,
// glasses and the rest (in the mascot's own pixels, ./mascot.ts), the
// decorations as they stand in the room, a gold star (the room's tokens)
// and the icons of the tablet's games.

// ── Vending machine items (12 × 12) ─────────────────────────────────────

const ITEM_ART: Record<string, (s: Sprite) => void> = {
  pudding: (s) => {
    s.mass(ellipse(6, 10.4, 5.6, 1.4), 'pp', { outline: false });
    s.fill(rect(1, 11, 11, 1), 'pp0');
    s.mass(soft(2, 2, 9, 9, 3), 'gd', { deep: true });
    s.fill([...rect(4, 2, 5, 1), ...rect(3, 3, 7, 1), [3, 4], [5, 4], [6, 4], [9, 4], [5, 5], [9, 5]], 'or2').fill([[5, 2], [6, 2]], 'or3');
    s.set(4, 6, 'gd4');
  },
  gum: (s) => {
    s.mass(rect(1, 4, 9, 7), 'pp', { deep: true });
    s.fill(rect(1, 7, 9, 2), 'wt2').fill(rect(2, 7, 7, 1), 'wt3');
    s.mass(disc(9, 3.5, 2.8), 'pk', { round: [9, 3] });
    s.set(8, 2, 'pk4');
  },
  lemonade: (s) => {
    s.mass([...rect(5, 1, 2, 3), ...soft(3, 3, 6, 9, 2)], 'lc', { deep: true });
    s.fill(rect(5, 0, 2, 1), 'rd2');
    s.fill(rect(3, 6, 6, 3), 'gd3').fill(rect(4, 7, 4, 1), 'rd2');
    s.set(4, 4, 'pp4').set(4, 10, 'lc4');
  },
  partyhat: (s) => {
    const cone: Pt[] = [];
    for (let y = 2; y < 11; y++) for (let x = 6 - Math.floor((y - 1) / 2); x <= 6 + Math.floor((y - 1) / 2); x++) cone.push([x, y]);
    s.mass(cone, 'ld', { deep: true });
    for (const [x, y] of cone) if ((x + y) % 4 === 0) s.set(x, y, 'lb2');
    s.mass(disc(6.5, 1.5, 1.6), 'gd');
  },
  gradcap: (s) => {
    s.mass(rect(3, 6, 7, 4), 'ik', { deep: true });
    s.mass([...rect(1, 4, 11, 2), ...rect(3, 3, 7, 1), ...rect(3, 6, 7, 0)], 'ik', { deep: true });
    s.fill(rect(6, 4, 1, 1), 'gd3').fill([[7, 5], [8, 6], [9, 7], [9, 8], [9, 9]], 'gd2').set(9, 10, 'gd3');
  },
  headphones: (s) => {
    s.mass([...limb(2.5, 7, 3.5, 3, 0.8), ...limb(3.5, 3, 6, 1.6, 0.8), ...limb(6, 1.6, 8.5, 3, 0.8), ...limb(8.5, 3, 9.5, 7, 0.8)], 'ik', { outline: false });
    s.mass(soft(0, 6, 4, 6, 1.4), 'ld', { deep: true }).mass(soft(8, 6, 4, 6, 1.4), 'ld', { deep: true });
  },
  shades: (s) => {
    s.fill(rect(0, 5, 12, 1), 'ik2');
    s.mass(soft(0, 5, 5, 4, 1.4), 'ik', { outline: false }).mass(soft(7, 5, 5, 4, 1.4), 'ik', { outline: false });
    s.fill([[1, 6], [2, 5]], 'pp4').fill([[8, 6], [9, 5]], 'pp4');
  },
  stareyes: (s) => {
    s.mass(disc(3, 6, 3), 'pp').mass(disc(9, 6, 3), 'pp');
    const star = ['..#..', '#####', '.###.', '.#.#.'];
    s.fill(grid(star, 1, 4), 'gd2').fill(grid(star, 7, 4), 'gd2');
  },
  hearteyes: (s) => {
    const heart = ['.#.#.', '#####', '#####', '.###.', '..#..'];
    s.mass(grid(heart, 0, 4), 'rd').mass(grid(heart, 7, 4), 'rd');
    s.set(1, 5, 'rd4').set(8, 5, 'rd4');
  },
  plant: (s) => {
    s.mass(rect(3, 7, 6, 5), 'tc', { deep: true });
    s.fill(rect(3, 7, 6, 1), 'tc3');
    s.mass([...disc(6, 4, 2.8), ...disc(3.5, 5, 2), ...disc(8.5, 5, 2), ...disc(6, 1.5, 1.6)], 'gn', { round: [5, 3] });
  },
  lavalamp: (s) => lavaLamp(s, 3, 0, 0),
  lights: (s) => {
    for (let x = 0; x < 12; x++) s.set(x, 3 + Math.round(2 * Math.sin((x * Math.PI) / 11)), 'st1');
    ['gd', 'ld', 'lc', 'la'].forEach((m, i) => s.mass(rect(1 + i * 3, 5 + Math.round(2 * Math.sin(((1 + i * 3) * Math.PI) / 11)), 2, 3), m));
  },
  crown: (s) => {
    s.mass([...rect(1, 6, 10, 4), [1, 3], [1, 4], [1, 5], [5, 2], [6, 2], [5, 3], [6, 3], [5, 4], [6, 4], [5, 5], [6, 5], [10, 3], [10, 4], [10, 5], [3, 5], [8, 5]], 'gd', { deep: true });
    s.set(3, 8, 'rd3').set(6, 8, 'wt3').set(9, 8, 'lc3').set(5, 2, 'gd4');
  },
  disco: (s) => {
    s.fill(rect(6, 0, 1, 2), 'st1');
    const ball = disc(6.5, 7, 4.3);
    s.mass(ball, 'st', { round: [6.5, 7] });
    for (const [x, y] of ball) if ((x + y) % 2 === 0) s.set(x, y, (x * 3 + y) % 5 === 0 ? 'pp4' : 'st3');
    s.set(4, 4, 'pp4').set(10, 2, 'gd4').set(1, 9, 'wt4');
  },
  trophy: (s) => {
    s.mass([...rect(3, 1, 7, 5), ...rect(4, 6, 5, 1), ...rect(6, 7, 1, 2)], 'gd', { deep: true });
    s.fill([[2, 2], [1, 3], [2, 4], [10, 2], [11, 3], [10, 4]], 'gd1');
    s.mass(rect(3, 9, 7, 3), 'wd', { deep: true });
    s.set(4, 2, 'gd4');
  },
  duck: (s) => {
    s.mass([...ellipse(5.5, 8, 5, 3), ...disc(7.5, 4, 2.6)], 'gd', { round: [6, 5] });
    s.fill([[10, 4], [11, 4], [10, 5]], 'or2').set(8, 3, 'ik2');
  },
};

const itemCache = new Map<string, Sprite>();

/** The sprite of a vending machine item, 12 × 12 at the origin. */
export function itemSprite(id: string): Sprite {
  let s = itemCache.get(id);
  if (!s) {
    s = new Sprite();
    ITEM_ART[id]?.(s);
    itemCache.set(id, s);
  }
  return s;
}

export function lavaLamp(s: Sprite, x: number, y: number, frame: number) {
  s.mass([...rect(x + 1, y, 4, 1), ...rect(x + 2, y + 1, 2, 0)], 'st');
  const glass = [...rect(x + 1, y + 1, 4, 7), ...rect(x, y + 3, 6, 4)];
  s.mass(glass, 'ld', { deep: true });
  const blobs: Pt[] = frame ? [[x + 2, y + 2], [x + 3, y + 2], [x + 1, y + 5], [x + 2, y + 6]] : [[x + 3, y + 3], [x + 2, y + 4], [x + 3, y + 4], [x + 2, y + 7]];
  s.fill(blobs, 'or3');
  s.mass([...rect(x + 1, y + 8, 4, 1), ...rect(x, y + 9, 6, 3)], 'st', { deep: true });
}

// ── Worn by the mascot (its 40 × 37 pixels; the head's top is near row 1) ─

const WEAR_ART: Record<string, (s: Sprite) => void> = {
  partyhat: (s) => {
    const cone: Pt[] = [];
    for (let y = -11; y <= 1; y++) {
      const half = Math.floor((y + 12) / 2.4);
      const cx = 21 - Math.round(y * 0.09);
      for (let x = cx - half; x <= cx + half; x++) cone.push([x, y]);
    }
    s.mass(cone, 'ld', { deep: true });
    for (const [x, y] of cone) if ((x - y) % 4 === 0) s.set(x, y, 'lb2');
    s.mass(disc(22.5, -12, 1.8), 'gd');
  },
  gradcap: (s) => {
    s.mass(rect(14, -2, 13, 4), 'ik', { deep: true });
    const board: Pt[] = [];
    for (let y = -6; y <= -3; y++) for (let x = 9 - (y + 6); x <= 31 - (y + 6); x++) board.push([x, y + (x > 24 ? 0 : x < 16 ? 1 : 0)]);
    s.mass(board, 'ik', { deep: true });
    s.set(20, -5, 'gd3');
    s.fill([[21, -5], [24, -4], [27, -4], [29, -3], [30, -2], [30, -1], [30, 0], [30, 1]], 'gd2').fill([[29, 2], [30, 2], [31, 2], [30, 3]], 'gd3');
  },
  headphones: (s) => {
    s.mass([...limb(6, 8, 9, 0, 1), ...limb(9, 0, 15, -3.5, 1), ...limb(15, -3.5, 25, -4.5, 1), ...limb(25, -4.5, 31, -2, 1), ...limb(31, -2, 34.5, 5, 1)], 'ik', { outline: false });
    s.mass(soft(2, 8, 6, 9, 2.2), 'ld', { deep: true });
    s.mass(soft(32, 5, 6, 9, 2.2), 'ld', { deep: true });
    s.fill(rect(4, 10, 2, 5), 'ld1').fill(rect(34, 7, 2, 5), 'ld1');
  },
  crown: (s) => {
    const band = rect(13, -3, 15, 4).map(([x, y]) => [x, y + (x < 17 ? 1 : x > 24 ? -1 : 0)] as Pt);
    const points: Pt[] = [[13, -5], [13, -4], [14, -4], [19, -7], [20, -7], [20, -6], [19, -6], [19, -5], [20, -5], [19, -4], [20, -4], [26, -7], [27, -7], [27, -6], [26, -6], [26, -5], [27, -5]];
    s.mass([...band, ...points], 'gd', { deep: true });
    s.set(16, -1, 'rd3').set(20, -2, 'wt3').set(24, -3, 'lc3').set(19, -7, 'gd4');
  },
  shades: (s) => {
    s.fill([...line(5, 15, 11, 13), ...line(29, 11, 35, 9)], 'ik2');
    s.mass(soft(10, 9, 9, 6, 2), 'ik', { outline: false });
    s.mass(soft(20, 8, 9, 6, 2), 'ik', { outline: false });
    s.fill(rect(18, 10, 3, 1), 'ik2');
    s.fill([[12, 10], [13, 10], [12, 11]], 'pp4').fill([[22, 9], [23, 9], [22, 10]], 'pp4');
  },
};

const wearCache = new Map<string, Sprite>();

/** What the mascot wears, in its own pixels. */
export function wearSprite(id: string): Sprite | null {
  if (!WEAR_ART[id]) return null;
  let s = wearCache.get(id);
  if (!s) {
    s = new Sprite();
    WEAR_ART[id](s);
    wearCache.set(id, s);
  }
  return s;
}

// ── Decorations in the room (at their place from ./classroom.ts) ────────

/** The plant on the windowsill, its pot standing on (x, y). */
export function plantAt(x: number, y: number): Sprite {
  const s = new Sprite();
  s.mass(rect(x, y - 5, 7, 5), 'tc', { deep: true });
  s.fill(rect(x, y - 5, 7, 1), 'tc3');
  s.mass([...disc(x + 3.5, y - 9, 3.4), ...disc(x + 0.5, y - 7.5, 2.4), ...disc(x + 6.5, y - 7.5, 2.4), ...disc(x + 3, y - 13, 2.2), ...disc(x + 5.5, y - 12, 1.8)], 'gn', { round: [x + 2, y - 11] });
  return s;
}

/** The lava lamp on the teacher's desk, in two frames (its blobs rise). */
export function lampAt(x: number, y: number): [Sprite, Sprite] {
  return [0, 1].map((f) => { const s = new Sprite(); lavaLamp(s, x, y - 12, f); return s; }) as [Sprite, Sprite];
}

/** Fairy lights along the top of the board, in two frames (they twinkle). */
export function lightsAt(x: number, y: number, w = 84): [Sprite, Sprite] {
  const tones = ['gd', 'ld', 'lc', 'la', 'wt'];
  return [0, 1].map((f) => {
    const s = new Sprite();
    for (let i = 0; i < w; i++) s.set(x + i, y - 1 + Math.round(2.2 * Math.sin((i * Math.PI) / 21) ** 2), 'st1');
    for (let i = 3, k = 0; i < w - 2; i += 6, k++) {
      const by = y + Math.round(2.2 * Math.sin((i * Math.PI) / 21) ** 2);
      const m = tones[k % tones.length];
      s.fill([[x + i, by], [x + i + 1, by], [x + i, by + 1], [x + i + 1, by + 1]], (k + f) % 2 ? `${m}4` : `${m}2`);
    }
    return s;
  }) as [Sprite, Sprite];
}

/** The disco ball hanging from the ceiling at (x, top), and the spots of light it throws, in two frames. */
export function discoAt(x: number, top: number, room: { w: number; floor: number }): { ball: Sprite; spots: [Sprite, Sprite] } {
  const ball = new Sprite();
  ball.fill(rect(x, 0, 1, top + 1), 'st1');
  const d = disc(x + 0.5, top + 5, 4.4);
  ball.mass(d, 'st', { round: [x + 0.5, top + 5] });
  for (const [px, py] of d) if ((px + py) % 2 === 0) ball.set(px, py, (px * 3 + py) % 5 === 0 ? 'pp4' : 'st3');
  const tones = ['pk3', 'gd3', 'lc3', 'wt3', 'la3', 'or3'];
  const spots = [0, 1].map((f) => {
    const s = new Sprite();
    for (let i = 0; i < 46; i++) {
      const n = Math.sin((i + f * 23) * 91.7) * 43758.5;
      const sx = Math.floor((n - Math.floor(n)) * room.w);
      const m = Math.sin((i + f * 23) * 17.3) * 9631.1;
      const sy = Math.floor((m - Math.floor(m)) * (room.floor + 30));
      s.fill(rect(sx, sy, 2, 2), tones[i % tones.length]);
    }
    return s;
  }) as [Sprite, Sprite];
  return { ball, spots };
}

/** The trophy on the shelf, standing on (x, y). */
export function trophyAt(x: number, y: number): Sprite {
  const s = new Sprite();
  s.mass([...rect(x + 1, y - 9, 5, 4), ...rect(x + 2, y - 5, 3, 1), ...rect(x + 3, y - 4, 1, 1)], 'gd', { deep: true });
  s.fill([[x, y - 8], [x, y - 7], [x + 6, y - 8], [x + 6, y - 7]], 'gd1');
  s.mass(rect(x + 1, y - 3, 5, 3), 'wd', { deep: true });
  s.set(x + 2, y - 8, 'gd4');
  return s;
}

/** The rubber duck, standing on (x, y). */
export function duckAt(x: number, y: number): Sprite {
  const s = new Sprite();
  s.mass([...ellipse(x + 3.5, y - 2.5, 3.6, 2.2), ...disc(x + 5, y - 5.5, 1.9)], 'gd', { round: [x + 3, y - 4] });
  s.fill([[x + 7, y - 6], [x + 8, y - 6], [x + 7, y - 5]], 'or2').set(x + 5, y - 6, 'ik2');
  return s;
}

// ── The gold star: the room's tokens ─────────────────────────────────────

export const STAR = new Sprite().mass(grid(['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'], 0, 0), 'gd').set(3, 1, 'gd4');

// ── The tablet's games (12 × 12 icons) ──────────────────────────────────

const GAME_ART: Record<string, (s: Sprite) => void> = {
  memory: (s) => {
    s.mass(soft(0, 2, 7, 9, 1.2), 'la', { deep: true });
    s.mass(soft(5, 0, 7, 9, 1.2), 'pp', { deep: true });
    s.fill(grid(['.#.#.', '#####', '.###.', '..#..'], 6, 3), 'rd2');
  },
  maths: (s) => {
    s.mass(rect(0, 1, 12, 10), 'cb', { deep: true });
    s.fill(grid(['.#.....', '###.###', '.#.....', '.......', '#.#.###', '.#.....', '#.#.###'], 2, 2), 'pp3');
  },
  catch: (s) => {
    s.fill(line(2, 0, 6, 4), 'gd2').set(6, 4, 'ik2').set(1, 0, 'ld3');
    s.mass(soft(1, 6, 10, 6, 2), 'ac', { deep: true });
    s.fill([[4, 8], [7, 8]], 'pp4');
  },
  timetable: (s) => {
    s.mass(rect(0, 0, 12, 12), 'pp', { deep: true });
    s.fill(rect(1, 1, 10, 2), 'ac2');
    const cells: Array<[number, number, string]> = [[1, 4, 'la2'], [4, 4, 'lb2'], [7, 4, 'lc2'], [1, 7, 'ld2'], [4, 7, 'la2'], [7, 7, 'lb2']];
    for (const [x, y, t] of cells) s.fill(rect(x, y, 3, 2), t);
  },
  puzzle: (s) => {
    const piece = minus([...rect(1, 3, 8, 8), ...disc(5, 2, 1.8), ...disc(10, 7, 1.8)], disc(1, 7, 1.6));
    s.mass(piece, 'lc', { deep: true });
    s.fill(dither(rect(3, 5, 4, 4)), 'lc3');
  },
};

const gameCache = new Map<string, Sprite>();

export function gameIcon(id: string): Sprite {
  let s = gameCache.get(id);
  if (!s) {
    s = new Sprite();
    GAME_ART[id]?.(s);
    gameCache.set(id, s);
  }
  return s;
}

/** Everything side by side, for previews. */
export function collectiblesSheet() {
  const ids = Object.keys(ITEM_ART);
  const games = Object.keys(GAME_ART);
  const layers = [
    ...ids.map((id, i) => ({ name: id, sprite: itemSprite(id), dx: (i % 8) * 16, dy: Math.floor(i / 8) * 16 })),
    ...games.map((id, i) => ({ name: `g-${id}`, sprite: gameIcon(id), dx: i * 16, dy: 34 })),
    { name: 'star', sprite: STAR, dx: 84, dy: 36 },
  ];
  return { w: 128, h: 50, layers };
}
