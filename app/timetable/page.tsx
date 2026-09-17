'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, GraduationCap, Share2, WifiOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import { fetchAbsences, fetchTimetable, getAbsencesStale } from '@/lib/api';
import { parseAbsences } from '@/lib/absences';
import { pcGetWithTs } from '@/lib/persist-cache';
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
  schoolMinuteNow,
  toMins,
  type MergedSlot,
} from './timetable-logic';
import WeekGrid, { WeekGridSkeleton } from './WeekGrid';
import LessonDetailSheet from './LessonDetailSheet';
import { SpecialDayCard } from './parts';
import s from './timetable.module.css';

type WeekPageState =
  | { status: 'loading' }
  | { status: 'data'; entries: TimetableEntry[]; savedAt: number; stale: boolean }
  | { status: 'error'; message: string };

const EXAM_LOOKAHEAD_WEEKS = 12;
// Wide enough to reach the start of every selectable school year.
const PAGE_SPAN = 260;
const YEAR_COUNT = 4;
const LOADING: WeekPageState = { status: 'loading' };
const OFFLINE_WEEK_UNKNOWN =
  'Du bist offline und für diese Woche ist kein Stundenplan gespeichert. Ob Unterricht ist, lässt sich erst sagen, wenn du wieder Internet hast.';

const timetableUrl = (iso: string) => `/api/webuntis/timetable?date=${iso}`;
const clampOffset = (o: number) => Math.max(-PAGE_SPAN, Math.min(PAGE_SPAN, o));

