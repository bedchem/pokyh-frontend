'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart2, ChevronDown, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import EmptyView from '@/components/ui/EmptyView';
import { fetchGrades } from '@/lib/api';
import type { SubjectGrades } from '@/lib/types';
import {
  parseGrades,
  fmtNum,
  fmtDateShort,
  fmtUntisDateLong,
  monthKey,
  gradeDisplay,
  formatMark,
  averageOf,
  gradeClass,
} from '@/lib/grades';

const DONUT_GRADE_COLORS: Record<number, string> = {
  10: '#30D158',
  9: '#00C7BE',
  8: '#0A84FF',
  7: '#5E5CE6',
  6: '#FFD60A',
  5: '#FF9F0A',
  4: '#FF453A',
};

type DonutSeg = {
  grade: number;
  count: number;
  color: string;
  path: string;
  sweep: number;
  tickStart: [number, number];
  tickEnd: [number, number];
  labelPos: [number, number];
};

type RecentItem = {
  id: number;
  subject: string;
  numeric: number;
};

type SortMode = 'name' | 'avg-desc' | 'avg-asc' | 'recent';

const _now = new Date();
const CURRENT_SCHOOL_YEAR = _now.getMonth() >= 8 ? _now.getFullYear() : _now.getFullYear() - 1;
const AVAILABLE_YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_SCHOOL_YEAR - i);

