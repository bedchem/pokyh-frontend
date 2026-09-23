// Abwesenheiten as the app reads them, and what they mean for the timetable.
// Shared by the Abwesenheiten page and the Stundenplan overlay, so the grid knows
// about an absence without that page ever having been opened.

import type { AbsenceEntry } from './types';

function toMinutes(t: number): number {
  if (!t) return 0;
  if (t > 2359) return t; // too large to be HHMM
  if (t % 100 > 59) return t; // minutes part > 59 → already minutes
  return Math.floor(t / 100) * 60 + (t % 100);
}

// ─── Parser ───────────────────────────────────────────────────────────────────

export function parseAbsences(json: unknown): AbsenceEntry[] {
  try {
    const root = json as Record<string, unknown>;
    const inner = (root?.data as Record<string, unknown>) ?? root;

    let items: Record<string, unknown>[] = [];
    if (inner?.absences && Array.isArray(inner.absences)) {
      items = inner.absences as Record<string, unknown>[];
    } else if (inner?.absence && Array.isArray(inner.absence)) {
      items = inner.absence as Record<string, unknown>[];
    } else if (Array.isArray(inner)) {
      items = inner as Record<string, unknown>[];
    } else if (Array.isArray(root)) {
      items = root as Record<string, unknown>[];
    }

    return items.map((item) => {
      const startDate = item.startDate as number;
      const endDate = item.endDate as number;
      const startTime = (item.startTime as number) ?? 0;
      const endTime = (item.endTime as number) ?? 0;

      // Prefer server-provided hours; fallback to single-day estimate
      const rawHours =
        (item.hours as number | null | undefined) ??
        (item.lessonHours as number | null | undefined) ??
        null;

      let hours: number;
      if (rawHours !== null && rawHours !== undefined && rawHours > 0) {
        hours = rawHours;
      } else {
        const startMins = toMinutes(startTime);
        const endMins   = toMinutes(endTime);
        hours = endMins > startMins
          ? Math.max(1, Math.round((endMins - startMins) / 50))
          : 1;
      }

      const teacherName =
        (item.teacherName as string) ??
        (item.teacher as string) ??
        (item.teacherFirstname
          ? `${item.teacherFirstname} ${item.teacherLastname ?? ''}`
          : undefined);

      const subjectName =
        (item.subject as string) ??
        (item.subjectName as string) ??
        (item.subjectShortName as string) ??
        undefined;

      return {
        id: item.id as number,
        startDate,
        endDate,
        startTime,
        endTime,
        isExcused: (item.isExcused as boolean) ?? false,
        reasonName: (item.reasonName as string) ?? (item.reason as string) ?? undefined,
        absenceType: (item.absenceType as string) ?? undefined,
        hours,
        note: (item.text as string) ?? (item.note as string) ?? undefined,
        excuseNote: (item.excuseNote as string) ?? undefined,
        teacherName: teacherName as string | undefined,
        subjectName: subjectName as string | undefined,
      };
    });
  } catch {
    return [];
  }
}

// ─── Timetable marks ──────────────────────────────────────────────────────────

/**
 * What the timetable shows over a lesson the student is (or was) absent from:
 * - preExcused — the lesson hasn't ended yet: reported in advance (Vorentschuldigung).
 * - excused    — over, and WebUntis marks the absence excused.
 * - absent     — over and not (yet) excused; turns into excused on the next load once it is.
 */
export type AbsenceMark = 'preExcused' | 'excused' | 'absent';

export const ABSENCE_MARK_LABEL: Record<AbsenceMark, string> = {
  preExcused: 'Vorentschuldigung',
  excused: 'Entschuldigt',
  absent: 'Unentschuldigt',
};

/** For narrow columns (a phone's week grid), where the full label would have to be tiny. */
export const ABSENCE_MARK_SHORT_LABEL: Record<AbsenceMark, string> = {
  preExcused: 'Vorentsch.',
  excused: 'Entsch.',
  absent: 'Unentsch.',
};

export interface AbsenceBand {
  startMinute: number;
  endMinute: number;
  mark: AbsenceMark;
}

const MINUTES_PER_DAY = 1440;
/**
 * A lesson is only marked when the absence covers at least this much of it (or all of it, for a
 * shorter lesson). Arriving two minutes late shouldn't paint the whole lesson as "Unentschuldigt".
 */
const MIN_COVERED_MINUTES = 15;

/**
 * The mark for one lesson, plus the part of it the absence actually covers (minutes of the day):
 * an absence from 10:00 over a 09:30–10:20 lesson covers 10:00–10:20, not the whole lesson.
 */
