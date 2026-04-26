'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle, XCircle, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import EmptyView from '@/components/ui/EmptyView';
import { fetchAbsences } from '@/lib/api';
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

      // Prefer the server-provided hours value; only calculate as fallback
      const rawHours =
        (item.hours as number | null | undefined) ??
        (item.lessonHours as number | null | undefined) ??
        null;

      let hours: number;
      if (rawHours !== null && rawHours !== undefined && rawHours > 0) {
        hours = rawHours;
      } else {
        const startMins = toMinutes(startTime);
        const endMins = toMinutes(endTime);
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
  entries: AbsenceEntry[]
): Array<{ key: string; label: string; entries: AbsenceEntry[]; hours: number }> {
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
    hours: number;
  }> = [];

  map.forEach((es, key) => {
    const [year, month] = key.split('-');
    const label = `${MONTHS[parseInt(month) - 1]} ${year}`;
    const hours = es.reduce((a, e) => a + e.hours, 0);
    result.push({ key, label, entries: es, hours });
  });

  return result.sort((a, b) => b.key.localeCompare(a.key));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AbsencesPage() {
  const router = useRouter();
  const [absences, setAbsences] = useState<AbsenceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAbsences();
      setAbsences(parseAbsences(res));
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') {
        router.replace('/login');
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

  const totalHours = absences.reduce((a, e) => a + e.hours, 0);
  const excused = absences
    .filter((e) => e.isExcused)
    .reduce((a, e) => a + e.hours, 0);
  const unexcused = totalHours - excused;

  // Absence rate estimate
  const now = new Date();
  const sep = new Date(
    now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1,
    8,
    1
  );
  const elapsedDays = Math.floor(
    (now.getTime() - sep.getTime()) / 86400000
  );
  const totalPossible = Math.max(
    1,
    Math.floor((elapsedDays * 5) / 7) * 8
  );
  const rate = Math.min((totalHours / totalPossible) * 100, 100);
  const rateColor =
    rate < 5 ? 'var(--tint)' : rate < 15 ? 'var(--warning)' : 'var(--danger)';

  const groups = groupByMonth(absences);

  return (
    <AuthGuard>
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
                      {totalHours}
                    </p>
                  </div>
                  <div className="flex gap-5">
                    <div className="text-center">
                      <p
                        className="text-xl font-bold"
                        style={{ color: 'var(--tint)' }}
                      >
                        {excused}
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
                        {unexcused}
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
                          {group.hours} Std.
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
                                  {entry.hours}h
                                </span>
                                {entry.isExcused ? (
                                  <CheckCircle size={18} color="var(--tint)" />
                                ) : (
                                  <XCircle size={18} color="var(--danger)" />
                                )}
                              </div>
                            </div>
                            {entry.reasonName && (
                              <p
                                className="text-xs mt-2 px-3 py-1.5 rounded-lg"
                                style={{
                                  background: 'var(--app-card)',
                                  color: 'var(--app-text-secondary)',
                                }}
                              >
                                {entry.reasonName}
                              </p>
                            )}
                            {entry.note && !entry.reasonName && (
                              <p
                                className="text-xs mt-2 px-3 py-1.5 rounded-lg"
                                style={{
                                  background: 'var(--app-card)',
                                  color: 'var(--app-text-secondary)',
                                }}
                              >
                                {entry.note}
                              </p>
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
    </AuthGuard>
  );
}
