'use client';

import { apiFetch } from './api-client';

// The account's own activity from the POKYH backend (GET /users/me/activity,
// pokyh-backend src/services/accountActivity.ts): active days and sign-ins
// from the server logs, and — only with consent to the personal usage
// statistics — time in POKYH. Nothing is measured or stored for this on the
// device; the profile only shows what the backend already keeps.

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  active: boolean;
  logins: number;
  activeSeconds: number;
  visits: number;
  screens: number;
}

export interface AccountActivity {
  today: string;
  from: string;
  timezone: string;
  /** Days kept; `schoolYear`: kept for the running school year and archived at its end. */
  retention: { activeDays: number; usage: number; schoolYear?: boolean; pages?: number };
  usageConsent: boolean;
  memberSince: string | null;
  days: ActivityDay[];
  totals: {
    activeDays: number;
    logins: number;
    activeSeconds: number;
    visits: number;
    screens: number;
    currentStreak: number;
    longestStreak: number;
  };
  weekdays: number[];
  hours: number[];
  platforms: { phone: number; desktop: number; app: number; web: number };
  pages: Array<{ page: string; views: number }>;
  created: { todosDone: number; todosOpen: number; reminders: number; comments: number; ratings: number };
}

/** The activity, or why it couldn't be loaded (short and technical, for the small print). */
export type ActivityResult = { data: AccountActivity; error?: undefined } | { data: null; error: string };

let pending: Promise<ActivityResult> | null = null;

/** Fetched once per page load (profile and statistics share it); `fresh` asks again. */
export function fetchAccountActivity(fresh = false): Promise<ActivityResult> {
  if (fresh) pending = null;
  pending ??= apiFetch('/users/me/activity')
    .then(async (res): Promise<ActivityResult> => {
      if (res.ok) return { data: (await res.json()) as AccountActivity };
      return { data: null, error: `HTTP ${res.status} · /users/me/activity` };
    })
    .catch((e: unknown): ActivityResult => ({
      data: null,
      error: e instanceof Error && e.message ? e.message : 'network_error',
    }))
    .then((result) => {
      if (!result.data) pending = null;
      return result;
    });
  return pending;
}

/** Activity strength 0–4 for the grid: minutes when known, else sign-ins. */
export function levelOf(day: ActivityDay): number {
  if (!day.active) return 0;
  const minutes = day.activeSeconds / 60;
  if (minutes > 0) return minutes >= 45 ? 4 : minutes >= 20 ? 3 : minutes >= 5 ? 2 : 1;
  return day.logins >= 3 ? 4 : day.logins === 2 ? 3 : day.logins === 1 ? 2 : 1;
}
