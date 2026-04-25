'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronDown, Plus, X, BarChart2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import EmptyView from '@/components/ui/EmptyView';
import { fetchGrades } from '@/lib/api';
import { averageColor, gradeColor, GRADE_COLORS } from '@/lib/colors';
import type { SubjectGrades, GradeEntry } from '@/lib/types';

// ─── Parser ────────────────────────────────────────────────────────────────

function parseGrades(json: unknown): SubjectGrades[] {
  try {
    const root = json as Record<string, unknown>;
    const subjectsRaw = (root?.subjects ?? []) as Array<Record<string, unknown>>;

    return subjectsRaw
      .map((s) => {
        const grades = (s.grades ?? []) as Array<Record<string, unknown>>;
        const gradeEntries: GradeEntry[] = grades
          .map((g) => ({
            id: g.id as number,
            text: (g.text as string) ?? '',
            date: g.date as number,
            markName: (g.markName as string) ?? '',
            markValue: (g.markValue as number) ?? 0,
            markDisplayValue: (g.markDisplayValue as number) ?? 0,
            examType: (g.examType as string) ?? '',
          }))
          .filter((g) => g.markValue > 0);

        const vals = gradeEntries.map((g) => g.markDisplayValue).filter(Boolean);
        const average = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

        return {
          lessonId: s.lessonId as number,
          subjectName: (s.subjectName as string) ?? '',
          teacherName: (s.teacherName as string) ?? '',
          grades: gradeEntries,
          average,
          positiveCount: vals.filter((v) => v >= 6).length,
          negativeCount: vals.filter((v) => v < 6).length,
        } as SubjectGrades;
      })
      .filter((s) => s.grades.length > 0)
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  } catch (e) {
    console.error('[grades] parse error:', e);
    return [];
  }
}

function formatGradeDate(d: number): string {
  const s = d.toString();
  return `${s.slice(6, 8)}.${s.slice(4, 6)}.${s.slice(0, 4)}`;
}

// ─── Pie Chart ──────────────────────────────────────────────────────────────

