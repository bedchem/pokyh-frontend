// Pure scheduling rules for admin announcement popups (no storage, no fetch),
// so they can be unit-tested. lib/popups.ts wires them to localStorage.
//
// The backend returns every popup inside its time window; whether *this
// device* should see it right now is decided here. A popup's window is split
// into `showCount` equal slots (slotMs) and it is shown at most once per slot:
// "7× in 7 days" = at most once a day. Missed slots are never caught up, and
// nothing is shown once the window has ended. `slotMs === null` = show once.
// Mirrored by POKYH_ANDROID ui/popups/AnnouncementPopupViewModel.kt.

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

export interface SeenEntry { slot: number; count: number; at: number }
export type SeenMap = Record<string, SeenEntry>;

const PRUNE_AFTER_MS = 365 * 24 * 60 * 60 * 1000;

// A new revision (admin chose "show again") gets a fresh entry.
export const keyOf = (p: Pick<ActivePopup, 'id' | 'revision'>) => `${p.id}:${p.revision}`;

export function currentSlot(p: ActivePopup, now: number): number | null {
  if (p.endsAt && Date.parse(p.endsAt) <= now) return null;
  if (p.slotMs === null || !p.startsAt) return 0;
  const slot = Math.floor((now - Date.parse(p.startsAt)) / p.slotMs);
  if (slot < 0) return null;
  return Math.min(slot, p.showCount - 1);
}

export function isDueIn(seen: SeenMap, p: ActivePopup, now: number): boolean {
  const slot = currentSlot(p, now);
  if (slot === null) return false;
  const entry = seen[keyOf(p)];
  if (!entry) return true;
  return entry.count < p.showCount && slot > entry.slot;
}

// Records the current slot as used for every popup that is still due. Popups
// already recorded for this slot are left alone, so calling this again for a
// popup that was on screen never spends a second showing.
export function withSeen(seen: SeenMap, popups: ActivePopup[], now: number): SeenMap {
  const next: SeenMap = {};
  for (const [k, v] of Object.entries(seen)) {
    if (now - v.at <= PRUNE_AFTER_MS) next[k] = v;
  }
  for (const p of popups) {
    if (!isDueIn(next, p, now)) continue;
    const slot = currentSlot(p, now);
    if (slot === null) continue;
    next[keyOf(p)] = { slot, count: (next[keyOf(p)]?.count ?? 0) + 1, at: now };
  }
  return next;
}
