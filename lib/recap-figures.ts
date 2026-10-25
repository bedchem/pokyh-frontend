// A recap's WebUntis figures (components/recap): what the timetable,
// absences, grades, exams, homework and class register of a period add up
// to. Worked out here, on the device, from the answers lib/recap-data.ts
// loads with the student's own session; nothing of it is sent anywhere.
// Pure and self-contained, so it is tested on its own (tests/recap.test.mjs).
//
//   lessons in school  every lesson of the period that has ended and was not
//                      cancelled (lessons at the same time count once)
//   missed minutes     the school's own ("Fehlzeiten") where it gives them,
//                      else worked out from the timetable, else lesson hours
//                      × the school's usual lesson length
//   absence rate       missed minutes against the lesson minutes, only when
//                      every week of the period could be loaded

/** [start, end (minutes of the day), subject, teacher(s), room, state]; state 0 lesson, 1 cancelled, 2 substitution, 3 exam. */
export type RecapLesson = [number, number, string, string, string, number];

export interface RecapWeek {
  /** When the week was loaded (epoch ms). */
  at: number;
  /** The lessons per day (YYYYMMDD). */
  days: Record<string, RecapLesson[]>;
}

export const LESSON = 0;
export const CANCELLED = 1;
export const SUBSTITUTION = 2;
export const EXAM = 3;

const pad = (n: number) => String(n).padStart(2, '0');
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dayNumOf = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
export const dateOfNum = (n: number) => new Date(Math.floor(n / 10000), (Math.floor(n / 100) % 100) - 1, n % 100);
/** "YYYY-MM-DD" → YYYYMMDD */
export const numOfIso = (iso: string) => Number(iso.replace(/-/g, ''));

export function mondayOf(d: Date): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = m.getDay();
  m.setDate(m.getDate() - (dow === 0 ? 6 : dow - 1));
  return m;
}

/** Monday = 0 … Sunday = 6 for YYYYMMDD. */
export function weekdayOfNum(n: number): number {
  return (dateOfNum(n).getDay() + 6) % 7;
}

/** The Mondays (YYYY-MM-DD) of the weeks from `from` up to the earlier of `to` and `now`. */
export function periodWeeks(from: number, to: number, now = new Date()): string[] {
  const end = Math.min(to, dayNumOf(now));
  const out: string[] = [];
  if (end < from) return out;
  const last = dateOfNum(end);
  for (const d = mondayOf(dateOfNum(from)); d <= last; d.setDate(d.getDate() + 7)) out.push(isoOf(d));
  return out;
}

/** A WebUntis time in minutes of the day: HHMM (755) or already minutes (475). */
export function toMinutes(t: number): number {
  if (!t) return 0;
  if (t > 2359) return t;
  if (t % 100 > 59) return t;
  return Math.floor(t / 100) * 60 + (t % 100);
}

// ── A week of the timetable ─────────────────────────────────────────────────

interface Position { current?: { displayName?: string; longName?: string; status?: string } | null; removed?: { displayName?: string; longName?: string } | null }
interface GridEntry {
  status?: string;
  type?: string;
  duration?: { start?: string; end?: string };
  position1?: Position[];
  position2?: Position[];
  position3?: Position[];
}

