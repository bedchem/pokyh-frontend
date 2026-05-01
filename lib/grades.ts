import type { GradeEntry, SubjectGrades } from './types';

export function parseGrades(json: unknown): SubjectGrades[] {
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
          positiveCount: vals.filter((v) => v >= 6).length,
          negativeCount: vals.filter((v) => v < 6).length,
        } as SubjectGrades;
      })
      .filter((s) => s.subjectName && s.grades.length > 0)
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

export function fmtDateLong(date: Date): string {
  return date.toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function fmtUntisDateLong(date: number): string {
  const s = String(date);
  if (s.length !== 8) return String(date);
  const d = new Date(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)));
  return fmtDateLong(d);
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

export function gradeDisplay(g: GradeEntry): string {
  const raw = g.text?.trim() || g.markName?.trim() || g.examType?.trim();
  const normalized = (raw ?? '').replace(',', '.').replace(/[−–—]/g, '-').trim();
  const isGradeLike = /^(?:\d{1,2}(?:\.\d{1,2})?[+\-]?|\d{1,2}\/\d{1,2})$/.test(normalized);
  if (!raw || isGradeLike) return 'Prüfung';
  return raw;
}

export function formatMark(value: number): string {
  return fmtNum(value, 2);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function clampGrade(value: number): number {
  return round2(Math.max(1, Math.min(10, value)));
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
  if (parsed < 1 || parsed > 10) return null;
  return round2(parsed);
}

export type GradeClass = 'v-excellent' | 'v-positive' | 'v-negative' | 'v-critical';

export function gradeClass(value: number): GradeClass {
  if (value >= 9) return 'v-excellent';
  if (value >= 6) return 'v-positive';
  if (value > 4) return 'v-negative';
  return 'v-critical';
}
