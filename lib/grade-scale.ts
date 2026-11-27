// The grading scale of the signed-in account's school, as the API sends it
// with the grades (GET /webuntis/grades → scale; pokyh-backend
// src/webuntis/gradeScale.ts works it out from what WebUntis sends: the marks,
// the school year's dates, the school's postcode). Italy marks 1 to 10 and 6
// passes; Austria 1 to 5 and Germany 1 to 6, where 1 is best and 4 passes;
// Switzerland 1 to 6 with 6 best; German upper school 0 to 15 points.
//
// Every page asks this module instead of comparing with 6. Until the grades are
// in, the device's last copy (or the Italian scale). When the API is not sure
// (`certain: false`), marks are shown without pass/fail colours.

export interface GradeScale {
  kind: 'it10' | 'at5' | 'de6' | 'ch6' | 'de15';
  min: number;
  max: number;
  higherIsBetter: boolean;
  /** The worst mark that still passes. */
  pass: number;
  /** From here on a mark is excellent. */
  excellent: number;
  /** From here on a fail is critical. */
  critical: number;
  /** False when the API could not tell the scale for sure: no pass/fail colours then. */
  certain?: boolean;
}

export const ITALIAN_SCALE: GradeScale = { kind: 'it10', min: 1, max: 10, higherIsBetter: true, pass: 6, excellent: 9, critical: 4, certain: true };

const STORE_KEY = 'pokyh_grade_scale';

function valid(raw: unknown): GradeScale | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  const nums = ['min', 'max', 'pass', 'excellent', 'critical'] as const;
  if (!nums.every((k) => typeof s[k] === 'number' && Number.isFinite(s[k]))) return null;
  if (typeof s.higherIsBetter !== 'boolean' || typeof s.kind !== 'string') return null;
  return {
    kind: s.kind as GradeScale['kind'],
    min: s.min as number,
    max: s.max as number,
    higherIsBetter: s.higherIsBetter,
    pass: s.pass as number,
    excellent: s.excellent as number,
    critical: s.critical as number,
    certain: s.certain !== false,
  };
}

let current: GradeScale | null = null;

/** The scale now: the API's last answer, the device's copy, or the Italian one. */
export function gradeScale(): GradeScale {
  if (current) return current;
  if (typeof window !== 'undefined') {
    try { current = valid(JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null')); } catch { /* storage blocked */ }
  }
  return current ?? ITALIAN_SCALE;
}

/** Takes the scale from an answer of GET /webuntis/grades (ignored when it has none). */
export function setGradeScaleFrom(json: unknown): void {
  const scale = valid((json as { scale?: unknown } | null)?.scale);
  if (!scale) return;
  current = scale;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(scale)); } catch { /* storage blocked */ }
}

/** Whether marks may be coloured as passed or failed. */
export const scaleCertain = (s: GradeScale = gradeScale()) => s.certain !== false;

/** [a] is at least as good as [b] on the scale. */
const atLeast = (a: number, b: number, s: GradeScale) => (s.higherIsBetter ? a >= b : a <= b);

/** The mark passes. */
export const passes = (v: number, s: GradeScale = gradeScale()) => atLeast(v, s.pass, s);

/** The mark passes with a little room (6.4 and up in Italy, 3.6 and better in Germany). */
export const passesWell = (v: number, s: GradeScale = gradeScale()) => atLeast(v, s.higherIsBetter ? s.pass + 0.4 : s.pass - 0.4, s);

export const isExcellent = (v: number, s: GradeScale = gradeScale()) => atLeast(v, s.excellent, s);

/** A fail beyond rescue: 4 and below in Italy, 5.5 and worse in Germany. */
export const isCritical = (v: number, s: GradeScale = gradeScale()) => !passes(v, s) && atLeast(s.critical, v, s);

/** How good the mark is, 0 (worst) to 1 (best), on any scale. */
export function goodness(v: number, s: GradeScale = gradeScale()): number {
  const t = (v - s.min) / (s.max - s.min || 1);
  return Math.max(0, Math.min(1, s.higherIsBetter ? t : 1 - t));
}

/** The mark kept within the scale. */
export const clampToScale = (v: number, s: GradeScale = gradeScale()) => Math.max(s.min, Math.min(s.max, v));
