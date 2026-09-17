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
  absent: 'Gefehlt',
};

export interface AbsenceBand {
  startMinute: number;
  endMinute: number;
  mark: AbsenceMark;
}

const MINUTES_PER_DAY = 1440;
/**
 * A lesson is only marked when the absence covers at least this much of it (or all of it, for a
 * shorter lesson). Arriving two minutes late shouldn't paint the whole lesson as "Gefehlt".
 */
const MIN_COVERED_MINUTES = 15;
/** Lessons closer than this share one band — a break is not the end of an absence. */
const MERGE_GAP_MINUTES = 30;

export function absenceMarkFor(
  absences: AbsenceEntry[],
  dateNum: number,
  startMinute: number,
  endMinute: number,
  nowDateNum: number,
  nowMinute: number,
): AbsenceMark | null {
  const lessonStart = dateNum * MINUTES_PER_DAY + startMinute;
  const lessonEnd = dateNum * MINUTES_PER_DAY + endMinute;
  const covering = absences.filter((a) => {
    if (!a.startDate || !a.endDate) return false;
    const absStart = a.startDate * MINUTES_PER_DAY + (a.startTime > 0 ? toMinutes(a.startTime) : 0);
    const absEnd = a.endDate * MINUTES_PER_DAY + (a.endTime > 0 ? toMinutes(a.endTime) : MINUTES_PER_DAY);
    const covered = Math.min(lessonEnd, absEnd) - Math.max(lessonStart, absStart);
    return covered >= Math.min(MIN_COVERED_MINUTES, lessonEnd - lessonStart);
  });
  if (covering.length === 0) return null;
  const over = dateNum < nowDateNum || (dateNum === nowDateNum && endMinute <= nowMinute);
  if (!over) return 'preExcused';
  return covering.every((a) => a.isExcused) ? 'excused' : 'absent';
}

/** Continuous stretches of one day covered by the same mark. Pass only lessons that take place. */
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
  for (const l of sorted) {
    const mark = absenceMarkFor(absences, dateNum, l.startMinute, l.endMinute, nowDateNum, nowMinute);
    if (!mark) continue;
    const last = out[out.length - 1];
    if (last && last.mark === mark && l.startMinute <= last.endMinute + MERGE_GAP_MINUTES) {
      last.endMinute = Math.max(last.endMinute, l.endMinute);
    } else {
      out.push({ startMinute: l.startMinute, endMinute: l.endMinute, mark });
    }
  }
  return out;
}
