import { itemSprite } from './collectibles';
import { Sprite, dither, line, rect, soft, textPixels, type Pt } from './sprite';

// The vending machine of room A+2/05 up close (components/room/Vending.tsx):
// the lit SHOP sign, fifteen slots behind the glass (rows A–E, columns 1–3;
// the bottom row is the cooled drinks), each with its item on a spiral and a
// price tag, the display, the keypad, the slot for gold stars and the flap at
// the bottom where things come out. 96 × 164 pixels of the drawing; the parts
// that can be pressed come with their boxes.

export const VM_W = 96;
export const VM_H = 164;

export type Box = [number, number, number, number];

export interface Slot {
  code: string;
  /** The whole slot, and the item's top left in it. */
  box: Box;
  item: Pt;
}

// Letters and the clear key, the numbers, a wide OK below.
export const KEYS = ['A', 'B', 'C', 'D', 'E', 'X', '1', '2', '3', 'OK'] as const;
export type Key = (typeof KEYS)[number];

const GLASS: Box = [10, 30, 54, 110];
const SLOT_W = 18;
const SLOT_H = 22;
/** The row of drinks, behind its own cold glass. */
const DRINKS_ROW = 4;

export const SLOTS: Slot[] = ['A', 'B', 'C', 'D', 'E'].flatMap((row, r) => [1, 2, 3].map((col) => {
  const x = GLASS[0] + (col - 1) * SLOT_W;
  const y = GLASS[1] + r * SLOT_H;
  return { code: `${row}${col}`, box: [x, y, SLOT_W, SLOT_H] as Box, item: [x + 3, y + 1] as Pt };
}));

export const KEY_BOXES: Record<Key, Box> = Object.fromEntries(KEYS.map((k, i) => [k, k === 'OK' ? [69, 72, 17, 7] : [69 + (i % 3) * 6, 48 + Math.floor(i / 3) * 8, 5, 7]])) as Record<Key, Box>;
export const DISPLAY: Box = [69, 30, 17, 14];
export const COIN: Box = [70, 84, 14, 18];
export const FLAP: Box = [10, 144, 58, 12];
export const GLASS_BOX: Box = [8, 28, 58, 114];

/** A price tag's little star. */
const MINI_STAR = ['.#.', '###', '.#.'];

function text(s: Sprite, t: string, x: number, y: number, tone: string) {
  s.fill(textPixels(t, x, y).points, tone);
}

/** The machine with everything that doesn't change. `prices` by slot code. */
export function vendingFront(prices: Record<string, number>): Sprite {
  const s = new Sprite();
  // Shadow, feet, the body with its darker side.
  s.fill(dither(rect(6, 161, 88, 2)), 'sh');
  s.mass([...rect(8, 157, 10, 5), ...rect(78, 157, 10, 5)], 'st', { deep: true });
  s.mass(soft(2, 2, 92, 156, 5), 'ac', { deep: true });
  s.fill(rect(87, 8, 3, 146), 'ac1');
  // The sign at the top, and the bulbs around it (lit apart, they blink).
  s.mass(rect(8, 7, 80, 18), 'nt', { outline: true });
  s.fill(rect(9, 8, 78, 16), 'nt0');
  // It sells everything for gold stars: a shop, a star either side.
  const sign = textPixels('★ SHOP ★', 0, 0);
  const sx = 8 + Math.floor((80 - sign.width * 2) / 2);
  for (const [px, py] of sign.points) s.fill(rect(sx + px * 2, 11 + py * 2, 2, 2), 'gd3');
  // The glass, its frame, the shelves; on each a spiral and a price tag.
  s.mass(rect(...GLASS_BOX), 'st', { deep: true });
  s.fill(rect(...GLASS), 'nt1');
  s.fill(dither(rect(GLASS[0], GLASS[1], GLASS[2], 3)), 'nt2');
  // The drinks stand in the cold: a paler back, frost along its top.
  const cold = GLASS[1] + DRINKS_ROW * SLOT_H;
  s.fill(rect(GLASS[0], cold, GLASS[2], SLOT_H), 'nt2');
  s.fill(rect(GLASS[0], cold, GLASS[2], 1), 'wt3').fill(dither(rect(GLASS[0], cold + 1, GLASS[2], 2)), 'wt2');
  for (const slot of SLOTS) {
    const [x, y] = slot.box;
    // The spiral: a zigzag of wire under the item.
    for (let i = 1; i < SLOT_W - 1; i++) s.set(x + i, y + 13 + ((i >> 1) % 2), i % 2 ? 'st3' : 'st2');
    s.fill(rect(x, y + 15, SLOT_W, 1), 'st3');
    // The code on white, the price in stars on gold beside it.
    s.fill(rect(x + 1, y + 16, 9, 6), 'pp3');
    text(s, slot.code, x + 2, y + 16, 'ik2');
    const price = prices[slot.code];
    if (price !== undefined) {
      s.fill(rect(x + 11, y + 16, 6, 6), 'gd3');
      text(s, String(price), x + 12, y + 16, 'ik2');
    }
  }
  // The control panel: display, keypad, the slot for stars.
  s.mass(rect(...DISPLAY), 'st', { outline: true });
  s.fill(rect(DISPLAY[0] + 1, DISPLAY[1] + 1, DISPLAY[2] - 2, DISPLAY[3] - 2), 'nt0');
  for (const k of KEYS) {
    const [x, y, w, h] = KEY_BOXES[k];
    s.mass(rect(x, y, w, h), k === 'OK' ? 'lc' : k === 'X' ? 'ld' : 'st', { deep: true });
    if (k === 'OK') text(s, 'OK', x + 5, y + 1, 'lc0');
    else text(s, k, x + 1, y + 1, k === 'X' ? 'ld0' : 'ik2');
  }
  s.mass(rect(...COIN), 'st', { deep: true });
  s.fill(rect(COIN[0] + 6, COIN[1] + 3, 2, 9), 'nt0');
  MINI_STAR.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') s.set(COIN[0] + 6 + i, COIN[1] + 13 + j, 'gd2'); }));
  // A grille below it, where the cooling hums.
  for (let i = 0; i < 4; i++) s.fill(rect(71, 110 + i * 3, 12, 1), 'ac0').fill(rect(71, 111 + i * 3, 12, 1), 'ac3');
  // The flap where things come out.
  s.fill(rect(FLAP[0] - 1, FLAP[1] - 1, FLAP[2] + 2, FLAP[3] + 2), 'ac0');
  s.fill(rect(...FLAP), 'nt0');
  s.mass(rect(FLAP[0] + 2, FLAP[1] + 1, FLAP[2] - 4, 6), 'ac', { deep: true });
  s.mass(rect(FLAP[0] + 24, FLAP[1] + 5, 10, 1), 'st');
  // A POKYH sticker on the side.
  s.mass(soft(70, 132, 14, 12, 3), 'pp');
  s.fill(rect(73, 135, 8, 6), 'ac2').fill(textPixels('P', 75, 135).points, 'pp4');
  return s;
}

