'use client';

import { useSyncExternalStore } from 'react';
import {
  DISCOVERIES, DISCOVERY_STARS, GAME_IDS, ITEM_IDS, LUCKY_ODDS, PERFECT_BONUS, WELCOME_STARS,
  isBetter, itemById, starsFor, type Discovery, type GameId, type Item, type ItemId,
} from './catalog';

// What room 2B remembers between visits: the gold stars, what was bought
// or found, what the mascot wears and which decorations stand in the room,
// the secrets discovered and the games' best results. Kept in this browser
// only (localStorage, `pokyh_room_2b`, listed in the privacy policy's
// storage section), like the school chosen on the sign-in page; nothing of
// it reaches POKYH's servers. A damaged or foreign value starts afresh.

export const ROOM_KEY = 'pokyh_room_2b';

export interface RoomSave {
  v: 1;
  stars: number;
  /** Things bought or found (snacks are eaten, not kept). */
  owned: ItemId[];
  wear: { head: ItemId | null; face: ItemId | null };
  /** Decorations standing in the room. */
  decor: ItemId[];
  found: Discovery[];
  /** Best score per game, and its best stars. */
  best: Partial<Record<GameId, number>>;
  rated: Partial<Record<GameId, number>>;
  /** Snacks eaten, per snack. */
  eaten: Partial<Record<ItemId, number>>;
  welcomed: boolean;
}

const EMPTY: RoomSave = { v: 1, stars: 0, owned: [], wear: { head: null, face: null }, decor: [], found: [], best: {}, rated: {}, eaten: {}, welcomed: false };

const isItem = (v: unknown): v is ItemId => typeof v === 'string' && (ITEM_IDS as readonly string[]).includes(v);
const isFound = (v: unknown): v is Discovery => typeof v === 'string' && (DISCOVERIES as readonly string[]).includes(v);
const count = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.round(v))) : 0);

function perGame(v: unknown, max: number): Partial<Record<GameId, number>> {
  const out: Partial<Record<GameId, number>> = {};
  if (v && typeof v === 'object') for (const g of GAME_IDS) if (typeof (v as Record<string, unknown>)[g] === 'number') out[g] = count((v as Record<string, unknown>)[g], max);
  return out;
}

/** A stored value made safe: unknown things dropped, numbers in range. */
function sane(raw: unknown): RoomSave {
  if (!raw || typeof raw !== 'object' || (raw as { v?: unknown }).v !== 1) return EMPTY;
  const r = raw as Record<string, unknown>;
  const owned = Array.isArray(r.owned) ? [...new Set(r.owned.filter(isItem))].filter((id) => itemById(id)?.kind !== 'snack') : [];
  const wear = (r.wear && typeof r.wear === 'object' ? r.wear : {}) as Record<string, unknown>;
  const worn = (slot: 'head' | 'face') => (isItem(wear[slot]) && owned.includes(wear[slot] as ItemId) && itemById(wear[slot] as string)?.kind === slot ? (wear[slot] as ItemId) : null);
  const eaten: Partial<Record<ItemId, number>> = {};
  if (r.eaten && typeof r.eaten === 'object') for (const [k, n] of Object.entries(r.eaten)) if (isItem(k) && itemById(k)?.kind === 'snack') eaten[k] = count(n, 99999);
  return {
    v: 1,
    stars: count(r.stars, 9999),
    owned,
    wear: { head: worn('head'), face: worn('face') },
    decor: Array.isArray(r.decor) ? [...new Set(r.decor.filter(isItem))].filter((id) => owned.includes(id) && itemById(id)?.kind === 'decor') : [],
    found: Array.isArray(r.found) ? [...new Set(r.found.filter(isFound))] : [],
    best: perGame(r.best, 99999),
    rated: perGame(r.rated, 3),
    eaten,
    welcomed: r.welcomed === true,
  };
}

let cache: RoomSave | null = null;
const listeners = new Set<() => void>();

