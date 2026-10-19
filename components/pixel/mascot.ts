import { Sprite, dither, disc, ellipse, limb, line, minus, rect, soft, type Pt } from './sprite';

// POKYH's mascot as a sprite, after the drawing it comes from: a soft indigo
// block, a little tilted, with big white eyes and dark upright pupils, pink
// blush under the eyes, a tiny smile, stubby arms at the lower sides and two
// short legs with round feet. 40 × 37 pixels, the feet on row 33, its shadow
// below. A pose is built from the eyes, where they look, a mouth and what the
// arms do; every pose is drawn once and kept.

export const MW = 40;
export const MH = 37;
/** The row the feet stand on. */
export const FEET = 33;

export type Eyes = 'open' | 'blink' | 'happy' | 'wide' | 'closed' | 'angry';
export type Mouth = 'smile' | 'grin' | 'o' | 'wobble' | 'flat' | 'frown';
export type Arms = 'down' | 'wave' | 'wave2' | 'wave3' | 'cover' | 'peek' | 'thumb' | 'lens' | 'cheer' | 'fists';

export interface Pose {
  eyes: Eyes;
  /** Where the pupils look: -1, 0 or 1 on each axis. */
  look: [number, number];
  mouth: Mouth;
  arms: Arms;
}

/** A rounded rectangle turned by `deg` about its middle, in whole pixels. */
function tilted(cx: number, cy: number, w: number, h: number, r: number, deg: number): Pt[] {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const out: Pt[] = [];
  const reach = Math.ceil(Math.hypot(w, h) / 2) + 1;
  for (let y = Math.floor(cy - reach); y <= Math.ceil(cy + reach); y++) {
    for (let x = Math.floor(cx - reach); x <= Math.ceil(cx + reach); x++) {
      // The pixel's centre, turned back into the rectangle's own frame.
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const u = Math.abs(dx * cos + dy * sin);
      const v = Math.abs(-dx * sin + dy * cos);
      const ex = Math.max(0, u - (w / 2 - r));
      const ey = Math.max(0, v - (h / 2 - r));
      if (u <= w / 2 && v <= h / 2 && Math.hypot(ex, ey) <= r) out.push([x, y]);
    }
  }
  return out;
}

/**
 * Drops what the turning leaves sticking out of the top: a row of the shape
 * only one to three pixels wide above a much wider one.
 */
function trimmed(shape: Pt[]): Pt[] {
  const rows = new Map<number, number>();
  for (const [, y] of shape) rows.set(y, (rows.get(y) ?? 0) + 1);
  const top = Math.min(...rows.keys());
  return (rows.get(top) ?? 0) <= 3 && (rows.get(top + 1) ?? 0) > 6 ? shape.filter(([, y]) => y !== top) : shape;
}

// The block leans a little to the left: its right side is higher.
const BODY = trimmed(tilted(20, 13.6, 27, 25.4, 8, -5));
const EYE_L: Pt = [15, 12.6];
const EYE_R: Pt = [24.6, 11.2];

// Stubby arms out of the lower sides, drawn behind the body so only the part
// outside it shows (never over the face); one raised beside the head for a
// wave (three positions: out, up, in towards the head), both up for a cheer.
const ARM_L = limb(7.4, 19.4, 4.4, 23.4, 2.6);
const ARM_R = limb(32.8, 17.8, 35.6, 21.8, 2.6);
const hand = (x0: number, y0: number, x1: number, y1: number) => [...limb(x0, y0, x1, y1, 2.4), ...disc(x1, y1, 2.9)];
const RAISED_R = hand(32.2, 13.4, 36.8, 9.4);
const RAISED_R2 = hand(32.2, 13.4, 35.8, 6.2);
const RAISED_R3 = hand(32.2, 13.4, 33.8, 4.2);
const CHEER_L = hand(9, 15.5, 4.2, 8.6);
const CHEER_R = hand(31, 14, 35.8, 7);
// Angry: both fists up beside the body, lower than a cheer.
const FIST_L = hand(8.6, 19, 4.4, 14.4);
const FIST_R = hand(31.6, 17.4, 35.8, 12.8);

function legs(s: Sprite) {
  // Short legs, the feet turned a little outwards.
  s.mass([...rect(13, 24, 5, 7), ...ellipse(14, 31, 3.9, 2)], 'ac', { deep: true });
  s.mass([...rect(22, 23, 5, 8), ...ellipse(26, 31, 3.9, 2)], 'ac', { deep: true });
}

