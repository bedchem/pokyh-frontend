'use client';

import { apiFetch } from '@/lib/api-client';
import { isDueIn, withSeen, type ActivePopup, type SeenMap } from '@/lib/popup-schedule';

// Admin-authored announcement popups (pokyh-backend /popups/active). The
// scheduling rules live in lib/popup-schedule.ts; this file keeps the
// per-device "seen" record in localStorage and fetches the feed.

export type { ActivePopup } from '@/lib/popup-schedule';

const STORAGE_KEY = 'pokyh_popups_seen';

function readSeen(): SeenMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SeenMap) : {};
  } catch {
    return {};
  }
}

function writeSeen(map: SeenMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch { /* storage unavailable - worst case the popup shows again */ }
}

export function isDue(p: ActivePopup, now = Date.now()): boolean {
  return isDueIn(readSeen(), p, now);
}

// Spends the current slot of every given popup that is still due, used when
// one is put on screen and when the whole stack is closed, so popups the user
// skipped by closing don't come back on the next page load or sign-in.
export function markSeen(popups: ActivePopup[], now = Date.now()): void {
  writeSeen(withSeen(readSeen(), popups, now));
}

export type PopupAudience = 'user' | 'guest';

export async function fetchDuePopups(audience: PopupAudience): Promise<ActivePopup[]> {
  const res = await apiFetch(`/popups/active?platform=web&audience=${audience}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json() as { popups?: ActivePopup[] };
  return (data.popups ?? []).filter((p) => isDue(p));
}
