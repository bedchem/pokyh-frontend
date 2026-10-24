'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarBlank, CaretDown, CheckCircle, FilePdf, PaperPlaneTilt, Plus, XCircle } from '@phosphor-icons/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import { Button } from '@/components/ui/Button';
import { Page, PageHeader, Section, Segmented } from '@/components/app/Page';
import { Bone, Line, RowsSkeleton } from '@/components/app/Skeleton';
import PixelState from '@/components/app/PixelState';
import { absenceFigures, absenceWeeks, hasWholeYear, readLessonCalendar, refreshLessonCalendar, toMinutes, type LessonCalendar } from '@/lib/absence-calc';
import ErrorView from '@/components/ui/ErrorView';
// Abwesenheit-melden deaktiviert (kein funktionierender WebUntis-Schreib-Endpunkt):
import ReportAbsenceSheet from '@/components/absences/ReportAbsenceSheet';
import ExcuseSheet from '@/components/absences/ExcuseSheet';
import { fetchAbsences, fetchAbsenceTimes, fetchExcuses, fetchTimetableForCalc, getAbsencesStale, getAbsenceTimesStale, getExcusesStale, excuseLetterUrl, type AbsenceTimes, type ExcuseResult } from '@/lib/api';
import { useUntisPermissions } from '@/components/app/hooks';
import { untisActionsDict } from '@/lib/i18n/dictionaries/untisActions';
import { useSession, leaveForLogin } from '@/providers/SessionProvider';
import type { AbsenceEntry, SentExcuse } from '@/lib/types';
import { parseAbsences, sentExcuseFor } from '@/lib/absences';
import { useDateLocale, useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { absencesDict } from '@/lib/i18n/dictionaries/absences';
import { formatDate, monthShort } from '@/lib/i18n/dateLocale';

const MediaViewer = dynamic(() => import('@/components/ui/MediaViewer'), { ssr: false });

// ─── Time helpers ─────────────────────────────────────────────────────────────

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
    const totalMinutes = es.reduce((a, e) => a + (minutesMap.get(e.id) ?? 0), 0);
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
  // The lessons of the year the rate is counted against (lib/absence-calc.ts), loaded and kept per week.
  const [liveCal, setLiveCal] = useState<{ year: number; cal: LessonCalendar } | null>(null);
  const [calcBusy, setCalcBusy] = useState(false);
  // The rate against the lessons so far, or against every lesson of the school year.
  const [span, setSpan] = useState<'sofar' | 'year'>('sofar');
  const wholeRef = useRef(false);
  const [loading, setLoading] = useState(() => !getAbsencesStale(CURRENT_SCHOOL_YEAR));
  const [error, setError] = useState('');
  const [exact, setExact] = useState(false);
  // Shared with the frame: shown at once from the last answer on this device.
  const perms = useUntisPermissions();
  const canReport = !!perms?.canReportAbsence;
  const personName = perms?.personName ?? null;
  const [showReport, setShowReport] = useState(false);
  const [excuse, setExcuse] = useState<{ ids: number[]; summary: string; startDate: number; endDate: number } | null>(null);
  // Excuses sent to the class teachers, from "Gesendet" (stored copy first), and those sent just now.
  const [excuses, setExcuses] = useState<SentExcuse[]>(() => getExcusesStale()?.excuses ?? []);
  const [sentNow, setSentNow] = useState<SentExcuse[]>([]);
  const [letterOpen, setLetterOpen] = useState(false);
  const ta = useT(untisActionsDict);
  // The missed lessons as the school counts them (WebUntis "Fehlzeiten"):
  // the minutes of each absence. Where they are there, they are what the
  // page shows; the timetable is only needed for the rate's whole (all
  // lessons of the year).
  const [liveTimes, setLiveTimes] = useState<{ year: number; data: AbsenceTimes } | null>(null);
  const times = useMemo(
    () => (liveTimes?.year === selectedYear ? liveTimes.data : getAbsenceTimesStale(selectedYear) ?? null),
    [liveTimes, selectedYear],
  );

  useEffect(() => {
    let alive = true;
    fetchAbsenceTimes(selectedYear).then((data) => { if (alive) setLiveTimes({ year: selectedYear, data }); }).catch(() => {});
    return () => { alive = false; };
  }, [selectedYear]);

  const fmt = (m: number) => exact ? formatMinutes(m) : roundHours(m);

  const studentId = user?.studentId ?? 0;
  const cal = useMemo(
    () => (liveCal?.year === selectedYear ? liveCal.cal : readLessonCalendar(studentId, selectedYear)),
    [liveCal, selectedYear, studentId],
  );

  // The weeks of the timetable not kept yet, or due again; a few at a time.
  const refreshCalendar = useCallback(async (year: number, whole: boolean, extra: string[]) => {
    setCalcBusy(true);
    try {
      setLiveCal({ year, cal: await refreshLessonCalendar(studentId, year, fetchTimetableForCalc, extra, new Date(), whole) });
    } catch (e) {
      if (e instanceof Error && e.message === 'session_expired') leaveForLogin();
    } finally {
      setCalcBusy(false);
    }
  }, [studentId]);

  const load = useCallback(async () => {
    if (!getAbsencesStale(selectedYear)) setLoading(true);
    setError('');
    try {
      const res = await fetchAbsences(selectedYear);
      const parsed = parseAbsences(res);
      setAbsences(parsed);
      setLoading(false);
      await refreshCalendar(selectedYear, wholeRef.current && selectedYear === CURRENT_SCHOOL_YEAR, absenceWeeks(parsed));
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') {
        leaveForLogin();
      } else {
        setError(e instanceof Error ? e.message : 'Fehler');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedYear, refreshCalendar]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  // Not needed for the list itself, so it never holds it up; without it the buttons simply stay.
  const loadExcuses = useCallback(() => {
    fetchExcuses().then((r) => setExcuses(Array.isArray(r?.excuses) ? r.excuses : [])).catch(() => {});
  }, []);

  useEffect(() => { loadExcuses(); }, [loadExcuses]);

  const onExcused = (r: ExcuseResult) => {
    const sent = r.excuse;
    if (sent) setSentNow((prev) => [...prev, sent]);
    // Saved in WebUntis instead (no message allowed): the absence itself changed.
    if (r.via === 'webuntis') void load();
    else loadExcuses();
  };

  // What "Gesendet" has wins: it knows the message to open.
  const allExcuses = [...excuses, ...sentNow.filter((n) => !excuses.some((e) => e.start === n.start && e.end === n.end))];

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) setIsYearOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // A year that is over is the same either way.
  const canWhole = selectedYear === CURRENT_SCHOOL_YEAR;
  const whole = span === 'year' && canWhole;
  const chooseSpan = (next: 'sofar' | 'year') => {
    setSpan(next);
    wholeRef.current = next === 'year';
    // The weeks still to come are only loaded for the whole year.
    if (next === 'year' && !hasWholeYear(cal, selectedYear, undefined, true)) void refreshCalendar(selectedYear, true, absenceWeeks(absences));
  };

  // The same figures as the home page's tile (lib/absence-calc.ts).
  const figures = useMemo(() => absenceFigures(absences, cal, times, selectedYear, undefined, whole), [absences, cal, times, selectedYear, whole]);
  const minutesFor = figures.perAbsence;
  const getMin = (e: AbsenceEntry) => minutesFor.get(e.id) ?? 0;

  const totalMinutes = figures.minutes;
  const excusedMinutes = figures.excusedMinutes;
  const unexcusedMinutes = totalMinutes - excusedMinutes;
  const rate = figures.rate;

  const groups = groupByMonth(absences, minutesFor, tag);

  const rateInk = rate == null ? 'text-ink-3' : rate < 5 ? 'text-success-ink' : rate < 15 ? 'text-butter-ink' : 'text-danger-ink';
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
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[14px] font-semibold text-ink-2">{t('rate')}</p>
                        {canWhole && (
                          <Segmented<'sofar' | 'year'>
                            label={t('spanLabel')}
                            value={span}
                            onChange={chooseSpan}
                            options={[{ value: 'sofar', label: t('spanSoFar') }, { value: 'year', label: t('spanYear') }]}
                          />
                        )}
                      </div>
                      <p className={`mt-2 text-[46px] font-extrabold leading-none tracking-[-0.05em] tnum md:text-[54px] ${rateInk}`}>
                        {rate != null ? `${rate.toFixed(1).replace('.', locale === 'en' ? '.' : ',')} %` : calcBusy ? <Line w={150} h={44} className="text-ink" /> : '–'}
                      </p>
                      <p className="mt-2.5 text-[14px] text-ink-2">
                        {figures.possible != null ? (
                          t(whole ? 'ofLessonsYear' : 'ofLessons', { missed: fmt(totalMinutes), total: fmt(figures.possible) })
                        ) : calcBusy ? (
                          t('rateCounting')
                        ) : (
                          <>
                            {t('rateMissing')}{' '}
                            <button type="button" onClick={() => void refreshCalendar(selectedYear, whole, absenceWeeks(absences))} className="font-semibold text-ink underline underline-offset-2">{t('rateRetry')}</button>
                          </>
                        )}
                      </p>
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
                          // Excused in WebUntis, excuse sent and waiting for the class teachers, or open.
                          const sent = entry.isExcused ? null : sentExcuseFor(entry, allExcuses);
                          const sentDate = sent && !Number.isNaN(Date.parse(sent.sentAt)) ? formatDate(new Date(sent.sentAt), tag, { day: 'numeric', month: 'short' }) : '';
                          const sentNames = sent?.recipients.join(', ') ?? '';
                          const tone = entry.isExcused ? 'bg-sage text-sage-ink' : sent ? 'bg-butter text-butter-ink' : 'bg-blush text-blush-ink';
                          const sentChip = 'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold';
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
                                    {sent && (sentNames || sentDate) && (
                                      <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">
                                        {sentNames ? (sentDate ? ta('exSentTo', { names: sentNames, date: sentDate }) : ta('exDoneTo', { names: sentNames })) : sentDate}
                                      </p>
                                    )}
                                  </div>
                                  <div className="mt-3 flex flex-wrap items-center gap-2 lg:mt-0 lg:shrink-0 lg:justify-end">
                                    {sent ? (
                                      // Stays until the class teachers mark it excused in WebUntis; opens the message.
                                      sent.messageId ? (
                                        <Link
                                          href={localize(`/messages/${sent.messageId}?folder=sent`)}
                                          title={sentNames ? ta('exSentLabel', { names: sentNames, date: sentDate }) : undefined}
                                          className={`${sentChip} ${tone} transition-[filter] hover:brightness-95 dark:hover:brightness-125`}
                                        >
                                          <PaperPlaneTilt size={15} weight="bold" aria-hidden="true" />
                                          {ta('exSent')}
                                        </Link>
                                      ) : (
                                        <span className={`${sentChip} ${tone}`} title={sentNames ? ta('exSentLabel', { names: sentNames, date: sentDate }) : undefined}>
                                          <PaperPlaneTilt size={15} weight="bold" aria-hidden="true" />
                                          {ta('exSent')}
                                        </span>
                                      )
                                    ) : (
                                      <span className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold ${tone}`}>
                                        {entry.isExcused ? <CheckCircle size={15} weight="bold" aria-hidden="true" /> : <XCircle size={15} weight="bold" aria-hidden="true" />}
                                        {entry.isExcused ? t('statusExcused') : t('statusOpen')}
                                      </span>
                                    )}
                                    {/* Like WebUntis: only who may report absences (guardians, students of age) excuses them. */}
                                    {!entry.isExcused && !sent && canReport && (
                                      <button
                                        type="button"
                                        onClick={() => setExcuse({ ids: [entry.id], startDate: entry.startDate, endDate: entry.endDate, summary: [title, entry.startTime || entry.endTime ? `${formatTime(entry.startTime)} – ${formatTime(entry.endTime)}` : ''].filter(Boolean).join(' · ') })}
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
          <ExcuseSheet
            absenceIds={excuse.ids}
            summary={excuse.summary}
            startDate={excuse.startDate}
            endDate={excuse.endDate}
            onClose={() => setExcuse(null)}
            onSaved={onExcused}
          />
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
