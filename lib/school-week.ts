// Which week counts as "this week". Once the school week is over, its
// overview has nothing left to come, so from Saturday evening on the next
// week takes its place. The moment is set by NEXT_PUBLIC_WEEK_ROLLOVER as
// "<weekday> <HH:MM>" in local time, weekday 0 = Sunday … 6 = Saturday;
// default "6 17:00" (Saturday, 17:00).

const DEFAULT_ROLLOVER = { day: 6, minute: 17 * 60 };

export function parseRollover(raw: string | undefined): { day: number; minute: number } {
  const match = /^\s*([0-6])\s+(\d{1,2}):(\d{2})\s*$/.exec(raw ?? '');
  if (!match) return DEFAULT_ROLLOVER;
  const [h, m] = [Number(match[2]), Number(match[3])];
  if (h > 23 || m > 59) return DEFAULT_ROLLOVER;
  return { day: Number(match[1]), minute: h * 60 + m };
}

export const WEEK_ROLLOVER = parseRollover(process.env.NEXT_PUBLIC_WEEK_ROLLOVER);

/** Monday (00:00, local) of the calendar week of `date`. */
export function calendarMonday(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = monday.getDay();
  monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1));
  return monday;
}

/** Monday of the week that counts as "this week" at `now`: the next one once the rollover has passed. */
export function currentWeekMonday(now = new Date(), rollover = WEEK_ROLLOVER): Date {
  const monday = calendarMonday(now);
  const at = new Date(monday);
  // Days from Monday to the rollover weekday (Sunday counts as the 7th day).
  at.setDate(monday.getDate() + ((rollover.day + 6) % 7));
  at.setMinutes(rollover.minute);
  if (now >= at) monday.setDate(monday.getDate() + 7);
  return monday;
}
