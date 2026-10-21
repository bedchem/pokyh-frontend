'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { areGradesStale, fetchGrades, fetchMessages, getGradesStale, getMessagesStale } from '@/lib/api';
import { api, type ApiReminder, type ApiTodo } from '@/lib/api-client';
import { fetchAccountActivity, type AccountActivity } from '@/lib/account-activity';
import { messageIsRead } from '@/lib/untis-parse';
import {
  buildFeed, freshKeys, markSeen, readSeen, settleSeen,
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
// reads everything again. What was seen is remembered on the device, per
// account.

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
}

const EMPTY_SEEN: SeenState = { keys: [], sources: [] };
const EMPTY_INPUT: FeedInput = {};
let store: BellStore = { owner: '', input: EMPTY_INPUT, seen: EMPTY_SEEN, streak: undefined };
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
  emit({ owner, input: EMPTY_INPUT, seen, streak: undefined });
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
  return {
    input: { days: a.totals.currentStreak, end: dayOf(a.today, todayActive ? 0 : -1) },
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
  /** Reads the to-dos and reminders again (on opening). */
  refresh: () => void;
  /** Everything shown counts as seen. */
  seeAll: () => void;
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
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [owner, untis, username, stableUid, classId]);

  const mine = state.owner === owner;
  const input = mine ? state.input : EMPTY_INPUT;
  const feed = useMemo(() => buildFeed(input, now), [input, now]);
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
  }, [owner, untis, username, stableUid, classId]);

  const seeAll = useCallback(() => {
    if (store.owner === owner) saveSeen(markSeen(settleSeen(store.seen, feed, loaded, Date.now()), feed));
  }, [owner, feed, loaded]);

  return {
    feed,
    fresh,
    newCount: fresh.size,
    streak: mine ? state.streak : undefined,
    loading: loaded.length === 0,
    now,
    refresh,
    seeAll,
  };
}