function read(): RoomSave {
  try {
    const raw = localStorage.getItem(ROOM_KEY);
    return raw ? sane(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function roomSnapshot(): RoomSave {
  return (cache ??= read());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  // Another tab in the room: take its state.
  const onStorage = (e: StorageEvent) => { if (e.key === ROOM_KEY || e.key === null) { cache = null; fn(); } };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(fn); window.removeEventListener('storage', onStorage); };
}

function write(next: RoomSave) {
  cache = next;
  try {
    localStorage.setItem(ROOM_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the room still works for this visit.
  }
  listeners.forEach((l) => l());
}

function update(fn: (s: RoomSave) => RoomSave) {
  write(fn(roomSnapshot()));
}

export function useRoomSave(): RoomSave {
  return useSyncExternalStore(subscribe, roomSnapshot, () => EMPTY);
}

// ── What can happen ──────────────────────────────────────────────────────

/** The stars of the first visit; false when they were given before. */
export function welcome(): boolean {
  if (roomSnapshot().welcomed) return false;
  update((s) => ({ ...s, welcomed: true, stars: s.stars + WELCOME_STARS }));
  return true;
}

/** A secret found: true (and stars) the first time only. */
export function discover(id: Discovery): boolean {
  if (roomSnapshot().found.includes(id)) return false;
  update((s) => ({ ...s, found: [...s.found, id], stars: s.stars + DISCOVERY_STARS }));
  return true;
}

export function grant(stars: number) {
  update((s) => ({ ...s, stars: Math.min(9999, s.stars + stars) }));
}

/** A rare thing found: false when it was had already. Decorations go straight into the room. */
export function unlock(id: ItemId): boolean {
  const s = roomSnapshot();
  if (s.owned.includes(id)) return false;
  const item = itemById(id);
  update((old) => ({
    ...old,
    owned: [...old.owned, id],
    decor: item?.kind === 'decor' ? [...old.decor, id] : old.decor,
  }));
  return true;
}

export type Purchase =
  | { ok: true; lucky: boolean }
  | { ok: false; reason: 'stars' | 'owned' };

/**
 * Pays for an item. Snacks are counted as eaten; anything else is kept, a
 * decoration put in the room and something to wear put on. Now and then the
 * crown falls out too (`lucky`), until it is found.
 */
export function purchase(item: Item, roll = Math.random()): Purchase {
  const s = roomSnapshot();
  if (item.kind !== 'snack' && s.owned.includes(item.id)) return { ok: false, reason: 'owned' };
  if (s.stars < item.price) return { ok: false, reason: 'stars' };
  const lucky = !s.owned.includes('crown') && roll < 1 / LUCKY_ODDS;
  update((old) => {
    const next: RoomSave = { ...old, stars: old.stars - item.price };
    if (item.kind === 'snack') next.eaten = { ...old.eaten, [item.id]: (old.eaten[item.id] ?? 0) + 1 };
    else {
      next.owned = [...old.owned, item.id];
      if (item.kind === 'decor') next.decor = [...old.decor, item.id];
      else next.wear = { ...old.wear, [item.kind]: item.id };
    }
    if (lucky) next.owned = [...next.owned, 'crown'];
    return next;
  });
  return { ok: true, lucky };
}

export function wear(slot: 'head' | 'face', id: ItemId | null) {
  update((s) => ({ ...s, wear: { ...s.wear, [slot]: id && s.owned.includes(id) ? id : null } }));
}

export function toggleDecor(id: ItemId) {
  update((s) => ({ ...s, decor: s.decor.includes(id) ? s.decor.filter((d) => d !== id) : s.owned.includes(id) ? [...s.decor, id] : s.decor }));
}

export interface GameResult {
  score: number;
  stars: 0 | 1 | 2 | 3;
  /** Gold stars earned: the game's stars and, the first time it gave three, the bonus. */
  earned: number;
  perfectBonus: boolean;
  best: boolean;
  /** Three stars in every game now, the trophy just won. */
  trophy: boolean;
}

export function finishGame(game: GameId, score: number): GameResult {
  const s = roomSnapshot();
  const stars = starsFor(game, score);
  const perfectBonus = stars === 3 && (s.rated[game] ?? 0) < 3;
  const best = isBetter(game, score, s.best[game]);
  const earned = stars + (perfectBonus ? PERFECT_BONUS : 0);
  const rated = { ...s.rated, [game]: Math.max(stars, s.rated[game] ?? 0) };
  const trophy = !s.owned.includes('trophy') && GAME_IDS.every((g) => rated[g] === 3);
  update((old) => ({
    ...old,
    stars: Math.min(9999, old.stars + earned),
    best: best ? { ...old.best, [game]: score } : old.best,
    rated,
    owned: trophy ? [...old.owned, 'trophy'] : old.owned,
    decor: trophy ? [...old.decor, 'trophy'] : old.decor,
  }));
  return { score, stars, earned, perfectBonus, best, trophy };
}

/** Everything forgotten, as before the first visit. */
export function resetRoom() {
  try {
    localStorage.removeItem(ROOM_KEY);
  } catch {
    // Nothing stored, nothing to remove.
  }
  cache = EMPTY;
  listeners.forEach((l) => l());
}
