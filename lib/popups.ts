'use client';

import { apiFetch } from '@/lib/api-client';

// Admin-authored announcement popups (pokyh-backend /popups/active).
//
// The backend returns every popup inside its time window; whether *this
// device* should see it right now is decided here. A popup's window is split
// into `showCount` equal slots (slotMs) and it is shown at most once per slot:
// "7× in 7 days" = at most once a day. Missed slots are never caught up, and
// nothing is shown once the window has ended. `slotMs === null` = show once.

export interface ActivePopup {
  id: string;
  revision: number;
  title: string;
  html: string;
  showCount: number;
  startsAt: string | null;
  endsAt: string | null;
  slotMs: number | null;
}

interface SeenEntry { slot: number; count: number; at: number }
type SeenMap = Record<string, SeenEntry>;

const STORAGE_KEY = 'pockyh_popups_seen';
const PRUNE_AFTER_MS = 365 * 24 * 60 * 60 * 1000;

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
  } catch { /* storage unavailable — worst case the popup shows again */ }
}

// A new revision (admin chose "show again") gets a fresh entry.
const keyOf = (p: ActivePopup) => `${p.id}:${p.revision}`;

function currentSlot(p: ActivePopup, now: number): number | null {
  if (p.endsAt && Date.parse(p.endsAt) <= now) return null;
  if (p.slotMs === null || !p.startsAt) return 0;
  const slot = Math.floor((now - Date.parse(p.startsAt)) / p.slotMs);
  if (slot < 0) return null;
  return Math.min(slot, p.showCount - 1);
}

export function isDue(p: ActivePopup, now = Date.now()): boolean {
  const slot = currentSlot(p, now);
  if (slot === null) return false;
  const entry = readSeen()[keyOf(p)];
  if (!entry) return true;
  return entry.count < p.showCount && slot > entry.slot;
}

export function markSeen(p: ActivePopup, now = Date.now()): void {
  const slot = currentSlot(p, now);
  if (slot === null) return;
  const map = readSeen();
  const prev = map[keyOf(p)];
  map[keyOf(p)] = { slot, count: (prev?.count ?? 0) + 1, at: now };
  for (const [k, v] of Object.entries(map)) {
    if (now - v.at > PRUNE_AFTER_MS) delete map[k];
  }
  writeSeen(map);
}

export type PopupAudience = 'user' | 'guest';

export async function fetchDuePopups(audience: PopupAudience): Promise<ActivePopup[]> {
  const res = await apiFetch(`/popups/active?platform=web&audience=${audience}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json() as { popups?: ActivePopup[] };
  return (data.popups ?? []).filter((p) => isDue(p));
}