/** The items in their slots; what was bought already carries a tick. */
export function vendingItems(items: Record<string, string>, owned: Set<string>): Sprite {
  const s = new Sprite();
  for (const slot of SLOTS) {
    const id = items[slot.code];
    if (!id) continue;
    s.paste(itemSprite(id), slot.item[0], slot.item[1]);
    if (owned.has(id)) {
      const [x, y] = slot.box;
      s.mass(rect(x + 12, y + 1, 5, 5), 'lc', { outline: false });
      s.fill([[x + 13, y + 3], [x + 14, y + 4], [x + 15, y + 3], [x + 15, y + 2]], 'pp4');
    }
  }
  return s;
}

/** The glass in front: light across it. */
export const GLASS_SHEEN = (() => {
  const s = new Sprite();
  for (const i of [0, 2]) s.fill(dither(line(12 + i * 14, 138, 47 + i * 14, 32).filter(([x]) => x < GLASS[0] + GLASS[2] && x >= GLASS[0])), 'gl');
  return s;
})();

/** The bulbs around the sign in two frames. */
export const SIGN_BULBS: [Sprite, Sprite] = [0, 1].map((f) => {
  const s = new Sprite();
  for (let x = 10, i = 0; x < 86; x += 5, i++) {
    s.set(x, 8, (i + f) % 2 ? 'gd4' : 'gd1');
    s.set(x, 23, (i + f) % 2 ? 'gd1' : 'gd4');
  }
  return s;
}) as [Sprite, Sprite];

/** A frame around the chosen slot. */
export function slotFrame(code: string): Sprite {
  const slot = SLOTS.find((x) => x.code === code);
  const s = new Sprite();
  if (!slot) return s;
  const [x, y, w, h] = slot.box;
  s.fill([...rect(x, y, w, 1), ...rect(x, y + h - 1, w, 1), ...rect(x, y, 1, h), ...rect(x + w - 1, y, 1, h)], 'gd3');
  return s;
}

/** The display's text: up to two lines of four letters, green on black. */
export function displayText(lines: string[]): Sprite {
  const s = new Sprite();
  lines.slice(0, 2).forEach((l, i) => {
    const t = textPixels(l, 0, 0);
    const x = DISPLAY[0] + 1 + Math.floor((DISPLAY[2] - 2 - t.width) / 2);
    s.fill(t.points.map(([px, py]) => [px + x, py + DISPLAY[1] + 1 + i * 6] as Pt), 'gn3');
  });
  return s;
}

/** The spiral of a slot turning, in two frames (the item slides forward). */
export function spiralTurn(code: string): [Sprite, Sprite] {
  const slot = SLOTS.find((x) => x.code === code);
  return [0, 1].map((f) => {
    const s = new Sprite();
    if (!slot) return s;
    const [x, y] = slot.box;
    for (let i = 1; i < SLOT_W - 1; i++) s.set(x + i, y + 13 + (((i + f * 2) >> 1) % 2), i % 2 ? 'st4' : 'st2');
    return s;
  }) as [Sprite, Sprite];
}

/** The wall and parquet of the room behind the machine (or the console), for a stage of w × h. */
export function roomBackdrop(w: number, h: number, floor: number): Sprite {
  const s = new Sprite();
  s.fill(rect(0, 0, w, floor), 'cw2');
  s.fill(rect(0, floor - 26, w, 26), 'cl2');
  s.fill(rect(0, floor - 29, w, 1), 'wd3').fill(rect(0, floor - 28, w, 1), 'wd2').fill(rect(0, floor - 27, w, 1), 'wd1');
  s.fill(rect(0, floor - 2, w, 1), 'cl1').fill(rect(0, floor - 1, w, 1), 'cl0');
  for (let y = floor; y < h; y++) {
    const rel = y - floor;
    for (let x = 0; x < w; x++) {
      const scale = 8 + rel * 0.6;
      const u = (x - w / 2 + 0.5) / scale;
      const col = Math.floor(u);
      s.set(x, y, rel % 7 === 0 || u - col < 1 / scale ? 'pq1' : (col + Math.floor(rel / 7)) % 3 === 0 ? 'pq3' : 'pq2');
    }
  }
  s.fill(dither(rect(0, floor, w, 2)), 'sh');
  return s;
}