function initialOffsetFromUrl(): number {
  if (typeof window === 'undefined') return 0;
  const dateStr = new URLSearchParams(window.location.search).get('date');
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

function asOfText(ts: number): string {
  const d = new Date(ts);
  const time = d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
  if (dateNumOf(d) === dateNumOf(new Date())) return time;
  return `${d.toLocaleDateString('de-AT', { day: 'numeric', month: 'numeric' })} ${time}`;
}

function TimetableContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [weekOffset, setWeekOffset] = useState(initialOffsetFromUrl);
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
  const [yearOpen, setYearOpen] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);

  const setPage = useCallback((offset: number, state: WeekPageState) => {
    pagesRef.current = { ...pagesRef.current, [offset]: state };
    setPages(pagesRef.current);
  }, []);

  // ── Data ────────────────────────────────────────────────────────────────────

  const fetchWeek = useCallback(async (offset: number, silent: boolean) => {
    if (inFlight.current.has(offset)) return;
    inFlight.current.add(offset);
    try {
      const entries = parseTimetable(await fetchTimetable(isoDate(mondayOf(offset))));
      setPage(offset, { status: 'data', entries, savedAt: Date.now(), stale: false });
      if (entries.length) import('@/lib/api-client').then(({ api }) => api.subjectImages.reportSubjects(entries)).catch(() => {});
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') { router.replace('/login'); return; }
      const current = pagesRef.current[offset];
      if (current?.status === 'data') {
        // WebUntis unreachable → keep the copy off the disk, but say it's a copy.
        setPage(offset, { ...current, stale: true });
      } else if (!silent) {
        setPage(offset, { status: 'error', message: e instanceof Error ? e.message : 'Unbekannter Fehler.' });
      }
    } finally {
      inFlight.current.delete(offset);
    }
  }, [router, setPage]);

  const ensureWeek = useCallback((offset: number, force = false) => {
    const cached = pagesRef.current[offset];
    if (cached?.status === 'data' && !force) {
      // Already have data → revalidate silently (no spinner flash).
      void fetchWeek(offset, true);
      return;
    }
    if (!cached || force) {
      const disk = pcGetWithTs<unknown>(timetableUrl(isoDate(mondayOf(offset))));
      if (disk && !force) {
        setPage(offset, { status: 'data', entries: parseTimetable(disk.data), savedAt: disk.ts, stale: false });
        void fetchWeek(offset, true);
        return;
      }
      if (cached?.status !== 'data') setPage(offset, LOADING);
    }
    void fetchWeek(offset, false);
  }, [fetchWeek, setPage]);

  // ── Abwesenheiten (overlay) ─────────────────────────────────────────────────
  // Loaded here on their own, so the grid marks Vorentschuldigung / Entschuldigt /
  // Gefehlt without the Abwesenheiten page ever having been opened.

  const [absences, setAbsences] = useState<Record<number, AbsenceEntry[]>>({});
  const absenceYear = schoolYearOfDate(dateOf(weekOffset, 3));

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const stale = getAbsencesStale(absenceYear);
      if (stale) setAbsences(prev => (prev[absenceYear] ? prev : { ...prev, [absenceYear]: parseAbsences(stale) }));
      fetchAbsences(absenceYear)
        .then(res => { if (!cancelled) setAbsences(prev => ({ ...prev, [absenceYear]: parseAbsences(res) })); })
        .catch(() => { /* no overlay rather than a wrong one */ });
    };
    load();
    // Back to the tab → re-read, so an absence excused in the meantime turns "Entschuldigt".
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVisible); };
  }, [absenceYear]);

  // Preload radius 2 → a 5-week window is always cached.
  useEffect(() => {
    ensureWeek(weekOffset);
    for (let d = -2; d <= 2; d++) {
      const off = weekOffset + d;
      if (d === 0 || Math.abs(off) > PAGE_SPAN) continue;
      if (!pagesRef.current[off]) ensureWeek(off);
    }
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

  useEffect(() => {
    if (!yearOpen) return;
    const onDown = (e: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) setYearOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [yearOpen]);

  // ── Navigation ─────────────────────────────────────────────────────────────

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

  /** Same week of the school year, shifted into another year — or today when it's the current one. */
  const jumpToYear = (year: number) => {
    setYearOpen(false);
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
  const entries = useMemo(() => (page.status === 'data' ? page.entries : []), [page]);
  const dates = useMemo(() => Array.from({ length: 6 }, (_, i) => dateOf(weekOffset, i)), [weekOffset]);
  const dayNums = useMemo(() => dates.map(dateNumOf), [dates]);
  const dayEntries = useMemo(() => dayNums.map(n => entries.filter(e => e.date === n)), [dayNums, entries]);
  const weekNumber = isoWeekNumber(mondayOf(weekOffset));

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

  // ?open=<lessonId> — derived rather than copied into state, until it is dismissed.
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
    if (autoSlot) window.history.replaceState(null, '', '/timetable');
  }, [autoSlot]);

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
    if (entries.length) downloadIcs('pokyh_stundenplan.ics', buildIcs(entries, 'POKYH Stundenplan'));
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
      if (exams.length) downloadIcs('pokyh_pruefungen.ics', buildIcs(exams, 'POKYH Prüfungen'));
    } finally {
      setExporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const swipeVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0, opacity: 0.5 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? '100%' : dir > 0 ? '-100%' : 0, opacity: 0.5 }),
  };
  const swipeTransition = { x: { type: 'spring' as const, stiffness: 450, damping: 35 }, opacity: { duration: 0.2 } };

  const retry = () => ensureWeek(weekOffset, true);

  const renderWeek = () => {
    if (page.status === 'loading') return <WeekGridSkeleton />;
    if (page.status === 'error') return <div className={s.stateBox}><ErrorView message={page.message} onRetry={retry} /></div>;
    if (page.entries.length === 0 && page.stale) return <OfflineState onRetry={retry} />;
    if (page.entries.length === 0) return <div className={s.inset}><SpecialDayCard kind="holiday" /></div>;
    return (
      <WeekGrid
        dayEntries={dayEntries}
        dates={dates}
        dayNums={dayNums}
        todayNum={todayNum}
        weekNumber={weekNumber}
        minute={minute}
        scale={scale}
        onTap={setActiveSlot}
        absences={absences[absenceYear] ?? []}
      />
    );
  };

  return (
    <AuthGuard>
      <UntisGuard>
        <div className={s.wrap}>
          <div className={s.host}>
            <main className={s.page}>
              {/* Week stepper */}
              <div className={`${s.inset} ${s.weekHeader}`}>
                <button type="button" className={s.iconBtn} onClick={() => goWeek(-1)} aria-label="Vorherige Woche" disabled={weekOffset <= -PAGE_SPAN}>
                  <ChevronLeft size={18} />
                </button>
                <div className={s.weekCenter}>
                  <h1 className={s.rangeText}>{rangeText(weekOffset)}</h1>
                  {weekOffset !== 0
                    ? <button type="button" className={s.textBtn} onClick={goToday}>Zu heute</button>
                    : <p className={s.caption}>KW {weekNumber} · Diese Woche</p>}
                  <div className={s.yearWrap} ref={yearRef}>
                    <button
                      type="button"
                      className={s.yearBtn}
                      onClick={() => setYearOpen(o => !o)}
                      aria-haspopup="listbox"
                      aria-expanded={yearOpen}
                    >
                      Schuljahr {selectedYear}/{String(selectedYear + 1).slice(2)}
                      <ChevronDown size={13} style={{ transform: yearOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {yearOpen && (
                      <ul className={`${s.menu} ${s.yearMenu} fade-in`} role="listbox">
                        {availableYears.map(y => (
                          <li key={y}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={y === selectedYear}
                              className={`${s.menuItem} ${y === selectedYear ? s.menuItemActive : ''}`}
                              onClick={() => jumpToYear(y)}
                            >
                              {y} / {y + 1}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {page.status === 'data' && page.stale && page.savedAt > 0 && (
                    <span className={s.asOf}><WifiOff size={12} />&nbsp;Stand {asOfText(page.savedAt)}</span>
                  )}
                </div>
                <button type="button" className={s.iconBtn} onClick={() => goWeek(1)} aria-label="Nächste Woche" disabled={weekOffset >= PAGE_SPAN}>
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Stats + export */}
              <div className={`${s.inset} ${s.statsRow}`}>
                <div className={s.stats}>
                  <div className={s.stat}>
                    <span className={s.statLabel}>Heute</span>
                    <span className={s.statValue}>{weekStats.todayLessons}<span className={s.statUnit}>Std</span></span>
                  </div>
                  <div className={s.stat}>
                    <span className={s.statLabel}>Entfälle</span>
                    <span className={`${s.statValue} ${weekStats.cancellations > 0 ? s.isDanger : ''}`}>{weekStats.cancellations}</span>
                  </div>
                  <div className={s.stat}>
                    <span className={s.statLabel}>Prüfungen</span>
                    <span className={`${s.statValue} ${weekStats.exams > 0 ? s.isWarning : ''}`}>{weekStats.exams}</span>
                  </div>
                  <div className={s.stat}>
                    <span className={s.statLabel}>Vertretungen</span>
                    <span className={`${s.statValue} ${weekStats.substitutions > 0 ? s.isOrange : ''}`}>{weekStats.substitutions}</span>
                  </div>
                </div>
                <div className={s.menuWrap} ref={menuRef}>
                  <button
                    type="button"
                    className={`${s.iconBtn} ${s.exportBtn}`}
                    onClick={() => setMenuOpen(o => !o)}
                    aria-label="Exportieren"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    disabled={exporting}
                  >
                    {exporting ? <Spinner size={16} /> : <Share2 size={18} />}
                  </button>
                  {menuOpen && (
                    <ul className={`${s.menu} fade-in`} role="menu">
                      <li>
                        <button type="button" role="menuitem" className={s.menuItem} onClick={exportWeek}>
                          <CalendarDays size={18} />Diese Woche exportieren
                        </button>
                      </li>
                      <li>
                        <button type="button" role="menuitem" className={s.menuItem} onClick={exportExams}>
                          <GraduationCap size={18} />Prüfungen exportieren
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </div>

              <div className={s.pager}>
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.div
                    key={weekOffset}
                    custom={direction}
                    variants={swipeVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={swipeTransition}
                    drag="x"
                    dragDirectionLock
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.9}
                    onDragEnd={(_, { offset }) => {
                      if (offset.x < -50) goWeek(1);
                      else if (offset.x > 50) goWeek(-1);
                    }}
                    className={s.pagerInner}
                  >
                    {renderWeek()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
          </div>

          {shownSlot && <LessonDetailSheet key={shownSlot.id} slot={shownSlot} onClose={closeSheet} />}
        </div>
      </UntisGuard>
    </AuthGuard>
  );
}

function OfflineState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={s.stateBox}>
      <WifiOff size={44} color="var(--app-text-tertiary)" strokeWidth={1.5} />
      <h2>Stundenplan unbekannt</h2>
      <p>{OFFLINE_WEEK_UNKNOWN}</p>
      <button type="button" className={s.retryBtn} onClick={onRetry}>Erneut versuchen</button>
    </div>
  );
}

export default function TimetablePage() {
  return (
    <Suspense fallback={
      <AuthGuard>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
          <Spinner />
        </div>
      </AuthGuard>
    }>
      <TimetableContent />
    </Suspense>
  );
}
