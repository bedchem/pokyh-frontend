'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart2, ChevronDown, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import EmptyView from '@/components/ui/EmptyView';
import { fetchGrades } from '@/lib/api';
import type { GradeEntry, SubjectGrades } from '@/lib/types';

type RecentItem = {
  id: number;
  subject: string;
  numeric: number;
};

type DraftSubjectState = {
  removedTeacherGradeIds: number[];
  customGrades: number[];
};

function parseGrades(json: unknown): SubjectGrades[] {
  try {
    const root = json as Record<string, unknown>;
    const raw = (root?.subjects ?? []) as Array<Record<string, unknown>>;
    return raw
      .map((s) => {
        const entries: GradeEntry[] = ((s.grades ?? []) as Array<Record<string, unknown>>)
          .map((g) => ({
            id: g.id as number,
            text: (g.text as string) ?? '',
            date: g.date as number,
            markName: (g.markName as string) ?? '',
            markValue: (g.markValue as number) ?? 0,
            markDisplayValue: (g.markDisplayValue as number) ?? 0,
            examType: (g.examType as string) ?? '',
          }))
          .filter((g) => g.markValue > 0 && g.date > 0);

        const vals = entries.map((g) => g.markDisplayValue).filter((v) => v > 0);
        const average = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

        return {
          lessonId: s.lessonId as number,
          subjectName: (s.subjectName as string) ?? '',
          teacherName: (s.teacherName as string) ?? '',
          grades: entries,
          average,
          positiveCount: vals.filter((v) => v >= 6).length,
          negativeCount: vals.filter((v) => v < 6).length,
        } as SubjectGrades;
      })
      .filter((s) => s.subjectName && s.grades.length > 0)
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  } catch {
    return [];
  }
}

function fmtNum(value: number, digits = 2): string {
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor) / factor;
  const trimmed = rounded
    .toFixed(digits)
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '');
  return trimmed.replace('.', ',');
}

function fmtDateShort(date: number): string {
  const s = String(date);
  if (s.length !== 8) return String(date);
  return `${s.slice(6, 8)}.${s.slice(4, 6)}.${s.slice(2, 4)}`;
}

function fmtDateLong(date: Date): string {
  return date.toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function fmtUntisDateLong(date: number): string {
  const s = String(date);
  if (s.length !== 8) return String(date);
  const d = new Date(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)));
  return fmtDateLong(d);
}

function monthKey(date: number): string {
  const s = String(date);
  return s.slice(0, 6);
}

function gradeDisplay(g: GradeEntry): string {
  const raw = g.text?.trim() || g.markName?.trim() || g.examType?.trim();
  const normalized = (raw ?? '').replace(',', '.').replace(/[−–—]/g, '-').trim();
  const isGradeLike = /^(?:\d{1,2}(?:\.\d{1,2})?[+\-]?|\d{1,2}\/\d{1,2})$/.test(normalized);
  if (!raw || isGradeLike) return 'Prüfung';
  return raw;
}

function formatMark(value: number): string {
  return fmtNum(value, 2);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampGrade(value: number): number {
  return round2(Math.max(1, Math.min(10, value)));
}

function averageOf(values: number[]): number {
  if (!values.length) return 0;
  return round2(values.reduce((a, b) => a + b, 0) / values.length);
}

function parseGradeInput(raw: string): number | null {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 1 || parsed > 10) return null;
  return round2(parsed);
}

function gradeClass(value: number): 'v-excellent' | 'v-positive' | 'v-negative' | 'v-critical' {
  if (value >= 9) return 'v-excellent';
  if (value >= 6) return 'v-positive';
  if (value > 4) return 'v-negative';
  return 'v-critical';
}

