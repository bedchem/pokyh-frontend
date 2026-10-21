// The bell in the app's top bar (components/app/Bell.tsx): what happened
// lately across POKYH — new grades and messages, reminders a classmate put up,
// to-dos and reminders coming due, the streak reaching a milestone or running
// out — which of it the account hasn't looked at yet, and what it cleared
// away. Pure: the inputs arrive already read from WebUntis and the backend
// (components/app/useBell.ts).

const DAY = 86_400_000;

/** How far back the feed reaches. */
export const FEED_DAYS = 14;
/** To-dos and reminders join the feed this long before they are due. */
export const SOON_MS = DAY;
/** On a source's first load, only what is younger than this counts as new. */
export const FRESH_MS = 3 * DAY;
/** Streak lengths worth a line of their own. */
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 250, 300, 365];
/** How many seen (and cleared) keys are remembered (newest first). */
const SEEN_LIMIT = 400;

export type BellSource = 'grades' | 'messages' | 'reminders' | 'todos' | 'streak';
export type BellKind = 'grade' | 'message' | 'reminder' | 'reminderSoon' | 'todo' | 'streak' | 'streakLost';

export interface GradeIn { id: number; subject: string; lessonId: number; value: number; date: number; examType: string }
export interface MessageIn { id: number; subject: string; sender: string; sent: number; read: boolean }
export interface ReminderIn { id: string; title: string; remindAt: number; createdAt: number; by: string; mine: boolean }
export interface TodoIn { id: string; title: string; dueAt: number | null; done: boolean }
/** A run of active days, its first and last day (local midnight). */
export interface StreakRun { days: number; start: number; end: number }
/** The running streak: its length and the last day it counts (local midnight); `lost`: the last one that ran out. */
export interface StreakIn { days: number; end: number; lost?: StreakRun | null }

/** Each source is absent until it has been read. */
export interface FeedInput {
  grades?: GradeIn[];
  messages?: MessageIn[];
  reminders?: ReminderIn[];
  todos?: TodoIn[];
  streak?: StreakIn | null;
}

export interface BellItem {
  /** Stable, for remembering what was seen. */
  key: string;
  source: BellSource;
  kind: BellKind;
  /** When it happened, or when it is due. */
  at: number;
  /** `at` is a day, not a moment (grades, the streak). */
  allDay?: boolean;
  title: string;
  /** Subject's exam type, a sender, who made a reminder. */
  sub: string;
  href: string;
  /** The mark of a grade, the days of a streak (reached or lost). */
  value?: number;
  overdue?: boolean;
  /** Nothing to tell (a message already read): never counts as new. */
  settled?: boolean;
}

export interface Feed {
  /** Due soon or overdue, the soonest first. */
  current: BellItem[];
  /** What happened, the latest first. */
  recent: BellItem[];
}

export interface SeenState {
  keys: string[];
  /** Sources whose first load has been settled (see `settleSeen`). */
  sources: BellSource[];
  /** What was cleared away: it stays out of the feed. */
  cleared: string[];
}

