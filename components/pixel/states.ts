import { Sprite, disc, dither, ellipse, grid, line, minus, rect, rounded, shift, type Pt, type Scene, type SceneLayer } from './sprite';

// The scenes of components/app/PixelState.tsx as sprites, 40 × 25 pixels:
// what stands on the ground stands on row 20 and casts a dithered shadow on
// rows 21–22. Layers that move are named after their animation (app CSS,
// .px-*).

export type PixelSprite = 'unplugged' | 'search' | 'lock' | 'empty' | 'holiday' | 'sun' | 'cancelled' | 'event' | 'swap';

export const W = 40;
export const H = 25;

const layer = (name: string, sprite: Sprite, cls: string[] = [], alt = false): SceneLayer => ({ name, sprite, cls, alt });

/** A soft shadow on the ground: a dithered ellipse with a denser middle. */
function shadow(s: Sprite, cx: number, cy: number, rx: number, ry = 1.2) {
  s.fill(dither(ellipse(cx, cy, rx, ry)), 'sh');
  s.fill(dither(ellipse(cx, cy, rx * 0.55, ry * 0.8)), 'shd');
  return s;
}

// ── unplugged: a plug reaching for its socket, sparks when it nearly gets there

function unplugged(): Scene {
  const wall = new Sprite();
  // The wall and the floor, faint.
  wall.fill(rect(37, 1, 1, 20), 'fn');
  wall.fill(dither(rect(0, 21, 40, 1), 1), 'fn');
  // The socket: a white box on the wall, two holes facing the plug.
  wall.mass(rounded(29, 6, 8, 13, 1), 'pp');
  for (const y of [9, 10, 14, 15]) { wall.set(28, y, 'ik0'); wall.set(29, y, 'ik3'); }
  wall.fill(rect(31, 8, 1, 9), 'pp1');
  wall.set(30, 7, 'pp4');

  const plug = new Sprite();
  shadow(plug, 15, 21.5, 6);
  // The cable: from the plug down to the floor and off to the left.
  plug.mass([...rect(-8, 19, 14, 2), ...rect(4, 13, 2, 6), ...rect(5, 11, 6, 2), [4, 12]], 'ik');
  // The body: rounded where the cable goes in, flat where the prongs are.
  plug.mass([...rounded(10, 7, 9, 11, 2), ...rect(15, 7, 4, 11)], 'ac', { deep: true });
  for (let y = 9; y <= 15; y++) { plug.set(12, y, 'ac1'); plug.set(13, y, 'ac3'); plug.set(15, y, 'ac1'); plug.set(16, y, 'ac3'); }
  plug.set(11, 8, 'ac4');
  plug.mass(rect(19, 9, 4, 2), 'st');
  plug.mass(rect(19, 14, 4, 2), 'st');

  const spark = (cx: number, cy: number) => new Sprite()
    .fill([[cx, cy - 1], [cx - 1, cy], [cx + 1, cy], [cx, cy + 1]], 'gd2')
    .fill([[cx, cy - 2], [cx - 2, cy], [cx + 2, cy], [cx, cy + 2]], 'gd3')
    .set(cx, cy, 'gd4');
  return {
    w: W, h: H,
    layers: [
      layer('wall', wall),
      layer('plug', plug, ['px-plug']),
      layer('spark', spark(26, 7), ['px-spark']),
      layer('spark-late', spark(27, 17), ['px-spark', 'px-spark-late']),
    ],
  };
}

// ── search: a magnifier going over a page and finding nothing

