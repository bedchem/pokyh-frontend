'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { areGradesStale, fetchGrades, fetchMessages, getGradesStale, getMessagesStale } from '@/lib/api';
import { api, type ApiReminder, type ApiTodo } from '@/lib/api-client';
import { fetchAccountActivity, type AccountActivity } from '@/lib/account-activity';
import { messageIsRead } from '@/lib/untis-parse';
import {
  buildFeed, clearKeys, freshKeys, lostStreak, markSeen, mergeSeen, readSeen, settleSeen, unsyncedMarks, withoutCleared,
  type BellSource, type Feed, type FeedInput, type GradeIn, type MessageIn, type ReminderIn, type SeenState, type StreakIn, type TodoIn,
} from '@/lib/bell-feed';
import { useSession } from '@/providers/SessionProvider';
import { useApp } from '@/providers/AppProvider';

// What the bell shows (lib/bell-feed.ts), read from where the rest of the app
// already reads it: the stored grades and inbox first, then WebUntis once per
// page load (shared with the dashboard and the unread badges, nothing asked
// twice), the to-dos and the class's reminders from the backend, the streak
// from the account's activity (shared with the profile). Opening the bell
// reads the to-dos and reminders again; coming back to the tab after a while
// reads everything again. What was seen, and what was cleared away, is
// remembered per account: on the device, and with the account so every device
// shows the same (see "The account's marks" below).

export interface StreakView {
  days: number;
  longest: number;
  /** The last seven days, today last. */
  week: Array<{ date: string; active: boolean }>;
}

interface BellStore {
  /** The account the data belongs to. */
  owner: string;
  input: FeedInput;
  seen: SeenState;
  /** Undefined while loading, null when the activity can't be read. */
  streak: StreakView | null | undefined;
  /** The account's marks are in (or couldn't be read): the badge may count. */
  synced: boolean;
}

const EMPTY_SEEN: SeenState = { keys: [], sources: [], cleared: [] };
const EMPTY_INPUT: FeedInput = {};
let store: BellStore = { owner: '', input: EMPTY_INPUT, seen: EMPTY_SEEN, streak: undefined, synced: false };
const listeners = new Set<() => void>();
/** When each source was last asked for. */
let asked: Partial<Record<BellSource, number>> = {};
let refreshedAt = 0;

// Asking again on opening the bell: not more often than this.
const AGAIN_MS: Record<BellSource, number> = { todos: 30_000, reminders: 30_000, grades: 60_000, messages: 60_000, streak: 10 * 60_000 };
const AWAY_MS = 5 * 60_000;

const seenKey = (owner: string) => `pokyh_bell_seen_${owner}`;