/** Local midnight of a WebUntis date (YYYYMMDD). */
export function untisDay(date: number): number {
  const y = Math.floor(date / 10000);
  const m = Math.floor(date / 100) % 100;
  const d = date % 100;
  return new Date(y, m - 1, d).getTime();
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Same calendar day `n` days later (daylight saving keeps the midnight). */
function addDays(ms: number, n: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime();
}

/** The latest milestone the running streak has passed, and the day it did. */
export function streakMilestone(streak: StreakIn): { days: number; at: number; start: number } | null {
  const reached = STREAK_MILESTONES.filter((m) => m <= streak.days);
  const days = reached[reached.length - 1];
  if (!days) return null;
  const start = addDays(streak.end, -(streak.days - 1));
  return { days, at: addDays(start, days - 1), start };
}

/**
 * The latest streak, of at least the first milestone, that ran out: a whole
 * day without POKYH after it (a quiet today doesn't end one yet, as on the
 * backend). `active`: the active days, local midnights; `today`: midnight.
 */
export function lostStreak(active: number[], today: number): StreakRun | null {
  const days = [...new Set(active)].sort((a, b) => a - b);
  // The runs of consecutive days, oldest first.
  const runs: StreakRun[] = [];
  for (const day of days) {
    const run = runs[runs.length - 1];
    if (run && addDays(run.end, 1) === day) {
      run.days += 1;
      run.end = day;
    } else runs.push({ days: 1, start: day, end: day });
  }
  return runs.findLast((r) => r.days >= STREAK_MILESTONES[0] && addDays(r.end, 2) <= today) ?? null;
}

export function buildFeed(input: FeedInput, now: number): Feed {
  const since = addDays(startOfDay(now), -FEED_DAYS);
  const current: BellItem[] = [];
  const recent: BellItem[] = [];

  for (const g of input.grades ?? []) {
    const at = untisDay(g.date);
    if (!g.value || at < since || at > now) continue;
    recent.push({
      key: `grade:${g.id}`, source: 'grades', kind: 'grade', at, allDay: true,
      title: g.subject, sub: g.examType, href: `/grades/subject/${g.lessonId}`, value: g.value,
    });
  }

  for (const m of input.messages ?? []) {
    if (!m.sent || m.sent < since) continue;
    recent.push({
      key: `msg:${m.id}`, source: 'messages', kind: 'message', at: m.sent,
      title: m.subject, sub: m.sender, href: `/messages/${m.id}`, settled: m.read,
    });
  }

  for (const r of input.reminders ?? []) {
    if (r.remindAt > now && r.remindAt <= now + SOON_MS) {
      current.push({
        key: `rem-soon:${r.id}`, source: 'reminders', kind: 'reminderSoon', at: r.remindAt,
        title: r.title, sub: r.mine ? '' : r.by, href: '/reminders',
      });
    } else if (!r.mine && r.createdAt >= since && r.createdAt <= now && r.remindAt > now) {
      recent.push({
        key: `rem:${r.id}`, source: 'reminders', kind: 'reminder', at: r.createdAt,
        title: r.title, sub: r.by, href: '/reminders',
      });
    }
  }

  for (const td of input.todos ?? []) {
    if (td.done || td.dueAt === null || td.dueAt < since || td.dueAt > now + SOON_MS) continue;
    current.push({
      key: `todo:${td.id}:${td.dueAt}`, source: 'todos', kind: 'todo', at: td.dueAt,
      title: td.title, sub: '', href: '/todos', overdue: td.dueAt < now,
    });
  }

  const milestone = input.streak ? streakMilestone(input.streak) : null;
  if (milestone && milestone.at >= since) {
    recent.push({
      key: `streak:${milestone.start}:${milestone.days}`, source: 'streak', kind: 'streak', at: milestone.at, allDay: true,
      title: '', sub: '', href: '/profile', value: milestone.days,
    });
  }

  // Gone at the end of the first day missed.
  const lost = input.streak?.lost;
  const lostAt = lost ? addDays(lost.end, 2) : 0;
  if (lost && lostAt >= since && lostAt <= now) {
    recent.push({
      key: `streak-lost:${lost.start}:${lost.days}`, source: 'streak', kind: 'streakLost', at: lostAt, allDay: true,
      title: '', sub: '', href: '/profile', value: lost.days,
    });
  }

  current.sort((a, b) => a.at - b.at);
  recent.sort((a, b) => b.at - a.at);
  return { current, recent: recent.slice(0, 30) };
}

/** The feed without what was cleared away. */
export function withoutCleared(feed: Feed, cleared: readonly string[]): Feed {
  if (cleared.length === 0) return feed;
  const gone = new Set(cleared);
  return { current: feed.current.filter((i) => !gone.has(i.key)), recent: feed.recent.filter((i) => !gone.has(i.key)) };
}

/** These items are cleared away (and count as seen). */
export function clearKeys(state: SeenState, keys: string[]): SeenState {
  if (keys.length === 0) return state;
  return { ...state, keys: mergeKeys(keys, state.keys), cleared: mergeKeys(keys, state.cleared) };
}

export function isNew(item: BellItem, seen: ReadonlySet<string>): boolean {
  return !item.settled && !seen.has(item.key);
}

/** Keys of the items in the feed not seen yet. */
export function freshKeys(feed: Feed, seen: SeenState): Set<string> {
  const keys = new Set(seen.keys);
  return new Set([...feed.current, ...feed.recent].filter((i) => isNew(i, keys)).map((i) => i.key));
}

/**
 * A source read for the first time on this device doesn't flood the bell:
 * what is older than `FRESH_MS` counts as seen. Due to-dos and reminders stay
 * new, they still want doing. Unchanged state comes back as the same object.
 */
export function settleSeen(state: SeenState, feed: Feed, loaded: BellSource[], now: number): SeenState {
  const first = loaded.filter((s) => !state.sources.includes(s));
  if (first.length === 0) return state;
  const old = feed.recent.filter((i) => first.includes(i.source) && i.at < now - FRESH_MS).map((i) => i.key);
  return { ...state, keys: mergeKeys(old, state.keys), sources: [...state.sources, ...first] };
}

/** Everything in the feed now counts as seen. */
export function markSeen(state: SeenState, feed: Feed): SeenState {
  const keys = [...feed.current, ...feed.recent].map((i) => i.key);
  const merged = mergeKeys(keys, state.keys);
  if (merged.length === state.keys.length && merged.every((k, i) => k === state.keys[i])) return state;
  return { ...state, keys: merged };
}

function mergeKeys(front: string[], rest: string[]): string[] {
  return [...new Set([...front, ...rest])].slice(0, SEEN_LIMIT);
}

/** What the account holds (pokyh-backend /users/me/bell): `seen` includes the cleared. */
export interface BellMarks { seen: string[]; cleared: string[] }

/** The account's marks, from any device, joined into this device's. Unchanged state comes back as the same object. */
export function mergeSeen(state: SeenState, marks: BellMarks): SeenState {
  const keys = mergeKeys(state.keys, marks.seen);
  const cleared = mergeKeys(state.cleared, marks.cleared);
  const same = (a: string[], b: string[]) => a.length === b.length && a.every((k, i) => k === b[i]);
  if (same(keys, state.keys) && same(cleared, state.cleared)) return state;
  return { ...state, keys, cleared };
}

/** What this device marked that the account doesn't hold yet. */
export function unsyncedMarks(state: SeenState, known: { seen: ReadonlySet<string>; cleared: ReadonlySet<string> }): BellMarks {
  return {
    seen: state.keys.filter((k) => !known.seen.has(k) && !state.cleared.includes(k)),
    cleared: state.cleared.filter((k) => !known.cleared.has(k)),
  };
}

/** The stored state, or a fresh one for anything unreadable (stored before clearing: nothing cleared). */
export function readSeen(raw: string | null): SeenState {
  try {
    const v = JSON.parse(raw ?? '') as Partial<SeenState>;
    if (Array.isArray(v.keys) && Array.isArray(v.sources)) {
      return {
        keys: v.keys.filter((k) => typeof k === 'string'),
        sources: v.sources.filter((s) => typeof s === 'string'),
        cleared: Array.isArray(v.cleared) ? v.cleared.filter((k) => typeof k === 'string') : [],
      };
    }
  } catch { /* nothing stored yet */ }
  return { keys: [], sources: [], cleared: [] };
}
