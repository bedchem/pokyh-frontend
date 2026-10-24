import type { SchoolHoliday } from './api';

// The school's breaks (GET /webuntis/holidays) as the pages name them. Schools
// often call them only "Ferien3" or "8.12." in WebUntis (the API passes on a
// real name when there is one), so a break is named by when it is: the
// holidays of the Italian (and South Tyrolean) school year and the breaks
// around them. Pure: no React, no fetching.

export type HolidayKey =
  | 'christmas'
  | 'easter'
  | 'autumn'
  | 'carnival'
  | 'summer'
  | 'newYear'
  | 'epiphany'
  | 'easterMonday'
  | 'liberation'
  | 'labour'
  | 'ascension'
  | 'pentecost'
  | 'republic'
  | 'corpusChristi'
  | 'assumption'
  | 'allSaints'
  | 'immaculate'
  | 'christmasDay'
  | 'stStephen'
  | 'dayOff'
  | 'break';

const DAY_MS = 86_400_000;

/** A YYYY-MM-DD day as a UTC timestamp (date arithmetic without time zones). */
const utc = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const isoOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Easter Sunday of a year (anonymous Gregorian algorithm), YYYY-MM-DD. */
export function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const FIXED: Record<string, HolidayKey> = {
  '01-01': 'newYear',
  '01-06': 'epiphany',
  '04-25': 'liberation',
  '05-01': 'labour',
  '06-02': 'republic',
  '08-15': 'assumption',
  '11-01': 'allSaints',
  '12-08': 'immaculate',
  '12-25': 'christmasDay',
  '12-26': 'stStephen',
};

/** The public holiday on a day, if it is one. */
export function publicHolidayOn(iso: string): HolidayKey | null {
  const fixed = FIXED[iso.slice(5)];
  if (fixed) return fixed;
  const easter = utc(easterSunday(Number(iso.slice(0, 4))));
  const offset = Math.round((utc(iso) - easter) / DAY_MS);
  return ({ 1: 'easterMonday', 39: 'ascension', 50: 'pentecost', 60: 'corpusChristi' } as Record<number, HolidayKey>)[offset] ?? null;
}

const days = (h: SchoolHoliday) => Math.round((utc(h.end) - utc(h.start)) / DAY_MS) + 1;

function covers(h: SchoolHoliday, iso: string): boolean {
  return h.start <= iso && iso <= h.end;
}

/** What kind of break it is (names[0] from WebUntis, where real, takes precedence when shown). */
export function holidayKey(h: SchoolHoliday): HolidayKey {
  const length = days(h);
  const startYear = Number(h.start.slice(0, 4));
  const inside = (mmdd: string) => [startYear, startYear + 1].some((y) => covers(h, `${y}-${mmdd}`));
  if (inside('12-25') || inside('01-01')) return length >= 3 ? 'christmas' : inside('12-25') ? 'christmasDay' : 'newYear';
  const easter = easterSunday(startYear);
  const easterMonday = isoOf(utc(easter) + DAY_MS);
  if (length >= 3 && (covers(h, easter) || covers(h, easterMonday))) return 'easter';
  if (length >= 3) {
    const month = Number(h.start.slice(5, 7));
    if (length >= 21 && month >= 6 && month <= 8) return 'summer';
    if (month === 10 || month === 11) return 'autumn';
    if (month === 2 || (month === 3 && Number(h.start.slice(8, 10)) <= 7)) return 'carnival';
  }
  // A day or two: the holiday in it, else a free day (a bridge day, a school's own).
  for (let ms = utc(h.start); ms <= utc(h.end); ms += DAY_MS) {
    const key = publicHolidayOn(isoOf(ms));
    if (key) return key;
  }
  return length >= 3 ? 'break' : 'dayOff';
}

/** The break a day (YYYY-MM-DD or YYYYMMDD) falls in, if any. */
export function holidayOn(holidays: readonly SchoolHoliday[], day: string | number): SchoolHoliday | null {
  const s = String(day);
  const iso = s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s;
  return holidays.find((h) => covers(h, iso)) ?? null;
}
