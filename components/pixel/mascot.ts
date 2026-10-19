import { Sprite, dither, disc, ellipse, limb, line, minus, outlineOf, rect, soft, type Pt } from './sprite';


// POKYH's mascot as a sprite: an indigo block with big eyes, pink cheeks,
// round mitts for hands and two stubby legs. 40 × 37 pixels, the feet on
// row 33, its shadow below. The mitts hang at the lower sides, each with its
// own outline over the body's edge. A pose is built from eyes, where they
// look, a mouth and what the arms do; every pose is drawn once and kept.

export const MW = 40;
export const MH = 37;
/** The row the feet stand on. */
export const FEET = 33;

export type Eyes = 'open' | 'blink' | 'happy' | 'wide' | 'closed';
export type Mouth = 'smile' | 'grin' | 'o' | 'wobble' | 'flat';
export type Arms = 'down' | 'wave' | 'wave2' | 'cover' | 'peek' | 'thumb' | 'lens' | 'cheer';

export interface Pose {
  eyes: Eyes;
  /** Where the pupils look: -1, 0 or 1 on each axis. */
  look: [number, number];
  mouth: Mouth;
  arms: Arms;
}

const BODY = soft(7, 3, 26, 24, 6.5);
const EYE_L: Pt = [15, 13.5];
const EYE_R: Pt = [25, 12.5];

// Mitts: hanging at the lower sides (bent a little outwards), raised beside
// the head for a wave (two frames), up high for a cheer.
const MITT_L = [...ellipse(7.2, 18.5, 3, 3.6), ...ellipse(6, 21.5, 3.3, 3.4)];
const MITT_R = MITT_L.map(([x, y]) => [39 - x, y] as Pt);
const RAISED_R = [...limb(30, 17, 33.2, 11.5, 2.4), ...ellipse(34, 9, 3.3, 3.7)];
const RAISED_R2 = [...limb(30, 17, 33.8, 13, 2.4), ...ellipse(35, 11, 3.3, 3.5)];
const CHEER_L = [...limb(10, 17, 6.6, 11.5, 2.4), ...ellipse(5.8, 9, 3.3, 3.7)];
const CHEER_R = CHEER_L.map(([x, y]) => [39 - x, y] as Pt);

function legs(s: Sprite) {
  for (const x of [12, 22]) s.mass([...rect(x, 25, 6, 5), ...soft(x - 1, 28, 8, 5, 2.4)], 'ac', { deep: true });
}

function body(s: Sprite) {
  s.mass(BODY, 'ac', { deep: true });
  // A shine on the top left corner.
  s.fill([[11, 5], [12, 5], [13, 5], [10, 6], [9, 7], [9, 8]], 'ac4');
}

function eye(s: Sprite, [cx, cy]: Pt, kind: Eyes, [lx, ly]: [number, number], big = false) {
  const x = Math.floor(cx);
  const y = Math.floor(cy);
  if (kind === 'blink' || kind === 'closed') {
    s.fill(rect(x - 2, y + 1, 5, 1), 'ac0');
    // Shut tight: the lids bend down at the ends.
    if (kind === 'closed') s.fill([[x - 3, y + 2], [x + 3, y + 2]], 'ac0');
    return;
  }
  if (kind === 'happy') {
    s.fill([[x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 2, y], [x + 2, y], [x - 3, y + 1], [x + 3, y + 1]], 'ac0');
    return;
  }
  const [rx, ry] = kind === 'wide' || big ? [4.2, 5] : [3.6, 4.4];
  const white = ellipse(cx, cy, rx, ry);
  s.fill(white, 'pp3');
  // Shaded along the lower right, outlined in the body's darkest tone.
  const inner = new Set(white.map(([px, py]) => `${px - 1},${py - 1}`));
  s.fill(white.filter(([px, py]) => !inner.has(`${px - 1},${py - 1}`) || !white.some(([a, b]) => a === px + 1 && b === py + 1)), 'pp1');
  s.fill(outlineOf(white), 'ac0');
  // The pupil, with a glint.
  const [pw, ph] = kind === 'wide' ? [2, 3] : big ? [4, 5] : [3, 4];
  const px = x - Math.floor(pw / 2) + lx * (kind === 'wide' ? 1 : 1);
  const py = y - Math.floor(ph / 2) + ly + (kind === 'wide' ? 0 : 1);
  s.fill(rect(px, py, pw, ph), 'ik2');
  s.fill(rect(px + pw - 1, py + ph - 1, 1, 1), 'ik3');
  s.set(px, py, 'pp4');
  if (big) s.set(px + 1, py, 'pp4');
}

