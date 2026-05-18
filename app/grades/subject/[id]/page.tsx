'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  Plus,
  Trash2,
  RotateCcw,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import { fetchGrades } from '@/lib/api';
import type { SubjectGrades } from '@/lib/types';
import {
  parseGrades,
  fmtNum,
  fmtDateShort,
  fmtUntisDateLong,
  untisDateToJs,
  gradeDisplay,
  formatMark,
  round2,
  averageOf,
  parseGradeInput,
  gradeClass,
} from '@/lib/grades';

type DraftState = {
  removedTeacherGradeIds: number[];
  customGrades: number[];
};

const STORAGE_KEY = 'pockyh_grade_drafts_v1';

function loadDrafts(): Record<number, DraftState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveDrafts(d: Record<number, DraftState>) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // ignore quota errors
  }
}

function relativeDay(date: number): string {
  const js = untisDateToJs(date);
  if (!js) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(js);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diff === 0) return 'heute';
  if (diff === 1) return 'gestern';
  if (diff < 7) return `vor ${diff} Tagen`;
  if (diff < 30) return `vor ${Math.round(diff / 7)} Wochen`;
  if (diff < 365) return `vor ${Math.round(diff / 30)} Monaten`;
  return `vor ${Math.round(diff / 365)} Jahren`;
}

