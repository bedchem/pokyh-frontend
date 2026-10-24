// The absence rate: missed lesson minutes against the lesson minutes the
// school year has had so far. The absences page and the home page both work
// it out here, from the same data, so they show the same figures.
//
// The missed minutes of an absence are the school's own (WebUntis
// "Fehlzeiten") where it gives them, else worked out from the timetable, else
// WebUntis' lesson hours × the school's usual lesson length. The whole is every
// lesson of the timetable from 1 September that has ended, or, for the whole
// year, every lesson the timetable has up to 30 June. Nothing about the
// school's hours is assumed: it all comes from its timetable.
//
// The timetable takes a request per week, so the lessons of each week are kept
// on the device (localStorage "pokyh_abscalc_<student>_<year>", school data
// like the other caches). A week that is over is asked for again after a week,
// the running one after half an hour, one still to come after a day (only the
// whole year needs those), and a week that could not be loaded is
// asked for again next time: until every week is there, there is no rate,
// rather than one counted from a year with weeks missing.

import type { AbsenceEntry } from './types';

const CALC_CACHE_PREFIX = 'pokyh_abscalc_';
const CURRENT_WEEK_TTL = 30 * 60 * 1000;
const PAST_WEEK_TTL = 7 * 24 * 60 * 60 * 1000;
const FUTURE_WEEK_TTL = 24 * 60 * 60 * 1000;
// Weeks asked for at the same time; all of them at once get refused.
const PARALLEL_WEEKS = 3;
// An absence spanning more than this is taken as a mistake in its dates.
const MAX_ABSENCE_WEEKS = 60;

/** A lesson as [start, end] in minutes of the day; lessons at the same time are merged. */
export type LessonSlot = [number, number];

interface StoredWeek {
  /** When the week was loaded (epoch ms). */
  at: number;
  /** The lessons per day (YYYYMMDD). */
  days: Record<string, LessonSlot[]>;
}

/** The lessons of a school year, per week (its Monday, YYYY-MM-DD). */
export interface LessonCalendar {
  v: 2;
  weeks: Record<string, StoredWeek>;
}

/** The school's own minutes per missed lesson (lib/api.ts AbsenceTimes). */
export interface OfficialMinutes {
  lessons?: readonly { absenceId: number; minutes: number }[];
}

const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayNumOf = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
const dateOfNum = (n: number) => new Date(Math.floor(n / 10000), (Math.floor(n / 100) % 100) - 1, n % 100);

function mondayOf(d: Date): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = m.getDay();
  m.setDate(m.getDate() - (dow === 0 ? 6 : dow - 1));
  return m;
}

/**
 * A WebUntis time in minutes of the day. The classreg absences answer HHMM
 * (755 = 07:55) or already minutes (475 = 07:55): a value that cannot be
 * HHMM is taken as minutes.
 */
export function toMinutes(t: number): number {
  if (!t) return 0;
  if (t > 2359) return t;
  if (t % 100 > 59) return t;
  return Math.floor(t / 100) * 60 + (t % 100);
}

/** September of the school year a date belongs to (it starts on 1 September). */
export function schoolYearOf(d = new Date()): number {
  return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
}

// The moment the school year counts up to: now, or the end of 30 June for
// the whole year and for a year that is over.
function countUntil(year: number, now: Date, whole: boolean): Date {
  const end = new Date(year + 1, 5, 30, 23, 59);
  return !whole && now < end ? now : end;
}

/** The Mondays of the weeks from 1 September up to now (`whole`: up to 30 June). */
export function schoolYearWeeks(year: number, now = new Date(), whole = false): string[] {
  const until = countUntil(year, now, whole);
  const out: string[] = [];
  for (const d = mondayOf(new Date(year, 8, 1)); d <= until; d.setDate(d.getDate() + 7)) out.push(isoOf(d));
  return out;
}

/** The Mondays of the weeks the absences touch. */
export function absenceWeeks(absences: readonly AbsenceEntry[]): string[] {
  const out = new Set<string>();
  for (const a of absences) {
    const end = dateOfNum(a.endDate);
    let n = 0;
    for (const d = mondayOf(dateOfNum(a.startDate)); d <= end && n < MAX_ABSENCE_WEEKS; d.setDate(d.getDate() + 7), n++) out.add(isoOf(d));
  }
  return [...out];
}

type GridEntry = {
  status?: string;
  position2?: Array<{ current?: unknown; removed?: unknown }>;
  duration?: { start?: string; end?: string };
};

