// Where the school day stands right now, on the LBS Brixen period grid and the
// school's own clock (Europe/Rome). Pure functions; no personal data involved.

import { TIMETABLE_PERIODS, hhmm, type TimetablePeriod } from './timetable-logic';

export const DAY_START = TIMETABLE_PERIODS[0].startMinute; // 07:50
export const DAY_END = TIMETABLE_PERIODS[TIMETABLE_PERIODS.length - 1].endMinute; // 16:45

export type DayPhase = 'weekend' | 'before' | 'period' | 'break' | 'after';

export interface SchoolDayState {
  phase: DayPhase;
  /** The running period (phase "period") or the one coming up (phases "before" and "break"). */
  period: TimetablePeriod | null;
  /** Minutes until the running period ends or the next one starts. */
  minutesLeft: number;
  /** 0..1 through the running period. */
  progress: number;
  /** 0..1 through the whole school day (07:50-16:45). */
  dayProgress: number;
}

/** Weekday (0 = Sunday) and minute of day on the school's clock. */
export function schoolClock(now = new Date()): { weekday: number; minute: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const weekday = map[parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'] ?? 1;
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return { weekday, minute: h * 60 + m };
  } catch {
    return { weekday: now.getDay(), minute: now.getHours() * 60 + now.getMinutes() };
  }
}

/**
 * The state of a regular school day at `minute`. Lessons at LBS Brixen run
 * Monday to Saturday in blocks, so this describes the grid, not whether a
 * particular class has lessons today; signed-in screens combine it with the
 * real timetable.
 */
export function schoolDayState(minute: number, weekday: number): SchoolDayState {
  const dayProgress = Math.min(1, Math.max(0, (minute - DAY_START) / (DAY_END - DAY_START)));

  if (weekday === 0) {
    return { phase: 'weekend', period: TIMETABLE_PERIODS[0], minutesLeft: 0, progress: 0, dayProgress: 0 };
  }
  if (minute < DAY_START) {
    return { phase: 'before', period: TIMETABLE_PERIODS[0], minutesLeft: DAY_START - minute, progress: 0, dayProgress: 0 };
  }
  if (minute >= DAY_END) {
    return { phase: 'after', period: null, minutesLeft: 0, progress: 1, dayProgress: 1 };
  }
  for (let i = 0; i < TIMETABLE_PERIODS.length; i++) {
    const p = TIMETABLE_PERIODS[i];
    if (minute >= p.startMinute && minute < p.endMinute) {
      return {
        phase: 'period',
        period: p,
        minutesLeft: p.endMinute - minute,
        progress: (minute - p.startMinute) / (p.endMinute - p.startMinute),
        dayProgress,
      };
    }
    const next = TIMETABLE_PERIODS[i + 1];
    if (next && minute >= p.endMinute && minute < next.startMinute) {
      return { phase: 'break', period: next, minutesLeft: next.startMinute - minute, progress: 0, dayProgress };
    }
  }
  return { phase: 'after', period: null, minutesLeft: 0, progress: 1, dayProgress: 1 };
}

export function periodRange(p: TimetablePeriod): string {
  return `${hhmm(p.startMinute)}-${hhmm(p.endMinute)}`;
}

/** Position of a minute on the 07:50-16:45 ruler, 0..1. */
export function rulerPosition(minute: number): number {
  return Math.min(1, Math.max(0, (minute - DAY_START) / (DAY_END - DAY_START)));
}

export { TIMETABLE_PERIODS };
