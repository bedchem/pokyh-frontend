// What there is in room 2B (./Classroom.tsx): the vending machine's items,
// the rare things found elsewhere, the secrets that count as discoveries and
// the tablet's games with their rules for gold stars. Everything is
// cosmetic and only lives in this browser (./store.ts); nothing here costs
// real money or touches POKYH itself.

export type ItemKind = 'snack' | 'head' | 'face' | 'decor';

export const ITEM_IDS = [
  'pudding', 'gum', 'lemonade', 'chips', 'monster', 'cocoa',
  'partyhat', 'gradcap', 'headphones',
  'shades', 'stareyes', 'hearteyes',
  'plant', 'lavalamp', 'lights',
  'crown', 'disco', 'trophy', 'duck',
] as const;
export type ItemId = (typeof ITEM_IDS)[number];

export interface Item {
  id: ItemId;
  kind: ItemKind;
  /** Its place in the machine (row A–E, column 1–3); rare things have none. */
  code: string | null;
  price: number;
  /** A snack that is drunk, not eaten (the bottom row of the machine). */
  drink?: boolean;
  /** How a rare thing is found. */
  rare?: 'lucky' | 'code' | 'trophy' | 'bin';
}

export const ITEMS: Item[] = [
  { id: 'pudding', kind: 'snack', code: 'A1', price: 1 },
  { id: 'gum', kind: 'snack', code: 'A2', price: 1 },
  { id: 'chips', kind: 'snack', code: 'A3', price: 1 },
  { id: 'partyhat', kind: 'head', code: 'B1', price: 4 },
  { id: 'gradcap', kind: 'head', code: 'B2', price: 6 },
  { id: 'headphones', kind: 'head', code: 'B3', price: 6 },
  { id: 'shades', kind: 'face', code: 'C1', price: 5 },
  { id: 'stareyes', kind: 'face', code: 'C2', price: 5 },
  { id: 'hearteyes', kind: 'face', code: 'C3', price: 5 },
  { id: 'plant', kind: 'decor', code: 'D1', price: 4 },
  { id: 'lavalamp', kind: 'decor', code: 'D2', price: 6 },
  { id: 'lights', kind: 'decor', code: 'D3', price: 6 },
  // The drinks, in the bottom row; the white energy can makes the mascot hyper.
  { id: 'lemonade', kind: 'snack', code: 'E1', price: 2, drink: true },
  { id: 'monster', kind: 'snack', code: 'E2', price: 3, drink: true },
  { id: 'cocoa', kind: 'snack', code: 'E3', price: 2, drink: true },
  // Never in the window: a lucky extra now and then when buying, the room
  // number typed on the keypad, three stars in every game, the bin.
  { id: 'crown', kind: 'head', code: null, price: 0, rare: 'lucky' },
  { id: 'disco', kind: 'decor', code: null, price: 0, rare: 'code' },
  { id: 'trophy', kind: 'decor', code: null, price: 0, rare: 'trophy' },
  { id: 'duck', kind: 'decor', code: null, price: 0, rare: 'bin' },
];

export const itemById = (id: string): Item | undefined => ITEMS.find((i) => i.id === id);
export const itemByCode = (code: string): Item | undefined => ITEMS.find((i) => i.code === code);

/** The secret code of the keypad: the room's number. */
export const SECRET_CODE = '2B';
/** One purchase in this many drops the crown as well (until it is found). */
export const LUCKY_ODDS = 14;
/** One purchase in this many gets stuck and wants a shake. */
export const STUCK_ODDS = 9;
/** One search of the bin in this many finds the duck (after the first). */
export const DUCK_ODDS = 5;
/** One click on the mascot in this many is a golden moment. */
export const GOLDEN_ODDS = 25;
export const GOLDEN_STARS = 3;
export const WELCOME_STARS = 5;
export const DISCOVERY_STARS = 2;
/** The first time a game gives three stars, this many more. */
export const PERFECT_BONUS = 2;

export const DISCOVERIES = [
  'board', 'poster', 'switch', 'clock', 'book', 'globe', 'window',
  'apple', 'bin', 'notebook', 'friend', 'golden', 'code', 'stuck',
] as const;
export type Discovery = (typeof DISCOVERIES)[number];

// ── The tablet's games ───────────────────────────────────────────────────

export const GAME_IDS = ['memory', 'maths', 'catch', 'timetable', 'puzzle'] as const;
export type GameId = (typeof GAME_IDS)[number];

export interface GameRule {
  /** Whether a higher score is better (points) or a lower one (moves). */
  better: 'high' | 'low';
  /** The score for one, two and three stars. */
  stars: [number, number, number];
}

// One star for finishing well enough, two for good, three for great: the
// same for every game, so the stars mean the same everywhere.
export const GAME_RULES: Record<GameId, GameRule> = {
  memory: { better: 'low', stars: [99, 14, 10] },
  maths: { better: 'high', stars: [4, 10, 16] },
  catch: { better: 'high', stars: [6, 16, 28] },
  timetable: { better: 'high', stars: [1, 3, 5] },
  puzzle: { better: 'low', stars: [999, 70, 40] },
};

export function starsFor(game: GameId, score: number): 0 | 1 | 2 | 3 {
  const { better, stars } = GAME_RULES[game];
  const met = stars.filter((s) => (better === 'high' ? score >= s : score <= s)).length;
  return met as 0 | 1 | 2 | 3;
}

export function isBetter(game: GameId, score: number, best: number | undefined): boolean {
  if (best === undefined) return true;
  return GAME_RULES[game].better === 'high' ? score > best : score < best;
}