function sparkPath(values: number[]): { line: string; area: string } {
  if (values.length === 0) return { line: '', area: '' };
  if (values.length === 1) {
    const y = Math.round((1 - (values[0] - 1) / 9) * 42);
    return {
      line: `M0,${y} L200,${y}`,
      area: `M0,${y} L200,${y} L200,60 L0,60 Z`,
    };
  }

  const xs = values.map((_, i) => (i / (values.length - 1)) * 200);
  const ys = values.map((v) => {
    const clamped = Math.max(1, Math.min(10, v));
    return 42 - ((clamped - 1) / 9) * 24;
  });

  const line = ys.map((y, i) => `${i === 0 ? 'M' : 'L'}${xs[i].toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L200,60 L0,60 Z`;
  return { line, area };
}

export default function GradesPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [draftState, setDraftState] = useState<Record<number, DraftSubjectState>>({});
  const [detailsSubjectId, setDetailsSubjectId] = useState<number | null>(null);
  const [newGradeInput, setNewGradeInput] = useState('');
  const [hoverTrendIndex, setHoverTrendIndex] = useState<number | null>(null);
  const [hoverSparkIndex, setHoverSparkIndex] = useState<number | null>(null);
  const cacheRef = useRef<SubjectGrades[] | null>(null);

  const load = useCallback(async () => {
    if (cacheRef.current) {
      setSubjects(cacheRef.current);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetchGrades();
      const parsed = parseGrades(res);
      cacheRef.current = parsed;
      setSubjects(parsed);
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

  const dashboard = useMemo(() => {
    const allGrades = subjects
      .flatMap((s) => s.grades.map((g) => ({ ...g, subjectName: s.subjectName })))
      .sort((a, b) => a.date - b.date);

    const values = allGrades.map((g) => g.markDisplayValue).filter((v) => v > 0);
    const overallAvg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const bestGrade = values.length ? Math.max(...values) : 0;
    const latestGradeDate = allGrades.length ? allGrades[allGrades.length - 1].date : 0;

    const pos = values.filter((v) => v >= 6).length;
    const neg = values.filter((v) => v < 6).length;
    const passRate = values.length ? (pos / values.length) * 100 : 0;

    const distribution = Array.from({ length: 10 }, () => 0);
    values.forEach((v) => {
      const idx = Math.max(1, Math.min(10, Math.round(v))) - 1;
      distribution[idx] += 1;
    });

    const distMax = Math.max(...distribution, 1);
    const modeIdx = distribution.indexOf(Math.max(...distribution));

    const sortedVals = [...values].sort((a, b) => a - b);
    const median =
      sortedVals.length === 0
        ? 0
        : sortedVals.length % 2 === 1
          ? sortedVals[(sortedVals.length - 1) / 2]
          : (sortedVals[sortedVals.length / 2 - 1] + sortedVals[sortedVals.length / 2]) / 2;

    const mean = overallAvg;
    const sigma = values.length
      ? Math.sqrt(values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length)
      : 0;

    const today = new Date();
    const schoolYearStart = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;

    // Vormonat: Gesamtdurchschnitt aller Noten OHNE die letzten 4 Wochen
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const oneMonthAgoKey = Number(
      `${oneMonthAgo.getFullYear()}${String(oneMonthAgo.getMonth() + 1).padStart(2, '0')}${String(oneMonthAgo.getDate()).padStart(2, '0')}`
    );
    const prevMonthVals = allGrades
      .filter((g) => g.date < oneMonthAgoKey)
      .map((g) => g.markDisplayValue)
      .filter((v) => v > 0);
    const previousMonthAvg = prevMonthVals.length
      ? prevMonthVals.reduce((a, b) => a + b, 0) / prevMonthVals.length
      : overallAvg;
    const delta = overallAvg - previousMonthAvg;

    const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

    const keys = Array.from(new Set(allGrades.map((g) => monthKey(g.date)))).sort();
    const monthKeys = keys.length > 8 ? keys.slice(-8) : keys;
    const monthAverages = monthKeys.map((k) => {
      const monthVals = allGrades.filter((g) => monthKey(g.date) === k).map((g) => g.markDisplayValue);
      if (monthVals.length === 0) return 0;
      return monthVals.reduce((a, b) => a + b, 0) / monthVals.length;
    });
    const spark = sparkPath(monthAverages.length ? monthAverages : [overallAvg]);

    const sparkPoints = monthKeys.map((k, i) => {
      const avg = monthAverages[i];
      const x = monthKeys.length === 1 ? 100 : (i / (monthKeys.length - 1)) * 200;
      const clamped = Math.max(1, Math.min(10, avg));
      const y = 42 - ((clamped - 1) / 9) * 24;
      const mNum = parseInt(k.slice(4, 6)) - 1;
      const yShort = k.slice(2, 4);
      return { x, y, avg, label: `${MONTH_LABELS[mNum]} ${yShort}` };
    });

    const recent: RecentItem[] = [...allGrades]
      .sort((a, b) => b.date - a.date)
      .slice(0, 3)
      .map((g) => ({
        id: g.id,
        subject: g.subjectName,
        numeric: g.markDisplayValue,
      }));

    return {
      allCount: allGrades.length,
      subjectCount: subjects.length,
      latestGradeDate,
      overallAvg,
      bestGrade,
      pos,
      neg,
      passRate,
      distribution,
      distMax,
      mode: modeIdx + 1,
      median,
      sigma,
      delta,
      previousMonthAvg,
      spark,
      sparkPoints,
      recent,
      schoolYearLabel: `${schoolYearStart} / ${schoolYearStart + 1}`,
    };
  }, [subjects]);

  const valuesBySubject = useMemo(() => {
    const map: Record<number, number[]> = {};
    subjects.forEach((subject) => {
      const state = draftState[subject.lessonId];
      const removed = new Set(state?.removedTeacherGradeIds ?? []);
      const base = subject.grades
        .filter((g) => !removed.has(g.id))
        .map((g) => g.markDisplayValue)
        .filter((v) => v > 0)
        .map(round2);
      map[subject.lessonId] = [...base, ...(state?.customGrades ?? [])];
    });
    return map;
  }, [subjects, draftState]);

  const detailsSubject = useMemo(
    () => subjects.find((s) => s.lessonId === detailsSubjectId) ?? null,
    [subjects, detailsSubjectId]
  );

  const detailValues = useMemo(
    () => (detailsSubject ? valuesBySubject[detailsSubject.lessonId] ?? [] : []),
    [detailsSubject, valuesBySubject]
  );

  const detailAverage = averageOf(detailValues);
  const detailAverageTone = detailAverage >= 6.5 ? 'avg-good' : detailAverage < 6 ? 'avg-bad' : 'avg-warn';
  const detailPositive = detailValues.filter((v) => v >= 6).length;
  const detailNegative = detailValues.filter((v) => v < 6).length;
  const detailTeacherRows = useMemo(() => {
    if (!detailsSubject) return [] as Array<{ id: number; label: string; date: string; value: number; removed: boolean }>;
    const removed = new Set(draftState[detailsSubject.lessonId]?.removedTeacherGradeIds ?? []);
    return detailsSubject.grades.map((g) => ({
      id: g.id,
      label: gradeDisplay(g),
      date: fmtDateShort(g.date),
      value: round2(g.markDisplayValue),
      removed: removed.has(g.id),
    }));
  }, [detailsSubject, draftState]);

  const detailCustomValues = useMemo(() => {
    if (!detailsSubject) return [] as number[];
    return draftState[detailsSubject.lessonId]?.customGrades ?? [];
  }, [detailsSubject, draftState]);

  const trendAnimKey = useMemo(
    () => detailValues.map((v) => v.toFixed(2)).join('|'),
    [detailValues]
  );

  const trendPoints = useMemo(() => {
    if (!detailValues.length) return [] as Array<{ x: number; y: number; value: number; index: number }>;
    return detailValues.map((value, index) => {
      const x = 46 + (index / Math.max(1, detailValues.length - 1)) * 604;
      const y = Math.max(20, Math.min(220, 220 - ((value - 4) / 6) * 200));
      return { x, y, value, index };
    });
  }, [detailValues]);

  const allExpanded = subjects.length > 0 && expandedRows.size === subjects.length;

  const toggleRow = (lessonId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const toggleAllRows = () => {
    if (allExpanded) {
      setExpandedRows(new Set());
      return;
    }
    setExpandedRows(new Set(subjects.map((s) => s.lessonId)));
  };

  const openDetails = (lessonId: number) => {
    setDetailsSubjectId(lessonId);
    setNewGradeInput('');
    setHoverTrendIndex(null);
  };

  const closeDetails = () => {
    setDraftState((prev) => {
      if (detailsSubjectId === null) return prev;
      const { [detailsSubjectId]: _removed, ...rest } = prev;
      return rest;
    });
    setDetailsSubjectId(null);
    setNewGradeInput('');
    setHoverTrendIndex(null);
  };

  const toggleTeacherGrade = (lessonId: number, gradeId: number) => {
    setDraftState((prev) => {
      const current = prev[lessonId] ?? { removedTeacherGradeIds: [], customGrades: [] };
      const set = new Set(current.removedTeacherGradeIds);
      if (set.has(gradeId)) set.delete(gradeId);
      else set.add(gradeId);
      return {
        ...prev,
        [lessonId]: {
          ...current,
          removedTeacherGradeIds: Array.from(set),
        },
      };
    });
  };

  const removeCustomGrade = (lessonId: number, index: number) => {
    setDraftState((prev) => {
      const current = prev[lessonId] ?? { removedTeacherGradeIds: [], customGrades: [] };
      const nextCustom = [...current.customGrades];
      nextCustom.splice(index, 1);
      return {
        ...prev,
        [lessonId]: {
          ...current,
          customGrades: nextCustom,
        },
      };
    });
  };

  const addDraftValue = (lessonId: number) => {
    const parsed = parseGradeInput(newGradeInput);
    if (parsed === null) return;
    setDraftState((prev) => {
      const current = prev[lessonId] ?? { removedTeacherGradeIds: [], customGrades: [] };
      return {
        ...prev,
        [lessonId]: {
          ...current,
          customGrades: [...current.customGrades, parsed],
        },
      };
    });
    setNewGradeInput('');
  };

  const handleTrendMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!trendPoints.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const relX = (e.clientX - rect.left) / rect.width;
    const svgX = Math.max(46, Math.min(650, relX * 680));

    let nearest = 0;
    let minDist = Number.POSITIVE_INFINITY;
    trendPoints.forEach((p, idx) => {
      const d = Math.abs(p.x - svgX);
      if (d < minDist) {
        minDist = d;
        nearest = idx;
      }
    });
    setHoverTrendIndex(nearest);
  };

  const handleSparkMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const pts = dashboard.sparkPoints;
    if (!pts.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * 200;
    let nearest = 0;
    let minDist = Number.POSITIVE_INFINITY;
    pts.forEach((p, idx) => {
      const d = Math.abs(p.x - svgX);
      if (d < minDist) { minDist = d; nearest = idx; }
    });
    setHoverSparkIndex(nearest);
  };

  return (
    <AuthGuard>
      <div className="grades-dashboard-wrap">
        {loading ? (
          <div className="grades-state">
            <Spinner size={28} />
          </div>
        ) : error ? (
          <div className="grades-state">
            <ErrorView message={error} onRetry={load} />
          </div>
        ) : subjects.length === 0 ? (
          <div className="grades-state">
            <EmptyView icon={<BarChart2 size={56} color="var(--app-text-tertiary)" />} title="Keine Noten" subtitle="Es wurden noch keine Noten erfasst." />
          </div>
        ) : (
          <main className="grades-dashboard">
            <div className="page-head">
              <div>
                <h1 className="page-title">Schuljahr {dashboard.schoolYearLabel}</h1>
                <div className="page-sub">
                  Stand {dashboard.latestGradeDate ? fmtUntisDateLong(dashboard.latestGradeDate) : '—'} · {dashboard.subjectCount} Fächer · {dashboard.allCount} Noten erfasst
                </div>
              </div>
            </div>

            <section className="kpis">
              <div className="card">
                <div className="card-hd">
                  <div>
                    <div className="card-title">Durchschnittsnote</div>
                    <div className="card-sub">Alle Fächer · gewichtet</div>
                  </div>
                  <span className={`pill ${dashboard.delta >= 0 ? 'up' : 'down'}`}>
                    {dashboard.delta >= 0 ? '↗' : '↘'} {fmtNum(Math.abs(dashboard.delta), 2)}
                  </span>
                </div>
                <div className="kpi-value">{fmtNum(dashboard.overallAvg, 2)}</div>
                <div className="kpi-foot">
                  <span>
                    Vormonat <span className="mono">{fmtNum(dashboard.overallAvg - dashboard.delta, 2)}</span>
                  </span>
                  <span>
                    Beste Note <span className="mono">{dashboard.bestGrade ? formatMark(dashboard.bestGrade) : '—'}</span>
                  </span>
                </div>
                <div className="spark-wrap">
                  <svg
                    className="spark"
                    viewBox="0 0 200 60"
                    preserveAspectRatio="none"
                    onMouseMove={handleSparkMouseMove}
                    onMouseLeave={() => setHoverSparkIndex(null)}
                  >
                    <defs>
                      <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={dashboard.spark.area} fill="url(#sg)" />
                    <path d={dashboard.spark.line} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                    {dashboard.sparkPoints.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r={hoverSparkIndex === idx ? 3.5 : 2}
                        fill="currentColor"
                        opacity={hoverSparkIndex === idx ? 1 : 0.4}
                      />
                    ))}
                  </svg>
                  {hoverSparkIndex !== null && dashboard.sparkPoints[hoverSparkIndex] && (
                    <div className="spark-tooltip">
                      <span>{dashboard.sparkPoints[hoverSparkIndex].label}</span>
                      <strong>{fmtNum(dashboard.sparkPoints[hoverSparkIndex].avg, 2)}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-hd">
                  <div>
                    <div className="card-title">Notenverhältnis</div>
                    <div className="card-sub">Genügend · Ungenügend</div>
                  </div>
                  <span className="pill">{Math.round(dashboard.passRate)} %</span>
                </div>
                <div className="ratio">
                  <span className="pos">{dashboard.pos}</span>
                  <span className="sep">/</span>
                  <span className="neg">{dashboard.neg}</span>
                </div>
                <div className="ratio-bar" aria-hidden="true">
                  <div className="p" style={{ width: `${dashboard.passRate}%` }} />
                  <div className="n" style={{ width: `${100 - dashboard.passRate}%` }} />
                </div>
                <div className="kpi-foot">
                  <span><span className="mono good">{dashboard.pos}</span> über 6.0</span>
                  <span><span className="mono bad">{dashboard.neg}</span> unter 6.0</span>
                </div>
              </div>

              <div className="card">
                <div className="card-hd">
                  <div>
                    <div className="card-title">Notenverteilung</div>
                    <div className="card-sub">Häufigkeit pro Note</div>
                  </div>
                  <span className="pill">σ {fmtNum(dashboard.sigma, 2)}</span>
                </div>
                <div className="dist-bars" aria-hidden="true">
                  {dashboard.distribution.map((value, idx) => {
                    const h = value === 0 ? 4 : (value / dashboard.distMax) * 60 + 6;
                    return (
                      <div
                        key={`b-${idx}`}
                        className={`b ${idx < 5 ? 'bad' : ''}`}
                        style={{ height: `${h}px` }}
                        title={`Note ${idx + 1}: ${value}×`}
                      />
                    );
                  })}
                </div>
                <div className="dist-axis">
                  {Array.from({ length: 10 }, (_, i) => (
                    <span key={`a-${i}`}>{i + 1}</span>
                  ))}
                </div>
                <div className="kpi-foot">
                  <span>
                    Modus <span className="mono">{dashboard.mode}</span>
                  </span>
                  <span>
                    Median <span className="mono">{fmtNum(dashboard.median, 2)}</span>
                  </span>
                </div>
              </div>

              <div className="card">
                <div className="card-hd">
                  <div>
                    <div className="card-title">Kürzlich hinzugefügt</div>
                    <div className="card-sub">Letzte 3 Einträge</div>
                  </div>
                  <span className="mini-link"></span>
                </div>
                <div className="recent">
                  {dashboard.recent.map((r) => {
                    const cls = gradeClass(r.numeric);
                    return (
                      <div key={r.id} className="recent-row">
                        <span className="subj">{r.subject}</span>
                        <span className={`grade ${cls}`}>{formatMark(r.numeric)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="timeline-wrap">
              <div className="timeline-head">
                <button className="expand-all" onClick={toggleAllRows} type="button">
                  {allExpanded ? 'Alle einklappen' : 'Alle ausklappen'}
                </button>
              </div>

              <div className="timeline-list">
                {subjects.map((subject) => {
                  const isExpanded = expandedRows.has(subject.lessonId);
                  const subjectValues = valuesBySubject[subject.lessonId] ?? [];
                  const subjectAvg = averageOf(subjectValues);
                  const avgClass = gradeClass(subjectAvg);
                  return (
                    <article key={subject.lessonId} className="timeline-item">
                      <button
                        type="button"
                        className="timeline-row"
                        onClick={() => toggleRow(subject.lessonId)}
                        aria-expanded={isExpanded}
                      >
                        <span className="timeline-subject">{subject.subjectName}</span>
                        <span className="timeline-right">
                          <span className={`timeline-avg ${avgClass}`}>{fmtNum(subjectAvg, 2)}</span>
                          <ChevronDown className={`timeline-chevron ${isExpanded ? 'open' : ''}`} size={20} strokeWidth={2.4} />
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="timeline-panel">
                          {subject.grades.map((grade) => {
                            const gradeCls = gradeClass(grade.markDisplayValue);
                            return (
                              <div key={grade.id} className="grade-row">
                                <div className="grade-meta">
                                  <span className="grade-name">{gradeDisplay(grade)}</span>
                                  <span className="grade-date">{fmtDateShort(grade.date)}</span>
                                </div>
                                <span className={`grade-value ${gradeCls}`}>{formatMark(grade.markDisplayValue)}</span>
                              </div>
                            );
                          })}
                          <div className="timeline-actions">
                            <button type="button" className="details-btn" onClick={() => openDetails(subject.lessonId)}>
                              Details
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          </main>
        )}
      </div>

      {detailsSubject && (
        <div className="details-backdrop" onClick={closeDetails}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-head">
              <h2>{detailsSubject.subjectName}</h2>
              <button type="button" className="close-btn" onClick={closeDetails} aria-label="Schließen">
                <X size={18} />
              </button>
            </div>

            <div className="details-grid">
              <div className="detail-card">
                <p>Durchschnittsnote</p>
                <strong className={detailAverageTone}>{fmtNum(detailAverage, 2)}</strong>
              </div>
              <div className="detail-card">
                <p>Notenverhältnis</p>
                <strong>
                  <span className="ratio-pos">{detailPositive}</span>
                  <span className="ratio-sep">/</span>
                  <span className="ratio-neg">{detailNegative}</span>
                </strong>
              </div>
            </div>

            <div className="trend-card">
              <div className="edit-head">
                <h3>Trend</h3>
                <span>Notenentwicklung</span>
              </div>
              <svg
                viewBox="0 0 680 240"
                className="trend-svg"
                onMouseMove={handleTrendMouseMove}
                onMouseLeave={() => setHoverTrendIndex(null)}
              >
                <line x1="46" y1="20" x2="46" y2="220" className="trend-axis-line" />
                {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4].map((grade) => {
                  const y = 220 - ((grade - 4) / 6) * 200;
                  return (
                    <g key={`g-${grade}`}>
                      <text x="32" y={y} textAnchor="end" dominantBaseline="middle" className="trend-axis-label">
                        {grade.toFixed(1)}
                      </text>
                      <line x1="46" y1={y} x2="650" y2={y} className="trend-grid" />
                    </g>
                  );
                })}
                {trendPoints.length > 0 && (
                  <polyline
                    key={`line-${trendAnimKey}`}
                    className="trend-line"
                    fill="none"
                    points={trendPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                  />
                )}
                {detailValues.length > 1 && (() => {
                  const first = detailValues[0];
                  const last = detailValues[detailValues.length - 1];
                  const y1 = 220 - ((first - 4) / 6) * 200;
                  const y2 = 220 - ((last - 4) / 6) * 200;
                  return <line key={`fit-${trendAnimKey}`} x1="46" y1={Math.max(20, Math.min(220, y1))} x2="650" y2={Math.max(20, Math.min(220, y2))} className="trend-fit" />;
                })()}

                {trendPoints.map((p) => (
                  <circle
                    key={`pt-${p.index}-${trendAnimKey}`}
                    cx={p.x}
                    cy={p.y}
                    r={hoverTrendIndex === p.index ? 4.6 : 3.2}
                    className="trend-point"
                    onMouseEnter={() => setHoverTrendIndex(p.index)}
                  />
                ))}

                {hoverTrendIndex !== null && trendPoints[hoverTrendIndex] && (() => {
                  const p = trendPoints[hoverTrendIndex];
                  const t = trendPoints.length > 1 ? hoverTrendIndex / (trendPoints.length - 1) : 0;
                  const first = detailValues[0] ?? detailAverage;
                  const last = detailValues[detailValues.length - 1] ?? detailAverage;
                  const fitValue = first + (last - first) * t;
                  const tooltipX = Math.min(520, Math.max(78, p.x + 14));
                  const tooltipY = Math.max(22, p.y - 62);
                  return (
                    <g className="trend-hover">
                      <line x1={p.x} y1="20" x2={p.x} y2="220" className="trend-hover-line" />
                      <circle cx={p.x} cy={p.y} r="4.8" className="trend-point-active" />

                      <rect x={tooltipX} y={tooltipY} rx="7" ry="7" width="146" height="56" className="trend-tooltip-bg" />
                      <rect x={tooltipX + 9} y={tooltipY + 11} width="8" height="8" rx="2" className="trend-tooltip-dot-main" />
                      <text x={tooltipX + 22} y={tooltipY + 20} className="trend-tooltip-text">Note: {fmtNum(p.value, 2)}</text>
                      <rect x={tooltipX + 9} y={tooltipY + 31} width="8" height="8" rx="2" className="trend-tooltip-dot-fit" />
                      <text x={tooltipX + 22} y={tooltipY + 40} className="trend-tooltip-text">Trend: {fmtNum(fitValue, 2)}</text>
                    </g>
                  );
                })()}
              </svg>
            </div>

            <div className="edit-card">
              <div className="edit-head">
                <h3>Mittelwert-Rechner</h3>
              </div>

              <div className="edit-list">
                {detailTeacherRows.map((row) => (
                  <div key={row.id} className={`edit-row${row.removed ? ' removed' : ''}`}>
                    <div className="edit-meta">
                      <span>{row.date}</span>
                      <em>{row.label}</em>
                    </div>
                    <div className="edit-controls">
                      <strong className={`inline-grade ${row.value >= 6.5 ? 'mw-good' : 'mw-warn'}`}>{formatMark(row.value)}</strong>
                      <button
                        type="button"
                        onClick={() => toggleTeacherGrade(detailsSubject.lessonId, row.id)}
                        aria-label={row.removed ? 'Note wiederherstellen' : 'Note entfernen'}
                      >
                        {row.removed ? <Plus size={14} /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="custom-block">
                <div className="custom-head" style={{ textAlign: 'center' }}>Eigene Noten</div>
                {detailCustomValues.length > 0 ? (
                  <div className="custom-list">
                    {detailCustomValues.map((value, idx) => (
                      <div key={`custom-${idx}`} className={`custom-item ${value >= 6.5 ? 'mw-good' : 'mw-warn'}`}>
                        <span className={`inline-grade ${value >= 6.5 ? 'mw-good' : 'mw-warn'}`}>{formatMark(value)}</span>
                        <button type="button" onClick={() => removeCustomGrade(detailsSubject.lessonId, idx)} aria-label="Eigene Note entfernen">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="custom-empty">Noch keine eigenen Noten</div>
                )}
              </div>

              <div className="add-row">
                <div className="add-input">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newGradeInput}
                    onChange={(e) => {
                      const next = e.currentTarget.value;
                      if (/^\d{0,2}([.,]\d{0,2})?$/.test(next)) {
                        const parsed = Number.parseFloat(next.replace(',', '.'));
                        if (Number.isFinite(parsed) && parsed > 10) {
                          setNewGradeInput('10');
                        } else {
                          setNewGradeInput(next);
                        }
                      }
                    }}
                    placeholder="Neue Note"
                  />
                  <button type="button" onClick={() => addDraftValue(detailsSubject.lessonId)} aria-label="Neue Note hinzufügen">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .grades-dashboard-wrap {
          --g-bg: var(--app-bg);
          --g-surface: var(--app-surface);
          --g-line: var(--app-border);
          --g-line-2: color-mix(in srgb, var(--app-border) 70%, var(--app-text-tertiary));
          --g-ink: var(--app-text-primary);
          --g-ink-2: color-mix(in srgb, var(--app-text-primary) 86%, var(--app-text-secondary));
          --g-muted: var(--app-text-secondary);
          --g-muted-2: var(--app-text-tertiary);
          --g-good: var(--tint);
          --g-good-soft: color-mix(in srgb, var(--tint) 14%, transparent);
          --g-bad: var(--danger);
          --g-bad-soft: color-mix(in srgb, var(--danger) 14%, transparent);
          --g-excellent: color-mix(in srgb, var(--tint) 82%, #ffffff);
          --g-negative: var(--orange);
          --g-overlay: color-mix(in srgb, var(--app-bg) 52%, #000000 48%);

          height: 100%;
          overflow: auto;
          background: var(--g-bg);
          color: var(--g-ink);
          font-feature-settings: 'ss01', 'cv11';
          text-rendering: optimizeLegibility;
          letter-spacing: -0.005em;
        }

        .grades-state {
          min-height: 100%;
          display: grid;
          place-items: center;
          padding: 24px;
        }

        .grades-dashboard {
          max-width: 1320px;
          margin: 0 auto;
          padding: 36px 28px 80px;
          font-family: var(--font-inter, 'Inter'), -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .mono {
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
        }

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

        .filters {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .seg {
          display: inline-flex;
          padding: 3px;
          background: var(--g-surface);
          border: 1px solid var(--g-line);
          border-radius: 13px;
        }

        .seg button {
          appearance: none;
          background: transparent;
          border: 0;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          color: var(--g-muted);
          padding: 9px 16px;
          border-radius: 10px;
          transition: all 0.15s;
        }

        .seg button.on {
          background: var(--g-ink);
          color: var(--g-bg);
        }

        .seg button:not(.on):hover {
          color: var(--g-ink);
        }

        .btn {
          appearance: none;
          cursor: pointer;
          font-family: inherit;
          border: 0;
          padding: 10px 16px;
          border-radius: 13px;
          font-size: 14px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.15s, transform 0.1s;
        }

        .btn:active {
          transform: translateY(1px);
        }

        .btn.ghost {
          background: var(--g-surface);
          color: var(--g-ink);
          border: 1px solid var(--g-line);
        }

        .btn.ghost:hover {
          border-color: var(--g-line-2);
        }

        .kpis {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin-bottom: 32px;
        }

        .card {
          background: var(--g-surface);
          border: 1px solid var(--g-line);
          border-radius: 20px;
          padding: 22px 22px 20px;
          position: relative;
          transition: border-color 0.2s;
        }

        .card:hover {
          border-color: var(--g-line-2);
        }

        .card-hd {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .card-title {
          font-size: 12.5px;
          color: var(--g-muted);
          font-weight: 600;
          letter-spacing: 0;
        }

        .card-sub {
          font-size: 11.5px;
          color: var(--g-muted-2);
          letter-spacing: 0;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          padding: 3px 7px;
          border-radius: 999px;
          background: var(--g-line);
          color: var(--g-ink-2);
          font-weight: 600;
        }

        .pill.up {
          background: var(--g-good-soft);
          color: var(--g-good);
        }

        .pill.down {
          background: var(--g-bad-soft);
          color: var(--g-bad);
        }

        .kpi-value {
          font-variant-numeric: tabular-nums;
          font-size: 44px;
          font-weight: 600;
          line-height: 1;
          letter-spacing: -0.04em;
          color: var(--g-ink);
        }

        .kpi-foot {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11.5px;
          color: var(--g-muted);
        }

        .good {
          color: var(--g-good);
        }

        .bad {
          color: var(--g-bad);
        }

        .spark {
          height: 64px;
          width: 100%;
          color: var(--g-ink);
          cursor: crosshair;
          display: block;
        }

        .ratio {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .ratio .pos {
          color: var(--g-good);
          font-size: 44px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.04em;
        }

        .ratio .sep {
          color: var(--g-muted-2);
          font-size: 24px;
          font-weight: 300;
        }

        .ratio .neg {
          color: var(--g-bad);
          font-size: 32px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.04em;
        }

        .ratio-bar {
          height: 4px;
          background: var(--g-line);
          border-radius: 99px;
          overflow: hidden;
          display: flex;
          margin-top: 16px;
        }

        .ratio-bar .p {
          background: var(--g-good);
        }

        .ratio-bar .n {
          background: var(--g-bad);
        }

        .dist-bars {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 64px;
          margin-top: 6px;
        }

        .dist-bars .b {
          flex: 1;
          background: var(--g-ink);
          border-radius: 3px 3px 0 0;
          opacity: 0.85;
          transition: opacity 0.15s, transform 0.15s;
        }

        .dist-bars .b.bad {
          background: color-mix(in srgb, var(--g-bad) 85%, var(--g-ink));
        }

        .dist-bars .b:hover {
          opacity: 1;
          transform: translateY(-2px);
        }

        .dist-axis {
          display: flex;
          gap: 4px;
          margin-top: 6px;
          font-size: 9.5px;
          color: var(--g-muted-2);
        }

        .dist-axis span {
          flex: 1;
          text-align: center;
        }

        .mini-link {
          font-size: 12px;
          color: var(--g-muted);
        }

        .recent {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-top: 2px;
        }

        .recent-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px dashed var(--g-line);
          font-size: 13px;
        }

        .recent-row:last-child {
          border-bottom: 0;
        }

        .recent-row .subj {
          color: var(--g-ink);
          font-weight: 600;
        }

        .recent-row .grade {
          font-variant-numeric: tabular-nums;
          font-size: 14px;
          font-weight: 700;
        }

        .recent-row .grade.v-excellent {
          color: var(--g-excellent);
        }

        .recent-row .grade.v-positive {
          color: var(--g-good);
        }

        .recent-row .grade.v-negative {
          color: var(--g-negative);
        }

        .recent-row .grade.v-critical {
          color: var(--g-bad);
        }

        .timeline-wrap {
          background: var(--g-surface);
          border: 1px solid var(--g-line);
          border-radius: 12px;
          overflow: hidden;
        }

        .timeline-head {
          display: flex;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid var(--g-line);
        }

        .expand-all {
          border: 0;
          background: transparent;
          color: var(--g-ink);
          padding: 0;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
        }

        .timeline-list {
          display: block;
        }

        .timeline-item {
          border-bottom: 1px solid var(--g-line);
        }

        .timeline-item:last-child {
          border-bottom: 0;
        }

        .timeline-row {
          width: 100%;
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 72px;
          padding: 0 18px;
          cursor: pointer;
          transition: background 0.16s;
        }

        .timeline-row:hover {
          background: color-mix(in srgb, var(--g-bg) 45%, transparent);
        }

        .timeline-subject {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--g-ink);
        }

        .timeline-right {
          display: inline-flex;
          align-items: center;
          gap: 14px;
        }

        .timeline-avg {
          font-variant-numeric: tabular-nums;
          font-size: 17px;
          font-weight: 500;
          color: var(--g-muted);
        }

        .timeline-avg.v-excellent {
          color: var(--g-excellent);
        }

        .timeline-avg.v-positive {
          color: var(--g-good);
        }

        .timeline-avg.v-negative {
          color: var(--g-negative);
        }

        .timeline-avg.v-critical {
          color: var(--g-bad);
        }

        .timeline-chevron {
          color: var(--g-muted);
          transition: transform 0.2s;
        }

        .timeline-chevron.open {
          transform: rotate(180deg);
        }

        .timeline-panel {
          background: color-mix(in srgb, var(--g-bg) 55%, transparent);
          border-top: 1px solid var(--g-line);
          padding: 10px 18px 14px;
        }

        .timeline-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }

        .details-btn {
          border: 1px solid var(--g-line-2);
          background: var(--g-surface);
          color: var(--g-ink);
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.08em;
          cursor: pointer;
        }

        .details-btn:hover {
          border-color: var(--g-ink);
        }

        .grade-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid var(--g-line);
          background: var(--g-surface);
          border-radius: 10px;
          padding: 10px 12px;
          margin-top: 8px;
        }

        .grade-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .grade-name {
          color: var(--g-ink);
          font-size: 13px;
          font-weight: 600;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .grade-date {
          margin-top: 3px;
          color: var(--g-muted);
          font-size: 11px;
        }

        .grade-value {
          font-size: 13px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .grade-value.v-excellent {
          color: var(--g-excellent);
        }

        .grade-value.v-positive {
          color: var(--g-good);
        }

        .grade-value.v-negative {
          color: var(--g-negative);
        }

        .grade-value.v-critical {
          color: var(--g-bad);
        }

        .details-backdrop {
          position: fixed;
          inset: 0;
          background: var(--app-bg);
          backdrop-filter: none;
          display: grid;
          place-items: center;
          z-index: 80;
          animation: fadeInBackdrop 0.2s ease;
          padding: 16px;
        }

        .details-modal {
          width: min(760px, 100%);
          max-height: 92vh;
          overflow: auto;
          background: var(--app-surface);
          border: 1px solid var(--g-line);
          border-radius: 14px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.32);
          padding: 18px;
          animation: popIn 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .details-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .details-head h2 {
          margin: 0;
          font-size: 26px;
          letter-spacing: -0.02em;
        }

        .close-btn {
          border: 1px solid var(--g-line);
          background: var(--g-bg);
          color: var(--g-ink);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }

        .detail-card {
          border: 1px solid var(--g-line);
          border-radius: 12px;
          padding: 14px;
          background: var(--g-bg);
        }

        .detail-card p {
          margin: 0;
          font-size: 13px;
          color: var(--g-muted);
        }

        .detail-card strong {
          display: block;
          margin-top: 8px;
          font-size: 43px;
          line-height: 1;
          letter-spacing: -0.03em;
          color: var(--g-ink);
        }

        .detail-card strong.avg-good {
          color: #28c281;
        }

        .detail-card strong.avg-warn {
          color: #f3a53a;
        }

        .detail-card strong.avg-bad {
          color: #ff4d4f;
        }

        .detail-card .ratio-pos {
          color: #28c281;
        }

        .detail-card .ratio-sep {
          color: #8c8c8c;
          padding: 0 6px;
        }

        .detail-card .ratio-neg {
          color: #ff4d4f;
        }


        .edit-card,
        .trend-card {
          border: 1px solid var(--g-line);
          border-radius: 12px;
          padding: 14px;
          background: var(--g-bg);
          margin-bottom: 12px;
        }

        .edit-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 10px;
        }

        .edit-head h3 {
          margin: 0;
          font-size: 33px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .edit-head span {
          color: var(--g-muted);
          font-size: 12px;
        }

        .edit-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .edit-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid color-mix(in srgb, var(--g-line) 55%, transparent);
          background: color-mix(in srgb, var(--g-bg) 62%, #000000 38%);
          border-radius: 10px;
          padding: 10px 12px;
        }

        .edit-row.removed .edit-meta span,
        .edit-row.removed .edit-meta em,
        .edit-row.removed .inline-grade {
          text-decoration: line-through;
          opacity: 0.55;
        }

        .edit-meta {
          display: flex;
          gap: 14px;
          align-items: baseline;
          min-width: 0;
        }

        .edit-meta span {
          color: var(--g-ink);
          font-size: 13px;
          font-weight: 500;
          min-width: 84px;
        }

        .edit-meta em {
          color: var(--g-muted);
          font-size: 13px;
          font-style: italic;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 320px;
        }

        .edit-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .inline-grade {
          min-width: 56px;
          text-align: right;
          font-size: 18px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .inline-grade.v-excellent {
          color: var(--g-good) !important;
        }

        .inline-grade.v-positive {
          color: var(--g-good) !important;
        }

        .inline-grade.v-negative {
          color: var(--g-bad) !important;
        }

        .inline-grade.v-critical {
          color: var(--g-bad) !important;
        }

        .inline-grade.mw-good {
          color: #28c281;
        }

        .inline-grade.mw-warn {
          color: #f3a53a;
        }

        .add-row input {
          width: 132px;
          border: 1px solid #6a6a6a;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          color: var(--g-ink);
          padding: 8px 36px 8px 10px;
          font-size: 13px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
        }

        .add-row input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.7);
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.18);
        }

        .edit-controls button,
        .add-input button {
          width: 36px;
          height: 36px;
          border: 1px solid var(--g-line-2);
          border-radius: 8px;
          background: var(--g-surface);
          color: var(--g-ink);
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .add-row {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 12px;
        }

        .add-input {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .add-input button {
          position: absolute;
          right: 4px;
          width: 28px;
          height: 28px;
          border-radius: 7px;
        }

        .custom-block {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px dashed var(--g-line);
        }

        .custom-head {
          font-size: 12px;
          color: var(--g-muted);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
        }

        .custom-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
        }

        .custom-item {
          display: inline-flex;
          flex: 0 0 auto;
          justify-content: center;
          align-items: center;
          gap: 8px;
          width: max-content;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 6px 10px;
        }

        .custom-item.mw-good {
          border-color: color-mix(in srgb, #28c281 55%, transparent);
          background: color-mix(in srgb, #28c281 14%, transparent);
        }

        .custom-item.mw-warn {
          border-color: color-mix(in srgb, #f3a53a 55%, transparent);
          background: color-mix(in srgb, #f3a53a 14%, transparent);
        }

        .custom-item button {
          width: 30px;
          height: 30px;
          border: 1px solid var(--g-line-2);
          border-radius: 8px;
          background: var(--g-surface);
          color: var(--g-ink);
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .custom-item .inline-grade {
          min-width: 0;
          text-align: center;
        }

        .custom-empty {
          color: var(--g-muted-2);
          font-size: 12px;
          text-align: center;
          margin-bottom: 2px;
        }

        .add-row input::-webkit-outer-spin-button,
        .add-row input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .add-row input[type='text'] {
          appearance: textfield;
        }

        .trend-svg {
          width: 100%;
          height: 240px;
          overflow: visible;
        }

        .trend-grid {
          stroke: rgba(255, 255, 255, 0.22);
          stroke-width: 1.1;
          opacity: 1;
        }

        .trend-axis-line {
          stroke: rgba(255, 255, 255, 0.38);
          stroke-width: 1.3;
          opacity: 1;
        }

        .trend-axis-label {
          fill: #f4f7ff;
          font-size: 13px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .trend-line {
          stroke: var(--accent);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 900;
          stroke-dashoffset: 900;
          animation: drawTrend 0.45s ease forwards;
        }

        .trend-fit {
          stroke: var(--orange);
          stroke-width: 1.5;
          stroke-dasharray: 900;
          stroke-dashoffset: 900;
          animation: drawTrend 0.45s ease forwards;
          animation-delay: 0.05s;
        }

        .trend-point {
          fill: var(--accent);
          stroke: var(--g-surface);
          stroke-width: 1.3;
          cursor: pointer;
          animation: popPoint 0.28s ease both;
        }

        .trend-point-active {
          fill: var(--accent);
          stroke: var(--g-surface);
          stroke-width: 1.7;
        }

        .trend-hover-line {
          stroke: color-mix(in srgb, var(--g-ink) 55%, var(--g-bg));
          stroke-width: 1;
          stroke-dasharray: 3 3;
        }

        .trend-tooltip-bg {
          fill: color-mix(in srgb, var(--g-surface) 96%, #000000 4%);
          stroke: color-mix(in srgb, var(--g-ink) 20%, var(--g-bg));
          stroke-width: 1;
          pointer-events: none;
        }

        .trend-tooltip-dot-main {
          fill: var(--accent);
        }

        .trend-tooltip-dot-fit {
          fill: var(--orange);
        }

        .trend-tooltip-text {
          fill: #ffffff;
          font-size: 11px;
          font-weight: 600;
          pointer-events: none;
        }

        @keyframes fadeInBackdrop {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes popIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes drawTrend {
          from {
            stroke-dashoffset: 900;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes popPoint {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .spark-wrap {
          position: relative;
          margin-top: 4px;
        }

        .spark-tooltip {
          position: absolute;
          top: 6px;
          right: 0;
          background: color-mix(in srgb, var(--g-surface) 96%, #000000 4%);
          border: 1px solid var(--g-line-2);
          border-radius: 7px;
          padding: 4px 9px;
          font-size: 11px;
          font-weight: 600;
          color: var(--g-ink);
          font-variant-numeric: tabular-nums;
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .spark-tooltip span {
          color: var(--g-muted);
          font-weight: 500;
        }

        @media (max-width: 1200px) {
          .kpis {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .timeline-subject {
            font-size: 14px;
          }

          .timeline-avg {
            font-size: 15px;
          }
        }

        @media (max-width: 900px) {
          .grades-dashboard {
            padding: 24px 16px 76px;
          }

          .page-head {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }

        @media (max-width: 720px) {
          .kpis {
            grid-template-columns: 1fr;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .edit-head h3 {
            font-size: 24px;
          }

          .edit-meta {
            gap: 8px;
          }

          .edit-meta em {
            max-width: 140px;
          }

          .expand-all {
            font-size: 16px;
          }

          .timeline-row {
            min-height: 58px;
            padding: 0 14px;
          }

          .timeline-panel {
            padding: 10px 14px 12px;
          }

          .timeline-subject {
            font-size: 13px;
          }

          .timeline-avg {
            font-size: 14px;
          }
        }
      `}</style>
    </AuthGuard>
  );
}
