import { Sprite, grid, rect, rounded, disc, minus, type Pt, type Scene } from './sprite';

// Small pixel icons, 16 × 16, drawn like the scenes in ./states.ts (outlines,
// light from the top left) and shown at three times their size, so every
// pixel stays square (components/app/PixelState.tsx, PixelIcon). The
// settings use them beside the account's e-mail, password, two-factor
// sign-in and devices.

export type PixelIconName = 'mail' | 'key' | 'shield-on' | 'shield-off' | 'devices';

export const ICON_SIZE = 16;

// mail: an envelope seen from the back, its flap closed with a red seal.
function mail(): Sprite {
  const s = new Sprite().mass(rect(1, 3, 14, 10), 'pp', { deep: true });
  const flap: Pt[] = [[1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 8], [14, 3], [13, 4], [12, 5], [11, 6], [10, 7], [9, 8]];
  s.fill(flap, 'pp0');
  s.fill([[1, 12], [2, 11], [3, 10], [14, 12], [13, 11], [12, 10]], 'pp1');
  s.mass(rect(7, 8, 2, 2), 'rd', { outline: false });
  return s.set(7, 8, 'rd3');
}

// key: a gold key, its bow a ring, two teeth.
function key(): Sprite {
  const bow = minus(disc(4.5, 8, 3.7), disc(4.5, 8, 1.6));
  return new Sprite().mass([...bow, ...rect(8, 7, 6, 2), ...rect(11, 9, 1, 2), ...rect(13, 9, 1, 3)], 'gd', { deep: true })
    .fill([[3, 5], [2, 6]], 'gd4');
}

const SHIELD = grid([
  '############',
  '############',
  '############',
  '############',
  '############',
  '############',
  '.##########.',
  '.##########.',
  '..########..',
  '..########..',
  '...######...',
  '....####....',
  '.....##.....',
], 2, 1);

// shield-on: a green shield with a tick (two-factor sign-in on).
function shieldOn(): Sprite {
  const tick: Pt[] = [[4, 6], [5, 7], [6, 8], [7, 7], [8, 6], [9, 5], [10, 4], [11, 3]];
  return new Sprite().mass(SHIELD, 'gn', { deep: true })
    .fill([...tick, ...tick.map(([x, y]) => [x, y + 1] as Pt)], 'pp3');
}

// shield-off: a gold shield with an exclamation mark (two-factor sign-in off).
function shieldOff(): Sprite {
  return new Sprite().mass(SHIELD, 'gd', { deep: true })
    .fill([...rect(7, 3, 2, 5), ...rect(7, 9, 2, 2)], 'gd0');
}

// devices: a screen on its stand, a phone in front of it.
function devices(): Sprite {
  const s = new Sprite().mass([...rect(1, 2, 11, 8), ...rect(5, 10, 3, 1), ...rect(3, 11, 7, 1)], 'st');
  s.fill(rect(2, 3, 9, 6), 'wt2').fill([[3, 4], [4, 4], [3, 5]], 'wt4');
  s.mass(rounded(10, 6, 5, 9, 1), 'ac', { deep: true });
  return s.fill(rect(11, 7, 3, 6), 'wt2').set(11, 7, 'wt4').set(12, 13, 'ac3');
}

const BUILDERS: Record<PixelIconName, () => Sprite> = { mail, key, 'shield-on': shieldOn, 'shield-off': shieldOff, devices };
const built: Partial<Record<PixelIconName, Scene>> = {};

export function iconScene(name: PixelIconName): Scene {
  return (built[name] ??= { w: ICON_SIZE, h: ICON_SIZE, layers: [{ name, sprite: BUILDERS[name]() }] });
}
