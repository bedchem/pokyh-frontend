'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, FileText, ArrowLeftRight } from 'lucide-react';
import { addDays, format, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import { fetchTimetable } from '@/lib/api';
import { subjectColor } from '@/lib/colors';
import type { TimetableEntry } from '@/lib/types';

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];

function parseTime(t: number): string {
  const s = t.toString().padStart(4, '0');
  return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
}

function timeToMinutes(t: number): number {
  const s = t.toString().padStart(4, '0');
  return parseInt(s.slice(0, 2)) * 60 + parseInt(s.slice(2, 4));
}

function parseTimetable(json: unknown): TimetableEntry[] {
  try {
    const root = json as Record<string, unknown>;
    const wData = (
      (root?.data as Record<string, unknown>)?.result as Record<string, unknown>
    )?.data as Record<string, unknown>;
    const elementPeriods = wData?.elementPeriods as Record<string, unknown[]>;
    const elements = wData?.elements as Array<Record<string, unknown>>;
    if (!elementPeriods || !elements) return [];

    const subjectMap: Record<number, { name: string; longName: string }> = {};
    const teacherMap: Record<number, string> = {};
    const roomMap: Record<number, string> = {};

    elements.forEach((el) => {
      if (el.type === 3)
        subjectMap[el.id as number] = {
          name: el.name as string,
          longName: (el.displayname as string) ?? (el.longName as string) ?? (el.name as string),
        };
      if (el.type === 2) teacherMap[el.id as number] = el.name as string;
      if (el.type === 4) roomMap[el.id as number] = el.name as string;
    });

    const entries: TimetableEntry[] = [];

    Object.values(elementPeriods)
      .flat()
      .forEach((period: unknown) => {
        const p = period as Record<string, unknown>;
        const refs = (p.elements as Array<Record<string, unknown>>) ?? [];
        const subRef = refs.find((r) => r.type === 3);
        const teaRef = refs.find((r) => r.type === 2);
        const roomRef = refs.find((r) => r.type === 4);
        const subId = subRef?.id as number;
        const cellState = (p.cellState as string) ?? 'STANDARD';
        const isInfo = p.is as Record<string, unknown> | undefined;
        const isCancelled =
          cellState === 'CANCEL' || (isInfo?.cancelled as boolean) === true;
        const isExam = (isInfo?.exam as boolean) === true;

        entries.push({
          id: p.id as number,
          lessonId: p.lessonId as number,
          date: p.date as number,
          startTime: p.startTime as number,
          endTime: p.endTime as number,
          subjectName: subjectMap[subId]?.name ?? '',
          subjectLong: subjectMap[subId]?.longName ?? '',
          teacherName: teacherMap[teaRef?.id as number] ?? '',
          roomName: roomMap[roomRef?.id as number] ?? '',
          cellState: cellState as TimetableEntry['cellState'],
          isExam,
          isCancelled,
          isSubstitution: cellState === 'SUBSTITUTION',
          isAdditional: cellState === 'ADDITIONAL',
          note: (p.lessonText as string) || undefined,
        });
      });

    return entries.sort((a, b) => a.startTime - b.startTime);
  } catch {
    return [];
  }
}

// ─── Detail Sheet ────────────────────────────────────────────────────────────