function lessonCoverage(
  absences: AbsenceEntry[],
  dateNum: number,
  startMinute: number,
  endMinute: number,
  nowDateNum: number,
  nowMinute: number,
): (AbsenceBand & { covering: AbsenceEntry[] }) | null {
  const dayStart = dateNum * MINUTES_PER_DAY;
  const lessonStart = dayStart + startMinute;
  const lessonEnd = dayStart + endMinute;
  let from = Infinity;
  let to = -Infinity;
  const covering = absences.filter((a) => {
    if (!a.startDate || !a.endDate) return false;
    const absStart = a.startDate * MINUTES_PER_DAY + (a.startTime > 0 ? toMinutes(a.startTime) : 0);
    const absEnd = a.endDate * MINUTES_PER_DAY + (a.endTime > 0 ? toMinutes(a.endTime) : MINUTES_PER_DAY);
    const coveredFrom = Math.max(lessonStart, absStart);
    const coveredTo = Math.min(lessonEnd, absEnd);
    if (coveredTo - coveredFrom < Math.min(MIN_COVERED_MINUTES, lessonEnd - lessonStart)) return false;
    from = Math.min(from, coveredFrom);
    to = Math.max(to, coveredTo);
    return true;
  });
  if (covering.length === 0) return null;
  const over = dateNum < nowDateNum || (dateNum === nowDateNum && endMinute <= nowMinute);
  const mark: AbsenceMark = !over ? 'preExcused' : covering.every((a) => a.isExcused) ? 'excused' : 'absent';
  return { startMinute: from - dayStart, endMinute: to - dayStart, mark, covering };
}

/** The absence status of one lesson and the Abwesenheiten behind it — for the lesson popup. */
export function lessonAbsence(
  absences: AbsenceEntry[],
  dateNum: number,
  startMinute: number,
  endMinute: number,
  nowDateNum: number,
  nowMinute: number,
): { mark: AbsenceMark; covering: AbsenceEntry[] } | null {
  const c = lessonCoverage(absences, dateNum, startMinute, endMinute, nowDateNum, nowMinute);
  return c ? { mark: c.mark, covering: c.covering } : null;
}

function hhmmOf(t: number): string {
  const m = toMinutes(t);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function ddmmOf(d: number): string {
  const s = String(d);
  return `${s.slice(6, 8)}.${s.slice(4, 6)}.`;
}

/** "10:00 – 13:05", or with dates when the absence spans several days. */
export function absenceRangeText(a: AbsenceEntry, wholeDayLabel = 'Ganzer Tag'): string {
  const from = a.startTime > 0 ? hhmmOf(a.startTime) : '';
  const to = a.endTime > 0 ? hhmmOf(a.endTime) : '';
  if (a.startDate === a.endDate) return from && to ? `${from} – ${to}` : wholeDayLabel;
  return `${ddmmOf(a.startDate)}${from ? ` ${from}` : ''} – ${ddmmOf(a.endDate)}${to ? ` ${to}` : ''}`;
}

export function absenceMarkFor(
  absences: AbsenceEntry[],
  dateNum: number,
  startMinute: number,
  endMinute: number,
  nowDateNum: number,
  nowMinute: number,
): AbsenceMark | null {
  return lessonCoverage(absences, dateNum, startMinute, endMinute, nowDateNum, nowMinute)?.mark ?? null;
}

/**
 * Continuous stretches of one day covered by the same mark, from exactly where the absence starts
 * to where it ends (never beyond the lessons it covers). Pass only lessons that take place.
 *
 * A stretch runs on through breaks and free periods of any length — only a lesson you were there
 * for ends it. Merging by a maximum gap instead broke the band at lunch and at every free period.
 */
export function absenceBands(
  absences: AbsenceEntry[],
  dateNum: number,
  lessons: Array<{ startMinute: number; endMinute: number }>,
  nowDateNum: number,
  nowMinute: number,
): AbsenceBand[] {
  if (absences.length === 0) return [];
  const out: AbsenceBand[] = [];
  const sorted = lessons.filter((l) => l.endMinute > l.startMinute).sort((a, b) => a.startMinute - b.startMinute);
  let openBand: AbsenceBand | null = null;
  for (const l of sorted) {
    const covered = lessonCoverage(absences, dateNum, l.startMinute, l.endMinute, nowDateNum, nowMinute);
    if (!covered) {
      openBand = null; // a lesson that was attended — the stretch ends here
      continue;
    }
    if (openBand && openBand.mark === covered.mark) {
      openBand.endMinute = Math.max(openBand.endMinute, covered.endMinute);
    } else {
      openBand = { startMinute: covered.startMinute, endMinute: covered.endMinute, mark: covered.mark };
      out.push(openBand);
    }
  }
  return out;
}
