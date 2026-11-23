'use client';

import { useEffect, useMemo, useState } from 'react';
import { CaretLeft, CaretRight, Check } from '@phosphor-icons/react';
import { fetchTimetable } from '@/lib/api';
import { Line } from '@/components/app/Skeleton';
import { useDateLocale, useT } from '@/providers/LocaleProvider';
import { absencesDict } from '@/lib/i18n/dictionaries/absences';
import { formatDate } from '@/lib/i18n/dateLocale';
import PixelState from '@/components/app/PixelState';

export interface PickedRange {
  startDate: string; // YYYYMMDD
  endDate: string; // YYYYMMDD
  startTime: string; // HHMM
  endTime: string; // HHMM
}

export interface Lesson {
  startHHMM: string; // "07:50"
  endHHMM: string;
  label: string;
  /** Called off with nothing in its place (no substitution, no other lesson). */
  cancelled: boolean;
}

// The lesson blocks of one day to pick from, as a step inside the absence
// sheet: a block is one entry of the timetable, often more than one period
// (a double lesson). The day can be moved forward from today; the chosen
// blocks become the range (first start to last end), which the sheet takes
// over with its button. Blocks that are over, or called off with nothing in
// their place, can't be chosen: there is nothing left to report for them.


export function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function timePart(iso?: string): string {
  if (!iso) return '';
  const t = iso.split('T')[1] ?? '';
  return t.slice(0, 5);
}

// Extract the (deduplicated, time-sorted) lessons for one calendar day from the
// timetable API response.
type Named = { shortName?: string; longName?: string; displayName?: string; name?: string };
type GridEntry = {
  duration?: { start?: string; end?: string };
  status?: string;
  position2?: Array<{ current?: Named | null; removed?: Named | null }> | null;
};

export function lessonsForDate(json: unknown, dateStr: string, fallbackLabel: string): Lesson[] {
  try {
    const root = json as { days?: Array<{ date?: string; gridEntries?: GridEntry[] }> };
    const day = root.days?.find((d) => d.date === dateStr);
    if (!day?.gridEntries?.length) return [];
    const byStart = new Map<string, Lesson>();
    for (const ge of day.gridEntries) {
      const start = timePart(ge.duration?.start);
      const end = timePart(ge.duration?.end);
      if (!start || !end) continue;
      const pos2 = ge.position2 ?? [];
      const sub = pos2.map((p) => p.current ?? p.removed).find((x): x is Named => !!x);
      if (!sub) continue; // skip breaks / empty slots
      const label = sub.shortName ?? sub.longName ?? sub.displayName ?? sub.name ?? fallbackLabel;
      const lesson = { startHHMM: start, endHHMM: end, label, cancelled: ge.status === 'CANCELLED' };
      // A cancelled lesson and its substitution share the start: the one that
      // takes place wins, so the slot counts as cancelled only when all are.
      const seen = byStart.get(start);
      if (!seen || (seen.cancelled && !lesson.cancelled)) byStart.set(start, lesson);
    }
    return Array.from(byStart.values()).sort((a, b) => a.startHHMM.localeCompare(b.startHHMM));
  } catch {
    return [];
  }
}

