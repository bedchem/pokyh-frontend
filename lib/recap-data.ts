'use client';

import {
  fetchAbsenceTimesRange, fetchAbsencesForRecap, fetchClassregEvents, fetchExams, fetchGrades, fetchHomeworkRange, fetchTimetableForCalc,
} from './api';
import { parseAbsences } from './absences';
import { parseGrades } from './grades';
import { parseClassregEvents, parseExams, parseHomework } from './untis-parse';
import { dateOfNum, numOfIso, periodWeeks, recapLessonsOfWeek, untisRecap, type RecapWeek, type UntisRecap } from './recap-figures';
import type { RecapSection } from './recap';

// Loads what a recap's WebUntis figures are made of (lib/recap-figures.ts)
// with the student's own session, on this device only.
//
// The timetable takes a request per week, so each week's lessons are kept
// on the device (localStorage "pokyh_recapweeks_<student>", school data like
// the other caches): a week that ended long ago for a month, a recent one
// for a day, the running one for half an hour. A few weeks are asked for at
// a time; a week that fails is asked for once more, then left out (the
// figures then say they are incomplete). Loading starts as soon as a recap
// is there, so the story usually opens with everything ready.

const KEY_PREFIX = 'pokyh_recapweeks_';
const PARALLEL_WEEKS = 3;
const OLD_WEEK_TTL = 30 * 24 * 60 * 60_000;
const RECENT_WEEK_TTL = 24 * 60 * 60_000;
const CURRENT_WEEK_TTL = 30 * 60_000;
/** Weeks kept at most (a school year and a bit). */
const MAX_KEPT_WEEKS = 60;

interface StoredWeeks {
  v: 1;
  weeks: Record<string, RecapWeek>;
}

function readWeeks(studentId: number): StoredWeeks {
  try {
    const o = JSON.parse(localStorage.getItem(`${KEY_PREFIX}${studentId}`) ?? 'null') as StoredWeeks | null;
    if (o && o.v === 1 && o.weeks && typeof o.weeks === 'object') return o;
  } catch { /* unreadable: loaded again */ }
  return { v: 1, weeks: {} };
}

function writeWeeks(studentId: number, stored: StoredWeeks): void {
  const kept = Object.keys(stored.weeks).sort().slice(-MAX_KEPT_WEEKS);
  const weeks = Object.fromEntries(kept.map((k) => [k, stored.weeks[k]!]));
  try {
    localStorage.setItem(`${KEY_PREFIX}${studentId}`, JSON.stringify({ v: 1, weeks }));
  } catch { /* storage full or blocked: loaded again next time */ }
}

function isDue(week: RecapWeek | undefined, monday: string, now: number): boolean {
  if (!week) return true;
  const [y, m, d] = monday.split('-').map(Number);
  const over = new Date(y!, m! - 1, d! + 7).getTime();
  // Loaded before the week was over: lessons may have changed since.
  const ttl = week.at < over ? CURRENT_WEEK_TTL : now - over > 14 * 24 * 60 * 60_000 ? OLD_WEEK_TTL : RECENT_WEEK_TTL;
  return now - week.at > ttl;
}

export interface RecapProgress {
  done: number;
  total: number;
}

const ymd = (n: number) => String(n);

/** September of the school year a YYYYMMDD day belongs to. */
const schoolYearOfNum = (n: number) => {
  const d = dateOfNum(n);
  return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
};

async function settle<T>(task: () => Promise<T>): Promise<T | null> {
  try {
    return await task();
  } catch (e) {
    if (e instanceof Error && e.message === 'session_expired') throw e;
    return null;
  }
}

// Requests under way per recap and student: the banner's preload and the
// story share one.
const running = new Map<string, Promise<UntisRecap>>();

/**
 * The WebUntis figures of a period (YYYY-MM-DD, both included), for the
 * parts a recap shows. Parts WebUntis does not give this account (a 403)
 * come back as null.
 */
export function loadUntisRecap(
  studentId: number,
  periodFrom: string,
  periodTo: string,
  sections: readonly RecapSection[],
  onProgress?: (p: RecapProgress) => void,
): Promise<UntisRecap> {
  const key = `${studentId}:${periodFrom}:${periodTo}:${sections.join(',')}`;
  const pending = running.get(key);
  if (pending) {
    if (onProgress) progressListeners.set(key, [...(progressListeners.get(key) ?? []), onProgress]);
    return pending;
  }
  if (onProgress) progressListeners.set(key, [onProgress]);
  const job = run(studentId, periodFrom, periodTo, sections, (p) => {
    lastProgress.set(key, p);
    for (const listener of progressListeners.get(key) ?? []) listener(p);
  }).finally(() => {
    progressListeners.delete(key);
    // Kept a moment, so a story opened right after the preload reuses it.
    window.setTimeout(() => running.delete(key), 60_000);
  });
  running.set(key, job);
  return job;
}

