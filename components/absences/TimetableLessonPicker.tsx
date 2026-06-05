'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { fetchTimetable } from '@/lib/api';

export interface PickedRange {
  startDate: string; // YYYYMMDD
  endDate: string; // YYYYMMDD
  startTime: string; // HHMM
  endTime: string; // HHMM
}

interface Lesson {
  startHHMM: string; // "07:50"
  endHHMM: string;
  label: string;
  cancelled: boolean;
}

interface Props {
  initialDate?: Date;
  onConfirm: (range: PickedRange) => void;
  onBack: () => void;
}

const DOW = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function timePart(iso?: string): string {
  if (!iso) return '';
  const t = iso.split('T')[1] ?? '';
  return t.slice(0, 5);
}

// Extract the (deduplicated, time-sorted) lessons for one calendar day from the
// timetable API response.
function lessonsForDate(json: unknown, dateStr: string): Lesson[] {
  try {
    const root = json as { days?: any[] };
    const day = root.days?.find((d) => d.date === dateStr);
    if (!day?.gridEntries?.length) return [];
    const byStart = new Map<string, Lesson>();
    for (const ge of day.gridEntries) {
      const start = timePart(ge.duration?.start);
      const end = timePart(ge.duration?.end);
      if (!start || !end) continue;
      const pos2: any[] = ge.position2 ?? [];
      const sub = pos2.map((p) => p.current ?? p.removed).filter(Boolean)[0];
      if (!sub) continue; // skip breaks / empty slots
      const label = sub.shortName ?? sub.longName ?? sub.displayName ?? sub.name ?? 'Stunde';
      if (!byStart.has(start)) {
        byStart.set(start, { startHHMM: start, endHHMM: end, label, cancelled: ge.status === 'CANCELLED' });
      }
    }
    return Array.from(byStart.values()).sort((a, b) => a.startHHMM.localeCompare(b.startHHMM));
  } catch {
    return [];
  }
}

export default function TimetableLessonPicker({ initialDate, onConfirm, onBack }: Props) {
  const [day, setDay] = useState(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const dateStr = useMemo(() => dateToStr(day), [day]);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await fetchTimetable(dateStr);
      setLessons(lessonsForDate(res, dateStr));
    } catch {
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function shiftDay(delta: number) {
    setDay((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() + delta);
      return n;
    });
  }

  const canConfirm = selected.size > 0;

  function confirm() {
    if (!canConfirm) return;
    const picked = Array.from(selected).map((i) => lessons[i]);
    const startHHMM = picked.reduce((m, l) => (l.startHHMM < m ? l.startHHMM : m), picked[0].startHHMM);
    const endHHMM = picked.reduce((m, l) => (l.endHHMM > m ? l.endHHMM : m), picked[0].endHHMM);
    const ymd = dateStr.replace(/-/g, '');
    onConfirm({
      startDate: ymd,
      endDate: ymd,
      startTime: startHHMM.replace(':', ''),
      endTime: endHHMM.replace(':', ''),
    });
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:px-4 sm:py-8"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
      onClick={onBack}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[88dvh] overflow-hidden flex flex-col rounded-t-[28px] sm:rounded-[28px] slide-up"
        style={{ background: 'var(--app-surface)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-2 flex-shrink-0">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full press-scale flex-shrink-0"
            style={{ background: 'var(--app-card)', color: 'var(--app-text-primary)' }}
            aria-label="Zurück"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-[17px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
            Aus Stundenplan wählen
          </h3>
        </div>

        {/* Day nav */}
        <div className="flex items-center justify-between px-5 py-2 flex-shrink-0">
          <button
            onClick={() => shiftDay(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center press-scale"
            style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)' }}
          >
            <ChevronLeft size={17} />
          </button>
          <span className="text-[14px] font-semibold" style={{ color: 'var(--app-text-primary)' }}>
            {DOW[day.getDay()]}, {day.toLocaleDateString('de', { day: 'numeric', month: 'long' })}
          </span>
          <button
            onClick={() => shiftDay(1)}
            className="w-9 h-9 rounded-full flex items-center justify-center press-scale"
            style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)' }}
          >
            <ChevronRight size={17} />
          </button>
        </div>

        {/* Lessons */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size={24} />
            </div>
          ) : lessons.length === 0 ? (
            <p className="text-center text-[13px] py-10" style={{ color: 'var(--app-text-tertiary)' }}>
              Keine Stunden an diesem Tag.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {lessons.map((l, i) => {
                const sel = selected.has(i);
                return (
                  <button
                    key={`${l.startHHMM}-${i}`}
                    onClick={() => toggle(i)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl press-scale text-left"
                    style={{
                      background: sel ? 'color-mix(in srgb, var(--accent) 14%, var(--app-card))' : 'var(--app-card)',
                      border: `1.5px solid ${sel ? 'color-mix(in srgb, var(--accent) 45%, transparent)' : 'transparent'}`,
                      opacity: l.cancelled ? 0.55 : 1,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{
                        background: sel ? 'var(--accent)' : 'transparent',
                        border: sel ? 'none' : '1.5px solid var(--app-text-tertiary)',
                      }}
                    >
                      {sel && <Check size={13} color="#fff" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium" style={{ color: 'var(--app-text-primary)' }}>
                        {l.label}{l.cancelled ? ' (entfällt)' : ''}
                      </p>
                      <p className="text-[12px]" style={{ color: 'var(--app-text-secondary)' }}>
                        {l.startHHMM} – {l.endHHMM}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm */}
        <div className="px-5 pt-2 pb-6 flex-shrink-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={confirm}
            disabled={!canConfirm}
            className="w-full h-12 rounded-xl font-semibold text-white press-scale disabled:opacity-40 text-[15px]"
            style={{ background: 'var(--accent)' }}
          >
            {selected.size > 0 ? `${selected.size} Stunde${selected.size > 1 ? 'n' : ''} übernehmen` : 'Stunden auswählen'}
          </button>
        </div>
      </div>
    </div>
  );
}