function body(s: Sprite) {
  // Lit along the top and left edge, shaded along the right and bottom (the
  // shape's own light); nothing painted on the face.
  s.mass(BODY, 'ac', { deep: true });
}

function eye(s: Sprite, [cx, cy]: Pt, kind: Eyes, [lx, ly]: [number, number], right: boolean, big = false) {
  const x = Math.floor(cx);
  const y = Math.floor(cy);
  if (kind === 'blink') {
    s.fill(rect(x - 2, y + 1, 5, 1), 'pu0');
    return;
  }
  if (kind === 'closed') {
    // Shut tight: ◡
    s.fill([[x - 2, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1], [x + 2, y]], 'pu0');
    return;
  }
  if (kind === 'angry') {
    // Open, but a brow pushed down towards the middle cuts the top off.
    eye(s, [cx, cy], 'open', [lx, ly], right, big);
    const inward = right ? -1 : 1;
    for (let i = -4; i <= 4; i++) {
      const bx = x + i;
      const by = Math.round(y - 4 + (i * inward + 4) * 0.42);
      for (let yy = by - 1; yy >= y - 6; yy--) {
        const tone = s.get(bx, yy);
        if (tone?.startsWith('pp') || tone?.startsWith('pu')) s.set(bx, yy, 'ac2');
      }
      s.set(bx, by, 'pu0');
      s.set(bx, by - 1, 'pu0');
    }
    return;
  }
  if (kind === 'happy') {
    // Smiling eyes: ^, two pixels thick in the middle.
    s.fill([[x - 2, y + 1], [x - 1, y], [x, y - 1], [x + 1, y], [x + 2, y + 1], [x, y]], 'pu0');
    return;
  }
  // The white, the right one a touch bigger (it is nearer), and a big dark
  // upright pupil looking where the mascot looks.
  const grow = (right ? 0.2 : 0) + (kind === 'wide' || big ? 0.6 : 0);
  s.fill(ellipse(cx, cy, 3.7 + grow, 4.3 + grow), 'pp3');
  // A fixed pixel oval, so the pupil is clean wherever it looks.
  const px = Math.round(cx + 0.4 + lx * 1.2) - 2;
  const py = Math.round(cy - 0.3 + ly * 1.1) - 3;
  s.rows(['.11.', '1411', '1122', '2222', '2233', '.33.'], px, py, { 1: 'pu1', 2: 'pu2', 3: 'pu3', 4: 'pu4' });
}

function mouth(s: Sprite, kind: Mouth) {
  const m: Record<Mouth, () => void> = {
    smile: () => s.fill([[19, 17], [20, 18], [21, 18], [22, 17]], 'ac0'),
    flat: () => s.fill(rect(19, 18, 3, 1), 'ac0'),
    wobble: () => s.fill([[18, 18], [19, 17], [20, 18], [21, 17], [22, 18]], 'ac0'),
    o: () => s.fill([[20, 17], [21, 17], [20, 18], [21, 18]], 'pu0'),
    frown: () => s.fill([[18, 19], [19, 18], [20, 17], [21, 17], [22, 18], [23, 19]], 'pu0'),
    grin: () => {
      s.fill([...rect(18, 17, 5, 1), ...rect(19, 18, 3, 1)], 'pu0');
      s.set(20, 18, 'pk1');
    },
  };
  m[kind]();
}

function cheeks(s: Sprite, flushed = false) {
  for (const [cx, cy] of [[11.3, 18.6], [28.6, 17]] as Pt[]) {
    // Angry: red right across.
    s.fill(ellipse(cx, cy, flushed ? 3 : 2.4, flushed ? 1.5 : 1.2), flushed ? 'rd2' : 'pk2');
    s.set(Math.floor(cx) - 1, Math.floor(cy), flushed ? 'rd3' : 'pk3');
  }
}

/** A hand in front of the body, with its own outline. */
function mitt(s: Sprite, shape: Pt[], fingers: Pt[] = []) {
  s.mass(shape, 'ac', { deep: true });
  s.fill(fingers, 'ac1');
}

const cache = new Map<string, Sprite>();

