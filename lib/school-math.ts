// The arithmetic behind the public calculators (app/[lang]/(site)/tools):
// grade averages on the common European scales and absences in percent.
// Pure functions, so the pages and the tests use the same rules.

export type ScaleId = 'it' | 'de' | 'de15' | 'at' | 'ch';

export interface GradeScale {
  min: number;
  max: number;
  /** Lowest grade that still counts as a pass. */
  pass: number;
  /** Which end of the scale is the best grade. */
  best: 'high' | 'low';
}

export const GRADE_SCALES: Record<ScaleId, GradeScale> = {
  it: { min: 1, max: 10, pass: 6, best: 'high' },
  de: { min: 1, max: 6, pass: 4, best: 'low' },
  de15: { min: 0, max: 15, pass: 5, best: 'high' },
  at: { min: 1, max: 5, pass: 4, best: 'low' },
  ch: { min: 1, max: 6, pass: 4, best: 'high' },
};

export const SCALE_IDS = Object.keys(GRADE_SCALES) as ScaleId[];

/** What a + or - next to a grade is worth; schools differ, so it is a choice. */
export const SIGN_STEPS = [0.25, 0.3, 0.5] as const;

const GRADE_RE = /^(\d{1,2}(?:\.\d{1,2})?)\s*(?:(½|\+|-)|\/\s*(\d{1,2}))?$/;

/**
 * Reads a grade as people write it: `7`, `7,5`, `6+`, `6-`, `6½` or `6/7`
 * (halfway between two neighbours). A plus is always the better side, so on
 * scales where 1 is best it lowers the number. Returns null for anything that
 * is not a grade on the scale.
 */
export function parseGrade(input: string, scale: GradeScale, step: number = SIGN_STEPS[0]): number | null {
  const match = GRADE_RE.exec(input.trim().replace(',', '.'));
  if (!match) return null;
  const base = Number(match[1]);
  let value = base;
  const better = scale.best === 'high' ? 1 : -1;
  if (match[2] === '½') value = base + 0.5;
  else if (match[2] === '+') value = base + better * step;
  else if (match[2] === '-') value = base - better * step;
  else if (match[3] !== undefined) {
    const other = Number(match[3]);
    if (Math.abs(other - base) !== 1) return null;
    value = (base + other) / 2;
  }
  return value >= scale.min && value <= scale.max ? value : null;
}

/** A weight as typed (`1`, `0,5`, `2`); empty means 1. */
export function parseWeight(input: string): number | null {
  const text = input.trim().replace(',', '.');
  if (!text) return 1;
  const value = Number(text);
  return Number.isFinite(value) && value > 0 && value <= 100 ? value : null;
}

export interface WeightedGrade {
  value: number;
  weight: number;
}

/** Weighted mean of the grades, or null without any. */
export function weightedAverage(grades: WeightedGrade[]): number | null {
  const weight = grades.reduce((sum, g) => sum + g.weight, 0);
  if (weight <= 0) return null;
  return grades.reduce((sum, g) => sum + g.value * g.weight, 0) / weight;
}

export function isPassing(average: number, scale: GradeScale): boolean {
  return scale.best === 'high' ? average >= scale.pass : average <= scale.pass;
}

export type Needed =
  | { kind: 'any' }
  | { kind: 'impossible' }
  | { kind: 'grade'; value: number };

/**
 * The grade the next test needs (with the given weight) so the average
 * reaches `target`: `any` when every grade on the scale is enough,
 * `impossible` when not even the best one is.
 */
export function neededGrade(grades: WeightedGrade[], target: number, weight: number, scale: GradeScale): Needed {
  const sum = grades.reduce((s, g) => s + g.value * g.weight, 0);
  const total = grades.reduce((s, g) => s + g.weight, 0);
  const value = (target * (total + weight) - sum) / weight;
  const [worst, best] = scale.best === 'high' ? [scale.min, scale.max] : [scale.max, scale.min];
  const better = (a: number, b: number) => (scale.best === 'high' ? a > b : a < b);
  if (!better(value, worst)) return { kind: 'any' };
  if (better(value, best)) return { kind: 'impossible' };
  return { kind: 'grade', value };
}

export interface AbsenceStats {
  /** Share of the lessons missed, 0-100. */
  absentPct: number;
  /** Hours that may still be missed before the limit; negative when over it. */
  hoursLeft: number;
}

/**
 * Absences against the lessons of the year. `limitPct` is the share that may
 * be missed (25 for the three-quarter rule). Null when the numbers make no
 * sense together.
 */
export function absenceStats(absentHours: number, totalHours: number, limitPct: number): AbsenceStats | null {
  if (!(totalHours > 0) || !(absentHours >= 0) || absentHours > totalHours || !(limitPct >= 0 && limitPct <= 100)) return null;
  const allowed = (totalHours * limitPct) / 100;
  const left = allowed - absentHours;
  return {
    absentPct: (absentHours / totalHours) * 100,
    hoursLeft: left >= 0 ? Math.floor(left + 1e-9) : -Math.ceil(-left - 1e-9),
  };
}

/** A non-negative number as typed, with a comma or a point; null when empty or invalid. */
export function parseAmount(input: string): number | null {
  const text = input.trim().replace(',', '.');
  if (!text) return null;
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 ? value : null;
}