export default function GradesPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [hoverSparkIndex, setHoverSparkIndex] = useState<number | null>(null);
  const [hoverDonutGrade, setHoverDonutGrade] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(CURRENT_SCHOOL_YEAR);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  const SORT_OPTIONS: { value: SortMode; label: string }[] = [
    { value: 'name', label: 'Name' },
    { value: 'avg-desc', label: 'Bester ⌀' },
    { value: 'avg-asc', label: 'Schlechtester ⌀' },
    { value: 'recent', label: 'Letzte Note' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setIsYearOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchGrades(selectedYear);
      const parsed = parseGrades(res);
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
  }, [router, selectedYear]);

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
    const schoolYearStart = selectedYear;

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
    const monthKeys = keys;

    // Kumulative Durchschnitte: Schnitt aller Noten von Anfang bis zu diesem Monat
    const cumulativeAvgs = monthKeys.map((_, i) => {
      const upto = new Set(monthKeys.slice(0, i + 1));
      const vals = allGrades
        .filter((g) => upto.has(monthKey(g.date)))
        .map((g) => g.markDisplayValue)
        .filter((v) => v > 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });

    // Dynamisches Y-scaling, damit Variation sichtbar wird
    const validAvgs = cumulativeAvgs.filter((v) => v > 0);
    const minA = validAvgs.length ? Math.min(...validAvgs) : 1;
    const maxA = validAvgs.length ? Math.max(...validAvgs) : 10;
    const rangePad = Math.max(0.4, (maxA - minA) * 0.3);
    const dataMin = Math.max(1, minA - rangePad);
    const dataMax = Math.min(10, maxA + rangePad);
    const toSparkY = (v: number): number => {
      if (dataMax === dataMin) return 30;
      return 54 - ((v - dataMin) / (dataMax - dataMin)) * 48;
    };

    const sparkXs = cumulativeAvgs.map((_, i) =>
      cumulativeAvgs.length <= 1 ? 100 : (i / (cumulativeAvgs.length - 1)) * 200
    );

    let spark: { line: string; area: string };
    if (cumulativeAvgs.length === 0) {
      spark = { line: '', area: '' };
    } else if (cumulativeAvgs.length === 1) {
      const y = cumulativeAvgs[0] > 0 ? toSparkY(cumulativeAvgs[0]) : 30;
      spark = {
        line: `M0,${y.toFixed(1)} L200,${y.toFixed(1)}`,
        area: `M0,${y.toFixed(1)} L200,${y.toFixed(1)} L200,60 L0,60 Z`,
      };
    } else {
      const line = cumulativeAvgs
        .map((v, i) => `${i === 0 ? 'M' : 'L'}${sparkXs[i].toFixed(1)},${(v > 0 ? toSparkY(v) : 58).toFixed(1)}`)
        .join(' ');
      spark = { line, area: `${line} L200,60 L0,60 Z` };
    }

    const sparkPoints = monthKeys.map((k, i) => {
      const avg = cumulativeAvgs[i];
      const x = sparkXs[i];
      const y = avg > 0 ? toSparkY(avg) : 58;
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

    const donutSegs: DonutSeg[] = [];
    if (values.length > 0) {
      const CX = 55, CY = 55, R = 29, SW = 16, GAP = 0.035;
      const gradeEntries: [number, number][] = [];
      for (let i = 9; i >= 0; i--) {
        if (distribution[i] > 0) gradeEntries.push([i + 1, distribution[i]]);
      }
      let startAngle = -Math.PI / 2;
      for (const [grade, count] of gradeEntries) {
        const sweep = Math.max(0.01, (count / values.length) * Math.PI * 2 - GAP);
        const endAngle = startAngle + sweep;
        const midAngle = startAngle + sweep / 2;
        const x1 = CX + R * Math.cos(startAngle);
        const y1 = CY + R * Math.sin(startAngle);
        const x2 = CX + R * Math.cos(endAngle);
        const y2 = CY + R * Math.sin(endAngle);
        const outerEdge = R + SW / 2 + 1;
        const tickEndR = R + SW / 2 + 7;
        const labelR = R + SW / 2 + 14;
        donutSegs.push({
          grade,
          count,
          color: DONUT_GRADE_COLORS[grade] ?? '#636366',
          path: `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
          sweep,
          tickStart: [CX + outerEdge * Math.cos(midAngle), CY + outerEdge * Math.sin(midAngle)],
          tickEnd: [CX + tickEndR * Math.cos(midAngle), CY + tickEndR * Math.sin(midAngle)],
          labelPos: [CX + labelR * Math.cos(midAngle), CY + labelR * Math.sin(midAngle)],
        });
        startAngle += sweep + GAP;
      }
    }

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
      donutSegs,
      schoolYearLabel: `${schoolYearStart} / ${schoolYearStart + 1}`,
    };
  }, [subjects, selectedYear]);

  const filteredSubjects = useMemo(() => {
    const withMeta = subjects.map((s) => {
      const vals = s.grades.map((g) => g.markDisplayValue).filter((v) => v > 0);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      const latest = s.grades.reduce((max, g) => (g.date > max ? g.date : max), 0);
      return { ...s, avg, latest };
    });

    if (sortMode === 'name') {
      withMeta.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
    } else if (sortMode === 'avg-desc') {
      withMeta.sort((a, b) => b.avg - a.avg);
    } else if (sortMode === 'avg-asc') {
      withMeta.sort((a, b) => a.avg - b.avg);
    } else if (sortMode === 'recent') {
      withMeta.sort((a, b) => b.latest - a.latest);
    }

    return withMeta;
  }, [subjects, sortMode]);

  const allExpanded = filteredSubjects.length > 0 && expandedRows.size === filteredSubjects.length;

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
    setExpandedRows(new Set(filteredSubjects.map((s) => s.lessonId)));
  };

  const openDetails = (lessonId: number) => {
    router.push(`/grades/subject/${lessonId}`);
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
      <UntisGuard>
      <div className="grades-dashboard-wrap">
        {loading ? (
          <div className="grades-state">
            <Spinner size={28} />
          </div>
        ) : error ? (
          <div className="grades-state">
            <ErrorView message={error} onRetry={load} />
          </div>
        ) : (
          <main className="grades-dashboard">
            <div className="page-head">
              <div>
                <h1 className="page-title">Schuljahr {dashboard.schoolYearLabel}</h1>
                <div className="page-sub">
                  {subjects.length > 0
                    ? `Stand ${dashboard.latestGradeDate ? fmtUntisDateLong(dashboard.latestGradeDate) : '—'} · ${dashboard.subjectCount} Fächer · ${dashboard.allCount} Noten erfasst`
                    : 'Keine Noten für dieses Schuljahr'}
                </div>
              </div>
              <div className="custom-select-container" ref={yearRef}>
                <button
                  className={`sort-select year-select-btn ${isYearOpen ? 'open' : ''}`}
                  onClick={() => setIsYearOpen(!isYearOpen)}
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isYearOpen}
                >
                  {dashboard.schoolYearLabel}
                  <ChevronDown
                    size={14}
                    style={{ transform: isYearOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                  />
                </button>
                {isYearOpen && (
                  <ul className="custom-select-dropdown fade-in" role="listbox">
                    {AVAILABLE_YEARS.map((y) => (
                      <li
                        key={y}
                        role="option"
                        aria-selected={selectedYear === y}
                        className={`custom-select-item ${selectedYear === y ? 'selected' : ''}`}
                        onClick={() => { setSelectedYear(y); setIsYearOpen(false); }}
                      >
                        {y} / {y + 1}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {subjects.length === 0 ? (
              <div className="grades-empty">
                <EmptyView icon={<BarChart2 size={56} color="var(--app-text-tertiary)" />} title="Keine Noten" subtitle="Für dieses Schuljahr wurden keine Noten gefunden." />
              </div>
            ) : <>

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
                <div className="donut-wrap">
                  <svg viewBox="0 0 110 110" width="110" height="110" aria-hidden="true">
                    {dashboard.donutSegs.map((seg) => (
                      <path
                        key={`arc-${seg.grade}`}
                        d={seg.path}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="16"
                        strokeLinecap="butt"
                        opacity={hoverDonutGrade === null || hoverDonutGrade === seg.grade ? 1 : 0.35}
                        style={{ transition: 'opacity 0.15s' }}
                      />
                    ))}
                    {dashboard.donutSegs.filter((s) => s.sweep >= 0.18).map((seg) => (
                      <g key={`lbl-${seg.grade}`} opacity={hoverDonutGrade === null || hoverDonutGrade === seg.grade ? 1 : 0.35} style={{ transition: 'opacity 0.15s' }}>
                        <line
                          x1={seg.tickStart[0].toFixed(2)}
                          y1={seg.tickStart[1].toFixed(2)}
                          x2={seg.tickEnd[0].toFixed(2)}
                          y2={seg.tickEnd[1].toFixed(2)}
                          stroke={seg.color}
                          strokeWidth="1.2"
                          strokeOpacity="0.8"
                        />
                        <text
                          x={seg.labelPos[0].toFixed(2)}
                          y={seg.labelPos[1].toFixed(2)}
                          fontSize="9"
                          fontWeight="700"
                          fill={seg.color}
                          textAnchor="middle"
                          dominantBaseline="central"
                        >
                          {seg.grade}
                        </text>
                      </g>
                    ))}
                    {dashboard.donutSegs.map((seg) => (
                      <path
                        key={`hit-${seg.grade}`}
                        d={seg.path}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="24"
                        strokeLinecap="butt"
                        style={{ cursor: 'default' }}
                        onMouseEnter={() => setHoverDonutGrade(seg.grade)}
                        onMouseLeave={() => setHoverDonutGrade(null)}
                      />
                    ))}
                    {hoverDonutGrade !== null && (() => {
                      const seg = dashboard.donutSegs.find((s) => s.grade === hoverDonutGrade);
                      return seg ? (
                        <text
                          x="55"
                          y="55"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="14"
                          fontWeight="700"
                          fill={seg.color}
                          style={{ pointerEvents: 'none' }}
                        >
                          {seg.count}×
                        </text>
                      ) : null;
                    })()}
                  </svg>
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
                <div className="timeline-head-title">Fächer</div>
                <div className="sort-wrap">
                  <div className="custom-select-container" ref={sortRef}>
                    <button
                      className={`sort-select ${isSortOpen ? 'open' : ''}`}
                      onClick={() => setIsSortOpen(!isSortOpen)}
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={isSortOpen}
                    >
                      {SORT_OPTIONS.find((o) => o.value === sortMode)?.label}
                      <ChevronDown size={14} className="sort-arrow" style={{ transform: isSortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    
                    {isSortOpen && (
                      <ul className="custom-select-dropdown fade-in" role="listbox">
                        {SORT_OPTIONS.map((opt) => (
                          <li
                            key={opt.value}
                            role="option"
                            aria-selected={sortMode === opt.value}
                            className={`custom-select-item ${sortMode === opt.value ? 'selected' : ''}`}
                            onClick={() => {
                              setSortMode(opt.value);
                              setIsSortOpen(false);
                            }}
                          >
                            {opt.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button className="expand-all" onClick={toggleAllRows} type="button">
                    {allExpanded ? 'Einklappen' : 'Alle aufklappen'}
                  </button>
                </div>
              </div>

              <div className="timeline-list">
                {filteredSubjects.length === 0 ? (
                  <div className="timeline-empty">Keine Treffer</div>
                ) : (
                  filteredSubjects.map((subject) => {
                    const isExpanded = expandedRows.has(subject.lessonId);
                    const subjectAvg = averageOf(
                      subject.grades.map((g) => g.markDisplayValue).filter((v) => v > 0)
                    );
                    const avgClass = gradeClass(subjectAvg);
                    return (
                      <article key={subject.lessonId} className="timeline-item">
                        <button
                          type="button"
                          className="timeline-row"
                          onClick={() => toggleRow(subject.lessonId)}
                          aria-expanded={isExpanded}
                          aria-label={`${subject.subjectName} ${isExpanded ? 'einklappen' : 'aufklappen'}`}
                        >
                          <div className="timeline-left">
                            <span className="timeline-subject">{subject.subjectName}</span>
                            <span className="timeline-meta">{subject.grades.length} Note{subject.grades.length === 1 ? '' : 'n'}</span>
                          </div>
                          <span className="timeline-right">
                            <span className={`timeline-avg ${avgClass}`}>{fmtNum(subjectAvg, 2)}</span>
                            <ChevronDown className="timeline-chevron" size={18} strokeWidth={2.2} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="timeline-panel">
                            <div className="grade-list">
                              {[...subject.grades]
                                .sort((a, b) => b.date - a.date)
                                .map((grade) => {
                                  const gradeCls = gradeClass(grade.markDisplayValue);
                                  return (
                                    <div key={grade.id} className="grade-row">
                                      <span className="grade-date">{fmtDateShort(grade.date)}</span>
                                      <span className="grade-name">{gradeDisplay(grade)}</span>
                                      <span className={`grade-value ${gradeCls}`}>{formatMark(grade.markDisplayValue)}</span>
                                    </div>
                                  );
                                })}
                            </div>
                            <div className="timeline-actions">
                              <button type="button" className="details-btn" onClick={() => openDetails(subject.lessonId)}>
                                Details öffnen <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </section>
            </>}
          </main>
        )}
      </div>

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

        .grades-empty {
          display: flex;
          justify-content: center;
          padding: 60px 24px;
        }

        .year-select-btn {
          width: 140px;
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

        .donut-wrap {
          display: flex;
          justify-content: center;
          margin-top: 6px;
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
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid var(--g-line);
          gap: 12px;
        }

        .timeline-head-title {
          font-size: 14.5px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--g-ink);
        }

        .sort-wrap {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .sort-select {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 145px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          color: var(--g-ink);
          background: var(--g-surface);
          border: 1px solid var(--g-line);
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          transition: border-color 0.15s, background-color 0.15s;
        }

        .sort-select:hover {
          background: color-mix(in srgb, var(--g-bg) 50%, transparent);
          border-color: var(--g-line-2);
        }

        .sort-select:focus, .sort-select.open {
          outline: none;
          border-color: var(--g-line-2);
        }
        
        .custom-select-container {
          position: relative;
        }
        
        .custom-select-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          width: 145px;
          background: var(--g-surface);
          border: 1px solid var(--g-line-2);
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          z-index: 50;
          padding: 6px;
          list-style: none;
          margin: 0;
        }
        
        .custom-select-item {
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--g-ink);
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        
        .custom-select-item:hover {
          background: var(--g-bg);
        }
        
        .custom-select-item.selected {
          background: var(--accent);
          color: #fff;
          font-weight: 600;
        }

        .expand-all {
          border: 1px solid var(--g-line);
          background: var(--g-bg);
          color: var(--g-ink);
          padding: 6px 10px;
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 600;
          border-radius: 9px;
          cursor: pointer;
          transition: border-color 0.15s;
        }

        .expand-all:hover {
          border-color: var(--g-line-2);
        }

        .timeline-list {
          display: block;
        }

        .timeline-item {
          border-bottom: 1px solid var(--g-line);
        }

        .timeline-item:nth-child(odd) {
          background-color: color-mix(in srgb, var(--g-bg) 40%, transparent);
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
          background: color-mix(in srgb, var(--g-bg) 75%, transparent);
        }

        .timeline-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .timeline-subject {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--g-ink);
          white-space: nowrap;
        }

        .timeline-meta {
          font-size: 12.5px;
          color: var(--g-muted-2);
          font-weight: 500;
          white-space: nowrap;
        }

        .timeline-right {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
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
          padding: 6px 22px 14px;
        }

        .grade-list {
          display: flex;
          flex-direction: column;
        }

        .grade-row {
          display: grid;
          grid-template-columns: 76px 1fr auto;
          align-items: center;
          gap: 16px;
          padding: 11px 4px;
          border-bottom: 1px dashed color-mix(in srgb, var(--g-line) 55%, transparent);
        }

        .grade-row:last-child {
          border-bottom: 0;
        }

        .grade-date {
          font-size: 12px;
          color: var(--g-muted);
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.01em;
        }

        .grade-name {
          color: var(--g-ink);
          font-size: 13.5px;
          font-weight: 500;
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .grade-value {
          font-size: 15px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
          min-width: 44px;
          text-align: right;
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

        .timeline-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }

        .details-btn {
          border: 1px solid var(--g-line-2);
          background: var(--g-surface);
          color: var(--g-ink);
          border-radius: 9px;
          padding: 7px 12px;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: border-color 0.15s, color 0.15s;
        }

        .details-btn:hover {
          border-color: var(--g-ink);
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

          .expand-all {
            font-size: 16px;
          }

          .timeline-row {
            min-height: 58px;
            padding: 0 14px;
          }

          .timeline-panel {
            padding: 6px 14px 12px;
          }

          .timeline-subject {
            font-size: 13px;
          }

          .timeline-avg {
            font-size: 14px;
          }

          .grade-row {
            grid-template-columns: 60px 1fr auto;
            gap: 12px;
          }
        }
      `}</style>
      </UntisGuard>
    </AuthGuard>
  );
}