function search(): Scene {
  const page = new Sprite();
  // The sheet with its top right corner folded over.
  const sheet = minus(rect(5, 3, 27, 18), [[31, 3], [30, 3], [29, 3], [31, 4], [30, 4], [31, 5]]);
  page.fill(dither(shift(sheet, 1, 1)), 'sh');
  page.mass(sheet, 'pp');
  page.fill([[29, 4], [30, 5], [29, 5], [28, 4]], 'pp1').fill([[28, 3], [31, 6]], 'pp0').fill([[29, 3], [30, 4], [31, 5]], 'pp0');
  // A heading and lines of text.
  page.fill(rect(8, 6, 11, 2), 'ac3');
  for (const [y, runs] of [[10, [[8, 9], [19, 7]]], [13, [[8, 14], [24, 5]]], [16, [[8, 6], [16, 11]]]] as Array<[number, Array<[number, number]>]>) {
    for (const [x, n] of runs) page.fill(rect(x, y, n, 1), 'st1');
  }

  const lens = new Sprite();
  // Its shadow on the page, a little lower right.
  lens.fill(dither(disc(7.5, 8.5, 5.5)), 'sh');
  const ring = minus(disc(5.5, 5.5, 5.5), disc(5.5, 5.5, 3.6));
  lens.fill(disc(5.5, 5.5, 3.6), 'gl');
  lens.mass(ring, 'ac', { round: [5.5, 5.5] });
  lens.fill([[3, 3], [4, 3], [3, 4]], 'pp4');
  lens.mass([...line(9, 9, 12, 12), ...line(10, 9, 13, 12), ...line(9, 10, 12, 13)], 'wd');

  const mark = new Sprite().mass(grid(['.####.', '##..##', '....##', '...##.', '..##..', '..##..', '......', '..##..'], 32, 1), 'gd');
  return {
    w: W, h: H,
    layers: [layer('page', page), layer('lens', lens, ['px-lens']), layer('question', mark, ['px-question'])],
  };
}

// ── lock: a padlock whose shackle won't stay shut

function lock(): Scene {
  const base = shadow(new Sprite(), 20, 21.5, 9);
  const shackle = new Sprite().mass(grid([
    '...######...',
    '..########..',
    '.###....###.',
    '.##......##.',
    '.##......##.',
    '.##......##.',
    '.##......##.',
    '.##......##.',
  ], 14, 2), 'st', { deep: true });
  shackle.fill([[18, 2], [19, 2]], 'st4');
  const body = new Sprite().mass(rounded(12, 9, 16, 12, 2), 'ac', { deep: true });
  body.fill(rect(13, 11, 14, 1), 'ac3');
  // The keyhole.
  body.fill([...disc(20, 14, 1.6), ...rect(19, 15, 2, 3)], 'ik2').set(19, 13, 'ik3');
  const glint = new Sprite().fill([[24, 3], [23, 4], [25, 4], [24, 5]], 'gd3').set(24, 4, 'pp4');
  return {
    w: W, h: H,
    layers: [layer('ground', base), layer('shackle', shackle, ['px-shackle']), layer('body', body), layer('glint', glint, ['px-spark'])],
  };
}

// ── empty: a tumbleweed rolling past a cactus

function empty(): Scene {
  const land = new Sprite();
  // A long, low dune.
  const dune = ellipse(21, 23.6, 19, 3).filter(([, y]) => y >= 21);
  land.mass(dune, 'sd', { outline: false });
  land.fill(dither(dune.filter(([, y]) => y >= 23)), 'sd1');
  land.fill([[6, 22], [14, 23], [33, 22], [36, 23]], 'sd0');
  // The cactus, with its shadow to the right.
  land.fill(dither(rect(29, 20, 7, 2)), 'sh');
  const cactus = [
    ...rounded(24, 4, 5, 17, 2),
    ...rounded(19, 8, 4, 8, 1), ...rect(21, 13, 4, 3),
    ...rounded(30, 6, 4, 7, 1), ...rect(28, 10, 4, 3),
  ];
  land.mass(cactus, 'gn', { deep: true });
  for (let y = 6; y <= 19; y++) land.set(26, y, 'gn1');
  for (const [x, y] of [[25, 7], [27, 10], [25, 13], [27, 16], [20, 10], [31, 8]] as Pt[]) land.set(x, y, 'pp4');
  land.fill([[25, 3], [27, 3], [26, 2]], 'pk2').set(26, 3, 'gd2');

  // The weed: a ball of dry twigs in an 8 × 8 box, so it turns on the grid.
  const weed = new Sprite();
  const ball = minus(disc(4, 4, 3.9), [[2, 3], [3, 5], [5, 2], [5, 5], [4, 3], [2, 5]]);
  weed.mass(ball, 'wd', { round: [4, 4] });
  weed.fill([[3, 3], [4, 4], [5, 3], [2, 4]], 'wd1');
  const dust = new Sprite().fill([[-3, 7], [-5, 6], [-6, 7]], 'fn');
  return {
    w: W, h: H,
    layers: [
      layer('land', land),
      layer('dust', dust, ['px-tumble', 'px-blink']),
      layer('weed', shift2(weed, 0, 12), ['px-tumble', 'px-hop', 'px-turn']),
    ],
  };
}

