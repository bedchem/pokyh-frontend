'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart2, ChevronDown } from 'lucide-react';
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
  return value.toFixed(digits).replace('.', ',');
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
  if (raw) return raw;
  const v = g.markDisplayValue > 0 ? g.markDisplayValue : g.markValue;
  if (Number.isInteger(v)) return String(v);
  return String(v).replace('.', ',');
}

function formatMark(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return fmtNum(value, 1);
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

    const keys = Array.from(new Set(allGrades.map((g) => monthKey(g.date)))).sort();
    const monthKeys = keys.length > 8 ? keys.slice(-8) : keys;

    const monthAverages = monthKeys.map((k) => {
      const monthVals = allGrades.filter((g) => monthKey(g.date) === k).map((g) => g.markDisplayValue);
      if (monthVals.length === 0) return 0;
      return monthVals.reduce((a, b) => a + b, 0) / monthVals.length;
    });

    const currentMonthAvg = monthAverages[monthAverages.length - 1] ?? overallAvg;
    const previousMonthAvg = monthAverages[monthAverages.length - 2] ?? currentMonthAvg;
    const delta = currentMonthAvg - previousMonthAvg;

    const spark = sparkPath(monthAverages.length ? monthAverages : [overallAvg]);

    const recent: RecentItem[] = [...allGrades]
      .sort((a, b) => b.date - a.date)
      .slice(0, 3)
      .map((g) => ({
        id: g.id,
        subject: g.subjectName,
        numeric: g.markDisplayValue,
      }));

    const refDate = latestGradeDate
      ? new Date(
          Number(String(latestGradeDate).slice(0, 4)),
          Number(String(latestGradeDate).slice(4, 6)) - 1,
          Number(String(latestGradeDate).slice(6, 8))
        )
      : new Date();
    const schoolYearStart = refDate.getMonth() >= 7 ? refDate.getFullYear() : refDate.getFullYear() - 1;

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
      spark,
      recent,
      schoolYearLabel: `${schoolYearStart} / ${schoolYearStart + 1}`,
    };
  }, [subjects]);

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
                <svg className="spark" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={dashboard.spark.area} fill="url(#sg)" />
                  <path d={dashboard.spark.line} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
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
                  <span className="pill">σ {fmtNum(dashboard.sigma, 1)}</span>
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
                    Median <span className="mono">{fmtNum(dashboard.median, 1)}</span>
                  </span>
                </div>
              </div>

              <div className="card">
                <div className="card-hd">
                  <div>
                    <div className="card-title">Kürzlich hinzugefügt</div>
                    <div className="card-sub">Letzte 3 Einträge</div>
                  </div>
                  <span className="mini-link">Alle →</span>
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
                  const avgClass = gradeClass(subject.average);
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
                          <span className={`timeline-avg ${avgClass}`}>{fmtNum(subject.average, 1)}</span>
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
          --g-good: #2f8f56;
          --g-good-soft: color-mix(in srgb, #2f8f56 14%, transparent);
          --g-bad: #c54a4e;
          --g-bad-soft: color-mix(in srgb, #c54a4e 14%, transparent);

          height: 100%;
          overflow: auto;
          background: var(--g-bg);
          color: var(--g-ink);
          font-feature-settings: 'ss01', 'cv11';
          text-rendering: optimizeLegibility;
          letter-spacing: -0.005em;
        }

        :global(.dark) .grades-dashboard-wrap {
          --g-good: #5ecb80;
          --g-bad: #f07779;
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
          margin-top: 4px;
          color: var(--g-ink);
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
          color: #44d37d;
        }

        .recent-row .grade.v-positive {
          color: #2f8f56;
        }

        .recent-row .grade.v-negative {
          color: #ff7a4c;
        }

        .recent-row .grade.v-critical {
          color: #e3494f;
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
          color: #44d37d;
        }

        .timeline-avg.v-positive {
          color: #2f8f56;
        }

        .timeline-avg.v-negative {
          color: #ff7a4c;
        }

        .timeline-avg.v-critical {
          color: #e3494f;
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
          color: #44d37d;
        }

        .grade-value.v-positive {
          color: #2f8f56;
        }

        .grade-value.v-negative {
          color: #ff7a4c;
        }

        .grade-value.v-critical {
          color: #e3494f;
        }

        :global(.dark) .recent-row .grade.v-excellent,
        :global(.dark) .timeline-avg.v-excellent,
        :global(.dark) .grade-value.v-excellent {
          color: #60e292;
        }

        :global(.dark) .recent-row .grade.v-positive,
        :global(.dark) .timeline-avg.v-positive,
        :global(.dark) .grade-value.v-positive {
          color: #56c17d;
        }

        :global(.dark) .recent-row .grade.v-negative,
        :global(.dark) .timeline-avg.v-negative,
        :global(.dark) .grade-value.v-negative {
          color: #ff996c;
        }

        :global(.dark) .recent-row .grade.v-critical,
        :global(.dark) .timeline-avg.v-critical,
        :global(.dark) .grade-value.v-critical {
          color: #ff6d73;
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
