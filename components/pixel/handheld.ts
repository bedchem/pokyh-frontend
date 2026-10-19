import { mascot } from './mascot';
import { Sprite, disc, dither, ellipse, grid, line, rect, soft, textPixels, type Pt } from './sprite';

// The tablet of room 2B turned into a little handheld (components/room/
// Handheld.tsx): a lilac body, the screen in a dark frame with "POKYH" and a
// light under it, a cross of arrows, A and B, SELECT and START, a speaker.
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

function button(s: Sprite, cx: number, cy: number, mat: string, label: string): Box {
  s.fill(dither(ellipse(cx + 1, cy + 6, 6, 1.2)), 'la1');
  s.mass(disc(cx, cy, 6.2), mat, { round: [cx, cy] });
  s.fill(textPixels(label, cx + 6, cy + 4).points, 'la1');
  return [cx - 7, cy - 7, 14, 14];
}

function pill(s: Sprite, x: number, y: number): Box {
  s.mass(soft(x, y, 12, 4, 2), 'la', { outline: true, deep: true });
  s.fill(rect(x + 2, y + 1, 8, 2), 'la1');
  return [x - 2, y - 3, 16, 10];
}

function speaker(s: Sprite, x: number, y: number) {
  for (let i = 0; i < 5; i++) s.fill(line(x + i * 3, y + 10, x + i * 3 + 6, y + 4), 'la1');
}

function bezel(s: Sprite, x: number, y: number): Box {
  s.mass(soft(x, y, 96, 82, 6), 'nt', { deep: true });
  s.fill(soft(x + 2, y + 2, 92, 78, 5), 'nt0');
  const label = textPixels('POKYH', 0, 0);
  s.fill(label.points.map(([px, py]) => [px + x + 48 - Math.floor(label.width / 2), py + y + 73] as Pt), 'la2');
  s.fill(rect(x + 6, y + 75, 2, 2), 'st1');
  return [x + 4, y + 4, 88, 66];
}

const cache = new Map<string, Handheld>();

export function handheld(layout: 'wide' | 'tall'): Handheld {
  const hit = cache.get(layout);
  if (hit) return hit;
  const body = new Sprite();
  let made: Handheld;
  if (layout === 'wide') {
    body.mass([...rect(18, -2, 24, 4), ...rect(134, -2, 24, 4)], 'la', { deep: true });
    body.mass(soft(0, 0, 176, 100, 18), 'la', { deep: true });
    body.fill(dither(rect(8, 92, 160, 2)), 'la1');
    const screen = bezel(body, 40, 6);
    const arrows = dpad(body, 22, 50);
    const a = button(body, 160, 44, 'ld', 'A');
    const b = button(body, 146, 58, 'lb', 'B');
    const select = pill(body, 70, 91);
    const start = pill(body, 94, 91);
    speaker(body, 142, 74);
    made = { w: 176, h: 100, body, led: new Sprite().fill(rect(46, 81, 2, 2), 'gn3'), screen, pads: { ...arrows, a, b, select, start } };
  } else {
    body.mass(soft(0, 0, 112, 158, 16), 'la', { deep: true });
    body.fill(dither(rect(8, 150, 96, 2)), 'la1');
    const screen = bezel(body, 8, 8);
    const arrows = dpad(body, 26, 114);
    const a = button(body, 91, 107, 'ld', 'A');
    const b = button(body, 76, 120, 'lb', 'B');
    const select = pill(body, 36, 139);
    const start = pill(body, 60, 139);
    speaker(body, 82, 134);
    made = { w: 112, h: 158, body, led: new Sprite().fill(rect(14, 83, 2, 2), 'gn3'), screen, pads: { ...arrows, a, b, select, start } };
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

/** Mascot puzzle: the picture (48 × 48), the mascot by the board of room 2B. */
export function puzzlePicture(): Sprite {
  const s = new Sprite();
  s.fill(rect(0, 0, 48, 30), 'cw2');
  s.mass(rect(4, 3, 40, 18), 'wd', { deep: true });
  s.fill(rect(6, 5, 36, 14), 'cb2');
  s.fill(textPixels('2B', 9, 7).points, 'pp3');
  s.fill([[30, 9], [31, 8], [32, 9], [33, 8], [34, 9], [35, 8]], 'pp3');
  s.fill(rect(0, 30, 48, 4), 'cl2');
  for (let y = 34; y < 48; y++) for (let x = 0; x < 48; x++) s.set(x, y, (y - 34) % 4 === 0 || (x + Math.floor((y - 34) / 4) * 5) % 9 === 0 ? 'pq1' : 'pq2');
  s.paste(mascot({ eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'cheer' }), 4, 10);
  return s;
}