/** The same sprite moved by (dx, dy). */
function shift2(s: Sprite, dx: number, dy: number) {
  return new Sprite().paste(s, dx, dy);
}

// ── holiday: sun, a beach umbrella, waves rolling in

function sunBall(s: Sprite, cx: number, cy: number, r: number) {
  s.mass(disc(cx, cy, r), 'gd', { round: [cx, cy] });
  return s;
}

function rays(cx: number, cy: number, r: number, long: boolean): Sprite {
  const s = new Sprite();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = Math.round(cx - 0.5 + Math.cos(a) * (r + (long ? 3 : 2)));
    const y = Math.round(cy - 0.5 + Math.sin(a) * (r + (long ? 3 : 2)));
    s.set(x, y, long ? 'gd3' : 'gd2');
  }
  return s;
}

function holiday(): Scene {
  const sky = new Sprite();
  sunBall(sky, 8, 7, 4.2);
  sky.fill([[6, 5], [7, 5], [6, 6]], 'gd4');

  const beach = new Sprite();
  // Sand on the right, the shore slanting down to the left.
  const sand: Pt[] = [];
  for (let y = 18; y < H; y++) for (let x = 40 - (y - 17) * 4 - 10; x < W; x++) sand.push([Math.max(x, 0), y]);
  beach.mass(sand.filter(([x], i, a) => a.findIndex(([x2, y2]) => x2 === x && y2 === a[i][1]) === i), 'sd', { outline: false });
  beach.fill(dither(sand.filter(([, y]) => y > 20), 1), 'sd1');
  // The umbrella: pole, red and white canopy with a scalloped hem.
  beach.fill(dither(rect(24, 20, 9, 1)), 'sh');
  beach.mass(rect(24, 6, 2, 15), 'st');
  const canopy = ellipse(24.5, 10.5, 11, 7).filter(([, y]) => y <= 10)
    .filter(([x, y]) => y < 10 || x % 3 !== 0);
  beach.mass(canopy, 'rd', { round: [24.5, 10.5] });
  beach.recolor(canopy.filter(([x]) => Math.floor((x - 13.5) / 4.5) % 2 === 1), 'rd', 'pp');
  beach.mass(rect(24, 2, 2, 2), 'gd');

  // Waves: two frames of crests, moving one pixel at a time.
  const water = new Sprite();
  const sea: Pt[] = [];
  for (let y = 20; y < H; y++) for (let x = -6; x < 46 - (y - 17) * 4 - 10; x++) sea.push([x, y]);
  water.mass(sea, 'wt', { outline: false, deep: true });
  for (let x = -6; x < 30; x += 6) water.fill([[x, 20], [x + 1, 20], [x + 2, 21], [x + 4, 22]], 'pp4');
  return {
    w: W, h: H,
    layers: [
      layer('sky', sky),
      layer('rays', rays(8, 7, 4.2, false)),
      layer('ray', rays(8, 7, 4.2, true), ['px-ray']),
      layer('beach', beach),
      layer('waves', water, ['px-waves']),
    ],
  };
}

// ── sun: a day without school, the sun in sunglasses, a cloud drifting by

