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
  cancelled: boolean;
}

// The lessons of one day to pick from, as a step inside the absence sheet:
// the day can be moved back and forth, the chosen lessons become the range
// (first start to last end), which the sheet takes over with its button.


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
      if (!byStart.has(start)) {
        byStart.set(start, { startHHMM: start, endHHMM: end, label, cancelled: ge.status === 'CANCELLED' });
      }
    }
    return Array.from(byStart.values()).sort((a, b) => a.startHHMM.localeCompare(b.startHHMM));
  } catch {
    return [];
  }
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
  const [day, setDay] = useState(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const dateStr = useMemo(() => dateToStr(day), [day]);
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

  const navButton = 'grid size-10 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-inset hover:text-ink';

  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="flex items-center justify-between gap-2 rounded-[16px] bg-inset p-1">
        <button type="button" onClick={() => shiftDay(-1)} className={navButton} aria-label={t('prevDay')}>
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
              return (
                <li key={`${l.startHHMM}-${i}`}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={sel}
                    onClick={() => toggle(i)}
                    className={`flex w-full items-center gap-3.5 rounded-[16px] px-3 py-3 text-left transition-colors duration-200 ${sel ? 'bg-[color-mix(in_srgb,var(--accent)_11%,transparent)]' : 'hover:bg-inset'} ${l.cancelled ? 'opacity-55' : ''}`}
                  >
                    <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-[8px] transition-colors duration-200 ${sel ? 'bg-accent text-on-accent' : 'shadow-[inset_0_0_0_2px_var(--line)]'}`}>
                      {sel && <Check size={14} weight="bold" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[15.5px] text-ink ${sel ? 'font-bold' : 'font-semibold'}`}>{l.label}{l.cancelled ? t('cancelledSuffix') : ''}</span>
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
