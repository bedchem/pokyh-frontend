// The absences page works out, per absence, how many lesson minutes it really
// cost and how many lesson minutes the school year has had so far (from the
// timetable). That takes many timetable requests, so the result is kept on
// the device (localStorage "pokyh_abscalc_<student>_<year>", school data like
// the other caches) and reused until the number of absences changes or a week
// has passed. The dashboard reads the same result for its absences tile.

import type { AbsenceEntry } from './types';

const CALC_CACHE_PREFIX = 'pokyh_abscalc_';
const CALC_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

interface CalcCache { minutes: [number, number][]; possible: number; count: number; ts: number }

export interface AbsenceCalc { minutes: Map<number, number>; possible: number; count: number }

/** September of the school year a date belongs to (it starts on 1 September). */
export function schoolYearOf(d = new Date()): number {
  return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
}

export function readAbsenceCalc(studentId: number, year: number): AbsenceCalc | null {
  if (!studentId || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${CALC_CACHE_PREFIX}${studentId}_${year}`);
    if (!raw) return null;
    const o = JSON.parse(raw) as CalcCache;
    if (!o || !Array.isArray(o.minutes) || Date.now() - o.ts > CALC_CACHE_TTL) return null;
    return { minutes: new Map(o.minutes), possible: o.possible, count: o.count };
  } catch {
    return null;
  }
}

export function writeAbsenceCalc(studentId: number, year: number, minutes: Map<number, number>, possible: number, count: number): void {
  if (!studentId || typeof window === 'undefined') return;
  try {
    const payload: CalcCache = { minutes: [...minutes], possible, count, ts: Date.now() };
    window.localStorage.setItem(`${CALC_CACHE_PREFIX}${studentId}_${year}`, JSON.stringify(payload));
  } catch { /* storage full or blocked */ }
}

/**
 * Missed minutes and the absence rate. The rate is only given when the
 * stored calculation matches the current absences; otherwise the minutes fall
 * back to WebUntis' hours × 50.
 */
export function absenceSummary(absences: AbsenceEntry[], calc: AbsenceCalc | null): { minutes: number; unexcused: number; rate: number | null } {
  const fresh = !!calc && calc.count === absences.length;
  const minutes = absences.reduce((a, e) => a + ((fresh ? calc!.minutes.get(e.id) : undefined) ?? e.hours * 50), 0);
  return {
    minutes,
    unexcused: absences.filter((e) => !e.isExcused).length,
    rate: fresh && calc!.possible > 0 ? Math.min(100, (minutes / calc!.possible) * 100) : null,
  };
}
