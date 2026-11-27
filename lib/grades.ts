import type { GradeEntry, SubjectGrades } from './types';
import { formatDate } from './i18n/dateLocale';
import { clampToScale, gradeScale, isCritical, isExcellent, passes, scaleCertain, setGradeScaleFrom } from './grade-scale';

export function parseGrades(json: unknown): SubjectGrades[] {
  // The school's grading scale rides along with the grades (lib/grade-scale.ts).
  setGradeScaleFrom(json);
  try {
    const root = json as Record<string, unknown>;
    const raw = (root?.subjects ?? []) as Array<Record<string, unknown>>;
    return raw
      .map((s) => {
        const entries: GradeEntry[] = ((s.grades ?? []) as Array<Record<string, unknown>>)
          .map((g) => ({
            id: g.id as number,
            text: (g.text as string) ?? '',
            date: g.date as number,
            markName: (g.markName as string) ?? '',
            markValue: (g.markValue as number) ?? 0,
            markDisplayValue: (g.markDisplayValue as number) ?? 0,
            examType: (g.examType as string) ?? '',
            enteredAt: typeof g.enteredAt === 'number' ? g.enteredAt : null,
          }))
          .filter((g) => g.markValue > 0 && g.date > 0);

        const vals = entries.map((g) => g.markDisplayValue).filter((v) => v > 0);
        const average = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

        return {
          lessonId: s.lessonId as number,
          subjectName: (s.subjectName as string) ?? '',
          teacherName: (s.teacherName as string) ?? '',
          grades: entries,
          average,
          positiveCount: vals.filter((v) => passes(v)).length,
          negativeCount: vals.filter((v) => !passes(v)).length,
        } as SubjectGrades;
      })
      .filter((s) => s.subjectName)
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  } catch {
    return [];
  }
}

export function fmtNum(value: number, digits = 2): string {
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor) / factor;
  const trimmed = rounded
    .toFixed(digits)
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '');
  return trimmed.replace('.', ',');
}

export function fmtDateShort(date: number): string {
  const s = String(date);
  if (s.length !== 8) return String(date);
  return `${s.slice(6, 8)}.${s.slice(4, 6)}.${s.slice(2, 4)}`;
}

export function fmtDateLong(date: Date, tag = 'de-CH'): string {
  return formatDate(date, tag, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function fmtUntisDateLong(date: number, tag?: string): string {
  const s = String(date);
  if (s.length !== 8) return String(date);
  const d = new Date(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)));
  return fmtDateLong(d, tag);
}

export function untisDateToJs(date: number): Date | null {
  const s = String(date);
  if (s.length !== 8) return null;
  return new Date(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)));
}

export function monthKey(date: number): string {
  const s = String(date);
  return s.slice(0, 6);
}

export function gradeDisplay(g: GradeEntry, examLabel = 'Prüfung'): string {
  const raw = g.text?.trim() || g.markName?.trim() || g.examType?.trim();
  const normalized = (raw ?? '').replace(',', '.').replace(/[\u2212\u2013\u2014]/g, '-').trim();
  const isGradeLike = /^(?:\d{1,2}(?:\.\d{1,2})?[+\-]?|\d{1,2}\/\d{1,2})$/.test(normalized);
  if (!raw || isGradeLike) return examLabel;
  return raw;
}

export function formatMark(value: number): string {
  return fmtNum(value, 2);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** The mark kept within the school's scale (1 to 10 in Italy, 1 to 6 in Germany, …). */
export function clampGrade(value: number): number {
  return round2(clampToScale(value));
}

export function averageOf(values: number[]): number {
  if (!values.length) return 0;
  return round2(values.reduce((a, b) => a + b, 0) / values.length);
}

export function parseGradeInput(raw: string): number | null {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  const scale = gradeScale();
  if (parsed < scale.min || parsed > scale.max) return null;
  return round2(parsed);
}

/** A mark's tone; 'v-neutral' when the school's scale is not known for sure (no pass/fail colours then). */
export type GradeClass = 'v-excellent' | 'v-positive' | 'v-negative' | 'v-critical' | 'v-neutral';

/** The mark on the school's scale: excellent, passed, failed, or a critical fail. */
export function gradeClass(value: number): GradeClass {
  if (!scaleCertain()) return 'v-neutral';
  if (isExcellent(value)) return 'v-excellent';
  if (passes(value)) return 'v-positive';
  if (isCritical(value)) return 'v-critical';
  return 'v-negative';
}