function clockOf(iso: string | undefined): number | null {
  const time = iso?.split('T')[1];
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

const names = (positions: Position[] | undefined, long: boolean) =>
  (positions ?? []).map((p) => (long ? p.current?.longName || p.current?.displayName : p.current?.displayName) ?? '').filter(Boolean).join(', ');

/**
 * The lessons per day of a week of the timetable (GET /webuntis/timetable).
 * Entries without a subject (breaks, events) are left out. Null for an
 * answer that is not a timetable week, so it is not kept as an empty week.
 */
export function recapLessonsOfWeek(json: unknown): Record<string, RecapLesson[]> | null {
  const root = (json ?? {}) as { days?: unknown };
  if (!Array.isArray(root.days)) return null;
  const days: Record<string, RecapLesson[]> = {};
  for (const day of root.days as Array<{ date?: unknown; gridEntries?: GridEntry[] }>) {
    if (typeof day?.date !== 'string') continue;
    const lessons: RecapLesson[] = [];
    for (const ge of Array.isArray(day.gridEntries) ? day.gridEntries : []) {
      const subject = (ge.position2 ?? []).find((p) => p.current || p.removed);
      if (!subject) continue;
      const start = clockOf(ge.duration?.start);
      const end = clockOf(ge.duration?.end);
      if (start === null || end === null || end <= start) continue;
      const subjectName = subject.current?.longName || subject.current?.displayName || subject.removed?.longName || subject.removed?.displayName || '';
      const teacherChanged = (ge.position1 ?? []).some((p) => p.removed || (p.current?.status && p.current.status !== 'REGULAR'));
      const state = ge.status === 'CANCELLED' ? CANCELLED
        : ge.type === 'EXAM' ? EXAM
        : ge.status === 'CHANGED' && teacherChanged ? SUBSTITUTION
        : LESSON;
      lessons.push([start, end, subjectName, names(ge.position1, true), names(ge.position3, false), state]);
    }
    if (lessons.length) days[day.date.replace(/-/g, '')] = lessons.sort((a, b) => a[0] - b[0]);
  }
  return days;
}

// ── Figures ─────────────────────────────────────────────────────────────────

export interface Ranked {
  name: string;
  /** Minutes (subjects) or lessons (teachers, rooms). */
  value: number;
  lessons: number;
}

export interface SchoolFigures {
  /** Days with a lesson that has ended. */
  days: number;
  lessons: number;
  /** Lesson minutes (lessons at the same time once). */
  minutes: number;
  cancelled: number;
  substitutions: number;
  subjects: Ranked[];
  teachers: Ranked[];
  rooms: Ranked[];
  /** The day from the first lesson to the last was longest. */
  longestDay: { date: number; start: number; end: number } | null;
  earliest: { date: number; start: number } | null;
  latest: { date: number; end: number } | null;
  /** Lesson minutes per weekday, Monday first. */
  weekdays: number[];
}

export interface AbsenceFigures {
  /** Absences (WebUntis entries) in the period. */
  entries: number;
  openEntries: number;
  missedMinutes: number;
  excusedMinutes: number;
  /** Lesson minutes of the period so far; null when a week is missing. */
  possibleMinutes: number | null;
  /** Percent; null when a week is missing. */
  rate: number | null;
  /** Days with a missed lesson. */
  missedDays: number;
  bySubject: Ranked[];
  /** Missed minutes per weekday, Monday first. */
  byWeekday: number[];
  /** The school's own minutes ("Fehlzeiten") were used. */
  official: boolean;
}

export interface GradeFigures {
  count: number;
  average: number;
  positive: number;
  negative: number;
  subjects: Array<{ name: string; average: number; count: number }>;
  best: { name: string; average: number; count: number } | null;
  top: { value: number; name: string; date: number } | null;
}

export interface UntisRecap {
  /** Every week of the period could be loaded. */
  complete: boolean;
  weeksLoaded: number;
  weeksTotal: number;
  school: SchoolFigures | null;
  absences: AbsenceFigures | null;
  grades: GradeFigures | null;
  exams: number | null;
  homework: number | null;
  classreg: number | null;
}

export interface AbsenceLike {
  id: number;
  startDate: number;
  endDate: number;
  startTime: number;
  endTime: number;
  isExcused: boolean;
  hours: number;
  subjectName?: string;
}

export interface RecapSources {
  /** YYYYMMDD, both included. */
  from: number;
  to: number;
  now?: Date;
  weeks: Record<string, RecapWeek>;
  absences?: readonly AbsenceLike[] | null;
  times?: { lessons: ReadonlyArray<{ absenceId: number; minutes: number; subject: string; excused: boolean; date?: number }> } | null;
  grades?: ReadonlyArray<{ subjectName: string; grades: ReadonlyArray<{ date: number; markDisplayValue: number }> }> | null;
  exams?: ReadonlyArray<{ examDate: number }> | null;
  homework?: ReadonlyArray<{ id?: number; date: number }> | null;
  classreg?: ReadonlyArray<{ createDate: number }> | null;
}

function ranked(map: Map<string, { value: number; lessons: number }>, limit = 5): Ranked[] {
  return [...map.entries()]
    .map(([name, v]) => ({ name, value: v.value, lessons: v.lessons }))
    .sort((a, b) => b.value - a.value || b.lessons - a.lessons || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function bump(map: Map<string, { value: number; lessons: number }>, name: string, value: number) {
  if (!name) return;
  const e = map.get(name) ?? { value: 0, lessons: 0 };
  e.value += value;
  e.lessons += 1;
  map.set(name, e);
}

/** Lessons at the same time once: merged [start, end] spans. */
function mergedSpans(lessons: readonly RecapLesson[]): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const [start, end] of [...lessons].sort((a, b) => a[0] - b[0])) {
    const last = out[out.length - 1];
    if (last && start < last[1]) last[1] = Math.max(last[1], end);
    else out.push([start, end]);
  }
  return out;
}

interface Day { date: number; lessons: RecapLesson[] }

// The days of the period up to now, with the lessons that have ended (or
// all of them, `all`, for cancellations which may lie later in the day).
function periodDays(src: RecapSources, now: Date): Day[] {
  const today = dayNumOf(now);
  const clock = now.getHours() * 60 + now.getMinutes();
  const until = Math.min(src.to, today);
  const out: Day[] = [];
  for (const week of Object.values(src.weeks)) {
    for (const [key, lessons] of Object.entries(week.days)) {
      const date = Number(key);
      if (date < src.from || date > until) continue;
      out.push({ date, lessons: date < today ? lessons : lessons.filter((l) => l[1] <= clock) });
    }
  }
  return out.sort((a, b) => a.date - b.date);
}

// The length of one lesson ("Stunde") in the period: the most common length
// among entries of up to an hour; 50 without any. A double lesson the
// timetable shows as one entry counts as two.
function singleLesson(days: Day[]): number {
  const lengths = new Map<number, number>();
  for (const d of days) for (const l of d.lessons) if (l[1] - l[0] <= 60) lengths.set(l[1] - l[0], (lengths.get(l[1] - l[0]) ?? 0) + 1);
  let best = 50, most = 0;
  for (const [length, n] of lengths) if (n > most || (n === most && length > best)) { best = length; most = n; }
  return best;
}

/** How many lessons ("Stunden") an entry is. */
const periodsOf = (l: RecapLesson, single: number) => Math.max(1, Math.round((l[1] - l[0]) / single));

/** Each lesson once: the same lesson twice (groups of the class) is one. */
function distinct(lessons: readonly RecapLesson[]): RecapLesson[] {
  const seen = new Set<string>();
  return lessons.filter((l) => {
    const key = `${l[0]}-${l[1]}-${l[2]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function count(map: Map<string, { value: number; lessons: number }>, name: string, value: number, lessons: number) {
  const key = name.trim();
  if (!key) return;
  const e = map.get(key) ?? { value: 0, lessons: 0 };
  e.value += value;
  e.lessons += lessons;
  map.set(key, e);
}

function schoolFigures(days: Day[]): SchoolFigures {
  const single = singleLesson(days);
  const subjects = new Map<string, { value: number; lessons: number }>();
  const teachers = new Map<string, { value: number; lessons: number }>();
  const rooms = new Map<string, { value: number; lessons: number }>();
  const weekdays = Array.from({ length: 7 }, () => 0);
  let lessons = 0, minutes = 0, cancelled = 0, substitutions = 0, schoolDays = 0;
  let longestDay: SchoolFigures['longestDay'] = null;
  let earliest: SchoolFigures['earliest'] = null;
  let latest: SchoolFigures['latest'] = null;
  for (const day of days) {
    const all = distinct(day.lessons);
    for (const l of all) if (l[5] === CANCELLED) cancelled += periodsOf(l, single);
    const held = all.filter((l) => l[5] !== CANCELLED);
    if (!held.length) continue;
    schoolDays += 1;
    for (const l of held) {
      const n = periodsOf(l, single);
      lessons += n;
      if (l[5] === SUBSTITUTION) substitutions += n;
      count(subjects, l[2], l[1] - l[0], n);
      for (const t of l[3].split(', ')) count(teachers, t, n, n);
      for (const r of l[4].split(', ')) count(rooms, r, n, n);
    }
    const spans = mergedSpans(held);
    const dayMinutes = spans.reduce((a, [s, e]) => a + e - s, 0);
    minutes += dayMinutes;
    weekdays[weekdayOfNum(day.date)]! += dayMinutes;
    const start = spans[0]![0];
    const end = spans[spans.length - 1]![1];
    if (!longestDay || end - start > longestDay.end - longestDay.start) longestDay = { date: day.date, start, end };
    if (!earliest || start < earliest.start) earliest = { date: day.date, start };
    if (!latest || end > latest.end) latest = { date: day.date, end };
  }
  return {
    days: schoolDays, lessons, minutes, cancelled, substitutions,
    subjects: ranked(subjects), teachers: ranked(teachers), rooms: ranked(rooms),
    longestDay, earliest, latest, weekdays,
  };
}

// The most common length of a merged lesson slot in the period (as the
// absences page counts it, lib/absence-calc.ts); the usual 50 without any.
function usualLessonMinutes(days: Day[]): number {
  const lengths = new Map<number, number>();
  for (const d of days) for (const [s, e] of mergedSpans(d.lessons.filter((l) => l[5] !== CANCELLED))) lengths.set(e - s, (lengths.get(e - s) ?? 0) + 1);
  let best = 50, most = 0;
  for (const [length, n] of lengths) if (n > most) { best = length; most = n; }
  return best;
}

interface Missed { day: number; subject: string; minutes: number }

// What an absence cost inside the period, from the timetable, as the
// absences page works it out (lib/absence-calc.ts): the lessons it covers,
// lessons at the same time once, the times of its first and last day; each
// piece with the subject of the lesson it fell in. Null where a day of it
// has no week loaded.
function absenceFromLessons(a: AbsenceLike, src: RecapSources, until: number): Missed[] | null {
  const out: Missed[] = [];
  const multiDay = a.startDate !== a.endDate;
  const absStart = toMinutes(a.startTime);
  const absEnd = toMinutes(a.endTime);
  const first = Math.max(a.startDate, src.from);
  const last = Math.min(a.endDate, src.to, until);
  let n = 0;
  for (const d = dateOfNum(first); dayNumOf(d) <= last && n < 420; d.setDate(d.getDate() + 1), n++) {
    const week = src.weeks[isoOf(mondayOf(d))];
    if (!week) return null;
    const day = dayNumOf(d);
    const held = (week.days[String(day)] ?? []).filter((l) => l[5] !== CANCELLED);
    for (const [s, e] of mergedSpans(held)) {
      let from = s;
      let to = e;
      // Times are those of the first and the last day; the days between are whole.
      if (absStart > 0 && (!multiDay || day === a.startDate)) from = Math.max(from, absStart);
      if (absEnd > 0 && (!multiDay || day === a.endDate)) to = Math.min(to, absEnd);
      if (to <= from) continue;
      // The subject of the lesson that takes the most of this piece.
      let subject = '';
      let most = 0;
      for (const l of held) {
        const overlap = Math.min(to, l[1]) - Math.max(from, l[0]);
        if (overlap > most) { most = overlap; subject = l[2]; }
      }
      out.push({ day, subject, minutes: to - from });
    }
  }
  return out;
}

/**
 * The absences of the period, counted the way the absences page counts them
 * (lib/absence-calc.ts): per absence, the school's own minutes ("Fehlzeiten")
 * where WebUntis gives any for it, else worked out from the timetable, else
 * its lesson hours × the usual lesson length. An empty or missing
 * "Fehlzeiten" answer never stands in for the absences themselves.
 */
function absenceFigures(src: RecapSources, days: Day[], complete: boolean, now: Date): AbsenceFigures | null {
  if (!src.absences && !src.times) return null;
  const until = Math.min(src.to, dayNumOf(now));
  const inPeriod = (d: number) => d >= src.from && d <= until;
  const absences = (src.absences ?? []).filter((a) => a.endDate >= src.from && a.startDate <= until);
  // The school's minutes per absence, only for days in the period.
  const official = new Map<number, Array<{ day: number; subject: string; minutes: number; excused: boolean }>>();
  for (const l of src.times?.lessons ?? []) {
    if (typeof l.date !== 'number' || !inPeriod(l.date) || l.minutes <= 0) continue;
    official.set(l.absenceId, [...(official.get(l.absenceId) ?? []), { day: l.date, subject: l.subject, minutes: l.minutes, excused: l.excused }]);
  }

  const bySubject = new Map<string, { value: number; lessons: number }>();
  const byWeekday = Array.from({ length: 7 }, () => 0);
  const missedDays = new Set<number>();
  let missed = 0, excused = 0, fromSchool = 0;
  const add = (day: number, subject: string, minutes: number, isExcused: boolean) => {
    if (minutes <= 0) return;
    missed += minutes;
    if (isExcused) excused += minutes;
    bump(bySubject, subject || '—', minutes);
    byWeekday[weekdayOfNum(day)]! += minutes;
    missedDays.add(day);
  };

  const lessonLength = usualLessonMinutes(days);
  const counted = new Set<number>();
  for (const a of absences) {
    counted.add(a.id);
    const own = official.get(a.id);
    if (own) {
      for (const l of own) add(l.day, l.subject, l.minutes, a.isExcused);
      fromSchool += 1;
      continue;
    }
    const pieces = absenceFromLessons(a, src, until);
    if (pieces) for (const p of pieces) add(p.day, p.subject, p.minutes, a.isExcused);
    else if (inPeriod(a.startDate)) add(a.startDate, a.subjectName ?? '', a.hours * lessonLength, a.isExcused);
  }
  // The school's minutes of absences the list doesn't have (it could not be loaded).
  for (const [id, own] of official) {
    if (counted.has(id)) continue;
    for (const l of own) add(l.day, l.subject, l.minutes, l.excused);
    fromSchool += 1;
  }

  const possible = complete ? days.reduce((sum, d) => sum + mergedSpans(d.lessons.filter((l) => l[5] !== CANCELLED)).reduce((a, [s, e]) => a + e - s, 0), 0) : null;
  const officialOnly = !src.absences;
  return {
    entries: officialOnly ? official.size : absences.length,
    openEntries: officialOnly
      ? [...official.values()].filter((own) => own.some((l) => !l.excused)).length
      : absences.filter((a) => !a.isExcused).length,
    missedMinutes: missed,
    excusedMinutes: excused,
    possibleMinutes: possible,
    rate: possible ? Math.min(100, (missed / possible) * 100) : null,
    missedDays: missedDays.size,
    bySubject: ranked(bySubject),
    byWeekday,
    official: fromSchool > 0,
  };
}

function gradeFigures(src: RecapSources): GradeFigures | null {
  if (!src.grades) return null;
  const values: number[] = [];
  const subjects: GradeFigures['subjects'] = [];
  let top: GradeFigures['top'] = null;
  // A period across two school years has a subject in each: one subject.
  const bySubject = new Map<string, Array<{ date: number; markDisplayValue: number }>>();
  for (const s of src.grades) bySubject.set(s.subjectName, [...(bySubject.get(s.subjectName) ?? []), ...s.grades]);
  for (const [subjectName, grades] of bySubject) {
    const s = { subjectName };
    const own = grades.filter((g) => g.date >= src.from && g.date <= src.to && g.markDisplayValue > 0);
    if (!own.length) continue;
    const avg = own.reduce((a, g) => a + g.markDisplayValue, 0) / own.length;
    subjects.push({ name: s.subjectName, average: avg, count: own.length });
    for (const g of own) {
      values.push(g.markDisplayValue);
      if (!top || g.markDisplayValue > top.value || (g.markDisplayValue === top.value && g.date > top.date)) {
        top = { value: g.markDisplayValue, name: s.subjectName, date: g.date };
      }
    }
  }
  if (!values.length) return { count: 0, average: 0, positive: 0, negative: 0, subjects: [], best: null, top: null };
  subjects.sort((a, b) => b.average - a.average || b.count - a.count || a.name.localeCompare(b.name));
  // The best subject has more than one grade, where there is such a subject.
  const best = subjects.find((s) => s.count >= 2) ?? subjects[0] ?? null;
  return {
    count: values.length,
    average: values.reduce((a, b) => a + b, 0) / values.length,
    positive: values.filter((v) => v >= 6).length,
    negative: values.filter((v) => v < 6).length,
    subjects,
    best,
    top,
  };
}

// Up to today: an exam or a homework still to come is not "done" yet.
const within = (date: number, src: RecapSources, now: Date) => date >= src.from && date <= Math.min(src.to, dayNumOf(now));

export function untisRecap(src: RecapSources): UntisRecap {
  const now = src.now ?? new Date();
  const mondays = periodWeeks(src.from, src.to, now);
  const loaded = mondays.filter((m) => m in src.weeks).length;
  const complete = mondays.length > 0 && loaded === mondays.length;
  const days = periodDays(src, now);
  return {
    complete,
    weeksLoaded: loaded,
    weeksTotal: mondays.length,
    school: loaded > 0 ? schoolFigures(days) : null,
    absences: absenceFigures(src, days, complete, now),
    grades: gradeFigures(src),
    exams: src.exams ? src.exams.filter((e) => within(e.examDate, src, now)).length : null,
    // Each homework once (the answer can list one per lesson it belongs to).
    homework: src.homework ? new Set(src.homework.filter((h) => typeof h.date === 'number' && within(h.date, src, now)).map((h, i) => h.id ?? -i - 1)).size : null,
    classreg: src.classreg ? src.classreg.filter((e) => within(e.createDate, src, now)).length : null,
  };
}