function emit(next: BellStore) {
  store = next;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

const snapshot = () => store;

/** A new account (or the first one this page load) starts from what it saw before. */
function adoptOwner(owner: string) {
  if (!owner || store.owner === owner) return;
  let seen = EMPTY_SEEN;
  try { seen = readSeen(localStorage.getItem(seenKey(owner))); } catch { /* storage blocked */ }
  asked = {};
  refreshedAt = 0;
  emit({ owner, input: EMPTY_INPUT, seen, streak: undefined, synced: false });
}

function patch(owner: string, part: FeedInput, streak?: StreakView | null) {
  // An answer for an account that has since signed out is dropped.
  if (store.owner !== owner) return;
  emit({ ...store, input: { ...store.input, ...part }, streak: streak === undefined ? store.streak : streak });
}

function saveSeen(seen: SeenState) {
  if (seen === store.seen) return;
  emit({ ...store, seen });
  try { localStorage.setItem(seenKey(store.owner), JSON.stringify(seen)); } catch { /* storage blocked */ }
  schedulePush();
}

// ── The account's marks (pokyh-backend /users/me/bell) ───────────────────────
// What was seen or cleared on one device counts on all of them. The device's
// own copy shows at once (and offline); the account's is joined in when the
// bell starts, on opening it and back in the tab after a while, and what this
// device marks goes up shortly after. Only the notifications' identifiers
// travel ("grade:4711"), kept 30 days. Until the account's marks are in, the
// badge waits (at most SYNC_WAIT_MS), so another device's clearing never
// flashes up as new.

const PULL_AGAIN_MS = 30_000;
const PUSH_DELAY_MS = 800;
const SYNC_WAIT_MS = 4_000;
/** Most identifiers per request (as many as the backend takes). */
const PUSH_BATCH = 400;

interface Remote {
  owner: string;
  /** What the account is known to hold. */
  seen: Set<string>;
  cleared: Set<string>;
  /** Read once: from then on, what this device marks is sent. */
  read: boolean;
  pulledAt: number;
  pushing: boolean;
}

let remote: Remote = { owner: '', seen: new Set(), cleared: new Set(), read: false, pulledAt: 0, pushing: false };
let pushTimer: ReturnType<typeof setTimeout> | undefined;

function settle(owner: string) {
  if (store.owner === owner && !store.synced) emit({ ...store, synced: true });
}

function pull(owner: string) {
  if (remote.owner !== owner) remote = { owner, seen: new Set(), cleared: new Set(), read: false, pulledAt: 0, pushing: false };
  if (Date.now() - remote.pulledAt < PULL_AGAIN_MS) return;
  remote.pulledAt = Date.now();
  const wait = setTimeout(() => settle(owner), SYNC_WAIT_MS);
  api.bell.marks()
    .then((marks) => {
      if (remote.owner !== owner || store.owner !== owner) return;
      marks.seen.forEach((k) => remote.seen.add(k));
      marks.cleared.forEach((k) => remote.cleared.add(k));
      remote.read = true;
      saveSeen(mergeSeen(store.seen, marks));
      // What this device marked meanwhile (or before there was an account copy).
      schedulePush();
    })
    // An older backend, offline: the device's own copy stands.
    .catch(() => {})
    .finally(() => {
      clearTimeout(wait);
      settle(owner);
    });
}

function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, PUSH_DELAY_MS);
}

function push() {
  const owner = store.owner;
  if (!owner || remote.owner !== owner || !remote.read || remote.pushing) return;
  const due = unsyncedMarks(store.seen, remote);
  const batch = { seen: due.seen.slice(0, PUSH_BATCH), cleared: due.cleared.slice(0, PUSH_BATCH) };
  if (batch.seen.length === 0 && batch.cleared.length === 0) return;
  remote.pushing = true;
  api.bell.mark(batch)
    .then(() => {
      if (remote.owner !== owner) return;
      batch.seen.forEach((k) => remote.seen.add(k));
      batch.cleared.forEach((k) => { remote.seen.add(k); remote.cleared.add(k); });
      // The rest of a long list, or what was marked while this was on its way.
      schedulePush();
    })
    // Not sent: it goes with the next change or the next reading.
    .catch(() => {})
    .finally(() => { remote.pushing = false; });
}

// ── Reading the answers ──────────────────────────────────────────────────────

function gradesFrom(raw: unknown): GradeIn[] | undefined {
  const subjects = (raw as { subjects?: unknown } | undefined)?.subjects;
  if (!Array.isArray(subjects)) return undefined;
  return (subjects as Array<Record<string, unknown>>).flatMap((s) =>
    ((s.grades ?? []) as Array<Record<string, unknown>>).map((g) => ({
      id: Number(g.id),
      subject: String(s.subjectName ?? ''),
      lessonId: Number(s.lessonId ?? 0),
      value: Number(g.markDisplayValue ?? 0),
      date: Number(g.date ?? 0),
      examType: String(g.examType ?? ''),
    })));
}

