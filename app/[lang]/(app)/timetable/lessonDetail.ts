'use client';

import type { TimetableEntry } from '@/lib/types';
import type { TimetableKey } from '@/lib/i18n/dictionaries/timetable';

// What a lesson's detail (WebUntis calendar-entry/detail) adds to the
// timetable's own fields: the lesson texts, classes, group, exam and
// homework. Fetched once per lesson and kept for a few minutes, and already
// asked for when a lesson is pointed at, pressed or focused (prefetchLesson),
// so the popup usually opens with everything at once.

export interface LessonDetail {
  texts: Array<{ label: TimetableKey; text: string }>;
  classes: string[];
  group: string;
  examName: string;
  examDescription: string;
  homeworks: Array<{ id: number; text: string }>;
}

type LessonRef = Pick<TimetableEntry, 'date' | 'startTime' | 'endTime'>;

const KEEP_MS = 5 * 60_000;
const cache = new Map<string, { at: number; promise: Promise<LessonDetail | null>; value?: LessonDetail | null }>();

const keyOf = (l: LessonRef) => `${l.date}-${l.startTime}-${l.endTime}`;

/** Plain text from WebUntis' rich text: line breaks kept, tags and entities resolved. */
function plain(v: unknown): string {
  if (typeof v !== 'string' || !v.trim()) return '';
  if (!/[<&]/.test(v)) return v.trim();
  const html = v.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d)>/gi, '\n');
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

function names(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (x && typeof x === 'object' ? plain((x as Record<string, unknown>).displayName ?? (x as Record<string, unknown>).name ?? (x as Record<string, unknown>).shortName) : ''))
    .filter(Boolean);
}

/**
 * The texts WebUntis keeps on a lesson besides the timetable's: lesson content,
 * the teacher's note for everyone, the lesson info and the substitution text,
 * plus the classes, the group, the exam and the homework due. Every field is
 * optional; whatever is missing is simply not shown.
 */
function parse(entries: Array<Record<string, unknown>>): LessonDetail {
  const texts: LessonDetail['texts'] = [];
  const classes = new Set<string>();
  let group = '';
  let examName = '';
  let examDescription = '';
  const homeworks: LessonDetail['homeworks'] = [];
  for (const e of entries) {
    for (const [label, key] of [['teachingContent', 'teachingContent'], ['notesAll', 'notesAll'], ['note', 'lessonInfo'], ['substitutionText', 'substText']] as Array<[TimetableKey, string]>) {
      const text = plain(e[key]);
      if (text) texts.push({ label, text });
    }
    names(e.klasses).forEach((k) => classes.add(k));
    const mainGroup = e.mainStudentGroup && typeof e.mainStudentGroup === 'object' ? e.mainStudentGroup as Record<string, unknown> : null;
    group ||= plain(mainGroup?.name ?? mainGroup?.displayName);
    const exam = e.exam && typeof e.exam === 'object' ? e.exam as Record<string, unknown> : null;
    examName ||= plain(exam?.name);
    examDescription ||= plain(exam?.description);
    if (Array.isArray(e.homeworks)) {
      for (const h of e.homeworks as Array<{ id?: number; text?: unknown }>) {
        const text = plain(h?.text);
        if (text) homeworks.push({ id: h.id ?? homeworks.length, text });
      }
    }
  }
  return { texts, classes: [...classes], group, examName, examDescription, homeworks };
}

/** The lesson's detail, from the cache when it was asked for a moment ago; `null` when it could not be loaded. */
export function loadLessonDetail(lesson: LessonRef): Promise<LessonDetail | null> {
  const key = keyOf(lesson);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < KEEP_MS) return hit.promise;
  const entry: { at: number; promise: Promise<LessonDetail | null>; value?: LessonDetail | null } = { at: Date.now(), promise: Promise.resolve(null) };
  entry.promise = fetch(`/api/webuntis/lesson-detail?date=${lesson.date}&startTime=${lesson.startTime}&endTime=${lesson.endTime}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const list: unknown = data?.calendarEntries;
      if (!Array.isArray(list)) throw new Error('no detail');
      const value = parse(list.filter((e): e is Record<string, unknown> => !!e && typeof e === 'object'));
      entry.value = value;
      return value;
    })
    .catch(() => {
      // Not kept: the next open asks again.
      if (cache.get(key) === entry) cache.delete(key);
      return null;
    });
  cache.set(key, entry);
  return entry.promise;
}

/** The detail if it is already here (`undefined` while it is not). */
export function peekLessonDetail(lesson: LessonRef): LessonDetail | undefined {
  const hit = cache.get(keyOf(lesson));
  return hit && Date.now() - hit.at < KEEP_MS && hit.value ? hit.value : undefined;
}

/** Starts loading a lesson's detail ahead of the tap. Cancelled lessons have none worth fetching. */
export function prefetchLesson(lesson: LessonRef & { isCancelled?: boolean }): void {
  if (lesson.isCancelled) return;
  void loadLessonDetail(lesson);
}
