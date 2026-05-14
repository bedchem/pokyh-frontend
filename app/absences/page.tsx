'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle, XCircle, UserX, Clock, ClockArrowUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import EmptyView from '@/components/ui/EmptyView';
import { fetchAbsences, fetchTimetable } from '@/lib/api';
import type { AbsenceEntry } from '@/lib/types';

// ─── Time helpers ─────────────────────────────────────────────────────────────

// Convert WebUntis time value to minutes from midnight.
// The classreg absences endpoint may return times as minutes-from-midnight
// (e.g. 475 = 07:55) or as HHMM integers (e.g. 755 = 07:55).
// Detection: if the last two digits exceed 59, the value cannot be valid HHMM,
// so it must already be minutes-from-midnight.
function toMinutes(t: number): number {
  if (!t) return 0;
  if (t > 2359) return t; // too large to be HHMM
  if (t % 100 > 59) return t; // minutes part > 59 → already minutes
  return Math.floor(t / 100) * 60 + (t % 100);
}

function formatTime(t: number): string {
  if (!t) return '';
  const mins = toMinutes(t);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min === 0 ? `${h}h` : `${h}h ${min}m`;
}

function roundHours(m: number): string {
  return `${Math.round(m / 60)}h`;
}

// ─── Timetable helpers for exact absence minutes ───────────────────────────────

type DaySlot = { startMins: number; endMins: number };

// Build a map of dateNum → deduplicated lesson slots from a timetable API response.
// Only counts non-cancelled entries that have an actual subject (no breaks/free periods).
function mergeTimetableIntoMap(
  target: Map<number, Map<number, DaySlot>>,
  json: unknown,
): void {
  try {
    const root = json as { days?: any[] };
    if (!root.days) return;
    for (const day of root.days) {
      if (!day.gridEntries?.length) continue;
      const dateNum = parseInt(day.date.replace(/-/g, ''), 10);
      if (!target.has(dateNum)) target.set(dateNum, new Map());
      const timeMap = target.get(dateNum)!;
      for (const ge of day.gridEntries) {
        if (ge.status === 'CANCELLED') continue;
        // Skip entries without any subject in position2 (e.g. breaks)
        const pos2: any[] = ge.position2 ?? [];
        const hasSub = pos2.some((p: any) => p.current || p.removed);
        if (!hasSub) continue;
        const timePart = ge.duration?.start?.split('T')[1];
        const endPart  = ge.duration?.end?.split('T')[1];
        if (!timePart || !endPart) continue;
        const [startH, startM] = timePart.split(':').map(Number);
        const [endH, endM]     = endPart.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins   = endH   * 60 + endM;
        // Deduplicate by startMins so parallel subjects count as one period
        if (!timeMap.has(startMins)) {
          timeMap.set(startMins, { startMins, endMins });
        }
      }
    }
  } catch { /* ignore malformed responses */ }
}

// Returns one Monday date-string per calendar week from school-year start (Sep 1) to today.
function getWeeksForSchoolYear(now: Date, sep: Date): string[] {
  const dow = sep.getDay();
  const mon = new Date(sep);
  mon.setDate(sep.getDate() - (dow === 0 ? 6 : dow - 1));
  const mondays: string[] = [];
  const d = new Date(mon);
  while (d <= now) {
    mondays.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
    d.setDate(d.getDate() + 7);
  }
  return mondays;
}

// Returns one Monday date-string per calendar week that overlaps with any absence.
function getWeeksForAbsences(absences: AbsenceEntry[]): string[] {
  const mondays = new Set<string>();
  function addWeekOf(d: Date) {
    const dow = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    mondays.add(
      `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`,
    );
  }
  for (const entry of absences) {
    const s = entry.startDate.toString();
    const e = entry.endDate.toString();
    const start = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
    const end   = new Date(+e.slice(0, 4), +e.slice(4, 6) - 1, +e.slice(6, 8));
    const d = new Date(start);
    while (d <= end) {
      addWeekOf(d);
      d.setDate(d.getDate() + 1);
    }
  }
  return Array.from(mondays);
}

// Returns the exact lesson minutes for one absence entry by looking up the timetable.
function calcAbsenceMinutes(
  entry: AbsenceEntry,
  dateMap: Map<number, DaySlot[]>,
): number {
  let total = 0;
  const s = entry.startDate.toString();
  const e = entry.endDate.toString();
  const start = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
  const end   = new Date(+e.slice(0, 4), +e.slice(4, 6) - 1, +e.slice(6, 8));
  const isMultiDay  = entry.startDate !== entry.endDate;
  const absStartMin = toMinutes(entry.startTime);
  const absEndMin   = toMinutes(entry.endTime);

  const d = new Date(start);
  while (d <= end) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      const dateNum = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      const slots = dateMap.get(dateNum) ?? [];
      for (const slot of slots) {
        // Clip the counted duration to the absence window
        let countStart = slot.startMins;
        let countEnd   = slot.endMins;
        if (isMultiDay) {
          if (absStartMin > 0 && dateNum === entry.startDate) countStart = Math.max(countStart, absStartMin);
          if (absEndMin   > 0 && dateNum === entry.endDate)   countEnd   = Math.min(countEnd,   absEndMin);
        } else {
          if (absStartMin > 0) countStart = Math.max(countStart, absStartMin);
          if (absEndMin   > 0) countEnd   = Math.min(countEnd,   absEndMin);
        }
        if (countEnd > countStart) total += countEnd - countStart;
      }
    }
    d.setDate(d.getDate() + 1);
  }
  return total;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseAbsences(json: unknown): AbsenceEntry[] {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: number): string {
  const s = d.toString();
  return `${s.slice(6, 8)}.${s.slice(4, 6)}.${s.slice(0, 4)}`;
}