function clockOf(iso: string | undefined): number | null {
  const time = iso?.split('T')[1];
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

function mergeSlots(slots: LessonSlot[]): LessonSlot[] {
  const out: LessonSlot[] = [];
  for (const [start, end] of [...slots].sort((a, b) => a[0] - b[0])) {
    const last = out[out.length - 1];
    // Overlapping only: lessons one after the other stay apart, so each counts once it has ended.
    if (last && start < last[1]) last[1] = Math.max(last[1], end);
    else out.push([start, end]);
  }
  return out;
}

/**
 * The lessons per day (YYYYMMDD) of a week of the timetable. Cancelled
 * lessons and entries without a subject (breaks) are left out; lessons at the
 * same time (groups of the class) count once. Null for an answer that is not
 * a timetable week, so it is not kept as a week without lessons.
 */
export function lessonsOfWeek(json: unknown): Record<string, LessonSlot[]> | null {
  const root = (json ?? {}) as { days?: unknown };
  if (!Array.isArray(root.days)) return null;
  const days: Record<string, LessonSlot[]> = {};
  for (const day of root.days as Array<{ date?: unknown; gridEntries?: GridEntry[] }>) {
    if (typeof day?.date !== 'string') continue;
    const slots: LessonSlot[] = [];
    for (const ge of Array.isArray(day.gridEntries) ? day.gridEntries : []) {
      if (ge.status === 'CANCELLED') continue;
      if (!(ge.position2 ?? []).some((p) => p.current || p.removed)) continue;
      const start = clockOf(ge.duration?.start);
      const end = clockOf(ge.duration?.end);
      if (start === null || end === null || end <= start) continue;
      slots.push([start, end]);
    }
    if (slots.length) days[day.date.replace(/-/g, '')] = mergeSlots(slots);
  }
  return days;
}

const storageKey = (studentId: number, year: number) => `${CALC_CACHE_PREFIX}${studentId}_${year}`;

export function readLessonCalendar(studentId: number, year: number): LessonCalendar | null {
  if (!studentId || typeof window === 'undefined') return null;
  try {
    const o = JSON.parse(window.localStorage.getItem(storageKey(studentId, year)) ?? 'null') as LessonCalendar | null;
    // Kept by an earlier version (a finished sum instead of the weeks): worked out again.
    return o && o.v === 2 && o.weeks && typeof o.weeks === 'object' ? o : null;
  } catch {
    return null;
  }
}

function writeLessonCalendar(studentId: number, year: number, cal: LessonCalendar): void {
  if (!studentId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(studentId, year), JSON.stringify(cal));
  } catch { /* storage full or blocked */ }
}

function isDue(week: StoredWeek | undefined, monday: string, now: number): boolean {
  if (!week) return true;
  const [y, m, d] = monday.split('-').map(Number);
  const starts = new Date(y, m - 1, d).getTime();
  const over = new Date(y, m - 1, d + 7).getTime();
  // Loaded before the week was over: lessons may have been cancelled since.
  const ttl = week.at >= over ? PAST_WEEK_TTL : now < starts ? FUTURE_WEEK_TTL : CURRENT_WEEK_TTL;
  return now - week.at > ttl;
}

/**
 * Loads the weeks of the school year so far (`whole`: up to 30 June, and
 * `extraWeeks`) that are not kept yet or are due again, a few at a time,
 * and keeps them. A week that fails stays as it was. Rejects with
 * `session_expired` when the session ran out.
 */
export async function refreshLessonCalendar(
  studentId: number,
  year: number,
  fetchWeek: (monday: string) => Promise<unknown>,
  extraWeeks: readonly string[] = [],
  now = new Date(),
  whole = false,
): Promise<LessonCalendar> {
  const cal: LessonCalendar = readLessonCalendar(studentId, year) ?? { v: 2, weeks: {} };
  const due = [...new Set([...schoolYearWeeks(year, now, whole), ...extraWeeks])].filter((m) => isDue(cal.weeks[m], m, now.getTime()));
  let next = 0;
  let expired = false;
  const worker = async () => {
    while (next < due.length && !expired) {
      const monday = due[next++];
      try {
        const days = lessonsOfWeek(await fetchWeek(monday));
        if (days) cal.weeks[monday] = { at: now.getTime(), days };
      } catch (e) {
        if (e instanceof Error && e.message === 'session_expired') expired = true;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL_WEEKS, due.length) }, worker));
  if (due.length) writeLessonCalendar(studentId, year, cal);
  if (expired) throw new Error('session_expired');
  return cal;
}

