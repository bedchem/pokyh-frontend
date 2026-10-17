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