function mouth(s: Sprite, kind: Mouth) {
  const m: Record<Mouth, () => void> = {
    smile: () => s.fill([[18, 19], [19, 20], [20, 20], [21, 20], [22, 19]], 'ac0'),
    flat: () => s.fill(rect(18, 20, 5, 1), 'ac0'),
    wobble: () => s.fill([[17, 20], [18, 19], [19, 20], [20, 19], [21, 20], [22, 19], [23, 20]], 'ac0'),
    o: () => s.fill([[19, 19], [20, 19], [18, 20], [21, 20], [19, 21], [20, 21]], 'ac0').fill([[19, 20], [20, 20]], 'ik2'),
    grin: () => {
      s.fill([...rect(17, 19, 7, 1), ...rect(18, 20, 5, 1), ...rect(19, 21, 3, 1)], 'ik2');
      s.fill([[19, 21], [20, 21], [21, 21], [20, 20]], 'pk1');
      s.fill([[16, 18], [24, 18]], 'ac0');
    },
  };
  m[kind]();
}

function cheeks(s: Sprite) {
  for (const [x, y] of [[9, 19], [28, 18]] as Pt[]) {
    s.fill(rect(x, y, 4, 2), 'pk2');
    s.fill([[x - 1, y + 1], [x + 4, y]], 'pk2');
    s.set(x, y, 'pk3');
  }
}

/** A mitt in front of the body, with its own outline. */
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
  // Raised arms go behind the head's outline, hanging ones over the body's edge.
  const raised = a === 'wave' ? [RAISED_R] : a === 'wave2' ? [RAISED_R2] : a === 'cheer' ? [CHEER_L, CHEER_R] : [];
  const hanging = a === 'down' ? [MITT_L, MITT_R] : a === 'lens' || a === 'thumb' || a === 'wave' || a === 'wave2' ? [MITT_L] : [];
  body(s);
  for (const arm of raised) mitt(s, arm);
  for (const arm of hanging) mitt(s, arm);
  const lens = a === 'lens';
  eye(s, EYE_L, pose.eyes, pose.look);
  eye(s, EYE_R, pose.eyes, pose.look, lens && (pose.eyes === 'open' || pose.eyes === 'wide'));
  cheeks(s);
  mouth(s, pose.mouth);

  // Hands in front of the face or the body.
  if (a === 'cover' || a === 'peek') {
    // Forearms from the sides up to the face, mitts flat over the eyes.
    mitt(s, [...limb(8, 22, 11, 17, 2.6), ...soft(10, 8, 10, 10, 4)], [[13, 8], [13, 9], [16, 8], [16, 9]]);
    if (a === 'cover') mitt(s, [...limb(32, 22, 29, 17, 2.6), ...soft(20, 7, 10, 10, 4)], [[23, 7], [23, 8], [26, 7], [26, 8]]);
    else mitt(s, [...limb(32, 23, 29, 21, 2.6), ...soft(24, 17, 8, 7, 3)]);
  } else if (a === 'thumb') {
    // A fist on the right, thumb up.
    mitt(s, [...limb(32, 21, 31, 19, 2.6), ...soft(28, 14, 9, 8, 3)], [[30, 18], [31, 18], [32, 18], [33, 18], [34, 18]]);
    mitt(s, soft(29, 8, 4, 8, 1.8));
  } else if (lens) {
    // A magnifier held to the right eye: its glass makes the eye big.
    const [cx, cy] = EYE_R;
    s.fill(disc(cx, cy, 5.4), 'gl');
    s.mass(minus(disc(cx, cy, 6.8), disc(cx, cy, 5.4)), 'wd', { round: [cx, cy] });
    s.fill([[cx - 4, cy - 3], [cx - 3, cy - 4], [cx - 2, cy - 5]].map(([x, y]) => [Math.floor(x), Math.floor(y)] as Pt), 'pp4');
    s.mass([...line(30, 17, 33, 20), ...line(31, 17, 34, 20)], 'wd');
    mitt(s, [...limb(33, 24, 33, 22, 2.6), ...soft(30, 19, 8, 7, 3)], [[32, 22], [33, 22], [34, 22]]);
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
    { eyes: 'open', look: [1, 0], mouth: 'o', arms: 'lens' },
    { eyes: 'closed', look: [0, 0], mouth: 'flat', arms: 'cover' },
    { eyes: 'open', look: [1, 1], mouth: 'o', arms: 'peek' },
    { eyes: 'wide', look: [0, 0], mouth: 'o', arms: 'down' },
    { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'thumb' },
    { eyes: 'open', look: [-1, 0], mouth: 'wobble', arms: 'down' },
    { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'cheer' },
  ];
  return {
    w: MW * poses.length, h: MH,
    layers: poses.flatMap((p, i) => [
      { name: `shadow-${i}`, sprite: MASCOT_SHADOW, dx: i * MW },
      { name: `pose-${i}`, sprite: mascot(p), dx: i * MW },
    ]),
  };
}