/** Whether every week of the school year so far (`whole`: up to 30 June) is kept. */
export function hasWholeYear(cal: LessonCalendar | null, year: number, now = new Date(), whole = false): cal is LessonCalendar {
  return !!cal && schoolYearWeeks(year, now, whole).every((m) => m in cal.weeks);
}

/**
 * Lesson minutes of the school year so far: every lesson from 1 September
 * that has ended (`whole`: every lesson up to 30 June).
 */
export function possibleMinutes(cal: LessonCalendar, year: number, now = new Date(), whole = false): number {
  const from = year * 10000 + 901;
  const until = countUntil(year, now, whole);
  const today = dayNumOf(until);
  const clock = until.getHours() * 60 + until.getMinutes();
  let total = 0;
  for (const week of Object.values(cal.weeks)) {
    for (const [key, slots] of Object.entries(week.days)) {
      const day = Number(key);
      if (day < from || day > today) continue;
      for (const [start, end] of slots) if (day < today || end <= clock) total += end - start;
    }
  }
  return total;
}

// The lesson minutes an absence covers; null where a week of it is not kept.
function minutesFromLessons(a: AbsenceEntry, cal: LessonCalendar): number | null {
  const multiDay = a.startDate !== a.endDate;
  const absStart = toMinutes(a.startTime);
  const absEnd = toMinutes(a.endTime);
  const end = dateOfNum(a.endDate);
  let total = 0;
  let n = 0;
  for (const d = dateOfNum(a.startDate); d <= end && n < MAX_ABSENCE_WEEKS * 7; d.setDate(d.getDate() + 1), n++) {
    const week = cal.weeks[isoOf(mondayOf(d))];
    if (!week) return null;
    const day = dayNumOf(d);
    for (const [slotStart, slotEnd] of week.days[String(day)] ?? []) {
      let from = slotStart;
      let to = slotEnd;
      // Times are those of the first and the last day; days between are whole.
      if (absStart > 0 && (!multiDay || day === a.startDate)) from = Math.max(from, absStart);
      if (absEnd > 0 && (!multiDay || day === a.endDate)) to = Math.min(to, absEnd);
      if (to > from) total += to - from;
    }
  }
  return total;
}

// The most common length of a lesson, from the timetable or the school's own
// minutes; only with neither the usual 50.
function usualLessonMinutes(cal: LessonCalendar | null, official: OfficialMinutes | null | undefined): number {
  const count = new Map<number, number>();
  for (const week of Object.values(cal?.weeks ?? {})) {
    for (const slots of Object.values(week.days)) for (const [start, end] of slots) count.set(end - start, (count.get(end - start) ?? 0) + 1);
  }
  if (!count.size) for (const l of official?.lessons ?? []) if (l.minutes > 0) count.set(l.minutes, (count.get(l.minutes) ?? 0) + 1);
  let best = 50;
  let most = 0;
  for (const [length, n] of count) if (n > most) { best = length; most = n; }
  return best;
}

export interface AbsenceFigures {
  /** Missed minutes per absence id. */
  perAbsence: Map<number, number>;
  minutes: number;
  excusedMinutes: number;
  /** Lesson minutes of the school year so far (or the whole year); null until every week is kept. */
  possible: number | null;
  rate: number | null;
}

export function absenceFigures(
  absences: readonly AbsenceEntry[],
  cal: LessonCalendar | null,
  official: OfficialMinutes | null | undefined,
  year: number,
  now = new Date(),
  whole = false,
): AbsenceFigures {
  const fromSchool = new Map<number, number>();
  for (const l of official?.lessons ?? []) fromSchool.set(l.absenceId, (fromSchool.get(l.absenceId) ?? 0) + l.minutes);
  const lesson = usualLessonMinutes(cal, official);
  const perAbsence = new Map<number, number>();
  let minutes = 0;
  let excusedMinutes = 0;
  for (const a of absences) {
    const m = fromSchool.get(a.id) ?? (cal ? minutesFromLessons(a, cal) : null) ?? a.hours * lesson;
    perAbsence.set(a.id, m);
    minutes += m;
    if (a.isExcused) excusedMinutes += m;
  }
  const possible = hasWholeYear(cal, year, now, whole) ? possibleMinutes(cal, year, now, whole) : null;
  const rate = possible ? Math.min(100, (minutes / possible) * 100) : null;
  return { perAbsence, minutes, excusedMinutes, possible, rate };
}
