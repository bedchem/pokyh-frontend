'use client';

import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowClockwise, CalendarBlank, CaretDown, CaretLeft, CaretRight, Exam, ShareFat, UsersThree, WifiSlash, X } from '@phosphor-icons/react';
import { useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import { areAbsencesStale, fetchAbsences, fetchAbsencesRange, fetchOtherTimetable, fetchTimetable, getAbsencesStale } from '@/lib/api';
import { parseAbsences } from '@/lib/absences';
import { pcGetWithTs, pcIsStale } from '@/lib/persist-cache';
import type { AbsenceEntry, TimetableEntry } from '@/lib/types';
import {
  TIMETABLE_PERIODS,
  buildIcs,
  buildSlots,
  dateNumOf,
  dateOf,
  isoDate,
  isoWeekNumber,
  mondayOf,
  parseTimetable,
  rangeText,
  rangeTextTight,
  registerSubjects,
  schoolMinuteNow,
  toMins,
  weekRolledOver,
  type MergedSlot,
} from '@/lib/timetable-logic';
import WeekGrid, { WeekGridSkeleton, type WeekMark } from './WeekGrid';
import WeekPager from './WeekPager';
import LessonDetailSheet from './LessonDetailSheet';
import OtherTimetableSheet, { type TimetableSource } from './OtherTimetableSheet';
import s from './timetable.module.css';
import { useDateLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { timetableDict } from '@/lib/i18n/dictionaries/timetable';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { shellDict } from '@/lib/i18n/dictionaries/shell';
import PixelState, { PixelSpriteArt, holidaySprite } from '@/components/app/PixelState';
import { Button } from '@/components/ui/Button';
import { formatDate, formatTime } from '@/lib/i18n/dateLocale';
import { leaveForLogin } from '@/providers/SessionProvider';
import { useHolidayName, useHolidays } from '@/components/app/useHolidays';
import { holidayOn } from '@/lib/holidays';

type WeekPageState =
  | { status: 'loading' }
  | { status: 'data'; entries: TimetableEntry[]; savedAt: number; stale: boolean }
  | { status: 'error'; message: string };

const EXAM_LOOKAHEAD_WEEKS = 12;
const TIMETABLE_CACHE_TTL_MS = 5 * 60 * 1000;
// Wide enough to reach the start of every selectable school year.
const PAGE_SPAN = 260;
const YEAR_COUNT = 4;
const LOADING: WeekPageState = { status: 'loading' };
const NO_ENTRIES: TimetableEntry[] = [];
const NO_ABSENCES: AbsenceEntry[] = [];

// A mouse: pointing at a figure in the week switch marks its lessons. On a
// touch screen the figures are only read.
const HOVER_QUERY = '(hover: hover) and (pointer: fine)';
// A phone: the school year moves into the week switch, where it takes turns
// with "Zu heute" (timetable.module.css has the same breakpoint).
const PHONE_QUERY = '(max-width: 639.98px)';
// A computer: the lessons keep a comfortable height, and a long day scrolls the page under the
// week switch and the day names (WeekGrid's `roomy`, `data-roomy` in timetable.module.css).
const DESKTOP_QUERY = '(min-width: 1024px)';

/**
 * The week switch's height, as `--tt-stick` on the page that scrolls: on a computer the day names
 * stay right under the switch while the week scrolls (timetable.module.css).
 */
function measureStick(el: HTMLDivElement | null) {
  const host = el?.closest<HTMLElement>(`.${s.host}`);
  if (!el || !host) return;
  const ro = new ResizeObserver(() => host.style.setProperty('--tt-stick', `${el.offsetHeight}px`));
  ro.observe(el);
  return () => ro.disconnect();
}

function useMedia(query: string): boolean {
  const subscribe = useCallback((cb: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

const timetableUrl = (iso: string, source: TimetableSource | null = null) =>
  `/api/webuntis/timetable?date=${iso}${source ? `&type=${source.type}&id=${source.id}` : ''}`;
const clampOffset = (o: number) => Math.max(-PAGE_SPAN, Math.min(PAGE_SPAN, o));

/**
 * Week offset for a `?date=YYYYMMDD` link (e.g. "Im Stundenplan ansehen" on the Abwesenheiten page).
 *
 * Read from `useSearchParams`, not `window.location`: on a client-side navigation the page renders
 * before the browser's address bar changes, so `window.location` still showed the previous page and
 * every link opened on this week.
 */
function offsetForDateParam(dateStr: string | null): number {
  if (!dateStr || !/^\d{8}$/.test(dateStr)) return 0;
  const target = new Date(+dateStr.slice(0, 4), +dateStr.slice(4, 6) - 1, +dateStr.slice(6, 8));
  return clampOffset(Math.round((mondayOf(0, target).getTime() - mondayOf(0).getTime()) / (7 * 86400000)));
}

function downloadIcs(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** School year (starting 1 September) a date belongs to. */
function schoolYearOfDate(d: Date): number {
  return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
}

function asOfText(ts: number, tag: string): string {
  const d = new Date(ts);
  const time = formatTime(d, tag, { hour: '2-digit', minute: '2-digit' });
  if (dateNumOf(d) === dateNumOf(new Date())) return time;
  return `${formatDate(d, tag, { day: 'numeric', month: 'numeric' })} ${time}`;
}

function TimetableContent() {
  const searchParams = useSearchParams();
  const t = useT(timetableDict);
  const ts = useT(shellDict);
  const { tag } = useDateLocale();
  const localize = useLocalizeHref();
  // The school's breaks by name ("Herbstferien") on the days without lessons.
  const holidays = useHolidays();
  const holidayName = useHolidayName();
  const holidayTitle = useCallback((dayNum: number) => {
    const h = holidayOn(holidays, dayNum);
    return h ? holidayName(h) : null;
  }, [holidays, holidayName]);

  const [weekOffset, setWeekOffset] = useState(() => offsetForDateParam(searchParams.get('date')));
  const [direction, setDirection] = useState(0);
  const [pages, setPages] = useState<Record<number, WeekPageState>>({});
  const pagesRef = useRef(pages);
  const inFlight = useRef(new Set<number>());
  const [activeSlot, setActiveSlot] = useState<MergedSlot | null>(null);
  const [autoOpenId, setAutoOpenId] = useState<number | null>(() => {
    const v = searchParams.get('open');
    return v ? parseInt(v, 10) : null;
  });
  const [minute, setMinute] = useState(schoolMinuteNow);
  const [todayNum, setTodayNum] = useState(() => dateNumOf(new Date()));
  const [scale, setScale] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canHover = useMedia(HOVER_QUERY);
  const phone = useMedia(PHONE_QUERY);
  const desktop = useMedia(DESKTOP_QUERY);
  // Pointed at, or focused from the keyboard (a click focuses it too, so it stays until the next click).
  const [hoverMark, setHoverMark] = useState<WeekMark | null>(null);
  const [focusMark, setFocusMark] = useState<WeekMark | null>(null);
  const pointedMark = canHover ? hoverMark ?? focusMark : null;
  // Another class's (teacher's, room's) timetable instead of the own one; its weeks replace the own.
  const [source, setSource] = useState<TimetableSource | null>(null);
  const sourceRef = useRef<TimetableSource | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const setPage = useCallback((offset: number, state: WeekPageState) => {
    pagesRef.current = { ...pagesRef.current, [offset]: state };
    setPages(pagesRef.current);
  }, []);

  // ── Data ────────────────────────────────────────────────────────────────────

  const fetchWeek = useCallback(async (offset: number, silent: boolean) => {
    const flight = inFlight.current;
    if (flight.has(offset)) return;
    flight.add(offset);
    try {
      const iso = isoDate(mondayOf(offset));
      const entries = parseTimetable(await (source ? fetchOtherTimetable(iso, source.type, source.id) : fetchTimetable(iso)));
      // Another timetable chosen meanwhile: this week belongs to the one before.
      if (sourceRef.current !== source) return;
      setPage(offset, { status: 'data', entries, savedAt: Date.now(), stale: false });
      if (entries.length && !source) import('@/lib/api-client').then(({ api }) => api.subjectImages.reportSubjects(entries)).catch(() => {});
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') { leaveForLogin(); return; }
      if (sourceRef.current !== source) return;
      const current = pagesRef.current[offset];
      if (current?.status === 'data') {
        // WebUntis unreachable → keep the copy off the disk, but say it's a copy.
        setPage(offset, { ...current, stale: true });
      } else if (!silent) {
        setPage(offset, { status: 'error', message: e instanceof Error ? e.message : 'unknown' });
      }
    } finally {
      flight.delete(offset);
    }
  }, [setPage, source]);

  const ensureWeek = useCallback((offset: number, force = false) => {
    const cached = pagesRef.current[offset];
    if (cached?.status === 'data' && !force) {
      // Fresh in-memory data is already the fastest possible response.
      if (Date.now() - cached.savedAt <= TIMETABLE_CACHE_TTL_MS) return;
      // Stale data stays visible while it is refreshed in the background.
      void fetchWeek(offset, true);
      return;
    }
    if (!cached || force) {
      const url = timetableUrl(isoDate(mondayOf(offset)), source);
      const disk = pcGetWithTs<unknown>(url);
      if (disk && !force) {
        setPage(offset, { status: 'data', entries: parseTimetable(disk.data), savedAt: disk.ts, stale: false });
        if (pcIsStale(url)) void fetchWeek(offset, true);
        return;
      }
      if (cached?.status !== 'data') setPage(offset, LOADING);
    }
    void fetchWeek(offset, false);
  }, [fetchWeek, setPage, source]);

  const chooseSource = useCallback((next: TimetableSource | null) => {
    setPickerOpen(false);
    if (next?.type === sourceRef.current?.type && next?.id === sourceRef.current?.id) return;
    sourceRef.current = next;
    // The weeks loaded so far are another timetable's.
    inFlight.current = new Set();
    pagesRef.current = {};
    setPages({});
    setActiveSlot(null);
    setAutoOpenId(null);
    setSource(next);
  }, []);

  // ── Abwesenheiten (overlay) ─────────────────────────────────────────────────
  // Loaded here on their own, so the grid marks Vorentschuldigung / Entschuldigt /
  // Unentschuldigt without the Abwesenheiten page ever having been opened.

  // Seeded from the stored copy *before the first paint*, so the overlay is on screen with the
  // lessons instead of a second or two later: the Abwesenheiten request walks a whole school year
  // page by page, which is far slower than one week of timetable.
  const [absences, setAbsences] = useState<Record<number, AbsenceEntry[]>>(() => {
    const year = schoolYearOfDate(dateOf(weekOffset, 3));
    const stored = getAbsencesStale(year);
    return stored ? { [year]: parseAbsences(stored) } : {};
  });
  const absenceYear = schoolYearOfDate(dateOf(weekOffset, 3));

  /** Merge new entries into a year, replacing the ones already known by id. */
  const mergeAbsences = useCallback((year: number, entries: AbsenceEntry[]) => {
    setAbsences(prev => {
      const byId = new Map((prev[year] ?? []).map(a => [a.id, a]));
      entries.forEach(a => byId.set(a.id, a));
      return { ...prev, [year]: [...byId.values()] };
    });
  }, []);

  // The displayed week alone: one page, so the overlay arrives with the lessons instead of after
  // the whole school year below has been walked.
  useEffect(() => {
    let cancelled = false;
    const ymd = (d: Date) => String(dateNumOf(d));
    fetchAbsencesRange(ymd(mondayOf(weekOffset)), ymd(dateOf(weekOffset, 5)))
      .then(res => { if (!cancelled) mergeAbsences(absenceYear, parseAbsences(res)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [weekOffset, absenceYear, mergeAbsences]);

  useEffect(() => {
    let cancelled = false;
    const load = (force = false) => {
      const stored = getAbsencesStale(absenceYear);
      if (stored) setAbsences(prev => (prev[absenceYear] ? prev : { ...prev, [absenceYear]: parseAbsences(stored) }));
      // A fresh stored copy is enough, don't spend the request again on every mount.
      if (!force && stored && !areAbsencesStale(absenceYear)) return;
      fetchAbsences(absenceYear)
        .then(res => { if (!cancelled) setAbsences(prev => ({ ...prev, [absenceYear]: parseAbsences(res) })); })
        .catch(() => { /* no overlay rather than a wrong one */ });
    };
    load();
    // Back to the tab → re-read, so an absence excused in the meantime turns "Entschuldigt".
    const onVisible = () => { if (document.visibilityState === 'visible') load(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVisible); };
  }, [absenceYear]);

  // Make the adjacent weeks instant, then warm a wider window when the browser is idle.
  useEffect(() => {
    ensureWeek(weekOffset);
    for (const d of [-1, 1]) {
      const off = weekOffset + d;
      if (Math.abs(off) <= PAGE_SPAN) ensureWeek(off);
    }

    const warmFurtherWeeks = () => {
      for (const d of [-2, 2]) {
        const off = weekOffset + d;
        if (Math.abs(off) <= PAGE_SPAN) ensureWeek(off);
      }
    };
    const idleApi = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let cancelWarm: () => void;
    if (typeof idleApi.requestIdleCallback === 'function') {
      const idleId = idleApi.requestIdleCallback(warmFurtherWeeks, { timeout: 1200 });
      cancelWarm = () => idleApi.cancelIdleCallback?.(idleId);
    } else {
      const timeoutId = window.setTimeout(warmFurtherWeeks, 250);
      cancelWarm = () => window.clearTimeout(timeoutId);
    }
    return () => {
      cancelWarm();
    };
  }, [weekOffset, ensureWeek]);

  // ── Clock / layout ─────────────────────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => {
      setMinute(schoolMinuteNow());
      setTodayNum(dateNumOf(new Date()));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setScale(w >= 1280 ? 1.5 : w >= 768 ? 1.3 : 1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  // ── Navigation ─────────────────────────────────────────────────────────────

  // One week on or back slides (WeekPager glides when the offset follows); longer jumps fade.
  const goWeek = useCallback((by: number) => {
    setDirection(by);
    setWeekOffset(o => clampOffset(o + by));
  }, []);

  const goToday = useCallback(() => {
    setDirection(weekOffset > 0 ? -1 : 1);
    setWeekOffset(0);
  }, [weekOffset]);

  // School years start in September; the selected one is whichever the shown week falls in.
  const schoolYearOf = (d: Date) => (d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1);
  const currentSchoolYear = schoolYearOf(new Date());
  const selectedYear = schoolYearOf(mondayOf(weekOffset));
  const availableYears = Array.from({ length: YEAR_COUNT }, (_, i) => currentSchoolYear - i);

  /** Same week of the school year, shifted into another year, or today when it's the current one. */
  const jumpToYear = (year: number) => {
    if (year === selectedYear) return;
    if (year === currentSchoolYear) { goToday(); return; }
    const shown = mondayOf(weekOffset);
    const target = new Date(shown.getFullYear() + (year - selectedYear), shown.getMonth(), shown.getDate());
    const offset = Math.round((mondayOf(0, target).getTime() - mondayOf(0).getTime()) / (7 * 86400000));
    setDirection(year > selectedYear ? 1 : -1);
    setWeekOffset(clampOffset(offset));
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const page = pages[weekOffset] ?? LOADING;
  const entries = page.status === 'data' ? page.entries : NO_ENTRIES;
  const weekNumber = isoWeekNumber(mondayOf(weekOffset));
  // The shown week's colours are the ones the lesson sheet uses (each grid colours its own week).
  useMemo(() => registerSubjects(entries.map(e => e.subjectName)), [entries]);

  const weekStats = useMemo(() => {
    const todayActive = entries.filter(e => e.date === todayNum && !e.isCancelled);
    const todayLessons = TIMETABLE_PERIODS.filter(p =>
      todayActive.some(e => toMins(e.startTime) <= p.startMinute && toMins(e.endTime) >= p.endMinute)).length;
    return {
      todayLessons,
      cancellations: entries.filter(e => e.isCancelled).length,
      exams: entries.filter(e => e.isExam).length,
      substitutions: entries.filter(e => e.isSubstitution && !e.isCancelled).length,
    };
  }, [entries, todayNum]);

  // Each figure in its category's ink; pointed at, its fill comes up behind it.
  const figures: Array<{ mark: WeekMark; count: number; label: string; ink: string; fill: string }> = [
    { mark: 'today', count: weekStats.todayLessons, label: `${t('hoursUnit')} · ${t('today')}`, ink: 'text-ink', fill: 'bg-inset' },
    { mark: 'cancelled', count: weekStats.cancellations, label: t('cancellations'), ink: 'text-blush-ink', fill: 'bg-blush' },
    { mark: 'exam', count: weekStats.exams, label: t('exams'), ink: 'text-butter-ink', fill: 'bg-butter' },
    { mark: 'substitution', count: weekStats.substitutions, label: t('substitutions'), ink: 'text-periwinkle-ink', fill: 'bg-periwinkle' },
  ];
  // Still pointed at after the arrow keys turned to a week without any: nothing to mark.
  const mark = figures.some((f) => f.mark === pointedMark && f.count > 0) ? pointedMark : null;

  // ?open=<lessonId>: derived rather than copied into state, until it is dismissed.
  const autoSlot = useMemo<MergedSlot | null>(() => {
    if (!autoOpenId) return null;
    const entry = entries.find(e => e.id === autoOpenId);
    if (!entry) return null;
    const slot = buildSlots(entries.filter(e => e.date === entry.date))
      .find(sl => sl.display.id === autoOpenId || sl.replacement?.id === autoOpenId);
    if (!slot) return null;
    return slot.replacement?.id === autoOpenId
      ? { id: `${slot.id}-active`, display: slot.replacement, replacement: slot.display, kind: 'replacement' }
      : slot;
  }, [autoOpenId, entries]);

  useEffect(() => {
    if (autoSlot) window.history.replaceState(null, '', localize('/timetable'));
  }, [autoSlot, localize]);

  const shownSlot = activeSlot ?? autoSlot;
  const closeSheet = useCallback(() => { setActiveSlot(null); setAutoOpenId(null); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (shownSlot) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); goWeek(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goWeek(1); }
      else if (e.key === 't' || e.key === 'T' || e.key === 'Home') { e.preventDefault(); goToday(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shownSlot, goWeek, goToday]);

  // ── Export ─────────────────────────────────────────────────────────────────

  const exportWeek = () => {
    setMenuOpen(false);
    if (entries.length) downloadIcs(t('icsWeekFile'), buildIcs(entries, t('icsWeekName'), { lesson: t('lesson'), teacher: t('icsTeacher') }));
  };

  const exportExams = async () => {
    setMenuOpen(false);
    setExporting(true);
    try {
      const exams: TimetableEntry[] = [];
      for (let w = 0; w <= EXAM_LOOKAHEAD_WEEKS; w++) {
        const cached = pagesRef.current[w];
        let weekEntries: TimetableEntry[] = cached?.status === 'data' ? cached.entries : [];
        if (cached?.status !== 'data') {
          try { weekEntries = parseTimetable(await fetchTimetable(isoDate(mondayOf(w)))); } catch { weekEntries = []; }
        }
        exams.push(...weekEntries.filter(e => e.isExam && e.date >= todayNum));
      }
      if (exams.length) downloadIcs(t('icsExamsFile'), buildIcs(exams, t('icsExamsName'), { lesson: t('lesson'), teacher: t('icsTeacher') }));
    } finally {
      setExporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderPane = (offset: number) => (
    <WeekPane
      offset={offset}
      page={pages[offset] ?? LOADING}
      todayNum={todayNum}
      minute={minute}
      scale={scale}
      roomy={desktop}
      absences={source ? NO_ABSENCES : absences[schoolYearOfDate(dateOf(offset, 3))] ?? NO_ABSENCES}
      onTap={setActiveSlot}
      ensureWeek={ensureWeek}
      mark={offset === weekOffset ? mark : null}
      holidayTitle={holidayTitle}
    />
  );

  const stale = page.status === 'data' && page.stale && page.savedAt > 0;
  // Under the week: "Diese Woche" for this one. On a phone, where the school year gives way
  // to "Zu heute", a week of another school year names that year here instead (25/26, as the
  // switch writes it there).
  const weekNote = weekOffset === 0 ? (weekRolledOver() ? t('nextWeek') : t('thisWeek'))
    : phone && selectedYear !== currentSchoolYear ? `${String(selectedYear).slice(2)}/${String(selectedYear + 1).slice(2)}` : '';

  return (
    <AuthGuard>
      <UntisGuard>
        <div className={s.wrap}>
          <div className={s.host} data-roomy={desktop || undefined}>
            <main className={s.page}>
              {/* Header: title and menus. On a phone the school year is in the week switch, and
                  the header only shows for an old copy of the week (its date, under the switch). */}
              <header className={`${s.inset} ${s.head} ${stale || source ? '' : s.headQuiet}`}>
                <div className={s.headRow}>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h1 className={`${s.title} w-full text-[30px] font-extrabold leading-[1.04] tracking-[-0.05em] sm:text-[34px] md:text-[46px]`}>{ts('timetable')}</h1>
                    {/* On a phone, where the menus are not in the header, another timetable says so here. */}
                    {phone && source && <SourceSwitch source={source} onOpen={() => setPickerOpen(true)} onClear={() => chooseSource(null)} />}
                    {stale && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-butter px-2.5 py-1 text-[12.5px] font-semibold text-butter-ink">
                        <WifiSlash size={13} weight="bold" aria-hidden="true" />
                        {t('asOf', { time: asOfText(page.savedAt, tag) })}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!phone && <SourceSwitch source={source} onOpen={() => setPickerOpen(true)} onClear={() => chooseSource(null)} />}
                    {!phone && <YearSwitch selected={selectedYear} years={availableYears} onPick={jumpToYear} />}
                    <div className={`${s.menuWrap} ${s.export}`} ref={menuRef}>
                      <button
                        type="button"
                        className={s.pillBtn}
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label={t('export')}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        disabled={exporting}
                      >
                        {exporting ? <Spinner size={16} /> : <ShareFat size={18} weight="bold" />}
                      </button>
                      {menuOpen && (
                        <ul className={`${s.menu} sheet-in`} role="menu">
                          <li>
                            <button type="button" role="menuitem" className={s.menuItem} onClick={exportWeek}>
                              <CalendarBlank size={18} weight="bold" />{t('exportWeek')}
                            </button>
                          </li>
                          {!source && (
                            <li>
                              <button type="button" role="menuitem" className={s.menuItem} onClick={exportExams}>
                                <Exam size={18} weight="bold" />{t('exportExams')}
                              </button>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

              </header>

              <div ref={measureStick} className={`${s.inset} ${s.weekBarWrap}`}>
              <div className={s.weekBar}>
                <button type="button" className={`${s.weekArrow} ${s.weekPrev}`} onClick={() => goWeek(-1)} aria-label={t('prevWeek')} disabled={weekOffset <= -PAGE_SPAN}>
                  <CaretLeft size={20} weight="bold" />
                </button>
                <div className={s.weekLabel}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={weekOffset}
                      initial={{ opacity: 0, y: direction >= 0 ? 6 : -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: direction >= 0 ? -6 : 6 }}
                      transition={{ duration: 0.18 }}
                      className="block"
                    >
                      <span className={`${s.rangeText} block truncate text-[17px] font-bold tracking-[-0.02em] md:text-[19px]`}>
                        <span className={s.rangeShort}>{rangeText(weekOffset, tag, false)}</span>
                        <span className={s.rangeLong}>{rangeText(weekOffset, tag)}</span>
                        {phone && <span className={s.rangeTight}>{rangeTextTight(weekOffset, tag)}</span>}
                      </span>
                      <span className={`${s.weekSub} mt-0.5 block truncate text-[13.5px] font-semibold text-ink-2`}>{t('cw')} {weekNumber}{weekNote && <span> · {weekNote}</span>}</span>
                    </motion.span>
                  </AnimatePresence>
                </div>
                {/* The week in figures, in the week switch where there is room (CSS). With a
                    mouse, pointing at one marks its lessons in the week below. */}
                <div className={s.figures} onPointerLeave={() => setHoverMark(null)}>
                  {figures.map((f) => {
                    const on = mark === f.mark;
                    const cls = `${s.figure} ${f.count === 0 ? 'text-ink-3' : f.ink} ${on ? f.fill : ''}`;
                    const body = <><strong>{f.count}</strong> <span className={s.figureLabel}>{f.label}</span></>;
                    if (!canHover || f.count === 0) return <span key={f.mark} className={cls}>{body}</span>;
                    return (
                      <button
                        key={f.mark}
                        type="button"
                        className={`${cls} ${s.figurePoint}`}
                        onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHoverMark(f.mark); }}
                        onPointerLeave={() => setHoverMark(null)}
                        onFocus={() => setFocusMark(f.mark)}
                        onBlur={() => setFocusMark(null)}
                      >
                        {body}
                      </button>
                    );
                  })}
                </div>
                {/* Away from this week: back to it. On a phone, this week's place holds the school year. */}
                {weekOffset !== 0 ? (
                  <button type="button" className={s.weekToday} onClick={goToday}>{t('toToday')}</button>
                ) : phone && (
                  <YearSwitch className={s.weekYear} short selected={selectedYear} years={availableYears} onPick={jumpToYear} onOther={() => setPickerOpen(true)} />
                )}
                <button type="button" className={`${s.weekArrow} ${s.weekNext}`} onClick={() => goWeek(1)} aria-label={t('nextWeek')} disabled={weekOffset >= PAGE_SPAN}>
                  <CaretRight size={20} weight="bold" />
                </button>
              </div>
              </div>
              <WeekPager offset={weekOffset} min={-PAGE_SPAN} max={PAGE_SPAN} locked={shownSlot !== null} onStep={goWeek}>
                {renderPane}
              </WeekPager>
            </main>
          </div>

          {shownSlot && <LessonDetailSheet key={shownSlot.id} slot={shownSlot} onClose={closeSheet} absences={source ? NO_ABSENCES : absences[absenceYear] ?? NO_ABSENCES} todayNum={todayNum} minute={minute} />}
          <OtherTimetableSheet open={pickerOpen} source={source} onPick={chooseSource} onClose={() => setPickerOpen(false)} />
        </div>
      </UntisGuard>
    </AuthGuard>
  );
}

/** One week in the pager: its grid, or why there is none. Drawn again only when its own data changes. */
const WeekPane = memo(function WeekPane({
  offset,
  page,
  todayNum,
  minute,
  scale,
  roomy,
  absences,
  onTap,
  ensureWeek,
  mark,
  holidayTitle,
}: {
  offset: number;
  page: WeekPageState;
  todayNum: number;
  minute: number;
  scale: number;
  roomy: boolean;
  absences: AbsenceEntry[];
  onTap: (slot: MergedSlot) => void;
  ensureWeek: (offset: number, force?: boolean) => void;
  mark: WeekMark | null;
  holidayTitle: (dayNum: number) => string | null;
}) {
  const t = useT(timetableDict);
  const entries = page.status === 'data' ? page.entries : NO_ENTRIES;
  const dates = useMemo(() => Array.from({ length: 6 }, (_, i) => dateOf(offset, i)), [offset]);
  const dayNums = useMemo(() => dates.map(dateNumOf), [dates]);
  const dayEntries = useMemo(() => dayNums.map(n => entries.filter(e => e.date === n)), [dayNums, entries]);
  const retry = useCallback(() => ensureWeek(offset, true), [ensureWeek, offset]);

  if (page.status === 'loading') return <WeekGridSkeleton />;
  if (page.status === 'error') return <div className={s.stateBox}><ErrorView message={page.message} onRetry={retry} /></div>;
  if (page.entries.length === 0 && page.stale) return <OfflineState onRetry={retry} />;
  const empty = page.entries.length === 0;
  return (
    <WeekGrid
      dayEntries={dayEntries}
      dates={dates}
      dayNums={dayNums}
      todayNum={todayNum}
      weekNumber={isoWeekNumber(dates[0])}
      minute={minute}
      scale={scale}
      roomy={roomy}
      onTap={onTap}
      absences={empty ? NO_ABSENCES : absences}
      mark={mark}
      holidayTitle={holidayTitle}
      empty={empty ? (
        // Small enough that it never outgrows a short screen.
        <div className="rise flex flex-col items-center px-6 py-6 text-center">
          {/* The holidays look like the time of year of the week shown. */}
          <PixelSpriteArt sprite={holidaySprite(dates[0].getMonth() + 1)} width="min(260px, 56vw, 30vh)" />
          <p className="mt-5 text-[26px] font-extrabold tracking-[-0.045em] md:text-[34px]">{dayNums.map(holidayTitle).find(Boolean) ?? t('holiday')}</p>
          <p className="mt-1 text-[15px] font-semibold opacity-75">{t('noLessons')}</p>
        </div>
      ) : undefined}
    />
  );
});

/**
 * The school year of the shown week, and the list to jump to another. Its open state is its own,
 * so on a phone, where it gives way to "Zu heute", it comes back closed. `short` writes it as
 * 26/27, so the week beside it keeps its dates.
 */
/** Whose timetable is shown: the own one, or the class (teacher, room) picked; X goes back to the own. */
function SourceSwitch({ source, onOpen, onClear }: {
  source: TimetableSource | null;
  onOpen: () => void;
  onClear: () => void;
}) {
  const t = useT(timetableDict);
  return (
    <span className="inline-flex items-center gap-1.5">
      <button type="button" className={`${s.pillBtn} ${source ? 'bg-periwinkle! text-periwinkle-ink' : ''}`} onClick={onOpen} aria-haspopup="dialog">
        <UsersThree size={18} weight="bold" aria-hidden="true" />
        <span className="max-w-[180px] truncate">{source ? source.name : t('myTimetable')}</span>
        <CaretDown size={14} weight="bold" aria-hidden="true" />
      </button>
      {source && (
        <button type="button" className={s.pillBtn} onClick={onClear} aria-label={t('otherBack')} title={t('otherBack')}>
          <X size={16} weight="bold" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

/**
 * On a phone the school year's list also leads to the other timetables, as the
 * header with their button is not shown there.
 */
function YearSwitch({ selected, years, onPick, onOther, short = false, className = '' }: {
  selected: number;
  years: number[];
  onPick: (year: number) => void;
  onOther?: () => void;
  short?: boolean;
  className?: string;
}) {
  const t = useT(timetableDict);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className={`${s.menuWrap} ${className}`} ref={ref}>
      <button
        type="button"
        className={s.pillBtn}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('schoolYear')} ${selected}/${selected + 1}`}
      >
        {short ? String(selected).slice(2) : selected}/{String(selected + 1).slice(2)}
        <CaretDown size={14} weight="bold" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={`${s.menu} sheet-in`}>
          <ul role="listbox" aria-label={t('schoolYear')}>
            {years.map((y) => (
              <li key={y}>
                <button
                  type="button"
                  role="option"
                  aria-selected={y === selected}
                  className={`${s.menuItem} ${y === selected ? s.menuItemActive : ''}`}
                  onClick={() => { setOpen(false); onPick(y); }}
                >
                  {t('schoolYear')} {y}/{y + 1}
                </button>
              </li>
            ))}
          </ul>
          {onOther && (
            <button type="button" className={`${s.menuItem} mt-1`} onClick={() => { setOpen(false); onOther(); }}>
              <UsersThree size={18} weight="bold" aria-hidden="true" />
              {t('otherTimetables')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function OfflineState({ onRetry }: { onRetry: () => void }) {
  const t = useT(timetableDict);
  const tc = useT(commonDict);
  return (
    <div className={s.stateBox}>
      <div className="squircle w-full rounded-[26px] bg-surface">
        <PixelState
          title={t('unknownTitle')}
          detail={t('offlineUnknown')}
          action={<Button variant="quiet" onClick={onRetry}><ArrowClockwise size={17} weight="bold" aria-hidden="true" />{tc('retry')}</Button>}
        />
      </div>
    </div>
  );
}

export default function TimetablePage() {
  return (
    <Suspense fallback={<div className={s.wrap}><div className={s.host}><div className={s.page}><div className={s.pager}><div className={s.pane}><WeekGridSkeleton /></div></div></div></div></div>}>
      <TimetableContent />
    </Suspense>
  );
}
