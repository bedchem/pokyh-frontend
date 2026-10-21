'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarBlank, CaretDown, CheckCircle, FilePdf, Plus, XCircle } from '@phosphor-icons/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import { Button } from '@/components/ui/Button';
import { Page, PageHeader, Section, Segmented } from '@/components/app/Page';
import { Bone, Line, RowsSkeleton } from '@/components/app/Skeleton';
import PixelState from '@/components/app/PixelState';
import { readAbsenceCalc, writeAbsenceCalc } from '@/lib/absence-calc';
import ErrorView from '@/components/ui/ErrorView';
// Abwesenheit-melden deaktiviert (kein funktionierender WebUntis-Schreib-Endpunkt):
import ReportAbsenceSheet from '@/components/absences/ReportAbsenceSheet';
import ExcuseSheet from '@/components/absences/ExcuseSheet';
import { fetchAbsences, fetchTimetableForCalc, getAbsencesStale, excuseLetterUrl } from '@/lib/api';
import { useUntisPermissions } from '@/components/app/hooks';
import { untisActionsDict } from '@/lib/i18n/dictionaries/untisActions';
import { useSession, loginPath } from '@/providers/SessionProvider';
import type { AbsenceEntry } from '@/lib/types';
import { parseAbsences } from '@/lib/absences';
import { useDateLocale, useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { absencesDict } from '@/lib/i18n/dictionaries/absences';
import { formatDate, monthShort } from '@/lib/i18n/dateLocale';

const MediaViewer = dynamic(() => import('@/components/ui/MediaViewer'), { ssr: false });

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

// m is real clock time spent in lessons (breaks are never counted), so it is shown in 60-minute
// hours: Mo 07:50-16:45 minus 1h 15m of breaks is 7h 40m, not "9h 10m" in 50-minute units.
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
type GridEntry = {
  status?: string;
  position2?: Array<{ current?: unknown; removed?: unknown }>;
  duration?: { start?: string; end?: string };
};

// Build a map of dateNum → deduplicated lesson slots from a timetable API response.
// Only counts non-cancelled entries that have an actual subject (no breaks/free periods).
function mergeTimetableIntoMap(
  target: Map<number, Map<number, DaySlot>>,
  json: unknown,
): void {
  try {
    const root = json as { days?: Array<{ date: string; gridEntries?: GridEntry[] }> };
    if (!root.days) return;
    for (const day of root.days) {
      if (!day.gridEntries?.length) continue;
      const dateNum = parseInt(day.date.replace(/-/g, ''), 10);
      if (!target.has(dateNum)) target.set(dateNum, new Map());
      const timeMap = target.get(dateNum)!;
      for (const ge of day.gridEntries) {
        if (ge.status === 'CANCELLED') continue;
        // Skip entries without any subject in position2 (e.g. breaks)
        const pos2 = ge.position2 ?? [];
        const hasSub = pos2.some((p) => p.current || p.removed);
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateOf(d: number): Date {
  const s = d.toString();
  return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
}

function groupByMonth(
  entries: AbsenceEntry[],
  minutesMap: Map<number, number>,
  tag: string,
): Array<{ key: string; label: string; entries: AbsenceEntry[]; totalMinutes: number }> {
  const map = new Map<string, AbsenceEntry[]>();
  entries.forEach((e) => {
    const s = e.startDate.toString();
    const key = `${s.slice(0, 4)}-${s.slice(4, 6)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  });

  const result: Array<{
    key: string;
    label: string;
    entries: AbsenceEntry[];
    totalMinutes: number;
  }> = [];

  map.forEach((es, key) => {
    const [year, month] = key.split('-');
    const long = formatDate(new Date(+year, parseInt(month) - 1, 1), tag, { month: 'long', year: 'numeric' });
    const label = long.charAt(0).toUpperCase() + long.slice(1);
    const totalMinutes = es.reduce((a, e) => a + (minutesMap.get(e.id) ?? e.hours * 50), 0);
    result.push({ key, label, entries: es, totalMinutes });
  });

  return result.sort((a, b) => b.key.localeCompare(a.key));
}

// ─── Module-level constants ───────────────────────────────────────────────────

const _nowDate = new Date();
const CURRENT_SCHOOL_YEAR = _nowDate.getMonth() >= 8 ? _nowDate.getFullYear() : _nowDate.getFullYear() - 1;
const AVAILABLE_YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_SCHOOL_YEAR - i);
// September to June, the months of a school year.
const SCHOOL_MONTHS = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AbsencesPage() {
  const { user } = useSession();
  const t = useT(absencesDict);
  const { locale } = useLocale();
  const { tag } = useDateLocale();
  const localize = useLocalizeHref();
  const [selectedYear, setSelectedYear] = useState(CURRENT_SCHOOL_YEAR);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);
  const [absences, setAbsences] = useState<AbsenceEntry[]>(() => {
    const stale = getAbsencesStale(CURRENT_SCHOOL_YEAR);
    return stale ? parseAbsences(stale) : [];
  });
  const [minutesMap, setMinutesMap] = useState<Map<number, number>>(new Map());
  const [totalPossibleMins, setTotalPossibleMins] = useState(0);
  const [loading, setLoading] = useState(() => !getAbsencesStale(CURRENT_SCHOOL_YEAR));
  const [error, setError] = useState('');
  const [exact, setExact] = useState(false);
  // Shared with the frame: shown at once from the last answer on this device.
  const perms = useUntisPermissions();
  const canReport = !!perms?.canReportAbsence;
  const personName = perms?.personName ?? null;
  const [showReport, setShowReport] = useState(false);
  const [excuse, setExcuse] = useState<{ ids: number[]; summary: string } | null>(null);
  const [letterOpen, setLetterOpen] = useState(false);
  const ta = useT(untisActionsDict);

  const fmt = (m: number) => exact ? formatMinutes(m) : roundHours(m);

  const studentId = user?.studentId ?? 0;

  const load = useCallback(async () => {
    if (!getAbsencesStale(selectedYear)) setLoading(true);
    setError('');
    try {
      const res = await fetchAbsences(selectedYear);
      const parsed = parseAbsences(res);
      setAbsences(parsed);

      // Schneller Pfad: lokal gecachtes Berechnungs-Ergebnis verwenden, solange
      // sich die Anzahl der Abwesenheiten nicht geändert hat → kein Stundenplan-Laden.
      const cached = readAbsenceCalc(studentId, selectedYear);
      if (cached && cached.count === parsed.length) {
        setMinutesMap(cached.minutes);
        setTotalPossibleMins(Math.max(1, cached.possible));
        return; // finally setzt loading=false
      }

      // Compute school year date range for selected year
      const sep = new Date(selectedYear, 8, 1); // Sept 1 of selected year
      const schoolYearEndDate = new Date(selectedYear + 1, 5, 30); // June 30 of next year
      const now = selectedYear === CURRENT_SCHOOL_YEAR ? new Date() : schoolYearEndDate;

      // Fetch timetable for absence weeks + all school-year weeks (for accurate rate denominator)
      const allWeeks = Array.from(new Set([...getWeeksForAbsences(parsed), ...getWeeksForSchoolYear(now, sep)]));
      const weekResults = await Promise.allSettled(allWeeks.map((d) => fetchTimetableForCalc(d)));

      // If any timetable fetch was rejected due to session expiry, redirect now.
      const sessionExpired = weekResults.some(
        (r) => r.status === 'rejected' && r.reason instanceof Error && r.reason.message === 'session_expired',
      );
      if (sessionExpired) {
        window.location.replace(loginPath());
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

      // Sum all lesson minutes since school-year start, accounts for Ferien, Feiertage, personal schedule
      const nowNum = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
      const sepNum = sep.getFullYear() * 10000 + (sep.getMonth() + 1) * 100 + sep.getDate();
      let possibleMins = 0;
      for (const [dateNum, slots] of dateMap.entries()) {
        if (dateNum >= sepNum && dateNum <= nowNum) {
          for (const slot of slots) possibleMins += slot.endMins - slot.startMins;
        }
      }
      setTotalPossibleMins(Math.max(1, possibleMins));

      // Ergebnis lokal cachen → nächster Aufruf rendert sofort.
      writeAbsenceCalc(studentId, selectedYear, mins, possibleMins, parsed.length);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') {
        window.location.replace(loginPath());
      } else {
        setError(e instanceof Error ? e.message : 'Fehler');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedYear, studentId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) setIsYearOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const getMin = (e: AbsenceEntry) => minutesMap.get(e.id) ?? e.hours * 50;

  const totalMinutes    = absences.reduce((a, e) => a + getMin(e), 0);
  const excusedMinutes  = absences.filter((e) => e.isExcused).reduce((a, e) => a + getMin(e), 0);
  const unexcusedMinutes = totalMinutes - excusedMinutes;

  const rate      = totalPossibleMins > 0 ? Math.min((totalMinutes / totalPossibleMins) * 100, 100) : 0;

  const groups = groupByMonth(absences, minutesMap, tag);

  const rateInk = rate < 5 ? 'text-success-ink' : rate < 15 ? 'text-butter-ink' : 'text-danger-ink';
  const unexcusedIds = absences.filter((a) => !a.isExcused).map((a) => a.id);
  const excusedShare = totalMinutes > 0 ? (excusedMinutes / totalMinutes) * 100 : 0;

  // Sep–Jun of the selected school year, missed time per month.
  const monthBars = SCHOOL_MONTHS.map((m, i) => {
    const year = i < 4 ? selectedYear : selectedYear + 1;
    const key = `${year}-${String(m + 1).padStart(2, '0')}`;
    const minutes = groups.find((g) => g.key === key)?.totalMinutes ?? 0;
    const future = new Date(year, m, 1) > _nowDate;
    return { key, label: monthShort(locale)[m].replace('.', ''), minutes, future };
  });
  const monthMax = Math.max(1, ...monthBars.map((b) => b.minutes));

  const jumpTo = (key: string) => {
    document.getElementById(`m-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <AuthGuard>
      <UntisGuard>
        <Page>
          <PageHeader
            title={t('title')}
            subtitle={`${selectedYear}/${selectedYear + 1}`}
            actions={
              <>
                <div className="relative" ref={yearRef}>
                  <Button variant="quiet" onClick={() => setIsYearOpen(!isYearOpen)} aria-haspopup="listbox" aria-expanded={isYearOpen}>
                    {selectedYear}/{String(selectedYear + 1).slice(2)}
                    <CaretDown size={15} weight="bold" className={`transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </Button>
                  {isYearOpen && (
                    <ul role="listbox" className="sheet-in absolute right-0 top-[calc(100%+6px)] z-50 min-w-[160px] rounded-[16px] bg-surface p-1.5 shadow-[var(--shadow-float)]">
                      {AVAILABLE_YEARS.map((y) => (
                        <li key={y}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selectedYear === y}
                            onClick={() => { setSelectedYear(y); setIsYearOpen(false); }}
                            className={`w-full rounded-[10px] px-3 py-2.5 text-left text-[14.5px] font-semibold transition-colors ${selectedYear === y ? 'bg-periwinkle text-periwinkle-ink' : 'hover:bg-inset'}`}
                          >
                            {y} / {y + 1}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Segmented<'rounded' | 'exact'>
                  label={t('exact')}
                  value={exact ? 'exact' : 'rounded'}
                  onChange={(v) => setExact(v === 'exact')}
                  options={[{ value: 'rounded', label: t('rounded') }, { value: 'exact', label: t('exact') }]}
                />
                {canReport && (
                  <Button onClick={() => setShowReport(true)}>
                    <Plus size={18} weight="bold" aria-hidden="true" />
                    {t('report')}
                  </Button>
                )}
              </>
            }
          />

          {loading ? (
            <div aria-hidden="true" className="flex flex-col gap-9 text-ink">
              <div className="grid gap-3 md:gap-4 lg:grid-cols-2">
                <span className="squircle flex h-[258px] flex-col justify-between rounded-[24px] bg-surface p-5 md:p-6">
                  <span className="flex flex-col gap-3"><Line w={90} h={12} /><Line w={150} h={44} /><Line w={180} h={12} /></span>
                  <span className="flex flex-col gap-4"><Line w="100%" h={10} /><span className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <Line key={i} w="70%" h={20} />)}</span></span>
                </span>
                <span className="squircle flex h-[258px] items-end gap-2 rounded-[24px] bg-surface p-5 md:p-6">
                  {[40, 70, 25, 55, 35, 60, 20, 45, 30, 50].map((h, i) => <Bone key={i} className="flex-1 !rounded-[6px]" style={{ height: `${h}%` }} />)}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <Line w={150} h={20} />
                <RowsSkeleton rows={4} lead="square" trailing />
              </div>
            </div>
          ) : error ? (
            <div className="squircle rounded-[26px] bg-surface"><ErrorView message={error} onRetry={load} /></div>
          ) : (
            <div className="flex flex-col gap-9">
              <div className="rise flex flex-col gap-3 md:gap-4">
                <div className="grid gap-3 md:gap-4 lg:grid-cols-2">
                  <div className="squircle flex flex-col justify-between gap-7 rounded-[24px] bg-surface p-5 md:p-6">
                    <div>
                      <p className="text-[14px] font-semibold text-ink-2">{t('rate')}</p>
                      <p className={`mt-2 text-[46px] font-extrabold leading-none tracking-[-0.05em] tnum md:text-[54px] ${rateInk}`}>{rate.toFixed(1).replace('.', locale === 'en' ? '.' : ',')} %</p>
                      <p className="mt-2.5 text-[14px] text-ink-2">{t('ofLessons', { missed: fmt(totalMinutes), total: fmt(totalPossibleMins) })}</p>
                    </div>
                    <div>
                      <span className="flex h-2.5 gap-[3px] overflow-hidden rounded-full bg-inset">
                        {totalMinutes > 0 && (
                          <>
                            <span className="rounded-full bg-success transition-[width] duration-700 ease-[var(--ease-out)]" style={{ width: `${excusedShare}%` }} />
                            {unexcusedMinutes > 0 && <span className="flex-1 rounded-full bg-danger" />}
                          </>
                        )}
                      </span>
                      <dl className="mt-4 grid grid-cols-3 gap-3">
                        {[
                          { label: t('totalMissed'), value: totalMinutes, dot: '', ink: '' },
                          { label: t('excused'), value: excusedMinutes, dot: 'bg-success', ink: '' },
                          { label: t('unexcused'), value: unexcusedMinutes, dot: 'bg-danger', ink: unexcusedMinutes > 0 ? 'text-danger-ink' : '' },
                        ].map((f) => (
                          <div key={f.label} className="flex min-w-0 flex-col justify-between gap-1">
                            <dt className="flex items-center gap-1.5 text-[13px] leading-snug text-ink-2">
                              {f.dot && <span className={`size-2 shrink-0 rounded-full ${f.dot}`} aria-hidden="true" />}
                              {f.label}
                            </dt>
                            <dd className={`text-[21px] font-extrabold tracking-[-0.03em] tnum ${f.ink}`}>{fmt(f.value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>

                <div className="squircle flex flex-col rounded-[24px] bg-surface p-5 md:p-6">
                  <p className="text-[14px] font-semibold text-ink-2">{t('perMonth')}</p>
                  <div className="mt-4 flex min-h-[150px] flex-1 items-end gap-1.5">
                    {monthBars.map((b, i) => {
                      const has = b.minutes > 0;
                      return (
                        <button
                          key={b.key}
                          type="button"
                          disabled={!has}
                          onClick={() => jumpTo(b.key)}
                          title={has ? fmt(b.minutes) : undefined}
                          className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5 disabled:cursor-default"
                        >
                          <span className={`text-[11px] font-bold tnum transition-colors ${has ? 'text-ink-2 group-hover:text-ink' : 'text-transparent'}`}>{has ? fmt(b.minutes) : '·'}</span>
                          <span
                            className={`w-full rounded-[6px] transition-[filter,height] duration-500 ease-[var(--ease-out)] ${
                              has ? 'bg-accent group-hover:brightness-110' : b.future ? 'bg-[color-mix(in_srgb,var(--inset)_50%,transparent)]' : 'bg-inset'
                            }`}
                            style={{ height: has ? `${Math.max(8, (b.minutes / monthMax) * 100)}%` : 4, transitionDelay: `${i * 30}ms` }}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {monthBars.map((b) => (
                      <span key={b.key} className={`min-w-0 flex-1 truncate text-center text-[11px] font-semibold ${b.future ? 'text-ink-3/60' : 'text-ink-3'}`}>{b.label}</span>
                    ))}
                  </div>
                </div>
                </div>

                {unexcusedIds.length > 0 && (
                  // Opens in the viewer, with its download button beside it.
                  <button
                    type="button"
                    onClick={() => setLetterOpen(true)}
                    className="squircle group flex items-center justify-between gap-4 rounded-[22px] bg-butter px-5 py-4 text-left text-butter-ink transition-[filter] hover:brightness-[0.98] dark:hover:brightness-110"
                  >
                    <span>
                      <span className="block text-[15.5px] font-bold">{ta('exLetter')}</span>
                      <span className="block text-[13.5px] font-semibold opacity-80">{ta('exLetterHint')}</span>
                    </span>
                    <FilePdf size={22} weight="bold" className="shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-9">
                {absences.length === 0 ? (
                  <div className="squircle rounded-[26px] bg-surface"><PixelState sprite="empty" title={t('emptyTitle')} detail={t('emptySubtitle')} /></div>
                ) : (
                  groups.map((group) => (
                    <Section
                      key={group.key}
                      id={`m-${group.key}`}
                      title={group.label}
                      action={<span className="text-[14px] font-semibold text-ink-2 tnum">{fmt(group.totalMinutes)}</span>}
                      className="rise scroll-mt-6"
                    >
                      <ul className="squircle flex flex-col rounded-[24px] bg-surface p-2">
                        {group.entries.map((entry) => {
                          const start = dateOf(entry.startDate);
                          const multi = entry.startDate !== entry.endDate;
                          const title = multi
                            ? `${formatDate(start, tag, { day: 'numeric', month: 'short' })} – ${formatDate(dateOf(entry.endDate), tag, { day: 'numeric', month: 'short' })}`
                            : formatDate(start, tag, { weekday: 'long', day: 'numeric', month: 'long' });
                          const meta = [
                            entry.startTime || entry.endTime ? `${formatTime(entry.startTime)} – ${formatTime(entry.endTime)}` : '',
                            entry.subjectName,
                            entry.teacherName,
                          ].filter(Boolean).join(' · ');
                          const tone = entry.isExcused ? 'bg-sage text-sage-ink' : 'bg-blush text-blush-ink';
                          return (
                            <li key={entry.id} className="relative px-3 py-3.5 before:absolute before:inset-x-3.5 before:top-0 before:h-px before:bg-line first:before:hidden">
                              <div className="flex items-start gap-3.5 lg:items-center lg:gap-4">
                                <span className={`flex size-12 shrink-0 flex-col items-center justify-center rounded-[14px] leading-none ${tone}`}>
                                  <span className="text-[18px] font-extrabold tracking-[-0.03em] tnum">{start.getDate()}</span>
                                  <span className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.04em] opacity-80">{formatDate(start, tag, { weekday: 'short' }).replace('.', '')}</span>
                                </span>
                                <div className="min-w-0 flex-1 lg:flex lg:items-center lg:gap-6">
                                  <div className="min-w-0 lg:flex-1">
                                    <div className="flex items-baseline justify-between gap-3">
                                      <p className="min-w-0 text-[15.5px] font-semibold first-letter:uppercase">{title}</p>
                                      <span className="shrink-0 text-[15px] font-bold tnum lg:hidden">{fmt(getMin(entry))}</span>
                                    </div>
                                    {meta && <p className="mt-0.5 text-[13.5px] text-ink-2 tnum">{meta}</p>}
                                    {(entry.reasonName || entry.note) && (
                                      <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">
                                        {entry.reasonName && <span className="font-semibold text-ink">{entry.reasonName}</span>}
                                        {entry.reasonName && entry.note ? ' · ' : ''}
                                        {entry.note}
                                      </p>
                                    )}
                                  </div>
                                  <div className="mt-3 flex flex-wrap items-center gap-2 lg:mt-0 lg:shrink-0 lg:justify-end">
                                    <span className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold ${tone}`}>
                                      {entry.isExcused ? <CheckCircle size={15} weight="bold" aria-hidden="true" /> : <XCircle size={15} weight="bold" aria-hidden="true" />}
                                      {entry.isExcused ? t('statusExcused') : t('statusOpen')}
                                    </span>
                                    {/* Like WebUntis: only who may report absences (guardians, students of age) excuses them. */}
                                    {!entry.isExcused && canReport && (
                                      <button
                                        type="button"
                                        onClick={() => setExcuse({ ids: [entry.id], summary: [title, entry.startTime || entry.endTime ? `${formatTime(entry.startTime)} – ${formatTime(entry.endTime)}` : ''].filter(Boolean).join(' · ') })}
                                        className="inline-flex h-8 items-center rounded-full bg-periwinkle px-3 text-[13px] font-semibold text-periwinkle-ink transition-[filter] hover:brightness-95 dark:hover:brightness-125"
                                      >
                                        {ta('exAction')}
                                      </button>
                                    )}
                                    <Link
                                      href={localize(`/timetable?date=${entry.startDate}`)}
                                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-inset px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-[color-mix(in_srgb,var(--inset)_86%,var(--ink))]"
                                    >
                                      <CalendarBlank size={14} weight="bold" aria-hidden="true" />
                                      {t('viewInTimetable')}
                                    </Link>
                                  </div>
                                </div>
                                <span className="hidden w-[72px] shrink-0 text-right text-[17px] font-extrabold tracking-[-0.02em] tnum lg:block">{fmt(getMin(entry))}</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </Section>
                  ))
                )}
              </div>
            </div>
          )}
        </Page>
        {showReport && (
          <ReportAbsenceSheet
            personName={personName}
            onClose={() => setShowReport(false)}
            onCreated={load}
          />
        )}
        {excuse && (
          <ExcuseSheet absenceIds={excuse.ids} summary={excuse.summary} onClose={() => setExcuse(null)} onSaved={load} />
        )}
        {letterOpen && (
          <MediaViewer
            item={{ kind: 'pdf', src: excuseLetterUrl(`${selectedYear}0901`, `${selectedYear + 1}0630`, unexcusedIds), name: `${ta('exLetter')} ${selectedYear}-${String(selectedYear + 1).slice(2)}.pdf` }}
            onClose={() => setLetterOpen(false)}
          />
        )}
      </UntisGuard>
    </AuthGuard>
  );
}