export function mascot(pose: Pose): Sprite {
  const k = `${pose.eyes}/${pose.look.join(',')}/${pose.mouth}/${pose.arms}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const s = new Sprite();
  legs(s);
  const a = pose.arms;
  // Hanging arms go behind the body's outline (only what reaches out shows);
  // raised ones in front of its edge, so the waving hand is always seen.
  const raised = a === 'wave' ? [RAISED_R] : a === 'wave2' ? [RAISED_R2] : a === 'wave3' ? [RAISED_R3] : a === 'cheer' ? [CHEER_L, CHEER_R] : a === 'fists' ? [FIST_L, FIST_R] : [];
  const hanging = a === 'down' ? [ARM_L, ARM_R] : a === 'lens' || a === 'thumb' || a.startsWith('wave') ? [ARM_L] : [];
  for (const arm of hanging) mitt(s, arm);
  body(s);
  for (const arm of raised) mitt(s, arm);
  const lens = a === 'lens';
  eye(s, EYE_L, pose.eyes, pose.look, false);
  eye(s, EYE_R, pose.eyes, pose.look, true, lens && (pose.eyes === 'open' || pose.eyes === 'wide'));
  cheeks(s, pose.eyes === 'angry');
  mouth(s, pose.mouth);

  // Hands in front of the face or the body.
  if (a === 'cover' || a === 'peek') {
    // Hands flat over the eyes.
    mitt(s, [...limb(8.5, 20, 11, 16.5, 2.4), ...soft(11, 9, 8, 8, 3.5)], [[14, 9], [16, 9]]);
    if (a === 'cover') mitt(s, [...limb(32, 18.5, 29.5, 15, 2.4), ...soft(21, 7, 8, 8, 3.5)], [[23, 7], [25, 7]]);
    else mitt(s, [...limb(32, 19, 30.5, 18, 2.4), ...soft(26, 16, 7, 6, 2.5)]);
  } else if (a === 'thumb') {
    // A little fist on the right, thumb up.
    mitt(s, [...limb(32.5, 18, 31.5, 16.5, 2.4), ...soft(28, 12, 8, 7, 2.5)], [[30, 15], [31, 15], [32, 15], [33, 15]]);
    mitt(s, soft(29, 7, 3, 6, 1.4));
  } else if (lens) {
    // A magnifier held to the right eye: its glass makes the eye big.
    const [cx, cy] = EYE_R;
    s.fill(disc(cx, cy, 5.3), 'gl');
    s.mass(minus(disc(cx, cy, 6.7), disc(cx, cy, 5.3)), 'wd', { round: [cx, cy] });
    s.fill([[cx - 3.5, cy - 3], [cx - 2.5, cy - 4]].map(([x, y]) => [Math.floor(x), Math.floor(y)] as Pt), 'pp4');
    s.mass([...line(29, 16, 32, 19), ...line(30, 16, 33, 19)], 'wd');
    mitt(s, [...limb(33.5, 22, 33.5, 20.5, 2.4), ...soft(30, 18, 7, 6, 2.5)], [[32, 20], [33, 20]]);
  }
  cache.set(k, s);
  return s;
}

/** Its shadow on the floor, apart from the body so it stays down when the body hops. */
export const MASCOT_SHADOW = new Sprite().fill(dither(ellipse(20, 34.5, 15, 1.6)), 'sh').fill(dither(ellipse(20, 34.5, 9, 1.2), 1), 'shd');

/** All poses side by side, for previews. */
export function mascotSheet() {
  const poses: Pose[] = [
    { eyes: 'open', look: [1, 0], mouth: 'smile', arms: 'down' },
    { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'wave' },
    { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'wave2' },
    { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'wave3' },
    { eyes: 'open', look: [1, 0], mouth: 'o', arms: 'lens' },
    { eyes: 'closed', look: [0, 0], mouth: 'flat', arms: 'cover' },
    { eyes: 'open', look: [1, 1], mouth: 'o', arms: 'peek' },
    { eyes: 'wide', look: [0, 0], mouth: 'o', arms: 'down' },
    { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'thumb' },
    { eyes: 'open', look: [-1, 0], mouth: 'wobble', arms: 'down' },
    { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'cheer' },
    { eyes: 'angry', look: [0, 0], mouth: 'frown', arms: 'fists' },
  ];
  return {
    w: MW * poses.length, h: MH,
    layers: poses.flatMap((p, i) => [
      { name: `shadow-${i}`, sprite: MASCOT_SHADOW, dx: i * MW },
      { name: `pose-${i}`, sprite: mascot(p), dx: i * MW },
    ]),
  };
}