function LessonDetailSheet({
  entry,
  onClose,
}: {
  entry: TimetableEntry;
  onClose: () => void;
}) {
  const borderColor = entry.isCancelled
    ? 'var(--danger)'
    : entry.isExam
    ? 'var(--warning)'
    : entry.isSubstitution
    ? 'var(--orange)'
    : subjectColor(entry.subjectName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-h-[80dvh] overflow-y-auto rounded-t-2xl"
        style={{ background: 'var(--app-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-10 h-1 rounded-full mx-auto mt-3 mb-5"
          style={{ background: 'var(--app-border)' }}
        />
        <div className="px-6 pb-10">
          {/* Title row */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-1.5 h-14 rounded-full flex-shrink-0"
              style={{ background: borderColor }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="text-[18px] font-bold truncate"
                style={{ color: 'var(--app-text-primary)' }}
              >
                {entry.subjectLong || entry.subjectName}
              </p>
              <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
                {parseTime(entry.startTime)} – {parseTime(entry.endTime)}
              </p>
            </div>
            {entry.isExam && (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--warning) 20%, transparent)', color: 'var(--warning)' }}
              >
                <FileText size={12} />
                Prüfung
              </span>
            )}
            {entry.isCancelled && (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)' }}
              >
                <X size={12} />
                Entfall
              </span>
            )}
            {entry.isSubstitution && (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--orange) 20%, transparent)', color: 'var(--orange)' }}
              >
                <ArrowLeftRight size={12} />
                Vertretung
              </span>
            )}
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--app-card)' }}
          >
            <DetailRow label="Lehrer" value={entry.teacherName || '–'} />
            <DetailRow label="Raum" value={entry.roomName || '–'} />
            <DetailRow
              label="Zeit"
              value={`${parseTime(entry.startTime)} – ${parseTime(entry.endTime)}`}
            />
            {entry.note && (
              <DetailRow label="Notiz" value={entry.note} last />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{
        borderBottom: last ? 'none' : '1px solid var(--app-separator)',
      }}
    >
      <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
        {label}
      </p>
      <p
        className="text-sm font-medium text-right"
        style={{ color: 'var(--app-text-primary)', maxWidth: '60%' }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Lesson Cell ─────────────────────────────────────────────────────────────

function LessonCell({ entry }: { entry: TimetableEntry }) {
  const [open, setOpen] = useState(false);

  const leftColor = entry.isCancelled
    ? 'var(--danger)'
    : entry.isExam
    ? 'var(--warning)'
    : entry.isSubstitution
    ? 'var(--orange)'
    : subjectColor(entry.subjectName);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-full rounded-lg text-left overflow-hidden press-scale flex"
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          opacity: entry.isCancelled ? 0.65 : 1,
        }}
      >
        {/* Colored left border */}
        <div
          className="w-[3px] flex-shrink-0 h-full"
          style={{ background: leftColor }}
        />
        <div className="flex-1 min-w-0 px-1 py-1 flex flex-col justify-center">
          <p
            className="text-[10px] font-bold leading-tight truncate"
            style={{
              color: 'var(--app-text-primary)',
              textDecoration: entry.isCancelled ? 'line-through' : 'none',
            }}
          >
            {entry.subjectName}
          </p>
          <p
            className="text-[9px] leading-tight truncate mt-0.5"
            style={{ color: 'var(--app-text-secondary)' }}
          >
            {entry.roomName}
          </p>
          {entry.isExam && (
            <FileText size={8} color="var(--warning)" style={{ marginTop: 1 }} />
          )}
          {entry.isCancelled && (
            <X size={8} color="var(--danger)" style={{ marginTop: 1 }} />
          )}
          {entry.isSubstitution && (
            <ArrowLeftRight size={8} color="var(--orange)" style={{ marginTop: 1 }} />
          )}
        </div>
      </button>

      {open && (
        <LessonDetailSheet entry={entry} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TimetablePage() {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });
  const cacheRef = useRef<Record<number, TimetableEntry[]>>({});
  const timeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const monday = startOfWeek(addDays(new Date(), weekOffset * 7), {
    weekStartsOn: 1,
  });
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  const todayStr = format(new Date(), 'yyyyMMdd');
  const isCurrentWeek = weekOffset === 0;

  // Keep current time updated for the red line
  useEffect(() => {
    timeRef.current = setInterval(() => {
      const n = new Date();
      setNowMinutes(n.getHours() * 60 + n.getMinutes());
    }, 60000);
    return () => {
      if (timeRef.current) clearInterval(timeRef.current);
    };
  }, []);

  const load = useCallback(async () => {
    if (cacheRef.current[weekOffset]) {
      setEntries(cacheRef.current[weekOffset]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const dateStr = format(monday, 'yyyy-MM-dd');
      const res = await fetchTimetable(dateStr);
      const parsed = parseTimetable(res);
      cacheRef.current[weekOffset] = parsed;
      setEntries(parsed);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') {
        router.replace('/login');
        return;
      }
      setError(e instanceof Error ? e.message : 'Fehler beim Laden des Stundenplans');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  useEffect(() => {
    load();
  }, [load]);

  function entriesForDay(date: Date) {
    const d = parseInt(format(date, 'yyyyMMdd'));
    return entries.filter((e) => e.date === d);
  }

  // Determine time bounds from all entries
  const minStart = entries.length
    ? Math.min(...entries.map((e) => e.startTime))
    : 730;
  const maxEnd = entries.length
    ? Math.max(...entries.map((e) => e.endTime))
    : 1600;

  const minMins = timeToMinutes(minStart);
  const maxMins = timeToMinutes(maxEnd);
  const totalMins = maxMins - minMins;
  const PX_PER_MIN = 1.4;
  const gridHeight = Math.max(totalMins * PX_PER_MIN, 400);

  // Time labels every 50 minutes (one lesson block)
  const timeLabels: number[] = [];
  for (let m = minMins; m <= maxMins; m += 50) {
    timeLabels.push(m);
  }

  return (
    <AuthGuard>
      <div
        className="h-dvh flex flex-col overflow-hidden"
        style={{ background: 'var(--app-bg)', paddingBottom: 'var(--nav-h)' }}
      >
        {/* Header */}
        <div className="px-5 pt-14 pb-3 fade-in flex-shrink-0">
          <div className="mb-2">
            <h1
              className="text-[28px] font-bold tracking-tight"
              style={{ color: 'var(--app-text-primary)' }}
            >
              Stundenplan
            </h1>
          </div>
          <div className="flex items-center justify-between mt-1">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="p-2 rounded-full press-scale"
              style={{ background: 'var(--app-surface)' }}
            >
              <ChevronLeft size={20} color="var(--accent)" />
            </button>
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--app-text-secondary)' }}
            >
              {format(monday, 'd. MMM', { locale: de })} –{' '}
              {format(addDays(monday, 4), 'd. MMM yyyy', { locale: de })}
            </span>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              className="p-2 rounded-full press-scale"
              style={{ background: 'var(--app-surface)' }}
            >
              <ChevronRight size={20} color="var(--accent)" />
            </button>
          </div>
        </div>

        {/* Day header row */}
        <div className="px-3 flex gap-1 mb-1">
          <div className="w-9 flex-shrink-0" />
          {weekDates.map((date, i) => {
            const isToday = format(date, 'yyyyMMdd') === todayStr;
            return (
              <div key={i} className="flex-1 text-center">
                <p
                  className="text-[10px] font-medium"
                  style={{ color: 'var(--app-text-secondary)' }}
                >
                  {DAY_LABELS[i]}
                </p>
                <div className="flex justify-center">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      background: isToday ? 'var(--accent)' : 'transparent',
                    }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: isToday ? '#fff' : 'var(--app-text-primary)',
                      }}
                    >
                      {format(date, 'd')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-3 pb-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size={28} />
            </div>
          ) : error ? (
            <ErrorView message={error} onRetry={load} />
          ) : (
            <div className="flex gap-1">
              {/* Time column */}
              <div
                className="w-9 flex-shrink-0 relative"
                style={{ height: gridHeight }}
              >
                {timeLabels.map((m) => {
                  const top = (m - minMins) * PX_PER_MIN;
                  return (
                    <div
                      key={m}
                      className="absolute left-0 right-0"
                      style={{ top }}
                    >
                      <p
                        className="text-[9px]"
                        style={{ color: 'var(--app-text-tertiary)' }}
                      >
                        {Math.floor(m / 60)
                          .toString()
                          .padStart(2, '0')}
                        :{(m % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Day columns */}
              {weekDates.map((date, di) => {
                const dayEntries = entriesForDay(date);
                const isToday = format(date, 'yyyyMMdd') === todayStr;

                return (
                  <div
                    key={di}
                    className="flex-1 relative"
                    style={{
                      height: gridHeight,
                      background: isToday
                        ? 'color-mix(in srgb, var(--accent) 5%, transparent)'
                        : 'transparent',
                      borderRadius: 6,
                    }}
                  >
                    {dayEntries.map((entry) => {
                      const top =
                        (timeToMinutes(entry.startTime) - minMins) *
                        PX_PER_MIN;
                      const height = Math.max(
                        (timeToMinutes(entry.endTime) -
                          timeToMinutes(entry.startTime)) *
                          PX_PER_MIN -
                          2,
                        28
                      );
                      return (
                        <div
                          key={entry.id}
                          className="absolute left-0.5 right-0.5"
                          style={{ top, height }}
                        >
                          <LessonCell entry={entry} />
                        </div>
                      );
                    })}

                    {/* Current time red line */}
                    {isToday &&
                      isCurrentWeek &&
                      nowMinutes >= minMins &&
                      nowMinutes <= maxMins && (
                        <div
                          className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                          style={{
                            top: (nowMinutes - minMins) * PX_PER_MIN,
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: 'var(--danger)' }}
                          />
                          <div
                            className="flex-1 h-[1.5px]"
                            style={{ background: 'var(--danger)' }}
                          />
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