const progressListeners = new Map<string, Array<(p: RecapProgress) => void>>();
const lastProgress = new Map<string, RecapProgress>();

async function run(
  studentId: number,
  periodFrom: string,
  periodTo: string,
  sections: readonly RecapSection[],
  report: (p: RecapProgress) => void,
): Promise<UntisRecap> {
  const from = numOfIso(periodFrom);
  const to = numOfIso(periodTo);
  const now = new Date();
  const until = Math.min(to, Number(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`));
  const wants = (s: RecapSection) => sections.includes(s);
  const needsTimetable = wants('school') || wants('absences');

  const stored = readWeeks(studentId);
  const mondays = needsTimetable ? periodWeeks(from, to, now) : [];
  const due = mondays.filter((m) => isDue(stored.weeks[m], m, now.getTime()));
  // The other requests count as one step each.
  const others = [wants('absences'), wants('absences'), wants('grades'), wants('exams'), wants('exams'), wants('classreg')].filter(Boolean).length;
  const total = due.length + others;
  let done = 0;
  const step = () => { done += 1; report({ done, total }); };
  report({ done, total });

  // The weeks, a few at a time; a failed week once more at the end.
  const failed: string[] = [];
  let next = 0;
  let expired = false;
  const loadWeek = async (monday: string, retry: boolean) => {
    try {
      const days = recapLessonsOfWeek(await fetchTimetableForCalc(monday));
      if (days) stored.weeks[monday] = { at: Date.now(), days };
      else if (!retry) failed.push(monday);
    } catch (e) {
      if (e instanceof Error && e.message === 'session_expired') expired = true;
      else if (!retry) failed.push(monday);
    }
  };
  const worker = async () => {
    while (next < due.length && !expired) {
      const monday = due[next++]!;
      await loadWeek(monday, false);
      step();
    }
  };

  const years = [...new Set([schoolYearOfNum(from), schoolYearOfNum(until)])];
  const counted = <T,>(task: () => Promise<T>) => settle(task).finally(step);
  const [, absencesRaw, timesRaw, gradesRaw, examsRaw, homeworkRaw, classregRaw] = await Promise.all([
    Promise.all(Array.from({ length: Math.min(PARALLEL_WEEKS, due.length) }, worker)),
    wants('absences') ? counted(() => fetchAbsencesForRecap(ymd(from), ymd(to))) : null,
    wants('absences') ? counted(() => fetchAbsenceTimesRange(ymd(from), ymd(to))) : null,
    wants('grades') ? counted(() => Promise.all(years.map((y) => fetchGrades(y)))) : null,
    wants('exams') ? counted(() => fetchExams(ymd(from), ymd(to))) : null,
    wants('exams') ? counted(() => fetchHomeworkRange(ymd(from), ymd(to))) : null,
    wants('classreg') ? counted(() => Promise.all(years.map((y) => fetchClassregEvents(y)))) : null,
  ]);
  for (const monday of failed) {
    if (expired) break;
    await loadWeek(monday, true);
  }
  if (due.length) writeWeeks(studentId, stored);
  if (expired) throw new Error('session_expired');

  const weeks = Object.fromEntries(mondays.filter((m) => stored.weeks[m]).map((m) => [m, stored.weeks[m]!]));
  return untisRecap({
    from,
    to,
    now,
    weeks,
    absences: absencesRaw ? parseAbsences(absencesRaw) : null,
    times: timesRaw && Array.isArray(timesRaw.lessons) ? timesRaw : null,
    grades: gradesRaw ? gradesRaw.flatMap((g) => parseGrades(g)) : null,
    exams: examsRaw ? parseExams(examsRaw) : null,
    homework: homeworkRaw ? parseHomework(homeworkRaw).homeworks : null,
    classreg: classregRaw ? classregRaw.flatMap((c) => parseClassregEvents(c)) : null,
  });
}

/** How far the loading of a recap's figures is, if it is under way. */
export function recapProgress(studentId: number, periodFrom: string, periodTo: string, sections: readonly RecapSection[]): RecapProgress | null {
  return lastProgress.get(`${studentId}:${periodFrom}:${periodTo}:${sections.join(',')}`) ?? null;
}
