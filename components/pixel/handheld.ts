import { mascot } from './mascot';
import { Sprite, disc, dither, ellipse, grid, limb, minus, rect, soft, textPixels, type Pt } from './sprite';

// The game console on a desk of room A+2/05, up close (components/room/
// Handheld.tsx): a lilac shell with its thickness showing along the bottom
// and shoulder buttons on top, the screen in a dark frame with "POKYH" and a
// power light, a cross of arrows in its round dip, A and B with their letters
// on them, SELECT and START with their names under them, a speaker grille.
// Lying wide on bigger screens, standing up on phones. The parts that can be
// pressed come with their boxes; the screen is a box the games fill. And the
// little sprites of the games themselves.

export type Box = [number, number, number, number];
export type Pad = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'select' | 'start';

export interface Handheld {
  w: number;
  h: number;
  body: Sprite;
  /** The light under the screen, on. */
  led: Sprite;
  screen: Box;
  pads: Record<Pad, Box>;
}

function dpad(s: Sprite, cx: number, cy: number): Record<'up' | 'down' | 'left' | 'right', Box> {
  // The round dip the cross sits in.
  s.fill(disc(cx + 0.5, cy + 0.5, 13.5), 'la1');
  s.fill(minus(disc(cx + 0.5, cy + 0.5, 13.5), disc(cx + 1.5, cy + 1.5, 13)), 'la0');
  s.mass([...rect(cx - 10, cy - 3, 21, 7), ...rect(cx - 3, cy - 10, 7, 21)], 'ik', { deep: true });
  s.fill(disc(cx + 0.5, cy + 0.5, 1.6), 'ik1');
  s.fill([[cx, cy - 8], [cx - 1, cy - 7], [cx, cy - 7], [cx + 1, cy - 7]], 'ik3');
  s.fill([[cx, cy + 8], [cx - 1, cy + 7], [cx, cy + 7], [cx + 1, cy + 7]], 'ik3');
  s.fill([[cx - 8, cy], [cx - 7, cy - 1], [cx - 7, cy], [cx - 7, cy + 1]], 'ik3');
  s.fill([[cx + 8, cy], [cx + 7, cy - 1], [cx + 7, cy], [cx + 7, cy + 1]], 'ik3');
  return {
    up: [cx - 3, cy - 10, 7, 7],
    down: [cx - 3, cy + 4, 7, 7],
    left: [cx - 10, cy - 3, 7, 7],
    right: [cx + 4, cy - 3, 7, 7],
  };
}

/** A round button with its letter pressed into the middle of it. */
function button(s: Sprite, cx: number, cy: number, mat: string, label: string): Box {
  s.fill(dither(ellipse(cx + 1, cy + 6.5, 6, 1.2)), 'la0');
  s.mass(disc(cx, cy, 6.2), mat, { round: [cx, cy] });
  const t = textPixels(label, 0, 0);
  s.fill(t.points.map(([px, py]) => [px + Math.floor(cx) - 1, py + Math.floor(cy) - 2] as Pt), `${mat}0`);
  return [cx - 7, cy - 7, 14, 14];
}

/** A rubber pill and its name under it (centred on the pill). */
function pill(s: Sprite, x: number, y: number, name: string): Box {
  s.mass(soft(x, y, 12, 4, 2), 'ik', { outline: true, deep: true });
  s.fill(rect(x + 2, y + 1, 8, 1), 'ik3');
  const t = textPixels(name, 0, 0);
  s.fill(t.points.map(([px, py]) => [px + x + 6 - Math.ceil(t.width / 2), py + y + 7] as Pt), 'la0');
  return [x - 2, y - 3, 16, 10];
}

/** Holes of the speaker, in rows that slide by one. */
function speaker(s: Sprite, x: number, y: number, rows: number, cols: number) {
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s.set(x + c * 3 + (r % 2), y + r * 3, 'la0').set(x + c * 3 + (r % 2) + 1, y + r * 3, 'la3');
}

function bezel(s: Sprite, x: number, y: number): Box {
  s.mass(soft(x, y, 96, 80, 7), 'nt', { deep: true });
  s.fill(soft(x + 2, y + 2, 92, 76, 6), 'nt0');
  const label = textPixels('POKYH', 0, 0);
  s.fill(label.points.map(([px, py]) => [px + x + 48 - Math.floor(label.width / 2), py + y + 70] as Pt), 'la2');
  return [x + 4, y + 4, 88, 62];
}

/** The shell: shoulder buttons behind, the bottom edge showing how thick it is, the face. */
function shell(s: Sprite, w: number, h: number, r: number, shoulders: number[]) {
  for (const x of shoulders) s.mass(soft(x, -3, 30, 8, 3), 'la', { deep: true });
  s.mass(soft(0, 2, w, h - 2, r), 'la', { deep: true });
  s.fill(soft(1, 3, w - 2, h - 4, r), 'la1');
  s.mass(soft(0, 0, w, h - 5, r), 'la', { deep: true });
}

const cache = new Map<string, Handheld>();

