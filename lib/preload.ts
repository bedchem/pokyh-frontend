'use client';

// Loading on intent: when the pointer rests on a link into the app, a finger
// touches it or it gets keyboard focus, the live data of the page behind it
// starts loading, so the page opens with it already there. The loaders are
// the pages' own requests (lib/api.ts) with the same addresses: the page then
// shares a request still under way, or takes the answer the memory or device
// copy already holds. Nothing is loaded that a page would not load itself,
// and a message is only preloaded once it is read, because opening one in
// WebUntis is what marks it read.

import { format, addDays } from 'date-fns';
import {
  fetchAbsences,
  fetchAbsencesRange,
  fetchClassregEvents,
  fetchClassServices,
  fetchExams,
  fetchGrades,
  fetchHomeworkRange,
  fetchMessageDetail,
  fetchMessages,
  fetchTimetable,
  getMessagesStale,
} from './api';
import { dateNumOf, dateOf, isoDate, mondayOf } from './timetable-logic';
import { messageIsRead, schoolWeek } from './untis-parse';

/** A pointer only passing over a link on its way elsewhere is no intent. */
const DWELL_MS = 60;
/** The same page is not loaded again sooner. */
const AGAIN_MS = 20_000;

const currentSchoolYear = () => {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
};

// A message of the stored inbox that is already read.
function readMessage(id: number): boolean {
  const root = (getMessagesStale('inbox') ?? {}) as Record<string, unknown>;
  const data = (root.data ?? {}) as Record<string, unknown>;
  const list = (root.incomingMessages ?? data.incomingMessages ?? []) as Array<Record<string, unknown>>;
  const m = Array.isArray(list) ? list.find((x) => x?.id === id) : undefined;
  return !!m && messageIsRead(m);
}

/** The requests a page makes first, by its path without the language. */
function loadersFor(path: string): (() => Promise<unknown>)[] {
  const week = (offset: number) => isoDate(mondayOf(offset));
  const message = path.match(/^\/messages\/(\d+)$/);
  if (message) {
    const id = Number(message[1]);
    return readMessage(id) ? [() => fetchMessageDetail(id)] : [];
  }
  if (path.startsWith('/grades/subject/')) return [() => fetchGrades()];
  switch (path) {
    case '/home': {
      const today = new Date();
      return [
        () => fetchTimetable(week(0)), () => fetchTimetable(week(1)), () => fetchTimetable(week(2)),
        () => fetchGrades(), () => fetchMessages(), () => fetchAbsences(),
        () => fetchExams(format(today, 'yyyyMMdd'), format(addDays(today, 14), 'yyyyMMdd')),
      ];
    }
    case '/timetable':
      return [
        () => fetchTimetable(week(0)),
        () => fetchAbsencesRange(String(dateNumOf(mondayOf(0))), String(dateNumOf(dateOf(0, 5)))),
      ];
    case '/grades':
      return [() => fetchGrades(currentSchoolYear())];
    case '/messages':
      return [() => fetchMessages('inbox')];
    case '/absences':
      return [() => fetchAbsences(currentSchoolYear())];
    case '/classregevents':
      return [() => fetchClassregEvents(currentSchoolYear())];
    case '/class': {
      const now = schoolWeek(0);
      const next = schoolWeek(1);
      return [
        () => fetchClassregEvents(), () => fetchClassServices(), () => fetchAbsences(),
        () => fetchExams(now.startStr, now.endStr), () => fetchExams(next.startStr, next.endStr),
        () => fetchHomeworkRange(now.startStr, next.endStr),
      ];
    }
    default:
      return [];
  }
}

const loadedAt = new Map<string, number>();

/** The app path of a link (`/de/messages/12/` → `/messages/12`), or null for anything else. */
function appPath(anchor: HTMLAnchorElement): string | null {
  if (anchor.origin !== window.location.origin || anchor.target === '_blank' || anchor.hasAttribute('download')) return null;
  const path = anchor.pathname.replace(/^\/(de|it|en)(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  return path === window.location.pathname.replace(/^\/(de|it|en)(?=\/|$)/, '').replace(/\/+$/, '') ? null : path;
}

function preload(anchor: HTMLAnchorElement): void {
  const path = appPath(anchor);
  if (!path) return;
  const now = Date.now();
  if (now - (loadedAt.get(path) ?? 0) < AGAIN_MS) return;
  const loaders = loadersFor(path);
  if (loaders.length === 0) return;
  loadedAt.set(path, now);
  // Errors are the page's to show; a preload stays quiet.
  for (const load of loaders) load().catch(() => {});
}

/**
 * Starts loading on intent for every link of the page; only while signed in
 * with WebUntis (the caller's to decide). Returns the clean-up.
 */
export function installIntentPreload(): () => void {
  let timer: number | undefined;
  let pending: HTMLAnchorElement | null = null;
  const anchorOf = (target: EventTarget | null) =>
    target instanceof Element ? target.closest<HTMLAnchorElement>('a[href]') : null;

  const now = (target: EventTarget | null) => {
    const anchor = anchorOf(target);
    if (anchor) preload(anchor);
  };
  const over = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const anchor = anchorOf(e.target);
    if (!anchor || anchor === pending) return;
    window.clearTimeout(timer);
    pending = anchor;
    timer = window.setTimeout(() => {
      pending = null;
      preload(anchor);
    }, DWELL_MS);
  };
  const out = (e: PointerEvent) => {
    if (!pending || (e.relatedTarget instanceof Node && pending.contains(e.relatedTarget))) return;
    window.clearTimeout(timer);
    pending = null;
  };
  const down = (e: PointerEvent) => now(e.target);
  const focus = (e: FocusEvent) => now(e.target);

  document.addEventListener('pointerover', over, { passive: true });
  document.addEventListener('pointerout', out, { passive: true });
  document.addEventListener('pointerdown', down, { passive: true });
  document.addEventListener('focusin', focus);
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener('pointerover', over);
    document.removeEventListener('pointerout', out);
    document.removeEventListener('pointerdown', down);
    document.removeEventListener('focusin', focus);
  };
}