export default function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = use(params);
  const lessonId = parseInt(idParam, 10);
  const router = useRouter();

  const [subjects, setSubjects] = useState<SubjectGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [drafts, setDrafts] = useState<Record<number, DraftState>>({});
  const [newGradeInput, setNewGradeInput] = useState('');
  const [hoverTrendIndex, setHoverTrendIndex] = useState<number | null>(null);
  const [targetInput, setTargetInput] = useState('');
  const draftsHydrated = useRef(false);

  useEffect(() => {
    setDrafts(loadDrafts());
    draftsHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!draftsHydrated.current) return;
    saveDrafts(drafts);
  }, [drafts]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchGrades();
      setSubjects(parseGrades(res));
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

  const subject = useMemo(
    () => subjects.find((s) => s.lessonId === lessonId) ?? null,
    [subjects, lessonId]
  );

  const draft = drafts[lessonId] ?? { removedTeacherGradeIds: [], customGrades: [] };

  const teacherRows = useMemo(() => {
    if (!subject) return [] as Array<{ id: number; label: string; date: number; value: number; removed: boolean }>;
    const removed = new Set(draft.removedTeacherGradeIds);
    return [...subject.grades]
      .sort((a, b) => b.date - a.date)
      .map((g) => ({
        id: g.id,
        label: gradeDisplay(g),
        date: g.date,
        value: round2(g.markDisplayValue),
        removed: removed.has(g.id),
      }));
  }, [subject, draft]);

  const liveValues = useMemo(() => {
    const teacher = teacherRows.filter((r) => !r.removed).map((r) => r.value);
    return [...teacher, ...draft.customGrades];
  }, [teacherRows, draft]);

  const liveAvg = averageOf(liveValues);
  const positive = liveValues.filter((v) => v >= 6).length;
  const negative = liveValues.filter((v) => v < 6).length;
  const passRate = liveValues.length ? (positive / liveValues.length) * 100 : 0;

  const teacherAvg = useMemo(() => {
    if (!subject) return 0;
    const vals = subject.grades.map((g) => g.markDisplayValue).filter((v) => v > 0);
    return averageOf(vals);
  }, [subject]);

  // Trend in chronological order for the chart
  const chronological = useMemo(() => {
    if (!subject) return [] as Array<{ value: number; date: number; label: string; isCustom: boolean }>;
    const removed = new Set(draft.removedTeacherGradeIds);
    const teacher = subject.grades
      .filter((g) => !removed.has(g.id))
      .map((g) => ({
        value: round2(g.markDisplayValue),
        date: g.date,
        label: gradeDisplay(g),
        isCustom: false,
      }));
    const customs = draft.customGrades.map((v) => ({
      value: v,
      date: 99999999,
      label: 'Eigene',
      isCustom: true,
    }));
    return [...teacher.sort((a, b) => a.date - b.date), ...customs];
  }, [subject, draft]);

  const trendPoints = useMemo(() => {
    if (!chronological.length) return [] as Array<{ x: number; y: number; value: number; date: number; label: string; isCustom: boolean; index: number }>;
    return chronological.map((g, index) => {
      const x = 32 + (chronological.length === 1 ? 298 : (index / Math.max(1, chronological.length - 1)) * 596);
      const y = Math.max(20, Math.min(220, 220 - ((g.value - 4) / 6) * 200));
      return { x, y, value: g.value, date: g.date, label: g.label, isCustom: g.isCustom, index };
    });
  }, [chronological]);

  const trendAnimKey = useMemo(
    () => chronological.map((g) => g.value.toFixed(2) + (g.isCustom ? 'c' : 't')).join('|'),
    [chronological]
  );

  const trendDirection = useMemo(() => {
    if (chronological.length < 2) return 'flat' as const;
    const first = chronological[0].value;
    const last = chronological[chronological.length - 1].value;
    const diff = last - first;
    if (Math.abs(diff) < 0.3) return 'flat' as const;
    return diff > 0 ? 'up' : 'down';
  }, [chronological]);

  const hoverPoint = hoverTrendIndex !== null ? trendPoints[hoverTrendIndex] : null;
  const hoverFlip = hoverPoint ? hoverPoint.x > 480 : false;
  const hoverPos = hoverPoint
    ? { left: `${(hoverPoint.x / 660) * 100}%`, top: `${(hoverPoint.y / 240) * 100}%` }
    : null;
  const hoverDateText = hoverPoint
    ? (hoverPoint.isCustom ? 'Eigene Note' : fmtDateShort(hoverPoint.date))
    : '';

  const GRADE_STEP = 0.5;

  const roundToGradeStep = (value: number, mode: 'up' | 'down') => {
    const factor = 1 / GRADE_STEP;
    const scaled = value * factor;
    const rounded = mode === 'up'
      ? Math.ceil(scaled - 1e-9)
      : Math.floor(scaled + 1e-9);
    return round2(Math.min(10, Math.max(4, rounded / factor)));
  };

  const targetResult = useMemo(() => {
    const target = parseGradeInput(targetInput);
    if (target === null || liveValues.length === 0) return null;
    const sum = liveValues.reduce((a, b) => a + b, 0);
    const n = liveValues.length;
    const currentAvg = sum / n;

    if (Math.abs(currentAvg - target) < 1e-6) {
      return { target, status: 'reached' as const, count: 0, needed: 0 };
    }

    if (currentAvg < target) {
      // Schnitt anheben: kleinste k Noten ≤ 10 finden
      for (let k = 1; k <= 50; k++) {
        const perGrade = (target * (n + k) - sum) / k;
        if (perGrade <= 10) {
          const neededRaw = Math.max(4, perGrade);
          return {
            target,
            status: 'reachable' as const,
            count: k,
            needed: roundToGradeStep(neededRaw, 'up'),
          };
        }
      }
      return { target, status: 'impossible' as const, count: 0, needed: 0 };
    } else {
      // Schnitt senken: perGrade(k) nähert sich target von unten an
      // Minimum-Note ist 4, also k_min = ceil((sum - target*n) / (target - 4))
      if (target <= 4 + 1e-6) {
        return { target, status: 'impossible' as const, count: 0, needed: 0 };
      }
      const kMin = Math.ceil((sum - target * n) / (target - 4) - 1e-9);
      if (kMin <= 0 || kMin > 50) {
        return { target, status: 'impossible' as const, count: 0, needed: 0 };
      }
      const perGrade = (target * (n + kMin) - sum) / kMin;
      const neededRaw = Math.max(4, perGrade);
      return {
        target,
        status: 'reachable' as const,
        count: kMin,
        needed: roundToGradeStep(neededRaw, 'down'),
      };
    }
  }, [targetInput, liveValues]);

  const handleTrendMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!trendPoints.length) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgX = Math.max(32, Math.min(628, pt.matrixTransform(ctm.inverse()).x));
    let nearest = 0;
    let minDist = Number.POSITIVE_INFINITY;
    trendPoints.forEach((p, idx) => {
      const d = Math.abs(p.x - svgX);
      if (d < minDist) { minDist = d; nearest = idx; }
    });
    setHoverTrendIndex(nearest);
  };

  const updateDraft = (updater: (prev: DraftState) => DraftState) => {
    setDrafts((prev) => {
      const current = prev[lessonId] ?? { removedTeacherGradeIds: [], customGrades: [] };
      return { ...prev, [lessonId]: updater(current) };
    });
  };

  const removeTeacherGrade = (gradeId: number) => {
    updateDraft((d) => {
      if (d.removedTeacherGradeIds.includes(gradeId)) return d;
      return { ...d, removedTeacherGradeIds: [...d.removedTeacherGradeIds, gradeId] };
    });
  };

  const restoreTeacherGrade = (gradeId: number) => {
    updateDraft((d) => ({
      ...d,
      removedTeacherGradeIds: d.removedTeacherGradeIds.filter((x) => x !== gradeId),
    }));
  };

  const removeCustomGrade = (index: number) => {
    updateDraft((d) => {
      const next = [...d.customGrades];
      next.splice(index, 1);
      return { ...d, customGrades: next };
    });
  };

  const addCustomGrade = () => {
    const parsed = parseGradeInput(newGradeInput);
    if (parsed === null) return;
    updateDraft((d) => ({ ...d, customGrades: [...d.customGrades, parsed] }));
    setNewGradeInput('');
  };

  const resetDraft = () => {
    updateDraft(() => ({ removedTeacherGradeIds: [], customGrades: [] }));
    setNewGradeInput('');
    setTargetInput('');
  };

  const hasDraft = draft.removedTeacherGradeIds.length > 0 || draft.customGrades.length > 0;
  const trendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;
  const TrendIconElem = trendIcon;

  if (loading) {
    return (
      <AuthGuard>
        <div className="subject-state">
          <Spinner size={28} />
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="subject-state">
          <ErrorView message={error} onRetry={load} />
        </div>
      </AuthGuard>
    );
  }

  if (!subject) {
    return (
      <AuthGuard>
        <div className="subject-state">
          <ErrorView message="Fach nicht gefunden" onRetry={() => router.push('/grades')} />
        </div>
      </AuthGuard>
    );
  }

  const livePassPctRound = Math.round(passRate);
  const teacherDelta = liveAvg && teacherAvg ? liveAvg - teacherAvg : 0;

  return (
    <AuthGuard>
      <div className="subject-wrap">
        <div className="subject-page">
          <header className="page-head">
            <div className="head-left">
              <button
                type="button"
                onClick={() => router.push('/grades')}
                className="back-btn"
                aria-label="Zurück"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="head-text">
                <p className="head-eyebrow">Fach</p>
                <h1 className="head-title">{subject.subjectName}</h1>
                {subject.teacherName && <p className="head-sub">{subject.teacherName}</p>}
              </div>
            </div>
          </header>

          <section className="kpis">
            <div className="card kpi-main">
              <div className="card-hd">
                <div>
                  <div className="card-title">Durchschnitt</div>
                  <div className="card-sub">{liveValues.length} Note{liveValues.length === 1 ? '' : 'n'}{hasDraft ? ' · Simulation' : ''}</div>
                </div>
                {hasDraft && Math.abs(teacherDelta) > 0.005 && (
                  <span className={`pill ${teacherDelta >= 0 ? 'up' : 'down'}`}>
                    {teacherDelta >= 0 ? '↗' : '↘'} {fmtNum(Math.abs(teacherDelta), 2)}
                  </span>
                )}
              </div>
              <div className={`kpi-value ${gradeClass(liveAvg)}`}>{liveAvg ? fmtNum(liveAvg, 2) : '—'}</div>
              <div className="kpi-foot">
                {hasDraft ? (
                  <span>Lehrer-Schnitt <span className="mono">{fmtNum(teacherAvg, 2)}</span></span>
                ) : (
                  <span>{liveValues.length > 0 ? `Beste ${formatMark(Math.max(...liveValues))}` : '—'}</span>
                )}
                <span className="trend-mini">
                  <TrendIconElem size={14} />
                  {trendDirection === 'up' ? 'steigend' : trendDirection === 'down' ? 'fallend' : 'stabil'}
                </span>
              </div>
            </div>

            <div className="card">
              <div className="card-hd">
                <div>
                  <div className="card-title">Notenverhältnis</div>
                  <div className="card-sub">Genügend · Ungenügend</div>
                </div>
                <span className="pill">{livePassPctRound} %</span>
              </div>
              <div className="ratio">
                <span className="pos">{positive}</span>
                <span className="sep">/</span>
                <span className="neg">{negative}</span>
              </div>
              <div className="ratio-bar" aria-hidden="true">
                <div className="p" style={{ width: `${passRate}%` }} />
                <div className="n" style={{ width: `${100 - passRate}%` }} />
              </div>
            </div>

            <div className="card target-card">
              <div className="card-hd">
                <div>
                  <div className="card-title">Was brauche ich?</div>
                  <div className="card-sub">Zielnote-Rechner</div>
                </div>
                <Target size={16} className="card-icon" />
              </div>
              <div className="target-input-row">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ziel"
                  value={targetInput}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    if (/^\d{0,2}([.,]\d{0,2})?$/.test(v)) setTargetInput(v);
                  }}
                  className="target-input"
                  aria-label="Zielnote"
                />
                <span className="target-arrow">→</span>
                {(() => {
                  if (!targetResult) {
                    return <span className="target-result muted">—</span>;
                  }
                  if (targetResult.status === 'reached') {
                    return <span className="target-result v-positive">erreicht</span>;
                  }
                  if (targetResult.status === 'impossible') {
                    return <span className="target-result v-critical">unmöglich</span>;
                  }
                  if (targetResult.count === 1) {
                    return (
                      <span className={`target-result ${gradeClass(targetResult.needed)}`}>
                        {fmtNum(targetResult.needed, 2)}
                      </span>
                    );
                  }
                  return (
                    <span className={`target-result ${gradeClass(targetResult.needed)}`}>
                      <span className="target-count">{targetResult.count}×</span>
                      {fmtNum(targetResult.needed, 2)}
                    </span>
                  );
                })()}
              </div>
              <p className="target-hint">
                {(() => {
                  if (!targetResult) return 'Trage einen Zielschnitt ein';
                  if (targetResult.status === 'reached') return 'Ziel ist mit dem aktuellen Schnitt schon erreicht';
                  if (targetResult.status === 'impossible') return 'Ziel ist mit weiteren Noten nicht mehr erreichbar';
                  if (targetResult.count === 1) return 'Nächste Note für dein Ziel';
                  return `${targetResult.count}x ${fmtNum(targetResult.needed, 2)}, um den Schnitt zu erreichen`;
                })()}
              </p>
            </div>
          </section>

          <section className="trend-section">
            <div className="section-hd">
              <div>
                <h2>Notentrend</h2>
                <p>Verlauf vom Schuljahresbeginn bis heute</p>
              </div>
              {hasDraft && (
                <button type="button" className="reset-btn" onClick={resetDraft}>
                  <RotateCcw size={13} /> Zurücksetzen
                </button>
              )}
            </div>
            <div className="trend-card">
              {chronological.length === 0 ? (
                <div className="trend-empty">Noch keine Noten</div>
              ) : (
                <div className="trend-plot">
                  <svg
                    viewBox="0 0 660 240"
                    className="trend-svg"
                    onMouseMove={handleTrendMouseMove}
                    onMouseLeave={() => setHoverTrendIndex(null)}
                  >
                    {[10, 9, 8, 7, 6, 5, 4].map((grade) => {
                      const y = 220 - ((grade - 4) / 6) * 200;
                      return (
                        <g key={`g-${grade}`}>
                          <line x1="0" y1={y} x2="660" y2={y} className="trend-grid" />
                          <text x="8" y={y - 4} className="trend-axis-label">{grade}</text>
                        </g>
                      );
                    })}
                    {(() => {
                      const y = 220 - ((6 - 4) / 6) * 200;
                      return <line x1="0" y1={y} x2="660" y2={y} className="trend-baseline" />;
                    })()}

                    {trendPoints.length > 1 && (() => {
                      const lastRealIdx = chronological.reduce((last, g, i) => (!g.isCustom ? i : last), -1);
                      const hasCustomSeg = draft.customGrades.length > 0 && lastRealIdx >= 0;
                      const realPts = hasCustomSeg ? trendPoints.slice(0, lastRealIdx + 1) : trendPoints;
                      const dashedPts = hasCustomSeg
                        ? [trendPoints[lastRealIdx], ...trendPoints.slice(lastRealIdx + 1)]
                        : [];
                      return (
                        <>
                          {realPts.length > 1 && (
                            <polyline
                              key={`line-real-${trendAnimKey}`}
                              className="trend-line"
                              fill="none"
                              points={realPts.map((p) => `${p.x},${p.y}`).join(' ')}
                            />
                          )}
                          {dashedPts.length > 1 && (
                            <polyline
                              key={`line-custom-${trendAnimKey}`}
                              className="trend-line-custom"
                              fill="none"
                              points={dashedPts.map((p) => `${p.x},${p.y}`).join(' ')}
                            />
                          )}
                        </>
                      );
                    })()}

                    {trendPoints.filter(p => !p.isCustom).length > 1 && (() => {
                      const realPts = trendPoints.filter(p => !p.isCustom);
                      const n = realPts.length;
                      const sumX  = realPts.reduce((s, p) => s + p.x, 0);
                      const sumY  = realPts.reduce((s, p) => s + p.y, 0);
                      const sumXY = realPts.reduce((s, p) => s + p.x * p.y, 0);
                      const sumX2 = realPts.reduce((s, p) => s + p.x * p.x, 0);
                      const denom = n * sumX2 - sumX * sumX;
                      if (Math.abs(denom) < 1e-9) return null;
                      const slope = (n * sumXY - sumX * sumY) / denom;
                      const intercept = (sumY - slope * sumX) / n;
                      const rx1 = realPts[0].x;
                      const rx2 = realPts[realPts.length - 1].x;
                      const ry1 = Math.max(20, Math.min(220, slope * rx1 + intercept));
                      const ry2 = Math.max(20, Math.min(220, slope * rx2 + intercept));
                      return <line key={`fit-${trendAnimKey}`} x1={rx1.toFixed(1)} y1={ry1.toFixed(1)} x2={rx2.toFixed(1)} y2={ry2.toFixed(1)} className="trend-fit" />;
                    })()}

                    {trendPoints.map((p) => (
                      <circle
                        key={`pt-${p.index}-${trendAnimKey}`}
                        cx={p.x}
                        cy={p.y}
                        r={hoverTrendIndex === p.index ? 5 : p.isCustom ? 4 : 3.4}
                        className={`trend-point ${p.isCustom ? 'custom' : ''}`}
                        onMouseEnter={() => setHoverTrendIndex(p.index)}
                      />
                    ))}

                    {hoverPoint && (
                      <g className="trend-hover">
                        <line x1={hoverPoint.x} y1="20" x2={hoverPoint.x} y2="220" className="trend-hover-line" />
                        <circle cx={hoverPoint.x} cy={hoverPoint.y} r="5.4" className="trend-point-active" />
                      </g>
                    )}
                  </svg>

                  {hoverPoint && hoverPos && (
                    <div
                      className={`trend-tooltip${hoverFlip ? ' flip' : ''}`}
                      style={{ left: hoverPos.left, top: hoverPos.top }}
                    >
                      <div className="trend-tooltip-inner">
                        <div className="trend-tooltip-title">{hoverDateText}</div>
                        <div className="trend-tooltip-text">
                          {hoverPoint.label}: <span className="trend-tooltip-grade">{fmtNum(hoverPoint.value, 2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="grid-section">
            <div className="card list-card">
              <div className="section-hd inline">
                <div>
                  <h2>Noten-Liste</h2>
                  <p>{teacherRows.filter((r) => !r.removed).length} aktiv · {teacherRows.filter((r) => r.removed).length} ausgeschlossen</p>
                </div>
              </div>
              <div className="grade-list">
                {teacherRows.length === 0 ? (
                  <div className="empty-list">Keine Noten erfasst</div>
                ) : (
                  teacherRows.map((row) => (
                    <div key={row.id} className={`grade-item ${row.removed ? 'is-removed' : ''}`}>
                      <div className="grade-meta">
                        <span className="grade-label">{row.label}</span>
                        <span className="grade-when">
                          {fmtDateShort(row.date)} · {relativeDay(row.date)}
                        </span>
                      </div>
                      <div className="grade-actions">
                        <span className={`grade-mark ${gradeClass(row.value)}`}>{formatMark(row.value)}</span>
                        {row.removed ? (
                          <button
                            type="button"
                            className="grade-restore"
                            onClick={() => restoreTeacherGrade(row.id)}
                            aria-label="Note wiederherstellen"
                          >
                            <RotateCcw size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="grade-remove"
                            onClick={() => removeTeacherGrade(row.id)}
                            aria-label="Note ausschließen"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card calc-card">
              <div className="section-hd inline">
                <div>
                  <h2>Mittelwert-Rechner</h2>
                  <p>Eigene Noten zum Spielen</p>
                </div>
              </div>

              <div className="add-row">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="z.B. 7,5"
                  value={newGradeInput}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    if (/^\d{0,2}([.,]\d{0,2})?$/.test(v)) setNewGradeInput(v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addCustomGrade();
                  }}
                />
                <button type="button" onClick={addCustomGrade} aria-label="Note hinzufügen">
                  <Plus size={15} />
                </button>
              </div>

              <div className="custom-list">
                {draft.customGrades.length === 0 ? (
                  <div className="empty-list small">Noch keine eigenen Noten</div>
                ) : (
                  draft.customGrades.map((value, idx) => (
                    <div key={`custom-${idx}`} className={`custom-item ${gradeClass(value)}`}>
                      <span className={`grade-mark ${gradeClass(value)}`}>{formatMark(value)}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomGrade(idx)}
                        aria-label="Eigene Note entfernen"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="quick-add">
                <span className="quick-label">Schnell-Test:</span>
                {[4, 5, 6, 7, 8, 9, 10].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`quick-btn ${gradeClass(v)}`}
                    onClick={() => updateDraft((d) => ({ ...d, customGrades: [...d.customGrades, v] }))}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="meta-foot">
            <span>
              Letzte Note <strong>{teacherRows[0] ? fmtUntisDateLong(teacherRows[0].date) : '—'}</strong>
            </span>
            <Link href="/grades" className="all-link">Alle Fächer →</Link>
          </section>
        </div>
      </div>

      <style jsx>{`
        .subject-wrap {
          --g-bg: var(--app-bg);
          --g-surface: var(--app-surface);
          --g-line: var(--app-border);
          --g-line-2: color-mix(in srgb, var(--app-border) 70%, var(--app-text-tertiary));
          --g-ink: var(--app-text-primary);
          --g-muted: var(--app-text-secondary);
          --g-muted-2: var(--app-text-tertiary);
          --g-good: var(--tint);
          --g-good-soft: color-mix(in srgb, var(--tint) 14%, transparent);
          --g-bad: var(--danger);
          --g-bad-soft: color-mix(in srgb, var(--danger) 14%, transparent);
          --g-excellent: color-mix(in srgb, var(--tint) 82%, #ffffff);
          --g-negative: var(--orange);

          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          background: var(--g-bg);
          color: var(--g-ink);
          font-family: var(--font-inter, 'Inter'), -apple-system, BlinkMacSystemFont, sans-serif;
          letter-spacing: -0.005em;
        }

        .subject-state {
          height: 100%;
          display: grid;
          place-items: center;
          padding: 24px;
        }

        .subject-page {
          max-width: 1320px;
          margin: 0 auto;
          padding: 22px 28px 80px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .page-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .head-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          flex: 1;
        }

        .back-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: var(--g-surface);
          border: 1px solid var(--g-line);
          color: var(--g-ink);
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: border-color 0.15s, transform 0.1s;
        }
        .back-btn:hover {
          border-color: var(--g-line-2);
        }
        .back-btn:active {
          transform: scale(0.96);
        }

        .head-text {
          min-width: 0;
        }

        .head-eyebrow {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--g-muted-2);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 0 0 2px;
        }

        .head-title {
          font-size: 30px;
          font-weight: 700;
          letter-spacing: -0.025em;
          margin: 0;
          line-height: 1.05;
        }

        .head-sub {
          font-size: 13.5px;
          color: var(--g-muted);
          margin: 6px 0 0;
        }

        .kpis {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          min-width: 0;
        }

        .card {
          background: var(--g-surface);
          border: 1px solid var(--g-line);
          border-radius: 18px;
          padding: 18px 18px 16px;
          transition: border-color 0.2s;
        }

        .card:hover {
          border-color: var(--g-line-2);
        }

        .card-hd {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .card-title {
          font-size: 12.5px;
          color: var(--g-muted);
          font-weight: 600;
        }

        .card-sub {
          font-size: 11.5px;
          color: var(--g-muted-2);
        }

        .card-icon {
          color: var(--g-muted);
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          padding: 3px 7px;
          border-radius: 999px;
          background: var(--g-line);
          color: var(--g-ink);
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

        .kpi-value.v-excellent { color: var(--g-good); }
        .kpi-value.v-positive { color: var(--g-good); }
        .kpi-value.v-negative { color: var(--g-negative); }
        .kpi-value.v-critical { color: var(--g-bad); }

        .kpi-foot {
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11.5px;
          color: var(--g-muted);
          gap: 8px;
        }

        .mono {
          font-variant-numeric: tabular-nums;
          color: var(--g-ink);
          font-weight: 600;
        }

        .trend-mini {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .ratio {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .ratio .pos {
          color: var(--g-good);
          font-size: 38px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.04em;
        }

        .ratio .sep {
          color: var(--g-muted-2);
          font-size: 22px;
          font-weight: 300;
        }

        .ratio .neg {
          color: var(--g-bad);
          font-size: 28px;
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
          margin-top: 14px;
        }

        .ratio-bar .p { background: var(--g-good); }
        .ratio-bar .n { background: var(--g-bad); }

        .target-card .target-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }

        .target-input {
          width: 78px;
          border: 1px solid var(--g-line-2);
          border-radius: 10px;
          background: var(--g-bg);
          color: var(--g-ink);
          padding: 9px 11px;
          font-size: 18px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          font-family: inherit;
          letter-spacing: -0.02em;
        }

        .target-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .target-arrow {
          font-size: 16px;
          color: var(--g-muted-2);
          font-weight: 700;
        }

        .target-result {
          font-size: 28px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.03em;
          color: var(--g-ink);
          flex: 1;
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          min-width: 0;
        }

        .target-result.muted { color: var(--g-muted-2); }
        .target-result.v-excellent { color: var(--g-good); }
        .target-result.v-positive { color: var(--g-good); }
        .target-result.v-negative { color: var(--g-negative); }
        .target-result.v-critical { color: var(--g-bad); }

        .target-count {
          font-size: 16px;
          font-weight: 600;
          color: var(--g-muted);
          letter-spacing: 0;
        }

        .target-hint {
          margin: 12px 0 0;
          font-size: 11.5px;
          color: var(--g-muted-2);
        }

        .section-hd {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 12px;
        }

        .section-hd.inline {
          margin-bottom: 14px;
        }

        .section-hd h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.015em;
        }

        .section-hd p {
          margin: 4px 0 0;
          font-size: 12px;
          color: var(--g-muted);
        }

        .reset-btn {
          appearance: none;
          background: var(--g-surface);
          border: 1px solid var(--g-line);
          color: var(--g-muted);
          padding: 6px 10px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 600;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }

        .reset-btn:hover {
          color: var(--g-ink);
          border-color: var(--g-line-2);
        }

        .trend-card {
          background: var(--g-surface);
          border: 1px solid var(--g-line);
          border-radius: 18px;
          padding: 12px 0 4px;
          overflow: hidden;
        }

        .trend-plot {
          position: relative;
        }

        .trend-svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .trend-empty {
          padding: 80px 20px;
          text-align: center;
          color: var(--g-muted-2);
          font-size: 14px;
        }

        .trend-grid {
          stroke: var(--g-line);
          stroke-width: 1;
          opacity: 0.7;
        }

        .trend-axis-label {
          fill: var(--g-muted-2);
          font-size: 7px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          pointer-events: none;
        }

        .trend-baseline {
          stroke: var(--g-good);
          stroke-width: 1;
          stroke-dasharray: 4 4;
          opacity: 0.5;
        }

        .trend-line {
          stroke: var(--accent);
          stroke-width: 1.4;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 1400;
          stroke-dashoffset: 1400;
          animation: drawTrend 0.55s ease forwards;
        }

        .trend-line-custom {
          stroke: var(--accent);
          stroke-width: 1.4;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 7 5;
          opacity: 0.8;
        }

        .trend-fit {
          stroke: var(--orange);
          stroke-width: 1;
          stroke-dasharray: 4 4;
          animation: fadeIn 0.4s ease 0.25s forwards;
          opacity: 0;
        }

        .trend-point {
          fill: var(--accent);
          stroke: var(--g-surface);
          stroke-width: 2;
          cursor: pointer;
        }

        .trend-point.custom {
          fill: var(--orange);
        }

        .trend-point-active {
          fill: var(--accent);
          stroke: var(--g-surface);
          stroke-width: 2.4;
        }

        .trend-hover-line {
          stroke: var(--g-muted);
          stroke-width: 1;
          stroke-dasharray: 3 3;
          opacity: 0.5;
        }

        .trend-tooltip {
          position: absolute;
          pointer-events: none;
          transform: translate(10px, -60px);
          z-index: 2;
        }

        .trend-tooltip.flip {
          transform: translate(calc(-100% - 10px), -60px);
        }

        .trend-tooltip-inner {
          width: max-content;
          max-width: 250px;
          padding: 6px 8px;
          border-radius: 6px;
          background: var(--g-surface);
          border: 1px solid var(--g-line-2);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
        }

        .trend-tooltip-title {
          color: var(--g-muted);
          font-size: 10px;
          font-weight: 600;
          line-height: 1.2;
        }

        .trend-tooltip-text {
          color: var(--g-ink);
          font-size: 11px;
          font-weight: 600;
          line-height: 1.2;
          white-space: normal;
        }

        .trend-tooltip-grade {
          color: var(--accent);
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .grid-section {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
          gap: 14px;
          min-width: 0;
        }

        .list-card,
        .calc-card {
          padding: 18px;
        }

        .grade-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 460px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .grade-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          background: var(--g-bg);
          border: 1px solid var(--g-line);
          transition: opacity 0.2s, border-color 0.15s;
        }

        .grade-item:hover {
          border-color: var(--g-line-2);
        }

        .grade-item.is-removed {
          opacity: 0.45;
        }

        .grade-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .grade-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--g-ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .grade-when {
          margin-top: 2px;
          font-size: 11px;
          color: var(--g-muted);
        }

        .grade-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .grade-mark {
          font-size: 16px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          min-width: 44px;
          text-align: right;
        }

        .grade-mark.v-excellent { color: var(--g-good); }
        .grade-mark.v-positive { color: var(--g-good); }
        .grade-mark.v-negative { color: var(--g-negative); }
        .grade-mark.v-critical { color: var(--g-bad); }

        .grade-remove,
        .grade-restore {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid var(--g-line);
          background: var(--g-surface);
          color: var(--g-muted);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }

        .grade-remove:hover {
          color: var(--g-bad);
          border-color: var(--g-bad);
        }

        .grade-restore:hover {
          color: var(--accent);
          border-color: var(--accent);
        }

        .empty-list {
          padding: 40px 12px;
          text-align: center;
          color: var(--g-muted-2);
          font-size: 13px;
        }

        .empty-list.small {
          padding: 18px 8px;
          font-size: 12px;
        }

        .add-row {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }

        .add-row input {
          flex: 1;
          border: 1px solid var(--g-line-2);
          border-radius: 10px;
          background: var(--g-bg);
          color: var(--g-ink);
          padding: 10px 12px;
          font-size: 14px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          font-family: inherit;
        }

        .add-row input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .add-row button {
          width: 40px;
          height: 40px;
          border: 0;
          border-radius: 10px;
          background: var(--accent);
          color: #fff;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }

        .add-row button:hover { opacity: 0.92; }
        .add-row button:active { transform: scale(0.96); }

        .custom-list {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 14px;
        }

        .custom-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 6px 5px 10px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--chip-color, var(--g-muted)) 10%, var(--g-bg));
          border: 1px solid color-mix(in srgb, var(--chip-color, var(--g-muted)) 30%, var(--g-line));
        }

        .custom-item.v-excellent { --chip-color: var(--g-excellent); }
        .custom-item.v-positive  { --chip-color: var(--g-good); }
        .custom-item.v-negative  { --chip-color: var(--g-negative); }
        .custom-item.v-critical  { --chip-color: var(--g-bad); }

        .custom-item .grade-mark {
          min-width: 0;
          text-align: left;
        }

        .custom-item button {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 0;
          background: transparent;
          color: var(--g-muted);
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .custom-item button:hover {
          color: var(--g-bad);
        }

        .quick-add {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          padding-top: 10px;
          border-top: 1px dashed var(--g-line);
        }

        .quick-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--g-muted-2);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-right: 4px;
        }

        .quick-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid var(--g-line);
          background: var(--g-surface);
          color: var(--g-ink);
          font-size: 12px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          cursor: pointer;
          transition: transform 0.1s, border-color 0.15s;
        }

        .quick-btn:hover {
          border-color: var(--g-line-2);
        }

        .quick-btn:active {
          transform: scale(0.93);
        }

        .quick-btn.v-excellent,
        .quick-btn.v-positive {
          color: var(--g-good);
        }

        .quick-btn.v-negative {
          color: var(--g-negative);
        }

        .quick-btn.v-critical {
          color: var(--g-bad);
        }

        .meta-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 4px 4px;
          font-size: 12.5px;
          color: var(--g-muted);
          flex-wrap: wrap;
          gap: 8px;
        }

        .meta-foot strong {
          color: var(--g-ink);
          font-weight: 600;
        }

        .all-link {
          color: var(--accent);
          font-weight: 600;
          text-decoration: none;
        }

        .all-link:hover {
          text-decoration: underline;
        }

        @keyframes drawTrend {
          from { stroke-dashoffset: 1400; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.65; }
        }

        @media (max-width: 1100px) {
          .grid-section {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .subject-page {
            padding: 16px 16px 80px;
            gap: 18px;
          }

          .head-title {
            font-size: 24px;
          }

          .page-head {
            align-items: flex-start;
          }

          .kpis {
            grid-template-columns: 1fr;
          }

          .kpi-value {
            font-size: 38px;
          }

          .target-result {
            font-size: 24px;
          }

          .grade-list {
            max-height: none;
          }

        }

        @media (max-width: 460px) {
          .head-eyebrow { display: none; }
          .head-title { font-size: 22px; }
        }
      `}</style>
    </AuthGuard>
  );
}
