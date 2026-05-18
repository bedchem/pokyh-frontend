'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/providers/SessionProvider';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import {
  fetchAbsences,
  fetchClassregEvents,
  fetchClassServices,
  fetchExams,
  fetchHomeworkRange,
} from '@/lib/api';
import type { AbsenceEntry } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type ClassRole = {
  id: number;
  personId: number;
  foreName: string;
  longName: string;
  duty: { id: number; label: string };
  klasse: { id: number; name: string };
};

type Exam = {
  subject: string;
  examDate: number;
  startTime: number;
  endTime: number;
  rooms: string[];
  text: string;
};

type HomeworkLesson = {
  id: number;
  subject: string;
};

type HomeworkRecord = {
  id: number;
  lessonId: number;
  date: number;
  dueDate: number;
  text: string;
  completed: boolean;
};

type ClassregEvent = {
  id: number;
  subjectName: string;
  categoryName: string;
  text: string;
  eventReasonName: string;
  createDate: number;
  createTime: number;
  creatorName: string;
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getSchoolWeek(offsetWeeks: number) {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const toNum = (d: Date) =>
    d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const toStr = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

  return { startNum: toNum(monday), endNum: toNum(friday), startStr: toStr(monday), endStr: toStr(friday) };
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS   = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function parseUntisDate(d: number): Date {
  const s = String(d);
  return new Date(parseInt(s.slice(0, 4)), parseInt(s.slice(4, 6)) - 1, parseInt(s.slice(6, 8)));
}

function fmtDateShort(d: number): string {
  const dt = parseUntisDate(d);
  return `${dt.getDate()}. ${MONTHS[dt.getMonth()]}`;
}

function fmtTime(t: number): string {
  const s = t.toString().padStart(4, '0');
  return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseAbsences(raw: unknown): AbsenceEntry[] {
  const r = raw as Record<string, unknown>;
  const data = (r?.data ?? r) as Record<string, unknown>;
  const arr = (data?.absences ?? []) as Record<string, unknown>[];
  return arr.map((a) => ({
    id:           (a.id as number)        ?? 0,
    startDate:    (a.startDate as number) ?? 0,
    endDate:      (a.endDate as number)   ?? 0,
    startTime:    (a.startTime as number) ?? 0,
    endTime:      (a.endTime as number)   ?? 0,
    isExcused:    (a.isExcused as boolean) ?? false,
    reasonName:   a.reasonName as string | undefined,
    absenceType:  a.absenceType as string | undefined,
    hours:        (a.hours as number)     ?? 0,
    note:         a.note as string | undefined,
    excuseNote:   a.excuseNote as string | undefined,
    teacherName:  a.teacherName as string | undefined,
    subjectName:  a.subjectName as string | undefined,
  }));
}

function parseClassServices(raw: unknown): ClassRole[] {
  const r = raw as Record<string, unknown>;
  const data = (r?.data ?? r) as Record<string, unknown>;
  const roles = (data?.classRoles ?? []) as ClassRole[];
  const seen = new Set<string>();
  return roles.filter((role) => {
    const key = `${role.personId}-${role.duty?.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseExams(raw: unknown): Exam[] {
  const r = raw as Record<string, unknown>;
  const data = (r?.data ?? r) as Record<string, unknown>;
  return (data?.exams ?? []) as Exam[];
}

function parseHomework(raw: unknown): { homeworks: HomeworkRecord[]; lessons: HomeworkLesson[] } {
  const r = raw as Record<string, unknown>;
  const data = (r?.data ?? r) as Record<string, unknown>;
  return {
    homeworks: ([...((data?.homeworks as HomeworkRecord[]) ?? []), ...((data?.records as HomeworkRecord[]) ?? [])]),
    lessons:   (data?.lessons ?? []) as HomeworkLesson[],
  };
}

function parseClassregEvents(raw: unknown): ClassregEvent[] {
  const r = raw as Record<string, unknown>;
  const data = (r?.data ?? r) as Record<string, unknown>;
  const rows = data?.rows as ClassregEvent[] | undefined;
  return Array.isArray(rows) ? rows : [];
}

// ─── Badge colors for Klassenbuch ────────────────────────────────────────────

function categoryColor(cat: string): string {
  const l = cat.toLowerCase();
  if (l.includes('täuschung') || l.includes('betrug')) return 'var(--danger)';
  if (l.includes('vermerk')) return 'var(--warning)';
  return 'var(--accent)';
}

function categoryBg(cat: string): string {
  const l = cat.toLowerCase();
  if (l.includes('täuschung') || l.includes('betrug'))
    return 'color-mix(in srgb, var(--danger) 14%, transparent)';
  if (l.includes('vermerk'))
    return 'color-mix(in srgb, var(--warning) 14%, transparent)';
  return 'color-mix(in srgb, var(--accent) 14%, transparent)';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClassPage() {
  const router = useRouter();
  const { user } = useSession();

  const [absences,        setAbsences]        = useState<AbsenceEntry[]>([]);
  const [classServices,   setClassServices]   = useState<ClassRole[]>([]);
  const [examsThis,       setExamsThis]       = useState<Exam[]>([]);
  const [examsNext,       setExamsNext]       = useState<Exam[]>([]);
  const [hwThis,          setHwThis]          = useState<HomeworkRecord[]>([]);
  const [hwNext,          setHwNext]          = useState<HomeworkRecord[]>([]);
  const [hwLessons,       setHwLessons]       = useState<HomeworkLesson[]>([]);
  const [recentEvents,    setRecentEvents]    = useState<ClassregEvent[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');

  const examThisRef = useRef<HTMLDivElement>(null);
  const hwThisRef   = useRef<HTMLDivElement>(null);
  const examNextRef = useRef<HTMLDivElement>(null);
  const hwNextRef   = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const sync = (a: HTMLDivElement | null, b: HTMLDivElement | null) => {
      if (!a || !b) return;
      a.style.minHeight = '';
      b.style.minHeight = '';
      const h = Math.max(a.scrollHeight, b.scrollHeight);
      a.style.minHeight = `${h}px`;
      b.style.minHeight = `${h}px`;
    };
    sync(examThisRef.current, hwThisRef.current);
    sync(examNextRef.current, hwNextRef.current);
  }, [examsThis, examsNext, hwThis, hwNext]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const thisWeek = getSchoolWeek(0);
    const nextWeek = getSchoolWeek(1);

    try {
      const [absRes, servRes, exThisRes, exNextRes, hwRes, evRes] = await Promise.allSettled([
        fetchAbsences(),
        fetchClassServices(),
        fetchExams(thisWeek.startStr, thisWeek.endStr),
        fetchExams(nextWeek.startStr, nextWeek.endStr),
        fetchHomeworkRange(thisWeek.startStr, nextWeek.endStr),
        fetchClassregEvents(),
      ]);

      const anyExpired = [absRes, servRes, exThisRes, exNextRes, hwRes, evRes].some(
        (r) => r.status === 'rejected' && (r as PromiseRejectedResult).reason?.message === 'session_expired',
      );
      if (anyExpired) { router.replace('/login'); return; }

      if (absRes.status === 'fulfilled') {
        setAbsences(parseAbsences(absRes.value).filter((a) => !a.isExcused));
      }
      if (servRes.status === 'fulfilled') {
        setClassServices(parseClassServices(servRes.value));
      }
      if (exThisRes.status === 'fulfilled') setExamsThis(parseExams(exThisRes.value));
      if (exNextRes.status === 'fulfilled') setExamsNext(parseExams(exNextRes.value));

      if (hwRes.status === 'fulfilled') {
        const { homeworks, lessons } = parseHomework(hwRes.value);
        setHwLessons(lessons);
        const open = homeworks.filter((h) => !h.completed && h.dueDate > 0);
        setHwThis(open.filter((h) => h.dueDate >= thisWeek.startNum && h.dueDate <= thisWeek.endNum));
        setHwNext(open.filter((h) => h.dueDate >= nextWeek.startNum && h.dueDate <= nextWeek.endNum));
      }

      if (evRes.status === 'fulfilled') {
        const all = parseClassregEvents(evRes.value);
        const cutoff = (() => {
          const d = new Date();
          d.setMonth(d.getMonth() - 3);
          return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
        })();
        setRecentEvents(
          all
            .filter((e) => e.createDate >= cutoff)
            .sort((a, b) => b.createDate - a.createDate || b.createTime - a.createTime)
            .slice(0, 10),
        );
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') router.replace('/login');
      else setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  function subjectShort(lessonId: number): string {
    const lesson = hwLessons.find((l) => l.id === lessonId);
    return lesson ? lesson.subject.split(' (')[0] : '–';
  }

  const now        = new Date();
  const schoolYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;

  return (
    <AuthGuard>
      <UntisGuard>
        <div className="cl-wrap">
          {loading ? (
            <div className="cl-state"><Spinner size={28} /></div>
          ) : error ? (
            <div className="cl-state"><ErrorView message={error} onRetry={load} /></div>
          ) : (
            <main className="cl-dashboard">

              {/* ── Header ── */}
              <div className="page-head">
                <div>
                  <h1 className="page-title">
                    {user?.klasseName ? `Klasse ${user.klasseName}` : 'Meine Klasse'}
                  </h1>
                  <div className="page-sub">Schuljahr {schoolYear} / {schoolYear + 1}</div>
                </div>
              </div>

              {/* ── 1. Neue Klassenbuch Einträge (volle Breite) ── */}
              <section className="section-wrap mb-grid">
                <div className="section-head">
                  <span className="section-title">Neue Klassenbuch Einträge · Letzte 3 Monate</span>
                  <Link href="/classregevents" className="section-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', flexWrap: 'nowrap', fontSize: '12px', fontWeight: 500, color: 'var(--accent)', textDecoration: 'none', opacity: 1 }}><span>Alle</span><ChevronRight size={12} style={{ display: 'inline-block', flexShrink: 0 }} /></Link>
                </div>
                {recentEvents.length === 0 ? (
                  <div className="empty-row">Keine Einträge in den letzten 3 Monaten</div>
                ) : (
                  <div className="item-list">
                    {recentEvents.map((ev, i) => {
                      const dt = parseUntisDate(ev.createDate);
                      return (
                        <div key={`ev-${ev.id}-${i}`} className="ev-row" style={{ borderTop: i > 0 ? '1px solid var(--g-line)' : 'none' }}>
                          <div className="ev-date">
                            <span className="ev-day">{dt.getDate()}.</span>
                            <span className="ev-month">{MONTHS[dt.getMonth()]}</span>
                          </div>
                          <div className="ev-content">
                            <span className="ev-subject">{ev.subjectName}</span>
                            <span className="ev-text">{ev.text || ev.eventReasonName}</span>
                            <span className="ev-meta">{ev.creatorName}</span>
                          </div>
                          <span
                            className="ev-badge"
                            style={{ color: categoryColor(ev.categoryName), background: categoryBg(ev.categoryName) }}
                          >
                            {ev.categoryName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* ── 2. Offene Abwesenheiten (links) · Klassendienste (rechts) ── */}
              <div className="main-grid mb-grid">

                <section className="section-wrap">
                  <div className="section-head">
                    <span className="section-title">Offene Abwesenheiten</span>
                    <Link href="/absences" className="section-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', flexWrap: 'nowrap', fontSize: '12px', fontWeight: 500, color: 'var(--accent)', textDecoration: 'none', opacity: 1 }}><span>Alle</span><ChevronRight size={12} style={{ display: 'inline-block', flexShrink: 0 }} /></Link>
                  </div>
                  {absences.length === 0 ? (
                    <div className="empty-row">Keine offenen Abwesenheiten</div>
                  ) : (
                    <div className="item-list">
                      {absences.slice(0, 6).map((a, i) => (
                        <div key={a.id} className="list-row" style={{ borderTop: i > 0 ? '1px solid var(--g-line)' : 'none' }}>
                          <div className="row-dot" style={{ background: 'var(--danger)' }} />
                          <div className="row-content">
                            <span className="row-main">
                              {fmtDateShort(a.startDate)}
                              {a.endDate !== a.startDate ? ` – ${fmtDateShort(a.endDate)}` : ''}
                            </span>
                            {(a.subjectName || a.reasonName) && (
                              <span className="row-sub">{a.subjectName ?? a.reasonName}</span>
                            )}
                          </div>
                          <span className="badge-danger">Offen</span>
                        </div>
                      ))}
                      {absences.length > 6 && (
                        <Link href="/absences" className="see-more">+{absences.length - 6} weitere</Link>
                      )}
                    </div>
                  )}
                </section>

                <section className="section-wrap">
                  <div className="section-head">
                    <span className="section-title">Klassendienste</span>
                  </div>
                  {classServices.length === 0 ? (
                    <div className="empty-row">Keine Klassendienste eingetragen</div>
                  ) : (
                    <div className="item-list">
                      {classServices.map((role, i) => (
                        <div key={role.id} className="list-row" style={{ borderTop: i > 0 ? '1px solid var(--g-line)' : 'none' }}>
                          <div
                            className="row-avatar"
                            style={{ background: `hsl(${(role.personId * 73) % 360}, 52%, 48%)` }}
                          >
                            {role.foreName.slice(0, 1)}{role.longName.slice(0, 1)}
                          </div>
                          <div className="row-content">
                            <span className="row-main">{role.foreName} {role.longName}</span>
                            <span className="row-sub">{role.duty?.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* ── 3. Prüfungen (links) · Hausaufgaben (rechts) ── */}
              <div className="main-grid">

                <section className="section-wrap">
                  <div className="section-head">
                    <span className="section-title">Prüfungen</span>
                  </div>
                  <div className="week-label">Diese Woche</div>
                  <div ref={examThisRef} className="week-content">
                    {examsThis.length === 0 ? (
                      <div className="empty-row-sm">Keine Prüfungen diese Woche</div>
                    ) : (
                      examsThis.map((exam, i) => {
                        const dt = parseUntisDate(exam.examDate);
                        return (
                          <div key={`et-${i}`} className="list-row" style={{ borderTop: i > 0 ? '1px solid var(--g-line)' : 'none' }}>
                            <div className="exam-date-col">
                              <span className="exam-wd">{WEEKDAYS[dt.getDay()]}</span>
                              <span className="exam-dnum">{dt.getDate()}.</span>
                            </div>
                            <div className="row-content">
                              <span className="row-main">{exam.subject}</span>
                              <span className="row-sub">{fmtTime(exam.startTime)} – {fmtTime(exam.endTime)}{exam.rooms?.length ? ` · ${exam.rooms[0]}` : ''}</span>
                              {exam.text && <span className="row-note">{exam.text}</span>}
                            </div>
                            <span className="badge-warn">Prüfung</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="week-label week-label-sep">Nächste Woche</div>
                  <div ref={examNextRef} className="week-content">
                    {examsNext.length === 0 ? (
                      <div className="empty-row-sm">Keine Prüfungen nächste Woche</div>
                    ) : (
                      examsNext.map((exam, i) => {
                        const dt = parseUntisDate(exam.examDate);
                        return (
                          <div key={`en-${i}`} className="list-row" style={{ borderTop: i > 0 ? '1px solid var(--g-line)' : 'none' }}>
                            <div className="exam-date-col">
                              <span className="exam-wd">{WEEKDAYS[dt.getDay()]}</span>
                              <span className="exam-dnum">{dt.getDate()}.</span>
                            </div>
                            <div className="row-content">
                              <span className="row-main">{exam.subject}</span>
                              <span className="row-sub">{fmtTime(exam.startTime)} – {fmtTime(exam.endTime)}{exam.rooms?.length ? ` · ${exam.rooms[0]}` : ''}</span>
                              {exam.text && <span className="row-note">{exam.text}</span>}
                            </div>
                            <span className="badge-warn">Prüfung</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                <section className="section-wrap">
                  <div className="section-head">
                    <span className="section-title">Hausaufgaben</span>
                  </div>
                  <div className="week-label">Diese Woche</div>
                  <div ref={hwThisRef} className="week-content">
                    {hwThis.length === 0 ? (
                      <div className="empty-row-sm">Keine Hausaufgaben diese Woche</div>
                    ) : (
                      hwThis.map((hw, i) => (
                        <div key={hw.id} className="list-row" style={{ borderTop: i > 0 ? '1px solid var(--g-line)' : 'none' }}>
                          <div className="row-content">
                            <span className="row-main">{subjectShort(hw.lessonId)}</span>
                            <span className="row-sub">{hw.text}</span>
                            <span className="row-note">Fällig: {fmtDateShort(hw.dueDate)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="week-label week-label-sep">Nächste Woche</div>
                  <div ref={hwNextRef} className="week-content">
                    {hwNext.length === 0 ? (
                      <div className="empty-row-sm">Keine Hausaufgaben nächste Woche</div>
                    ) : (
                      hwNext.map((hw, i) => (
                        <div key={hw.id} className="list-row" style={{ borderTop: i > 0 ? '1px solid var(--g-line)' : 'none' }}>
                          <div className="row-content">
                            <span className="row-main">{subjectShort(hw.lessonId)}</span>
                            <span className="row-sub">{hw.text}</span>
                            <span className="row-note">Fällig: {fmtDateShort(hw.dueDate)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

            </main>
          )}
        </div>

        <style jsx>{`
          .cl-wrap {
            --g-bg:     var(--app-bg);
            --g-surface: var(--app-surface);
            --g-line:   var(--app-border);
            --g-line-2: color-mix(in srgb, var(--app-border) 70%, var(--app-text-tertiary));
            --g-ink:    var(--app-text-primary);
            --g-muted:  var(--app-text-secondary);
            --g-muted-2: var(--app-text-tertiary);

            height: 100%;
            overflow: auto;
            background: var(--g-bg);
            color: var(--g-ink);
            font-feature-settings: 'ss01', 'cv11';
            text-rendering: optimizeLegibility;
            letter-spacing: -0.005em;
          }

          .cl-state {
            min-height: 100%;
            display: grid;
            place-items: center;
            padding: 24px;
          }

          .cl-dashboard {
            max-width: 1320px;
            margin: 0 auto;
            padding: 36px 28px 80px;
            font-family: var(--font-inter, 'Inter'), -apple-system, BlinkMacSystemFont, sans-serif;
          }

          /* ── Header ── */
          .page-head {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 32px;
            margin-bottom: 28px;
          }

          .page-title {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin: 0;
          }

          .page-sub {
            color: var(--g-muted);
            font-size: 13.5px;
            margin-top: 6px;
          }

          /* ── Grids ── */
          .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }

          .mb-grid {
            margin-bottom: 24px;
          }

          /* ── Sections ── */
          .section-wrap {
            background: var(--g-surface);
            border: 1px solid var(--g-line);
            border-radius: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .section-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 13px 18px;
            border-bottom: 1px solid var(--g-line);
          }

          .section-title {
            font-size: 13.5px;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: var(--g-ink);
          }

          .section-link {
            display: inline-flex;
            align-items: center;
            flex-wrap: nowrap;
            gap: 4px;
            font-size: 12px;
            font-weight: 500;
            color: var(--accent);
            text-decoration: none;
            transition: opacity 0.15s;
            line-height: 1;
            white-space: nowrap;
          }

          .section-link svg { display: block; flex-shrink: 0; }

          .section-link:hover { opacity: 0.7; }

          .item-list { display: block; flex: 1; }

          .empty-row {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px 18px;
            font-size: 13px;
            color: var(--g-muted-2);
            text-align: center;
          }

          /* ── List rows ── */
          .list-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 18px;
            min-height: 54px;
            transition: background 0.15s;
          }

          .list-row:hover {
            background: color-mix(in srgb, var(--g-bg) 75%, transparent);
          }

          .row-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
          }

          .row-avatar {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11.5px;
            font-weight: 700;
            color: #fff;
            flex-shrink: 0;
          }

          .row-content {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .row-main {
            font-size: 13.5px;
            font-weight: 600;
            color: var(--g-ink);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .row-sub {
            font-size: 12px;
            color: var(--g-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .row-note {
            font-size: 11px;
            color: var(--g-muted-2);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* ── Exam date column ── */
          .exam-date-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 34px;
            flex-shrink: 0;
          }

          .exam-wd {
            font-size: 10px;
            font-weight: 600;
            color: var(--g-muted);
            text-transform: uppercase;
            letter-spacing: 0.04em;
            line-height: 1;
          }

          .exam-dnum {
            font-size: 18px;
            font-weight: 700;
            color: var(--g-ink);
            line-height: 1.1;
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.02em;
          }

          /* ── Badges ── */
          .badge-danger {
            display: inline-flex;
            align-items: center;
            font-size: 11px;
            font-weight: 600;
            padding: 3px 9px;
            border-radius: 999px;
            white-space: nowrap;
            flex-shrink: 0;
            color: var(--danger);
            background: color-mix(in srgb, var(--danger) 14%, transparent);
          }

          .badge-warn {
            display: inline-flex;
            align-items: center;
            font-size: 11px;
            font-weight: 600;
            padding: 3px 9px;
            border-radius: 999px;
            white-space: nowrap;
            flex-shrink: 0;
            color: var(--warning);
            background: color-mix(in srgb, var(--warning) 14%, transparent);
          }

          .see-more {
            display: block;
            padding: 10px 18px;
            font-size: 12px;
            font-weight: 600;
            color: var(--accent);
            text-align: center;
            text-decoration: none;
            border-top: 1px solid var(--g-line);
            transition: background 0.15s;
          }

          .see-more:hover {
            background: color-mix(in srgb, var(--g-bg) 60%, transparent);
          }

          /* ── Klassenbuch event rows ── */
          .ev-row {
            display: grid;
            grid-template-columns: 44px 1fr auto;
            align-items: center;
            gap: 14px;
            padding: 12px 18px;
            min-height: 60px;
            transition: background 0.15s;
          }

          .ev-row:hover {
            background: color-mix(in srgb, var(--g-bg) 75%, transparent);
          }

          .ev-date {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-shrink: 0;
          }

          .ev-day {
            font-size: 18px;
            font-weight: 700;
            color: var(--g-ink);
            line-height: 1;
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.02em;
          }

          .ev-month {
            font-size: 10px;
            font-weight: 600;
            color: var(--g-muted);
            text-transform: uppercase;
            letter-spacing: 0.03em;
            margin-top: 2px;
          }

          .ev-content {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
          }

          .ev-subject {
            font-size: 13.5px;
            font-weight: 600;
            color: var(--g-ink);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .ev-text {
            font-size: 12px;
            color: var(--g-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .ev-meta {
            font-size: 11px;
            color: var(--g-muted-2);
          }

          .ev-badge {
            display: inline-flex;
            align-items: center;
            font-size: 11px;
            font-weight: 600;
            padding: 3px 9px;
            border-radius: 999px;
            white-space: nowrap;
            flex-shrink: 0;
          }

          /* ── Week labels (Prüfungen / Hausaufgaben) ── */
          .week-label {
            font-size: 10.5px;
            font-weight: 700;
            color: var(--g-muted-2);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 8px 18px 7px;
            border-bottom: 1px solid var(--g-line);
          }

          .week-label-sep {
            border-top: 1px solid var(--g-line);
          }

          .week-content {
            display: flex;
            flex-direction: column;
          }

          .empty-row-sm {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 52px;
            padding: 14px 18px;
            font-size: 12.5px;
            color: var(--g-muted-2);
            text-align: center;
          }

          /* ── Responsive ── */
          @media (max-width: 1200px) {
            .kpis {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 900px) {
            .cl-dashboard {
              padding: 24px 16px 76px;
            }
            .page-head {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }
            .main-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 600px) {
            .ev-row {
              grid-template-columns: 36px 1fr;
            }
            .ev-badge {
              display: none;
            }
          }
        `}</style>
      </UntisGuard>
    </AuthGuard>
  );
}