function sun(): Scene {
  const body = sunBall(new Sprite(), 20, 11.5, 6.6);
  // Sunglasses and a smile.
  body.fill([...rect(15, 9, 4, 3), ...rect(21, 9, 4, 3), ...rect(19, 9, 2, 1)], 'ik2');
  body.fill([[15, 9], [21, 9]], 'ik3').set(16, 9, 'ik4').set(22, 9, 'ik4');
  body.fill([[17, 14], [18, 15], [19, 15], [20, 15], [21, 15], [22, 14]], 'gd0');
  body.fill([[16, 7], [17, 6], [16, 6]], 'gd4');
  const cloud = new Sprite().mass([...disc(4, 4.5, 2.6), ...disc(8, 3.5, 3.3), ...disc(11.5, 5, 2.4), ...rect(2, 5, 11, 2)], 'pp', { round: [7, 4] });
  return {
    w: W, h: H,
    layers: [
      layer('rays', rays(20, 11.5, 6.6, false)),
      layer('ray', rays(20, 11.5, 6.6, true), ['px-ray']),
      layer('body', body),
      layer('cloud', shift2(cloud, 0, 16), ['px-cloud']),
    ],
  };
}

// ── cancelled: a calendar page with a blinking red cross

function cancelled(): Scene {
  const cal = shadow(new Sprite(), 20, 21.5, 10);
  cal.mass(rounded(11, 6, 18, 15, 1), 'pp', { deep: true });
  cal.mass(rect(11, 6, 18, 4), 'ac');
  for (const x of [15, 24]) cal.mass(rect(x, 3, 2, 5), 'st');
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) cal.fill(rect(13 + col * 4, 11 + row * 3, 2, 2), 'pp1');
  const cross = new Sprite().mass([...line(15, 11, 24, 20), ...line(16, 11, 25, 20), ...line(24, 11, 15, 20), ...line(25, 11, 16, 20)], 'rd');
  return { w: W, h: H, layers: [layer('calendar', cal), layer('cross', cross, ['px-blink'])] };
}

// ── event: a flag in the wind

function flagFrame(phase: number): Sprite {
  const cloth: Pt[] = [];
  const stripe: Pt[] = [];
  for (let i = 0; i < 16; i++) {
    const off = Math.round(Math.sin(i / 4 + phase) * Math.min(1.4, i / 5));
    for (let j = 0; j < 9; j++) (j === 4 ? stripe : cloth).push([14 + i, 4 + off + j]);
  }
  const s = new Sprite().mass([...cloth, ...stripe], 'ac', { deep: true });
  // A light stripe across it.
  s.recolor(stripe, 'ac', 'pp');
  return s;
}

function event(): Scene {
  const ground = new Sprite();
  const mound = ellipse(13, 22.5, 8, 2.6).filter(([, y]) => y >= 20);
  ground.mass(mound, 'gn', { outline: false });
  ground.fill(dither(mound.filter(([, y]) => y >= 22)), 'gn1');
  ground.mass(rect(12, 3, 2, 18), 'st');
  ground.mass(disc(13, 2, 1.8), 'gd', { round: [13, 2] });
  const a = flagFrame(0);
  const b = flagFrame(Math.PI);
  return { w: W, h: H, layers: [layer('ground', ground), layer('flag', a, ['px-flag']), layer('flag-alt', b, ['px-flag', 'px-flag-alt'], true)] };
}

// ── swap: two arrows trading places (every lesson substituted)

function arrow(right: boolean, mat: string): Sprite {
  const rows = [
    '..............##....',
    '..............####..',
    '####################',
    '####################',
    '####################',
    '..............####..',
    '..............##....',
  ];
  const shape = grid(right ? rows : rows.map((r) => [...r].reverse().join('')));
  return new Sprite().mass(shape, mat, { deep: true });
}

function swap(): Scene {
  const ground = shadow(new Sprite(), 20, 21.5, 11);
  return {
    w: W, h: H,
    layers: [
      layer('ground', ground),
      layer('arrow-r', shift2(arrow(true, 'ac'), 8, 3), ['px-arrow-r']),
      layer('arrow-l', shift2(arrow(false, 'gd'), 12, 12), ['px-arrow-l']),
    ],
  };
}

const BUILDERS: Record<PixelSprite, () => Scene> = { unplugged, search, lock, empty, holiday, sun, cancelled, event, swap };
const built: Partial<Record<PixelSprite, Scene>> = {};

export function stateScene(sprite: PixelSprite): Scene {
  return (built[sprite] ??= BUILDERS[sprite]());
}