function messagesFrom(raw: unknown): MessageIn[] | undefined {
  const root = (raw ?? {}) as Record<string, unknown>;
  const data = (root.data ?? {}) as Record<string, unknown>;
  const list = root.incomingMessages ?? data.incomingMessages ?? root.messages;
  if (!Array.isArray(list)) return undefined;
  return (list as Array<Record<string, unknown> | null>).filter((m): m is Record<string, unknown> => !!m).map((m) => {
    const sender = m.sender && typeof m.sender === 'object' ? m.sender as Record<string, unknown> : {};
    const sent = Date.parse(String(m.sentDateTime ?? m.sentDate ?? m.date ?? ''));
    return {
      id: Number(m.id),
      subject: String(m.subject ?? ''),
      sender: String(sender.displayName ?? sender.name ?? m.senderName ?? ''),
      sent: Number.isNaN(sent) ? 0 : sent,
      read: messageIsRead(m),
    };
  });
}

function remindersFrom(list: ApiReminder[], uid: string | null, username: string): ReminderIn[] {
  return list.map((r) => ({
    id: r.id,
    title: r.title,
    remindAt: Date.parse(r.remindAt),
    createdAt: Date.parse(r.createdAt),
    by: r.createdByUsername || r.createdByName,
    mine: (!!uid && r.createdBy === uid) || r.createdByUsername === username,
  }));
}

function todosFrom(list: ApiTodo[]): TodoIn[] {
  return list.map((td) => ({ id: td.id, title: td.title, dueAt: td.dueAt ? Date.parse(td.dueAt) : null, done: td.done }));
}

function dayOf(key: string, shift = 0): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d + shift).getTime();
}

function streakFrom(a: AccountActivity): { input: StreakIn; view: StreakView } {
  // A quiet today doesn't end the streak yet (the backend counts it the same way).
  const todayActive = a.days[a.days.length - 1]?.active ?? false;
  const lost = lostStreak(a.days.filter((d) => d.active).map((d) => dayOf(d.date)), dayOf(a.today));
  return {
    input: { days: a.totals.currentStreak, end: dayOf(a.today, todayActive ? 0 : -1), lost },
    view: {
      days: a.totals.currentStreak,
      longest: a.totals.longestStreak,
      week: a.days.slice(-7).map((d) => ({ date: d.date, active: d.active })),
    },
  };
}

// ── Asking ───────────────────────────────────────────────────────────────────

interface LoadCtx { owner: string; untis: boolean; username: string; uid: string | null; classId: string | null }

/** Asks for every source not asked yet; `again`: also those asked long enough ago. */
function load(ctx: LoadCtx, again: boolean) {
  const now = Date.now();
  const due = (source: BellSource) => {
    const at = asked[source];
    if (at !== undefined && !(again && now - at > AGAIN_MS[source])) return false;
    asked[source] = now;
    return true;
  };
  const { owner } = ctx;
  const failed = (source: BellSource) => () => { delete asked[source]; };

  if (ctx.untis) {
    // What other pages stored meanwhile counts at once.
    const grades = gradesFrom(getGradesStale());
    const messages = messagesFrom(getMessagesStale());
    if (grades || messages) patch(owner, { ...(grades && { grades }), ...(messages && { messages }) });

    if (due('grades') && (!grades || areGradesStale())) {
      fetchGrades().then((raw) => patch(owner, { grades: gradesFrom(raw) ?? [] })).catch(failed('grades'));
    }
    if (due('messages')) {
      fetchMessages().then((raw) => patch(owner, { messages: messagesFrom(raw) ?? [] })).catch(failed('messages'));
    }
  }

  if (ctx.username && due('todos')) {
    api.todos.list(ctx.username).then((list) => patch(owner, { todos: todosFrom(list) })).catch(failed('todos'));
  }

  if (ctx.classId && due('reminders')) {
    const { classId, uid, username } = ctx;
    api.reminders.list(classId).then((list) => patch(owner, { reminders: remindersFrom(list, uid, username) })).catch(failed('reminders'));
  }

  if (due('streak')) {
    fetchAccountActivity().then(({ data }) => {
      const streak = data ? streakFrom(data) : null;
      patch(owner, { streak: streak?.input ?? null }, streak?.view ?? null);
    });
  }
}