/** Whether a lesson on that day ("YYYY-MM-DD") has ended by `now`. */
export function lessonIsOver(dateStr: string, lesson: Lesson, now: Date): boolean {
  return `${dateStr}T${lesson.endHHMM}` <= `${dateToStr(now)}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/** The range from the first chosen lesson's start to the last one's end. */
function rangeOf(lessons: Lesson[], dateStr: string): PickedRange {
  const start = lessons.reduce((m, l) => (l.startHHMM < m ? l.startHHMM : m), lessons[0].startHHMM);
  const end = lessons.reduce((m, l) => (l.endHHMM > m ? l.endHHMM : m), lessons[0].endHHMM);
  const ymd = dateStr.replace(/-/g, '');
  return { startDate: ymd, endDate: ymd, startTime: start.replace(':', ''), endTime: end.replace(':', '') };
}

export default function TimetableLessonPicker({ initialDate, onChange }: {
  initialDate?: Date;
  /** The chosen range, or null while no lesson is chosen. */
  onChange: (range: PickedRange | null, count: number) => void;
}) {
  const t = useT(absencesDict);
  const { tag } = useDateLocale();
  // When the picker opened: what ended before then can't be chosen.
  const [now] = useState(() => new Date());
  const today = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);
  const [day, setDay] = useState(() => {
    const d = initialDate ? new Date(initialDate) : new Date(now);
    d.setHours(0, 0, 0, 0);
    return d < today ? new Date(today) : d;
  });
  const dateStr = useMemo(() => dateToStr(day), [day]);
  const atToday = day.getTime() <= today.getTime();
  // The lessons of the day shown, and which of them are chosen.
  const [loaded, setLoaded] = useState<{ date: string; lessons: Lesson[] } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const lessons = loaded?.date === dateStr ? loaded.lessons : null;

  useEffect(() => {
    let alive = true;
    fetchTimetable(dateStr)
      .then((res) => { if (alive) setLoaded({ date: dateStr, lessons: lessonsForDate(res, dateStr, t('lesson')) }); })
      .catch(() => { if (alive) setLoaded({ date: dateStr, lessons: [] }); });
    return () => { alive = false; };
  }, [dateStr, t]);

  useEffect(() => {
    if (!lessons || selected.size === 0) { onChange(null, 0); return; }
    onChange(rangeOf([...selected].map((i) => lessons[i]), dateStr), selected.size);
  }, [lessons, selected, dateStr, onChange]);

  function toggle(i: number) {
    const l = lessons?.[i];
    if (!l || l.cancelled || lessonIsOver(dateStr, l, now)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function shiftDay(delta: number) {
    setSelected(new Set());
    setDay((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() + delta);
      return n;
    });
  }

  const navButton = 'grid size-10 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-inset hover:text-ink disabled:pointer-events-none disabled:opacity-35';

  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="flex items-center justify-between gap-2 rounded-[16px] bg-inset p-1">
        <button type="button" onClick={() => shiftDay(-1)} disabled={atToday} className={navButton} aria-label={t('prevDay')}>
          <CaretLeft size={18} weight="bold" />
        </button>
        <span className="min-w-0 truncate text-center text-[15px] font-bold first-letter:uppercase" aria-live="polite">
          {formatDate(day, tag, { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
        <button type="button" onClick={() => shiftDay(1)} className={navButton} aria-label={t('nextDay')}>
          <CaretRight size={18} weight="bold" />
        </button>
      </div>

      <div className="-mx-3">
        {lessons === null ? (
          <span aria-hidden="true" className="flex flex-col gap-0.5 text-ink">
            {['44%', '58%', '40%', '52%', '47%'].map((w) => (
              <span key={w} className="flex items-center gap-3.5 px-3 py-3"><Line w={24} h={24} /><span className="flex flex-1 flex-col gap-2"><Line w={w} h={14} /><Line w={90} h={11} /></span></span>
            ))}
          </span>
        ) : lessons.length === 0 ? (
          <PixelState compact sprite="sun" title={t('noLessons')} />
        ) : (
          <ul className="flex flex-col gap-0.5" aria-label={t('chooseLessons')}>
            {lessons.map((l, i) => {
              const sel = selected.has(i);
              const over = lessonIsOver(dateStr, l, now);
              const locked = l.cancelled || over;
              return (
                <li key={`${l.startHHMM}-${i}`}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={sel}
                    disabled={locked}
                    onClick={() => toggle(i)}
                    className={`flex w-full items-center gap-3.5 rounded-[16px] px-3 py-3 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${sel ? 'bg-[color-mix(in_srgb,var(--accent)_11%,transparent)]' : 'enabled:hover:bg-inset'}`}
                  >
                    <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-[8px] transition-colors duration-200 ${sel ? 'bg-accent text-on-accent' : locked ? 'bg-inset' : 'shadow-[inset_0_0_0_2px_var(--line)]'}`}>
                      {sel && <Check size={14} weight="bold" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[15.5px] text-ink ${sel ? 'font-bold' : 'font-semibold'} ${l.cancelled ? 'line-through decoration-[1.5px]' : ''}`}>{l.label}{l.cancelled ? t('cancelledSuffix') : over ? t('overSuffix') : ''}</span>
                      <span className="block text-[13px] text-ink-2 tnum">{l.startHHMM} – {l.endHHMM}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
