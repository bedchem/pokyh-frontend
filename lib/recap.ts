'use client';

import { apiFetch } from './api-client';

// Recaps (pokyh-backend /recaps): an admin-made look back at a period that
// the app tells as a story (components/recap). The backend decides who gets
// one and answers its POKYH figures; the WebUntis figures are worked out on
// this device (lib/recap-data.ts) and go nowhere else.
//
// One small store for the whole app: the recaps the account may open now,
// and which one is on screen. The top bar's banner and the story read it.

export type RecapSection = 'school' | 'absences' | 'grades' | 'exams' | 'classreg' | 'pokyh';

export interface ClientRecap {
  id: string;
  title: string;
  /** YYYY-MM-DD, both included. */
  periodFrom: string;
  periodTo: string;
  endsAt: string | null;
  sections: RecapSection[];
  openedAt: string | null;
  finishedAt: string | null;
}

export interface RecapPokyh {
  covered: { from: string; to: string } | null;
  usageConsent: boolean;
  memberSince: string | null;
  totals?: { activeDays: number; logins: number; activeSeconds: number; visits: number; screens: number; longestStreak: number };
  /** Active days per weekday, Monday first. */
  weekdays?: number[];
  /** Foreground seconds by starting hour (consent only). */
  hours?: number[];
  platforms?: { phone: number; desktop: number; app: number; web: number };
  firstDay?: string | null;
  busiestDay?: { date: string; activeSeconds: number; logins: number } | null;
  pages?: Array<{ page: string; views: number }>;
  created?: { todos: number; todosDone: number; reminders: number; comments: number; ratings: number };
  favouriteDish?: { name: { de: string; it: string; en: string }; stars: number } | null;
  rank?: { topPercent: number; group: number } | null;
  /** From which day POKYH keeps the live rows, and whether an archived year held any of the period. */
  kept?: { liveFrom: string; archive: boolean };
}

interface State {
  /** null until the first answer. */
  recaps: ClientRecap[] | null;
  /** The recap on screen. */
  open: string | null;
}

let state: State = { recaps: null, open: null };
const listeners = new Set<() => void>();

function setState(next: Partial<State>): void {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

export function subscribeRecaps(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function recapState(): State {
  return state;
}

const SERVER_STATE: State = { recaps: null, open: null };
export function recapServerState(): State {
  return SERVER_STATE;
}

/** Fired when a closed story has gone into the banner in the top bar. */
export const RECAP_DOCKED_EVENT = 'pokyh-recap-docked';

export function openRecap(id: string): void {
  setState({ open: id });
}

export function closeRecap(): void {
  setState({ open: null });
}

/** The account's recaps; an error leaves the last answer (or none) in place. */
export async function refreshRecaps(): Promise<ClientRecap[]> {
  try {
    const res = await apiFetch('/recaps', { cache: 'no-store' });
    if (!res.ok) return state.recaps ?? [];
    const recaps = ((await res.json()) as { recaps?: ClientRecap[] }).recaps ?? [];
    setState({ recaps });
    return recaps;
  } catch {
    return state.recaps ?? [];
  }
}

export function forgetRecaps(): void {
  setState({ recaps: null, open: null });
}

/** One recap with the account's POKYH figures for its period. */
export async function fetchRecap(id: string): Promise<{ recap: ClientRecap; pokyh: RecapPokyh | null }> {
  const res = await apiFetch(`/recaps/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} · /recaps/${id}`);
  return (await res.json()) as { recap: ClientRecap; pokyh: RecapPokyh | null };
}

/** Notes that the story was opened (and, `finished`, watched to its end) on every device. */
export async function markRecapView(id: string, finished: boolean): Promise<void> {
  try {
    const res = await apiFetch(`/recaps/${encodeURIComponent(id)}/view`, { method: 'POST', body: JSON.stringify({ finished }) });
    if (!res.ok) return;
    const view = (await res.json()) as { openedAt: string; finishedAt: string | null };
    setState({ recaps: (state.recaps ?? []).map((r) => (r.id === id ? { ...r, ...view } : r)) });
  } catch { /* the story still plays; the banner just stays "new" */ }
}

// ── When the story opens on its own ─────────────────────────────────────────
// A recap no device of the account has shown yet opens by itself after
// signing in. Whether it was shown is kept on the POKYH server
// (recap_views, POST /recaps/:id/view as it opens), not on the device: shown
// once anywhere, every device has it as the banner in the top bar instead.

/** The recap that should open by itself now, if any: the newest one never shown. */
export function dueAutoRecap(recaps: readonly ClientRecap[]): ClientRecap | null {
  return recaps.find((r) => !r.openedAt) ?? null;
}