function loadedSources(input: FeedInput): BellSource[] {
  return (['grades', 'messages', 'reminders', 'todos', 'streak'] as const).filter((s) => input[s] !== undefined);
}

// ── The hook ─────────────────────────────────────────────────────────────────

export interface Bell {
  feed: Feed;
  /** Keys of what hasn't been seen. */
  fresh: ReadonlySet<string>;
  newCount: number;
  streak: StreakView | null | undefined;
  /** Nothing has arrived yet. */
  loading: boolean;
  now: number;
  /** Reads the to-dos, the reminders and the account's marks again (on opening). */
  refresh: () => void;
  /** Everything shown counts as seen. */
  seeAll: () => void;
  /** These items leave the feed for good, on every device of the account. */
  clear: (keys: string[]) => void;
}

export function useBell(): Bell {
  const { user } = useSession();
  const { stableUid, classId } = useApp();
  const owner = user?.username.toLowerCase() ?? '';
  const untis = !!user && user.isUntisUser !== false;
  const username = user?.username ?? '';
  const state = useSyncExternalStore(subscribe, snapshot, snapshot);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!owner) return;
    adoptOwner(owner);
    load({ owner, untis, username, uid: stableUid, classId }, false);
    pull(owner);
  }, [owner, untis, username, stableUid, classId]);

  // Times ("vor 5 Min.", "fällig in …") and what is due move with the clock.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // The inbox changes when messages are read (lib/api.ts marks them in storage).
  useEffect(() => {
    if (!owner || !untis) return;
    const onUpdate = () => {
      const messages = messagesFrom(getMessagesStale());
      if (messages) patch(owner, { messages });
    };
    window.addEventListener('pokyh-messages-updated', onUpdate);
    return () => window.removeEventListener('pokyh-messages-updated', onUpdate);
  }, [owner, untis]);

  // Back to the tab after a while: everything again.
  useEffect(() => {
    if (!owner) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || Date.now() - refreshedAt < AWAY_MS) return;
      refreshedAt = Date.now();
      setNow(Date.now());
      load({ owner, untis, username, uid: stableUid, classId }, true);
      pull(owner);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [owner, untis, username, stableUid, classId]);

  const mine = state.owner === owner;
  const input = mine ? state.input : EMPTY_INPUT;
  const cleared = mine ? state.seen.cleared : EMPTY_SEEN.cleared;
  const feed = useMemo(() => withoutCleared(buildFeed(input, now), cleared), [input, now, cleared]);
  const loaded = useMemo(() => loadedSources(input), [input]);
  // Settled while drawing, so a first load never flashes a full badge.
  const seen = mine ? settleSeen(state.seen, feed, loaded, now) : EMPTY_SEEN;
  const fresh = useMemo(() => freshKeys(feed, seen), [feed, seen]);

  useEffect(() => {
    if (mine) saveSeen(seen);
  }, [mine, seen]);

  const refresh = useCallback(() => {
    if (!owner) return;
    setNow(Date.now());
    load({ owner, untis, username, uid: stableUid, classId }, true);
    pull(owner);
  }, [owner, untis, username, stableUid, classId]);

  const seeAll = useCallback(() => {
    if (store.owner === owner) saveSeen(markSeen(settleSeen(store.seen, feed, loaded, Date.now()), feed));
  }, [owner, feed, loaded]);

  const clear = useCallback((keys: string[]) => {
    if (store.owner === owner) saveSeen(clearKeys(store.seen, keys));
  }, [owner]);

  return {
    feed,
    fresh,
    newCount: mine && state.synced ? fresh.size : 0,
    streak: mine ? state.streak : undefined,
    loading: loaded.length === 0,
    now,
    refresh,
    seeAll,
    clear,
  };
}
