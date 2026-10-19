// Mensa menu: normalising the public /api/mensa payload and grouping it by day.

import type { Dish } from './types';
import type { Locale } from './i18n/locale';

export type MenuDish = Dish & {
  isVegan?: boolean;
  isVegetarian?: boolean;
  allergens?: string[];
};

export interface MenuDay {
  key: string; // YYYY-MM-DD
  date: Date;
  dishes: MenuDish[];
}

export function dishesFrom(raw: unknown): MenuDish[] {
  if (Array.isArray(raw)) return raw as MenuDish[];
  const r = (raw ?? {}) as Record<string, unknown>;
  const fromMenu = (r.menu as Record<string, unknown> | undefined)?.dishes;
  const list = fromMenu ?? r.dishes ?? r.data;
  return Array.isArray(list) ? (list as MenuDish[]) : [];
}

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Days from today onwards, in order. */
export function upcomingDays(dishes: MenuDish[], now = new Date()): MenuDay[] {
  const today = localDayKey(now);
  const map = new Map<string, MenuDish[]>();
  for (const d of dishes) {
    const key = String(d.date ?? '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || key < today) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(d);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, list]) => {
      const [y, m, day] = key.split('-').map(Number);
      return { key, date: new Date(y, m - 1, day), dishes: list };
    });
}

export function isTodayKey(key: string, now = new Date()): boolean {
  return key === localDayKey(now);
}

/** Whole days from today to `date` (0 = today, 1 = tomorrow). */
export function daysFromToday(date: Date, now = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - start.getTime()) / 86_400_000);
}

export function localized(raw: unknown, locale: Locale): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  const o = raw as Record<string, string | undefined>;
  return o[locale] || o.de || o.it || o.en || '';
}

export function averageRating(ratings: Record<string, number> | undefined): { value: number; count: number } {
  const values = Object.values(ratings ?? {});
  if (!values.length) return { value: 0, count: 0 };
  return { value: values.reduce((a, b) => a + b, 0) / values.length, count: values.length };
}

export function dietOf(d: MenuDish): 'vegan' | 'vegetarian' | null {
  const tags = (d.tags ?? []).map((t) => t.toLowerCase());
  if (d.isVegan || tags.some((t) => t.includes('vegan'))) return 'vegan';
  if (d.isVegetarian || tags.some((t) => t.includes('vegetar'))) return 'vegetarian';
  return null;
}

// ─── Canteens ────────────────────────────────────────────────────────────────
// pokyh-backend lists the canteens of the public Mensa page (GET
// /dishes/canteens), each with the schools it serves, and names the canteen
// and school of every menu it sends (GET /dishes). A menu of a school is asked
// for with that school's slug (?school=).

export interface CanteenSchool {
  slug: string;
  name: string;
  shortName: string;
}

export interface Canteen {
  id: string;
  name: string;
  schools: CanteenSchool[];
}

function schoolFrom(raw: unknown): CanteenSchool | null {
  const s = raw as Partial<CanteenSchool> | null;
  return s && typeof s.slug === 'string' && typeof s.name === 'string'
    ? { slug: s.slug, name: s.name, shortName: typeof s.shortName === 'string' ? s.shortName : '' }
    : null;
}

/** The canteens of a /api/mensa/canteens answer; none for anything else (an older backend has no list). */
export function canteensFrom(raw: unknown): Canteen[] {
  const list = (raw as { canteens?: unknown } | null)?.canteens;
  if (!Array.isArray(list)) return [];
  return list.flatMap((c) => {
    const schools = Array.isArray(c?.schools) ? c.schools.map(schoolFrom).filter((s: CanteenSchool | null): s is CanteenSchool => !!s) : [];
    return typeof c?.id === 'string' && typeof c?.name === 'string' && schools.length ? [{ id: c.id, name: c.name, schools }] : [];
  });
}

/** Whose menu an answer is: its canteen and the school asked about, when the backend names them. */
export function menuOwner(raw: unknown): { canteen: { id: string; name: string } | null; school: CanteenSchool | null } {
  const r = (raw ?? {}) as { canteen?: { id?: unknown; name?: unknown }; school?: unknown };
  const canteen = typeof r.canteen?.id === 'string' && typeof r.canteen?.name === 'string' ? { id: r.canteen.id, name: r.canteen.name } : null;
  return { canteen, school: schoolFrom(r.school) };
}

/** A school as people call it: its short name when it has one. */
export const schoolLabel = (s: CanteenSchool) => s.shortName || s.name;

/** The canteen that serves a school (by slug). */
export const canteenOf = (canteens: Canteen[], slug: string | null) =>
  slug ? canteens.find((c) => c.schools.some((s) => s.slug === slug)) ?? null : null;

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** A search over the canteens: every word must be in the canteen's name or one of its schools' names. */
export function canteenMatches(c: Canteen, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = fold([c.name, ...c.schools.flatMap((s) => [s.name, s.shortName, s.slug])].join(' '));
  return words.every((w) => text.includes(w));
}

// The canteen chosen on the public Mensa page, kept on this device; a link
// can name one instead (?mensa=<school slug>).
const CHOICE_KEY = 'pokyh_mensa_choice';
export const CHOICE_PARAM = 'mensa';

export function rememberedCanteen(): string | null {
  try {
    return localStorage.getItem(CHOICE_KEY);
  } catch {
    return null;
  }
}

export function rememberCanteen(slug: string | null): void {
  try {
    if (slug) localStorage.setItem(CHOICE_KEY, slug);
    else localStorage.removeItem(CHOICE_KEY);
  } catch {
    // Storage blocked: the choice lasts as long as the page.
  }
}