function DonutChart({ subjects }: { subjects: SubjectGrades[] }) {
  const allGrades = subjects.flatMap((s) => s.grades);
  const counts: Record<number, number> = {};
  allGrades.forEach((g) => {
    counts[g.markDisplayValue] = (counts[g.markDisplayValue] ?? 0) + 1;
  });
  const total = allGrades.length;
  if (total === 0) return null;

  const CX = 80, CY = 80, R = 72;

  let cumulative = 0;
  const slices = Object.entries(GRADE_COLORS)
    .map(([grade, color]) => {
      const count = counts[parseInt(grade)] ?? 0;
      const frac = count / total;
      const slice = { grade, color, frac, start: cumulative, count };
      cumulative += frac;
      return slice;
    })
    .filter((s) => s.count > 0);

  function slicePath(start: number, frac: number) {
    const a0 = start * 2 * Math.PI - Math.PI / 2;
    const a1 = (start + frac) * 2 * Math.PI - Math.PI / 2;
    const x0 = CX + R * Math.cos(a0);
    const y0 = CY + R * Math.sin(a0);
    const x1 = CX + R * Math.cos(a1);
    const y1 = CY + R * Math.sin(a1);
    const large = frac > 0.5 ? 1 : 0;
    return `M ${CX} ${CY} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
  }

  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {slices.map((s) => (
        <path
          key={s.grade}
          d={slicePath(s.start, s.frac)}
          fill={s.color}
          stroke="var(--app-surface)"
          strokeWidth={slices.length > 1 ? 1.5 : 0}
        />
      ))}
      {/* Center label */}
      <circle cx={CX} cy={CY} r={28} fill="var(--app-surface)" />
      <text x={CX} y={CY - 5} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--app-text-primary)">
        {total}
      </text>
      <text x={CX} y={CY + 11} textAnchor="middle" fontSize="10" fill="var(--app-text-secondary)">
        Noten
      </text>
    </svg>
  );
}

// ─── Simulator Sheet ────────────────────────────────────────────────────────

function SimulatorSheet({
  subject,
  onClose,
}: {
  subject: SubjectGrades;
  onClose: () => void;
}) {
  const [simGrades, setSimGrades] = useState<number[]>([]);
  const [input, setInput] = useState('');

  const allValues = [
    ...subject.grades.map((g) => g.markDisplayValue),
    ...simGrades,
  ];
  const simAvg = allValues.length
    ? allValues.reduce((a, b) => a + b, 0) / allValues.length
    : 0;

  function addSim() {
    const v = parseFloat(input);
    if (v >= 1 && v <= 10) {
      setSimGrades([...simGrades, v]);
      setInput('');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end fade-backdrop"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-2xl slide-up"
        style={{ background: 'var(--app-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: 'var(--app-border)' }} />
        <div className="px-6 pb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--app-text-primary)' }}>
                {subject.subjectName}
              </h2>
              <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>Notensimulator</p>
            </div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
              style={{ background: averageColor(subject.average) }}
            >
              {subject.average > 0 ? subject.average.toFixed(1) : '–'}
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="number"
              min={1}
              max={10}
              step={0.5}
              placeholder="Note (1–10)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSim()}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none border"
              style={{
                background: 'var(--app-card)',
                borderColor: 'var(--app-border)',
                color: 'var(--app-text-primary)',
              }}
              autoFocus
            />
            <button
              onClick={addSim}
              className="w-9 h-9 rounded-lg flex items-center justify-center press-scale"
              style={{ background: 'var(--accent)' }}
            >
              <Plus size={18} color="#fff" />
            </button>
          </div>
          {simGrades.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {simGrades.map((v, i) => (
                <button
                  key={i}
                  onClick={() => setSimGrades(simGrades.filter((_, j) => j !== i))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold press-scale"
                  style={{ background: gradeColor(v), color: '#fff' }}
                >
                  {v} <X size={10} />
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between pt-1 px-4 py-3 rounded-xl" style={{ background: 'var(--app-card)' }}>
            <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
              {simGrades.length > 0 ? 'Simulierter Schnitt' : 'Aktueller Schnitt'}
            </p>
            <p className="text-base font-bold" style={{ color: averageColor(simAvg) }}>
              {simAvg.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Subject Row (accordion) ────────────────────────────────────────────────

function SubjectRow({
  subject,
  onSimulator,
}: {
  subject: SubjectGrades;
  onSimulator: (s: SubjectGrades) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden fade-in"
      style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3.5 text-left flex items-center gap-3 press-scale"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
          style={{ background: averageColor(subject.average) }}
        >
          {subject.average > 0 ? subject.average.toFixed(1) : '–'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold" style={{ color: 'var(--app-text-primary)' }}>
            {subject.subjectName}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--app-text-secondary)' }}>
            {subject.teacherName} · {subject.grades.length}{' '}
            {subject.grades.length === 1 ? 'Note' : 'Noten'}
          </p>
        </div>
        <div
          className="flex-shrink-0"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.22s ease',
          }}
        >
          <ChevronDown size={18} color="var(--app-text-tertiary)" />
        </div>
      </button>

      {/* Expanded grades */}
      {expanded && (
        <div
          className="px-4 pb-4 fade-in"
          style={{ animationDuration: '0.2s' }}
        >
          <div className="h-px mb-3" style={{ background: 'var(--app-separator)' }} />
          <div className="flex flex-col gap-2 mb-3">
            {subject.grades
              .slice()
              .sort((a, b) => b.date - a.date)
              .map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'var(--app-card)' }}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--app-text-primary)' }}>
                      {g.text || g.examType || 'Note'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--app-text-secondary)' }}>
                      {formatGradeDate(g.date)}
                    </p>
                  </div>
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: gradeColor(g.markDisplayValue) }}
                  >
                    {g.markDisplayValue}
                  </span>
                </div>
              ))}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSimulator(subject); }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold press-scale"
            style={{ background: 'var(--app-card)', color: 'var(--accent)' }}
          >
            Notensimulator
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function GradesPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [simulator, setSimulator] = useState<SubjectGrades | null>(null);
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

  const allGrades = subjects.flatMap((s) => s.grades);
  const overallAvg = allGrades.length
    ? allGrades.reduce((a, g) => a + g.markDisplayValue, 0) / allGrades.length
    : null;
  const positive = allGrades.filter((g) => g.markDisplayValue >= 6).length;
  const negative = allGrades.filter((g) => g.markDisplayValue < 6).length;

  return (
    <AuthGuard>
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{ background: 'var(--app-bg)' }}
      >
        {/* Nav */}
        <div className="px-5 pt-4 pb-4 flex items-center gap-3 fade-in flex-shrink-0">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full press-scale"
            style={{ background: 'var(--app-surface)' }}
          >
            <ChevronLeft size={20} color="var(--accent)" />
          </button>
          <h1
            className="flex-1 text-[28px] font-bold tracking-tight"
            style={{ color: 'var(--app-text-primary)' }}
          >
            Noten
          </h1>
        </div>

        <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 pb-10">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size={28} />
            </div>
          ) : error ? (
            <ErrorView message={error} onRetry={load} />
          ) : subjects.length === 0 ? (
            <EmptyView
              icon={<BarChart2 size={56} color="var(--app-text-primary)" />}
              title="Keine Noten"
              subtitle="Es wurden noch keine Noten erfasst."
            />
          ) : (
            <>
              {/* Overview card */}
              <div
                className="rounded-2xl overflow-hidden mb-4 fade-in delay-1"
                style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
              >
                <div
                  className="px-5 pt-5 pb-4 flex items-center justify-between gap-4"
                  style={{
                    background: overallAvg != null
                      ? `linear-gradient(135deg, color-mix(in srgb, ${averageColor(overallAvg)} 18%, var(--app-surface)) 0%, var(--app-surface) 65%)`
                      : undefined,
                  }}
                >
                  <div>
                    <p className="text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--app-text-secondary)' }}>
                      Gesamtschnitt
                    </p>
                    <p
                      className="text-5xl font-black leading-none tracking-tight"
                      style={{ color: overallAvg != null ? averageColor(overallAvg) : 'var(--app-text-primary)' }}
                    >
                      {overallAvg != null ? overallAvg.toFixed(2) : '–'}
                    </p>
                    <p className="text-sm mt-2" style={{ color: 'var(--app-text-tertiary)' }}>
                      {subjects.length} {subjects.length === 1 ? 'Fach' : 'Fächer'}
                    </p>
                  </div>
                  <DonutChart subjects={subjects} />
                </div>
                <div className="grid grid-cols-3" style={{ borderTop: '1px solid var(--app-separator)' }}>
                  {[
                    { label: 'Positiv', value: positive, color: 'var(--tint)' },
                    { label: 'Negativ', value: negative, color: 'var(--danger)' },
                    { label: 'Gesamt', value: allGrades.length, color: 'var(--app-text-primary)' },
                  ].map((stat, i) => (
                    <div
                      key={stat.label}
                      className="py-3 text-center"
                      style={i > 0 ? { borderLeft: '1px solid var(--app-separator)' } : undefined}
                    >
                      <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject accordion list */}
              <div className="flex flex-col gap-2 fade-in delay-2">
                {subjects.map((subject) => (
                  <SubjectRow
                    key={subject.lessonId}
                    subject={subject}
                    onSimulator={setSimulator}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        </div>

        {simulator && (
          <SimulatorSheet
            subject={simulator}
            onClose={() => setSimulator(null)}
          />
        )}
      </div>
    </AuthGuard>
  );
}