export function handheld(layout: 'wide' | 'tall'): Handheld {
  const hit = cache.get(layout);
  if (hit) return hit;
  const body = new Sprite();
  let made: Handheld;
  if (layout === 'wide') {
    shell(body, 176, 106, 20, [14, 132]);
    const screen = bezel(body, 40, 6);
    const arrows = dpad(body, 22, 48);
    // A and B in a dip slanting up to the right.
    body.fill(limb(149, 56, 163, 42, 9.5), 'la1');
    const a = button(body, 163, 42, 'ld', 'A');
    const b = button(body, 149, 56, 'lb', 'B');
    const select = pill(body, 66, 88, 'SELECT');
    const start = pill(body, 98, 88, 'START');
    speaker(body, 146, 74, 4, 6);
    made = { w: 176, h: 106, body, led: new Sprite().fill(rect(46, 77, 2, 2), 'gn3'), screen, pads: { ...arrows, a, b, select, start } };
  } else {
    shell(body, 112, 164, 16, [8, 74]);
    const screen = bezel(body, 8, 8);
    const arrows = dpad(body, 26, 112);
    body.fill(limb(76, 120, 92, 106, 9.5), 'la1');
    const a = button(body, 92, 106, 'ld', 'A');
    const b = button(body, 76, 120, 'lb', 'B');
    const select = pill(body, 30, 142, 'SELECT');
    const start = pill(body, 62, 142, 'START');
    speaker(body, 86, 136, 4, 6);
    made = { w: 112, h: 164, body, led: new Sprite().fill(rect(14, 79, 2, 2), 'gn3'), screen, pads: { ...arrows, a, b, select, start } };
  }
  cache.set(layout, made);
  return made;
}

// ── The games' sprites ───────────────────────────────────────────────────

/** Memory: the mascot's faces, cropped to the head (box -1 0 42 26). */
export const FACES: Array<{ id: string; sprite: Sprite }> = [
  ['smile', { eyes: 'open', mouth: 'smile' }],
  ['grin', { eyes: 'happy', mouth: 'grin' }],
  ['wow', { eyes: 'wide', mouth: 'o' }],
  ['angry', { eyes: 'angry', mouth: 'frown' }],
  ['stars', { eyes: 'stars', mouth: 'grin' }],
  ['love', { eyes: 'hearts', mouth: 'smile' }],
  ['sleep', { eyes: 'closed', mouth: 'flat' }],
  ['oops', { eyes: 'open', mouth: 'wobble', look: [0, 1] }],
].map(([id, p]) => {
  const pose = p as { eyes: 'open'; mouth: 'smile'; look?: [number, number] };
  return { id: id as string, sprite: mascot({ eyes: pose.eyes, mouth: pose.mouth, look: pose.look ?? [0, 0], arms: 'down' }) };
});

/** Pixel catch: the little mascot catching things (9 × 8), in two steps. */
export const CATCHER: [Sprite, Sprite] = [0, 1].map((f) => {
  const s = new Sprite();
  s.mass([...rect(1, 0, 7, 6), [0, 1], [0, 2], [0, 3], [0, 4], [8, 1], [8, 2], [8, 3], [8, 4]], 'ac', { outline: false });
  s.fill([[2, 2], [5, 2]], 'pp4').fill([[3, 2], [6, 2]], 'pu2');
  s.fill([[3, 4], [4, 4], [5, 4]], 'ac0');
  s.fill(f ? [[2, 6], [6, 7]] : [[2, 7], [6, 6]], 'ac1');
  return s;
}) as [Sprite, Sprite];

const FALLING: Record<string, string[]> = {
  pencil: ['......#', '.....##', '....##.', '...##..', '..##...', '.##....', '#......'],
  book: ['#######', '#.....#', '#######', '#######', '#######', '#######', '.......'],
  apple: ['...#...', '.##.##.', '#######', '#######', '#######', '.#####.', '..#.#..'],
  star: ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'],
  ink: ['..#....', '.###.#.', '#####..', '.######', '######.', '.####..', '...#...'],
  spider: ['#.....#', '.#...#.', '#.###.#', '.#####.', '#.###.#', '.#...#.', '#.....#'],
};
const FALL_TONES: Record<string, string> = { pencil: 'gd', book: 'wt', apple: 'rd', star: 'gd', ink: 'ik', spider: 'ik' };

export function fallingSprite(kind: string): Sprite {
  const s = new Sprite().mass(grid(FALLING[kind]), FALL_TONES[kind], { outline: false });
  if (kind === 'pencil') s.set(0, 6, 'ik2').set(6, 0, 'ld3');
  if (kind === 'book') s.fill(rect(1, 1, 5, 1), 'pp3');
  if (kind === 'apple') s.set(3, 0, 'gn2').set(2, 2, 'rd4');
  if (kind === 'star') s.set(3, 1, 'gd4');
  if (kind === 'spider') s.set(2, 2, 'rd3').set(4, 2, 'rd3');
  return s;
}

/** Mascot puzzle: the picture (48 × 48), the mascot by the board of room A+2/05. */
export function puzzlePicture(): Sprite {
  const s = new Sprite();
  s.fill(rect(0, 0, 48, 30), 'cw2');
  s.mass(rect(4, 3, 40, 18), 'wd', { deep: true });
  s.fill(rect(6, 5, 36, 14), 'cb2');
  s.fill(textPixels('A+2/05', 7, 7).points, 'pp3');
  s.fill([[30, 9], [31, 8], [32, 9], [33, 8], [34, 9], [35, 8]], 'pp3');
  s.fill(rect(0, 30, 48, 4), 'cl2');
  for (let y = 34; y < 48; y++) for (let x = 0; x < 48; x++) s.set(x, y, (y - 34) % 4 === 0 || (x + Math.floor((y - 34) / 4) * 5) % 9 === 0 ? 'pq1' : 'pq2');
  s.paste(mascot({ eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'cheer' }), 4, 10);
  return s;
}
