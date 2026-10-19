'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CaretDown, CaretRight } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import { Bone, Line, RowsSkeleton } from '@/components/app/Skeleton';
import PixelState from '@/components/app/PixelState';
import ErrorView from '@/components/ui/ErrorView';
import { fetchGrades, getGradesStale } from '@/lib/api';
import type { SubjectGrades } from '@/lib/types';
import { subjectTone, toneVars } from '@/lib/timetable-logic';
import { useDateLocale, useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { gradesDict } from '@/lib/i18n/dictionaries/grades';
import { shellDict } from '@/lib/i18n/dictionaries/shell';
import { monthShort } from '@/lib/i18n/dateLocale';
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
  date: number;
};

type SortMode = 'name' | 'avg-desc' | 'avg-asc' | 'recent';

const _now = new Date();
const CURRENT_SCHOOL_YEAR = _now.getMonth() >= 8 ? _now.getFullYear() : _now.getFullYear() - 1;
const AVAILABLE_YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_SCHOOL_YEAR - i);

export default function GradesPage() {
  const router = useRouter();
  const t = useT(gradesDict);
  const ts = useT(shellDict);
  const { locale } = useLocale();
  const { tag } = useDateLocale();
  const localize = useLocalizeHref();
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
    { value: 'name', label: t('sortName') },
    { value: 'avg-desc', label: t('sortBest') },
    { value: 'avg-asc', label: t('sortWorst') },
    { value: 'recent', label: t('sortRecent') },
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
    // The grades this device stored show at once; the fresh ones follow.
    const stale = getGradesStale(selectedYear);
    if (stale !== undefined) setSubjects(parseGrades(stale));
    setLoading(stale === undefined);
    setError('');
    try {
      const res = await fetchGrades(selectedYear);
      const parsed = parseGrades(res);
      setSubjects(parsed);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') {
        router.replace('/login');
      } else {
        setError(e instanceof Error ? e.message : 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [router, selectedYear]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
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

    const MONTH_LABELS = monthShort(locale);

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
      .filter((g) => g.markDisplayValue > 0)
      .sort((a, b) => b.id - a.id)
      .slice(0, 3)
      .map((g) => ({
        id: g.id,
        subject: g.subjectName,
        numeric: g.markDisplayValue,
        date: g.date,
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
  }, [subjects, selectedYear, locale]);

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
      withMeta.sort((a, b) => Number(a.avg <= 0) - Number(b.avg <= 0) || b.avg - a.avg);
    } else if (sortMode === 'avg-asc') {
      withMeta.sort((a, b) => Number(a.avg <= 0) - Number(b.avg <= 0) || a.avg - b.avg);
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
    router.push(localize(`/grades/subject/${lessonId}`));
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
          <div className="grades-dashboard" aria-hidden="true">
            <div className="page-head"><div className="flex flex-col gap-3 text-ink"><Line w={180} h={40} /><Line w={260} h={14} /></div></div>
            <div className="kpis text-ink">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="card flex flex-col gap-4"><Line w="50%" h={13} /><Line w={90} h={40} /><Bone className="h-12 w-full !rounded-[10px]" /></div>
              ))}
            </div>
            <RowsSkeleton rows={6} lead="square" trailing />
          </div>
        ) : error ? (
          <div className="grades-state">
            <ErrorView message={error} onRetry={load} />
          </div>
        ) : (
          <main className="grades-dashboard">
            <div className="page-head">
              <div>
                <h1 className="page-title">{ts('grades')}</h1>
                <div className="page-sub">
                  {t('schoolYear', { year: dashboard.schoolYearLabel })} · {subjects.length > 0
                    ? t('summary', { date: dashboard.latestGradeDate ? fmtUntisDateLong(dashboard.latestGradeDate, tag) : '-', subjects: dashboard.subjectCount, grades: dashboard.allCount })
                    : t('noGradesYear')}
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
                  <CaretDown
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
                <PixelState sprite="empty" title={t('emptyTitle')} detail={t('emptySubtitle')} />
              </div>
            ) : <>

            <section className="kpis">
              <div className="card">
                <div className="card-hd">
                  <div>
                    <div className="card-title">{t('avgTitle')}</div>
                    <div className="card-sub">{t('avgSub')}</div>
                  </div>
                  <span className={`pill ${dashboard.delta >= 0 ? 'up' : 'down'}`}>
                    {dashboard.delta >= 0 ? '↗' : '↘'} {fmtNum(Math.abs(dashboard.delta), 2)}
                  </span>
                </div>
                <div className="kpi-value">{fmtNum(dashboard.overallAvg, 2)}</div>
                <div className="kpi-foot">
                  <span>
                    {t('prevMonth')} <span className="mono">{fmtNum(dashboard.overallAvg - dashboard.delta, 2)}</span>
                  </span>
                  <span>
                    {t('bestGrade')} <span className="mono">{dashboard.bestGrade ? formatMark(dashboard.bestGrade) : '-'}</span>
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
                    <div className="card-title">{t('ratioTitle')}</div>
                    <div className="card-sub">{t('ratioSub')}</div>
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
                  <span><span className="mono good">{dashboard.pos}</span> {t('above6')}</span>
                  <span><span className="mono bad">{dashboard.neg}</span> {t('below6')}</span>
                </div>
              </div>

              <div className="card">
                <div className="card-hd">
                  <div>
                    <div className="card-title">{t('distTitle')}</div>
                    <div className="card-sub">{t('distSub')}</div>
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
                    {t('mode')} <span className="mono">{dashboard.mode}</span>
                  </span>
                  <span>
                    {t('median')} <span className="mono">{fmtNum(dashboard.median, 2)}</span>
                  </span>
                </div>
              </div>

              <div className="card">
                <div className="card-hd">
                  <div>
                    <div className="card-title">{t('recentTitle')}</div>
                    <div className="card-sub">{t('recentSub')}</div>
                  </div>
                  <span className="mini-link"></span>
                </div>
                <div className="recent">
                  {dashboard.recent.map((r) => {
                    const cls = gradeClass(r.numeric);
                    return (
                      <div key={r.id} className="recent-row">
                        <div className="recent-info">
                          <span className="subj">{r.subject}</span>
                          <span className="recent-date">{fmtDateShort(r.date)}</span>
                        </div>
                        <span className={`grade ${cls}`}>{formatMark(r.numeric)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="timeline-wrap">
              <div className="timeline-head">
                <div className="timeline-head-title">{t('subjects')}</div>
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
                      <CaretDown size={14} className="sort-arrow" style={{ transform: isSortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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
                    {allExpanded ? t('collapseAll') : t('expandAll')}
                  </button>
                </div>
              </div>

              <div className="timeline-list">
                {filteredSubjects.length === 0 ? (
                  <div className="timeline-empty">{t('noMatches')}</div>
                ) : (
                  filteredSubjects.map((subject) => {
                    const isExpanded = expandedRows.has(subject.lessonId);
                    const subjectAvg = averageOf(
                      subject.grades.map((g) => g.markDisplayValue).filter((v) => v > 0)
                    );
                    const avgClass = subjectAvg > 0 ? gradeClass(subjectAvg) : '';
                    return (
                      <article key={subject.lessonId} className="timeline-item">
                        <button
                          type="button"
                          className="timeline-row"
                          onClick={() => toggleRow(subject.lessonId)}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? t('collapse', { name: subject.subjectName }) : t('expand', { name: subject.subjectName })}
                        >
                          <div className="timeline-left">
                            <span className="timeline-subject" style={toneVars(subjectTone(subject.subjectName)) as React.CSSProperties}>{subject.subjectName}</span>
                            <span className="timeline-meta">{subject.grades.length === 1 ? t('gradeOne', { n: 1 }) : t('gradeMany', { n: subject.grades.length })}</span>
                          </div>
                          <span className="timeline-right">
                            <span className={`timeline-avg ${avgClass}`}>{subjectAvg > 0 ? fmtNum(subjectAvg, 2) : '-'}</span>
                            <CaretDown className="timeline-chevron" size={18} weight="bold" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="timeline-panel">
                            <div className="grade-list">
                              {subject.grades.length === 0 && (
                                <div className="grade-empty">{t('noSingleGrades')}</div>
                              )}
                              {[...subject.grades]
                                .sort((a, b) => b.date - a.date)
                                .map((grade) => {
                                  const gradeCls = gradeClass(grade.markDisplayValue);
                                  return (
                                    <div key={grade.id} className="grade-row">
                                      <span className="grade-date">{fmtDateShort(grade.date)}</span>
                                      <span className="grade-name">{gradeDisplay(grade, t('exam'))}</span>
                                      <span className={`grade-value ${gradeCls}`}>{formatMark(grade.markDisplayValue)}</span>
                                    </div>
                                  );
                                })}
                            </div>
                            <div className="timeline-actions">
                              <button type="button" className="details-btn" onClick={() => openDetails(subject.lessonId)}>
                                {t('openDetails')} <CaretRight size={14} />
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
        /* Grades in the app's design language: the page column of every app
           page, cards told apart by their fill (no borders, no dashed rules),
           the category tones for pass and fail, one typeface. */
        .grades-dashboard-wrap {
          --g-good: var(--success-ink);
          --g-good-soft: var(--sage);
          --g-bad: var(--danger-ink);
          --g-bad-soft: var(--blush);
          --g-excellent: var(--success-ink);
          --g-negative: var(--warning-ink);
          height: 100%;
          overflow: auto;
          color: var(--ink);
        }

        .grades-state {
          padding: 24px 0;
        }

        .grades-empty {
          padding: 24px 0;
        }

        .grades-dashboard {
          max-width: 1440px;
          margin: 0 auto;
          padding: 16px 20px 80px;
        }

        .mono {
          font-variant-numeric: tabular-nums;
        }

        .page-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          padding-bottom: 28px;
        }

        .page-title {
          margin: 0;
          font-size: 34px;
          font-weight: 800;
          line-height: 1.04;
          letter-spacing: -0.05em;
        }

        .page-sub {
          margin-top: 8px;
          color: var(--ink-2);
          font-size: 15px;
          line-height: 1.5;
        }

        .year-select-btn {
          min-width: 132px;
        }

        .kpis {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin-bottom: 44px;
        }

        .card {
          position: relative;
          padding: 22px;
          border-radius: 26px;
          background: var(--surface);
        }
        @supports (corner-shape: squircle) {
          .card { corner-shape: squircle; }
        }

        .card-hd {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .card-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.015em;
          color: var(--ink);
        }

        .card-sub {
          margin-top: 2px;
          font-size: 13px;
          color: var(--ink-2);
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--inset);
          color: var(--ink-2);
          font-size: 12.5px;
          font-weight: 700;
          white-space: nowrap;
        }
        .pill.up { background: var(--g-good-soft); color: var(--g-good); }
        .pill.down { background: var(--g-bad-soft); color: var(--g-bad); }

        .kpi-value {
          font-size: 46px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.05em;
          font-variant-numeric: tabular-nums;
        }

        .kpi-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 16px;
          font-size: 13px;
          color: var(--ink-2);
        }

        .good { color: var(--g-good); font-weight: 700; }
        .bad { color: var(--g-bad); font-weight: 700; }

        .spark-wrap { position: relative; margin-top: 10px; }
        .spark {
          display: block;
          width: 100%;
          height: 64px;
          color: var(--accent);
          cursor: crosshair;
        }
        .spark-tooltip {
          position: absolute;
          top: 0;
          right: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 10px;
          border-radius: 10px;
          background: var(--ink);
          color: var(--canvas);
          font-size: 12px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          pointer-events: none;
        }
        :global(.dark) .spark-tooltip { background: #2e2e34; color: var(--ink); }
        .spark-tooltip span { opacity: 0.7; font-weight: 600; }

        .ratio { display: flex; align-items: baseline; gap: 10px; }
        .ratio .pos,
        .ratio .neg {
          font-size: 46px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.05em;
          font-variant-numeric: tabular-nums;
        }
        .ratio .pos { color: var(--g-good); }
        .ratio .neg { color: var(--g-bad); font-size: 34px; }
        .ratio .sep { color: var(--ink-3); font-size: 26px; font-weight: 400; }

        .ratio-bar {
          display: flex;
          gap: 3px;
          height: 8px;
          margin-top: 18px;
          overflow: hidden;
          border-radius: 999px;
        }
        .ratio-bar .p { background: var(--success); border-radius: 999px; transition: width 0.7s var(--ease-out); }
        .ratio-bar .n { background: var(--danger); border-radius: 999px; transition: width 0.7s var(--ease-out); }

        .donut-wrap { display: flex; justify-content: center; margin-top: 4px; }

        .mini-link { font-size: 13px; color: var(--ink-2); }

        .recent { display: flex; flex-direction: column; gap: 2px; }
        .recent-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 9px 0;
        }
        .recent-info { display: flex; min-width: 0; flex-direction: column; gap: 1px; }
        .recent-row .subj { overflow: hidden; color: var(--ink); font-size: 14.5px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
        .recent-date { color: var(--ink-3); font-size: 12.5px; font-variant-numeric: tabular-nums; }
        .recent-row .grade {
          display: grid;
          place-items: center;
          min-width: 44px;
          height: 34px;
          padding: 0 8px;
          border-radius: 11px;
          font-size: 14.5px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          background: var(--inset);
        }
        .recent-row .grade.v-excellent,
        .recent-row .grade.v-positive { background: var(--sage); color: var(--sage-ink); }
        .recent-row .grade.v-negative { background: var(--butter); color: var(--butter-ink); }
        .recent-row .grade.v-critical { background: var(--blush); color: var(--blush-ink); }

        .timeline-wrap { display: block; }

        .timeline-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .timeline-head-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.035em;
          color: var(--ink);
        }

        .sort-wrap { display: inline-flex; align-items: center; gap: 8px; }

        .sort-select,
        .expand-all,
        .details-btn {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          height: 40px;
          padding: 0 14px;
          border: 0;
          border-radius: 12px;
          background: var(--surface);
          color: var(--ink);
          font: inherit;
          font-size: 14px;
          font-weight: 650;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .sort-select:hover,
        .expand-all:hover,
        .details-btn:hover { background: color-mix(in srgb, var(--surface) 90%, var(--ink)); }
        .sort-select { min-width: 150px; }
        .details-btn { background: var(--surface); }

        .custom-select-container { position: relative; }
        .custom-select-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          z-index: 50;
          min-width: 100%;
          margin: 0;
          padding: 6px;
          list-style: none;
          border-radius: 16px;
          background: var(--surface);
          box-shadow: var(--shadow-float);
        }
        .custom-select-item {
          padding: 9px 12px;
          border-radius: 10px;
          color: var(--ink);
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .custom-select-item:hover { background: var(--inset); }
        .custom-select-item.selected { background: var(--periwinkle); color: var(--periwinkle-ink); }

        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
          padding: 8px;
          border-radius: 26px;
          background: var(--surface);
        }

        .timeline-empty { padding: 20px 12px; color: var(--ink-2); font-size: 15px; }

        .timeline-item { position: relative; border-radius: 18px; }
        /* Thin rules between the subjects, inset from the card edge and hidden
           next to a hovered or opened row. */
        .timeline-item + .timeline-item::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 14px;
          right: 14px;
          height: 1px;
          background: var(--line);
          transition: opacity 0.2s ease;
        }
        .timeline-item:hover::before,
        .timeline-item:hover + .timeline-item::before { opacity: 0; }

        .timeline-row {
          display: flex;
          width: 100%;
          min-height: 64px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 12px;
          border: 0;
          border-radius: 18px;
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .timeline-row:hover { background: color-mix(in srgb, var(--surface) 92%, var(--ink)); }

        .timeline-left { display: flex; min-width: 0; align-items: center; gap: 12px; }

        .timeline-subject {
          min-width: 0;
          overflow: hidden;
          padding: 5px 10px;
          border-radius: 10px;
          background: var(--tone-fill-l);
          color: var(--tone-ink-l);
          font-size: 14.5px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.dark) .timeline-subject { background: var(--tone-fill-d); color: var(--tone-ink-d); }

        .timeline-meta { color: var(--ink-3); font-size: 13px; font-weight: 600; white-space: nowrap; }

        .timeline-right { display: inline-flex; flex-shrink: 0; align-items: center; gap: 12px; }

        .timeline-avg {
          display: grid;
          place-items: center;
          min-width: 58px;
          height: 36px;
          padding: 0 10px;
          border-radius: 12px;
          background: var(--inset);
          color: var(--ink-2);
          font-size: 15.5px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
        .timeline-avg.v-excellent,
        .timeline-avg.v-positive { background: var(--sage); color: var(--sage-ink); }
        .timeline-avg.v-negative { background: var(--butter); color: var(--butter-ink); }
        .timeline-avg.v-critical { background: var(--blush); color: var(--blush-ink); }

        .timeline-chevron { color: var(--ink-3); }

        .timeline-panel {
          margin: 2px 4px 8px;
          padding: 8px 14px 14px;
          border-radius: 18px;
          background: var(--inset);
          animation: rise 0.3s var(--ease-out) both;
        }

        .grade-list { display: flex; flex-direction: column; }
        .grade-row {
          display: grid;
          grid-template-columns: 76px 1fr auto;
          align-items: center;
          gap: 16px;
          padding: 9px 0;
        }
        .grade-date { color: var(--ink-2); font-size: 13px; font-variant-numeric: tabular-nums; }
        .grade-name {
          min-width: 0;
          overflow: hidden;
          color: var(--ink);
          font-size: 14.5px;
          font-weight: 550;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .grade-empty { padding: 8px 0; color: var(--ink-3); font-size: 14px; }
        .grade-value { min-width: 48px; text-align: right; font-size: 15.5px; font-weight: 800; font-variant-numeric: tabular-nums; }
        .grade-value.v-excellent,
        .grade-value.v-positive { color: var(--g-good); }
        .grade-value.v-negative { color: var(--g-negative); }
        .grade-value.v-critical { color: var(--g-bad); }

        .timeline-actions { display: flex; justify-content: flex-end; margin-top: 10px; }

        @media (min-width: 640px) {
          .grades-dashboard { padding: 16px 32px 96px; }
        }
        @media (min-width: 768px) {
          .grades-dashboard { padding-top: 32px; }
          .page-title { font-size: 46px; }
          .page-sub { font-size: 17px; }
        }
        @media (min-width: 1024px) {
          .grades-dashboard { padding-left: 48px; padding-right: 48px; }
        }
        @media (max-width: 1200px) {
          .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 767px) {
          .page-head { flex-direction: column; align-items: flex-start; }
          .timeline-head { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 640px) {
          .kpis { grid-template-columns: 1fr; }
          .timeline-row { min-height: 58px; padding: 0 10px; }
          .timeline-meta { display: none; }
          .grade-row { grid-template-columns: 60px 1fr auto; gap: 12px; }
        }
      `}</style>
      </UntisGuard>
    </AuthGuard>
  );
}