function groupByMonth(
  entries: AbsenceEntry[],
  minutesMap: Map<number, number>,
): Array<{ key: string; label: string; entries: AbsenceEntry[]; totalMinutes: number }> {
  const map = new Map<string, AbsenceEntry[]>();
  entries.forEach((e) => {
    const s = e.startDate.toString();
    const key = `${s.slice(0, 4)}-${s.slice(4, 6)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  });

  const MONTHS = [
    'Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
  ];
  const result: Array<{
    key: string;
    label: string;
    entries: AbsenceEntry[];
    totalMinutes: number;
  }> = [];

  map.forEach((es, key) => {
    const [year, month] = key.split('-');
    const label = `${MONTHS[parseInt(month) - 1]} ${year}`;
    const totalMinutes = es.reduce((a, e) => a + (minutesMap.get(e.id) ?? e.hours * 60), 0);
    result.push({ key, label, entries: es, totalMinutes });
  });

  return result.sort((a, b) => b.key.localeCompare(a.key));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AbsencesPage() {
  const router = useRouter();
  const [absences, setAbsences] = useState<AbsenceEntry[]>([]);
  const [minutesMap, setMinutesMap] = useState<Map<number, number>>(new Map());
  const [totalPossibleMins, setTotalPossibleMins] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exact, setExact] = useState(false);

  const fmt = (m: number) => exact ? formatMinutes(m) : roundHours(m);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAbsences();
      const parsed = parseAbsences(res);
      setAbsences(parsed);

      // Fetch timetable for absence weeks + all school-year weeks (for accurate rate denominator)
      const now = new Date();
      const sep = new Date(now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1, 8, 1);
      const allWeeks = Array.from(new Set([...getWeeksForAbsences(parsed), ...getWeeksForSchoolYear(now, sep)]));
      const weekResults = await Promise.allSettled(allWeeks.map((d) => fetchTimetable(d)));

      // If any timetable fetch was rejected due to session expiry, redirect now.
      const sessionExpired = weekResults.some(
        (r) => r.status === 'rejected' && r.reason instanceof Error && r.reason.message === 'session_expired',
      );
      if (sessionExpired) {
        window.location.replace('/login');
        return;
      }

      // Merge all weeks into a single date → slots map
      const rawMap = new Map<number, Map<number, DaySlot>>();
      weekResults.forEach((r) => {
        if (r.status === 'fulfilled') mergeTimetableIntoMap(rawMap, r.value);
      });
      const dateMap = new Map<number, DaySlot[]>();
      for (const [date, timeMap] of rawMap.entries()) {
        dateMap.set(date, Array.from(timeMap.values()));
      }

      // Calculate exact lesson minutes per absence entry
      const mins = new Map<number, number>();
      for (const entry of parsed) {
        mins.set(entry.id, calcAbsenceMinutes(entry, dateMap));
      }
      setMinutesMap(mins);

      // Sum all lesson minutes since school-year start — accounts for Ferien, Feiertage, personal schedule
      const nowNum = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
      const sepNum = sep.getFullYear() * 10000 + (sep.getMonth() + 1) * 100 + sep.getDate();
      let possibleMins = 0;
      for (const [dateNum, slots] of dateMap.entries()) {
        if (dateNum >= sepNum && dateNum <= nowNum) {
          for (const slot of slots) possibleMins += slot.endMins - slot.startMins;
        }
      }
      setTotalPossibleMins(Math.max(1, possibleMins));
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') {
        window.location.replace('/login');
      } else {
        setError(e instanceof Error ? e.message : 'Fehler');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const getMin = (e: AbsenceEntry) => minutesMap.get(e.id) ?? e.hours * 60;

  const totalMinutes    = absences.reduce((a, e) => a + getMin(e), 0);
  const excusedMinutes  = absences.filter((e) => e.isExcused).reduce((a, e) => a + getMin(e), 0);
  const unexcusedMinutes = totalMinutes - excusedMinutes;

  const rate      = Math.min((totalMinutes / totalPossibleMins) * 100, 100);
  const rateColor = rate < 5 ? 'var(--tint)' : rate < 15 ? 'var(--warning)' : 'var(--danger)';

  const groups = groupByMonth(absences, minutesMap);

  return (
    <AuthGuard>
      <UntisGuard>
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{ background: 'var(--app-bg)' }}
      >
        {/* Nav */}
        <div className="px-5 pt-4 pb-4 flex items-center gap-3 fade-in flex-shrink-0">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full press-scale"
            style={{ background: 'var(--app-surface)' }}
          >
            <ChevronLeft size={20} color="var(--accent)" />
          </button>
          <h1
            className="flex-1 text-[28px] font-bold tracking-tight"
            style={{ color: 'var(--app-text-primary)' }}
          >
            Abwesenheiten
          </h1>
          <button
            onClick={() => setExact((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium press-scale"
            style={{
              background: exact ? 'var(--tint)' : 'transparent',
              color: exact ? '#fff' : 'var(--tint)',
              border: exact ? 'none' : '1.5px solid var(--tint)',
              transition: 'background 0.2s, color 0.2s, border 0.2s',
            }}
          >
            {exact
              ? <ClockArrowUp size={15} />
              : <Clock size={15} />}
            {exact ? 'Exakt' : 'Gerundet'}
          </button>
        </div>

        <div className="flex-1 px-4 pb-10 overflow-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size={28} />
            </div>
          ) : error ? (
            <ErrorView message={error} onRetry={load} />
          ) : (
            <>
              {/* Overview card */}
              <div
                className="rounded-2xl p-5 mb-4 fade-in delay-1"
                style={{ background: 'var(--app-surface)' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      Fehlstunden gesamt
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      {fmt(totalMinutes)}
                    </p>
                  </div>
                  <div className="flex gap-5">
                    <div className="text-center">
                      <p
                        className="text-xl font-bold"
                        style={{ color: 'var(--tint)' }}
                      >
                        {fmt(excusedMinutes)}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--app-text-secondary)' }}
                      >
                        Entschuldigt
                      </p>
                    </div>
                    <div className="text-center">
                      <p
                        className="text-xl font-bold"
                        style={{ color: 'var(--danger)' }}
                      >
                        {fmt(unexcusedMinutes)}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--app-text-secondary)' }}
                      >
                        Unentschuldigt
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rate bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p
                      className="text-xs"
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      Fehlquote
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: rateColor }}
                    >
                      {rate.toFixed(1)}%
                    </p>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'var(--app-card)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${rate}%`,
                        background: rateColor,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              {absences.length === 0 ? (
                <EmptyView
                  icon={<UserX size={56} color="var(--app-text-primary)" />}
                  title="Keine Fehlstunden"
                  subtitle="Du hast keine Fehlstunden."
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {groups.map((group) => (
                    <section key={group.key}>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <p
                          className="text-[15px] font-semibold"
                          style={{ color: 'var(--app-text-primary)' }}
                        >
                          {group.label}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: 'var(--app-text-secondary)' }}
                        >
                          {fmt(group.totalMinutes)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {group.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="rounded-2xl p-4"
                            style={{ background: 'var(--app-surface)' }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: 'var(--app-text-primary)' }}
                                >
                                  {formatDate(entry.startDate)}
                                  {entry.startDate !== entry.endDate
                                    ? ` – ${formatDate(entry.endDate)}`
                                    : ''}
                                </p>
                                <p
                                  className="text-xs mt-0.5"
                                  style={{ color: 'var(--app-text-secondary)' }}
                                >
                                  {formatTime(entry.startTime)} –{' '}
                                  {formatTime(entry.endTime)}
                                  {entry.subjectName
                                    ? ` · ${entry.subjectName}`
                                    : ''}
                                  {entry.teacherName
                                    ? ` · ${entry.teacherName}`
                                    : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className="text-sm font-semibold"
                                  style={{ color: 'var(--app-text-secondary)' }}
                                >
                                  {fmt(getMin(entry))}
                                </span>
                                {entry.isExcused ? (
                                  <CheckCircle size={18} color="var(--tint)" />
                                ) : (
                                  <XCircle size={18} color="var(--danger)" />
                                )}
                              </div>
                            </div>
                            {entry.reasonName && (
                              <div
                                className="flex items-baseline gap-2 mt-2 px-3 py-1.5 rounded-lg"
                                style={{ background: 'var(--app-card)' }}
                              >
                                <span
                                  className="shrink-0 font-semibold"
                                  style={{ fontSize: '11px', color: 'var(--app-text-tertiary)' }}
                                >
                                  Grund
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: 'var(--app-text-secondary)' }}
                                >
                                  {entry.reasonName}
                                </span>
                              </div>
                            )}
                            {entry.note && (
                              <div
                                className="flex items-baseline gap-2 mt-1.5 px-3 py-1.5 rounded-lg"
                                style={{ background: 'var(--app-card)' }}
                              >
                                <span
                                  className="shrink-0 font-semibold"
                                  style={{ fontSize: '11px', color: 'var(--app-text-tertiary)' }}
                                >
                                  Text
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: 'var(--app-text-secondary)' }}
                                >
                                  {entry.note}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </UntisGuard>
    </AuthGuard>
  );
}
