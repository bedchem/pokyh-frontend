'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X, BarChart2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import EmptyView from '@/components/ui/EmptyView';
import { fetchGrades } from '@/lib/api';
import { averageColor, gradeColor, GRADE_COLORS } from '@/lib/colors';
import type { SubjectGrades, GradeEntry } from '@/lib/types';

// ─── Data helpers ─────────────────────────────────────────────────────────────

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
          .filter((g) => g.markValue > 0);
        const vals = entries.map((g) => g.markDisplayValue).filter(Boolean);
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
      .filter((s) => s.grades.length > 0)
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  } catch {
    return [];
  }
}

function fmtDate(d: number): string {
  const s = String(d);
  return `${s.slice(6, 8)}.${s.slice(4, 6)}.${s.slice(0, 4)}`;
}

// ─── Donut chart ──────────────────────────────────────────────────────────────

function DonutChart({ subjects, size = 120 }: { subjects: SubjectGrades[]; size?: number }) {
  const all = subjects.flatMap((s) => s.grades);
  const counts: Record<number, number> = {};
  all.forEach((g) => { counts[g.markDisplayValue] = (counts[g.markDisplayValue] ?? 0) + 1; });
  const total = all.length;
  if (!total) return null;

  const CX = size / 2, CY = size / 2;
  const R = size * 0.46, INNER = size * 0.25;

  let cum = 0;
  const slices = Object.entries(GRADE_COLORS)
    .map(([k, color]) => {
      const count = counts[+k] ?? 0;
      const frac = count / total;
      const s = { grade: k, color, frac, start: cum, count };
      cum += frac;
      return s;
    })
    .filter((s) => s.count > 0);

  function slice(start: number, frac: number): string {
    const a0 = start * 2 * Math.PI - Math.PI / 2;
    const a1 = (start + frac) * 2 * Math.PI - Math.PI / 2;
    if (frac >= 0.9999) {
      // full circle: draw two semicircle arcs
      return [
        `M ${CX} ${CY - R}`,
        `A ${R} ${R} 0 1 1 ${CX} ${CY + R}`,
        `A ${R} ${R} 0 1 1 ${CX} ${CY - R}`,
        'Z',
      ].join(' ');
    }
    const large = frac > 0.5 ? 1 : 0;
    const ox = CX + R * Math.cos(a0), oy = CY + R * Math.sin(a0);
    const ex = CX + R * Math.cos(a1), ey = CY + R * Math.sin(a1);
    return `M ${CX} ${CY} L ${ox} ${oy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey} Z`;
  }

  const fs = Math.round(size * 0.17);
  const fs2 = Math.round(size * 0.085);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {slices.map((s) => (
        <path key={s.grade} d={slice(s.start, s.frac)} fill={s.color}
          stroke="var(--app-surface)" strokeWidth={slices.length > 1 ? 1.5 : 0} />
      ))}
      {/* Donut hole */}
      <circle cx={CX} cy={CY} r={INNER} fill="var(--app-surface)" />
      <text x={CX} y={CY + fs * 0.35} textAnchor="middle" fontSize={fs} fontWeight="800" fill="var(--app-text-primary)">{total}</text>
      <text x={CX} y={CY + fs * 0.35 + fs2 + 2} textAnchor="middle" fontSize={fs2} fill="var(--app-text-tertiary)">Noten</text>
    </svg>
  );
}

// ─── Overall trend sparkline ──────────────────────────────────────────────────

function OverallSparkline({ subjects, size = 'sm' }: { subjects: SubjectGrades[]; size?: 'sm' | 'lg' }) {
  const all = subjects.flatMap((s) => s.grades).sort((a, b) => a.date - b.date);
  if (all.length < 3) return null;

  const pts: { d: number; v: number }[] = [];
  let sum = 0;
  all.forEach((g, i) => { sum += g.markDisplayValue; pts.push({ d: g.date, v: sum / (i + 1) }); });

  const W = size === 'lg' ? 280 : 180, H = size === 'lg' ? 60 : 44, PX = 4, PY = 6;
  const minD = pts[0].d, maxD = pts[pts.length - 1].d;
  const cW = W - PX * 2, cH = H - PY * 2;
  const toX = (d: number) => PX + (maxD > minD ? ((d - minD) / (maxD - minD)) * cW : cW);
  const toY = (v: number) => PY + cH - ((Math.max(4, Math.min(10, v)) - 4) / 6) * cH;

  const last = pts[pts.length - 1];
  const col = averageColor(last.v);
  const poly = pts.map((p) => `${toX(p.d)},${toY(p.v)}`).join(' ');
  const area = `M ${toX(pts[0].d)} ${H - PY} ${pts.map((p) => `L ${toX(p.d)} ${toY(p.v)}`).join(' ')} L ${toX(last.d)} ${H - PY} Z`;

  // trend direction
  const firstHalf = pts.slice(0, Math.ceil(pts.length / 2));
  const secondHalf = pts.slice(Math.ceil(pts.length / 2));
  const avg = (arr: typeof pts) => arr.reduce((a, p) => a + p.v, 0) / arr.length;
  const rising = avg(secondHalf) > avg(firstHalf) + 0.1;
  const falling = avg(secondHalf) < avg(firstHalf) - 0.1;

  return (
    <div className="flex items-center gap-2">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="spkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={col} stopOpacity="0.22" />
            <stop offset="100%" stopColor={col} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={PX} x2={W - PX} y1={toY(6)} y2={toY(6)} stroke="var(--app-border)" strokeWidth={1} strokeDasharray="3 2" />
        <path d={area} fill="url(#spkGrad)" />
        <polyline points={poly} fill="none" stroke={col} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={toX(last.d)} cy={toY(last.v)} r={3} fill={col} stroke="var(--app-surface)" strokeWidth={1.5} />
      </svg>
      <span className="text-[11px] font-semibold" style={{ color: rising ? 'var(--tint)' : falling ? 'var(--danger)' : 'var(--app-text-tertiary)' }}>
        {rising ? '↑' : falling ? '↓' : '→'}
      </span>
    </div>
  );
}

// ─── Subject trend chart ──────────────────────────────────────────────────────

function TrendChart({
  grades,
  excluded,
  simGrades = [],
}: {
  grades: GradeEntry[];
  excluded: Set<number>;
  simGrades?: number[];
}) {
  const sorted = [...grades].sort((a, b) => a.date - b.date);
  if (sorted.length === 0 && simGrades.length === 0) return null;

  const W = 440, H = 195, PX = 32, PY = 20, PB = 38;
  const cH = H - PY - PB, cW = W - PX * 2;

  const MONTHS_S = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  const DAY_MS = 86400000;

  function dToMs(d: number) {
    const s = String(d);
    return new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`).getTime();
  }
  function msToD(ms: number) {
    const d = new Date(ms);
    return parseInt(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`);
  }

  const lastDate = sorted.length > 0
    ? sorted[sorted.length - 1].date
    : msToD(Date.now());

  const simDates = simGrades.map((_, i) => msToD(dToMs(lastDate) + (i + 1) * DAY_MS));
  const allDates = [...sorted.map(g => g.date), ...simDates];

  const minMs = dToMs(allDates[0] ?? lastDate);
  const maxMs = dToMs(allDates[allDates.length - 1] ?? lastDate);
  const pad = Math.max((maxMs - minMs) * 0.07, 6 * DAY_MS);
  const rMin = minMs - pad, rMax = maxMs + pad, rSpan = rMax - rMin;

  const toX = (ms: number) => PX + ((ms - rMin) / rSpan) * cW;
  const toXd = (d: number) => toX(dToMs(d));
  const toY = (v: number) => PY + cH - ((v - 1) / 9) * cH;

  // Stagger same-date grades horizontally
  const dateGroups = new Map<number, number[]>();
  sorted.forEach(g => {
    if (!dateGroups.has(g.date)) dateGroups.set(g.date, []);
    dateGroups.get(g.date)!.push(g.id);
  });

  const pts = sorted.map(g => {
    const grp = dateGroups.get(g.date)!;
    const idx = grp.indexOf(g.id);
    const stagger = grp.length > 1 ? (idx - (grp.length - 1) / 2) * 16 : 0;
    return { x: toXd(g.date) + stagger, y: toY(g.markDisplayValue), v: g.markDisplayValue, id: g.id, on: !excluded.has(g.id) };
  });

  const simPts = simGrades.map((v, i) => ({ x: toXd(simDates[i]), y: toY(v), v, id: -i - 1, on: true }));

  const active = pts.filter(p => p.on);
  const allActive = [...active, ...simPts];

  // Linear regression trend
  let trendLine = null;
  if (allActive.length >= 2) {
    const n = allActive.length;
    const sx = allActive.reduce((a, p) => a + p.x, 0);
    const sy = allActive.reduce((a, p) => a + p.y, 0);
    const sxy = allActive.reduce((a, p) => a + p.x * p.y, 0);
    const sx2 = allActive.reduce((a, p) => a + p.x * p.x, 0);
    const den = n * sx2 - sx * sx;
    if (den !== 0) {
      const m = (n * sxy - sx * sy) / den;
      const b2 = (sy - m * sx) / n;
      trendLine = (
        <line x1={PX} y1={m * PX + b2} x2={W - PX} y2={m * (W - PX) + b2}
          stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.7} />
      );
    }
  }

  // Month markers
  const monthMarkers: { x: number; label: string }[] = [];
  {
    const cur = new Date(rMin);
    cur.setDate(1); cur.setMonth(cur.getMonth() + 1);
    const end = new Date(rMax);
    while (cur <= end) {
      const x = toX(cur.getTime());
      if (x > PX + 14 && x < W - PX - 14)
        monthMarkers.push({ x, label: MONTHS_S[cur.getMonth()] });
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  const avgV = active.length ? active.reduce((a, p) => a + p.v, 0) / active.length : 6;
  const col = averageColor(avgV);
  const gId = `tcg${sorted[0]?.id ?? 'x'}`;

  const areaPath = active.length >= 2
    ? `M ${active[0].x} ${PY + cH} ${active.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${active[active.length-1].x} ${PY + cH} Z`
    : null;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.2" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y grid */}
      {[2, 4, 6, 8, 10].map(v => (
        <g key={v}>
          <line x1={PX} x2={W - PX} y1={toY(v)} y2={toY(v)}
            stroke="var(--app-border)" strokeWidth={0.5} />
          <text x={PX - 6} y={toY(v) + 4} textAnchor="end" fontSize={9} fill="var(--app-text-tertiary)">{v}</text>
        </g>
      ))}
      <line x1={PX} x2={W - PX} y1={toY(6)} y2={toY(6)} stroke="var(--tint)" strokeWidth={1} opacity={0.28} />

      {/* Month markers */}
      {monthMarkers.map(m => (
        <g key={m.label + m.x}>
          <line x1={m.x} x2={m.x} y1={PY} y2={H - PB + 5}
            stroke="var(--app-border)" strokeWidth={0.5} strokeDasharray="3 2" />
          <text x={m.x} y={H - 8} textAnchor="middle" fontSize={9} fill="var(--app-text-tertiary)">{m.label}</text>
        </g>
      ))}

      {/* Sim divider */}
      {simPts.length > 0 && (
        <>
          <line x1={toXd(lastDate)} x2={toXd(lastDate)} y1={PY - 6} y2={H - PB}
            stroke="var(--warning)" strokeWidth={1} strokeDasharray="4 3" opacity={0.55} />
          <text x={toXd(lastDate)} y={PY - 9} textAnchor="middle" fontSize={8} fill="var(--warning)" opacity={0.75}>Sim</text>
        </>
      )}

      {/* Area fill */}
      {areaPath && <path d={areaPath} fill={`url(#${gId})`} />}

      {/* Real grade line */}
      {active.length >= 2 && (
        <polyline
          points={active.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none" stroke={col} strokeWidth={2}
          strokeLinejoin="round" strokeLinecap="round" opacity={0.8}
        />
      )}

      {/* Sim line */}
      {simPts.length > 0 && active.length > 0 && (
        <polyline
          points={[active[active.length-1], ...simPts].map(p => `${p.x},${p.y}`).join(' ')}
          fill="none" stroke="var(--warning)" strokeWidth={1.5}
          strokeLinejoin="round" strokeDasharray="5 3"
        />
      )}

      {trendLine}

      {/* Real grade dots with value */}
      {pts.map((p, i) => (
        <g key={i} style={{ opacity: p.on ? 1 : 0.3 }}>
          <circle cx={p.x} cy={p.y} r={11}
            fill={p.on ? gradeColor(p.v) : 'var(--app-card)'}
            stroke="var(--app-surface)" strokeWidth={2.5} />
          <text x={p.x} y={p.y + 4} textAnchor="middle"
            fontSize={10} fontWeight="700"
            fill={p.on ? '#fff' : 'var(--app-text-tertiary)'}>
            {p.v}
          </text>
        </g>
      ))}

      {/* Sim dots */}
      {simPts.map((p, i) => (
        <g key={`s${i}`}>
          <circle cx={p.x} cy={p.y} r={11}
            fill={gradeColor(p.v)} stroke="var(--warning)" strokeWidth={2.5} opacity={0.9} />
          <text x={p.x} y={p.y + 4} textAnchor="middle"
            fontSize={10} fontWeight="700" fill="#fff" opacity={0.9}>
            {p.v}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Shared subject detail (desktop panel + mobile sheet) ────────────────────

function SubjectDetail({ subject }: { subject: SubjectGrades }) {
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [simGrades, setSimGrades] = useState<number[]>([]);
  const [input, setInput] = useState('');

  // Reset when subject changes
  useEffect(() => {
    setExcluded(new Set());
    setSimGrades([]);
    setInput('');
  }, [subject.lessonId]);

  const activeVals = subject.grades.filter((g) => !excluded.has(g.id)).map((g) => g.markDisplayValue);
  const allVals = [...activeVals, ...simGrades];
  const liveAvg = allVals.length ? allVals.reduce((a, b) => a + b, 0) / allVals.length : 0;
  const hasChanges = excluded.size > 0 || simGrades.length > 0;
  const diff = liveAvg - subject.average;

  function toggle(id: number) {
    setExcluded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function addSim() {
    const v = parseFloat(input);
    if (v >= 1 && v <= 10) { setSimGrades((p) => [...p, v]); setInput(''); }
  }

  function reset() { setExcluded(new Set()); setSimGrades([]); setInput(''); }

  return (
    <div className="flex flex-col gap-4">
      {/* Live average card */}
      <div className="rounded-2xl p-5 flex items-center gap-4"
        style={{
          background: liveAvg > 0
            ? `linear-gradient(130deg, color-mix(in srgb, ${averageColor(liveAvg)} 13%, var(--app-surface)) 0%, var(--app-surface) 65%)`
            : 'var(--app-surface)',
          border: '1px solid var(--app-border)',
        }}
      >
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'var(--app-text-tertiary)' }}>
            {hasChanges ? 'Simulierter Schnitt' : 'Aktueller Schnitt'}
          </p>
          <p className="text-5xl font-black leading-none tabular-nums"
            style={{ color: liveAvg > 0 ? averageColor(liveAvg) : 'var(--app-text-primary)' }}>
            {liveAvg > 0 ? liveAvg.toFixed(2) : '–'}
          </p>
          {hasChanges && liveAvg > 0 && (
            <p className="text-xs mt-2" style={{ color: 'var(--app-text-tertiary)' }}>
              Original {subject.average.toFixed(2)}
              <span className="ml-1.5 font-semibold"
                style={{ color: diff > 0.01 ? 'var(--tint)' : diff < -0.01 ? 'var(--danger)' : 'var(--app-text-secondary)' }}>
                {diff > 0.01 ? '+' : ''}{diff.toFixed(2)}
              </span>
            </p>
          )}
        </div>
        {hasChanges && (
          <button onClick={reset}
            className="px-3 py-1.5 rounded-lg text-xs font-medium press-scale flex-shrink-0"
            style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)', border: '1px solid var(--app-border)' }}>
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Trend chart */}
      {subject.grades.length >= 2 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-tertiary)' }}>
              Notenverlauf
            </p>
            <div className="flex items-center gap-1.5">
              <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.65" /></svg>
              <span className="text-[10px]" style={{ color: 'var(--app-text-tertiary)' }}>Trend</span>
              <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke="var(--tint)" strokeWidth="1" opacity="0.35" /></svg>
              <span className="text-[10px]" style={{ color: 'var(--app-text-tertiary)' }}>Note 6</span>
            </div>
          </div>
          <TrendChart grades={subject.grades} excluded={excluded} simGrades={simGrades} />
        </div>
      )}

      {/* Grade toggles */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--app-separator)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-tertiary)' }}>
            Noten ein-/ausblenden
          </p>
          {excluded.size > 0 && (
            <button onClick={() => setExcluded(new Set())} className="text-xs press-scale" style={{ color: 'var(--accent)' }}>
              Alle aktivieren
            </button>
          )}
        </div>
        <div className="flex flex-col divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
          {subject.grades.slice().sort((a, b) => b.date - a.date).map((g) => {
            const on = !excluded.has(g.id);
            return (
              <button key={g.id} onClick={() => toggle(g.id)}
                className="flex items-center gap-3 px-4 py-3 text-left press-scale transition-opacity"
                style={{
                  background: 'var(--app-surface)',
                  borderBottom: '1px solid var(--app-separator)',
                  opacity: on ? 1 : 0.45,
                }}
              >
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: on ? gradeColor(g.markDisplayValue) : 'var(--app-text-tertiary)' }}>
                  {g.markDisplayValue}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--app-text-primary)' }}>
                    {g.text || g.examType || 'Note'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--app-text-tertiary)' }}>{fmtDate(g.date)}</p>
                </div>
                {/* Toggle pill */}
                <div className="w-9 h-5 rounded-full flex-shrink-0 flex items-center transition-colors"
                  style={{ background: on ? 'var(--accent)' : 'var(--app-border)', padding: '2px' }}>
                  <div className="w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: on ? 'translateX(16px)' : 'translateX(0)' }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulator */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--app-text-tertiary)' }}>
          Notensimulator
        </p>
        <div className="flex gap-2 mb-3">
          <input
            type="number" min={1} max={10} step={0.5}
            placeholder="Hypothetische Note (1–10)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSim()}
            className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', color: 'var(--app-text-primary)' }}
          />
          <button onClick={addSim}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 press-scale"
            style={{ background: 'var(--accent)' }}>
            <Plus size={18} color="#fff" />
          </button>
        </div>
        {simGrades.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {simGrades.map((v, i) => (
              <button key={i}
                onClick={() => setSimGrades((p) => p.filter((_, j) => j !== i))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold text-white press-scale"
                style={{ background: gradeColor(v) }}>
                {v} <X size={10} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mobile subject row ───────────────────────────────────────────────────────

function MobileSubjectRow({ s, onOpen }: { s: SubjectGrades; onOpen: () => void }) {
  return (
    <button onClick={onOpen}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left press-scale"
      style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
        style={{ background: averageColor(s.average) }}>
        {s.average > 0 ? s.average.toFixed(1) : '–'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[15px] truncate" style={{ color: 'var(--app-text-primary)' }}>{s.subjectName}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--app-text-secondary)' }}>
          {s.teacherName} · {s.grades.length} {s.grades.length === 1 ? 'Note' : 'Noten'}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {s.positiveCount > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'color-mix(in srgb, var(--tint) 14%, transparent)', color: 'var(--tint)' }}>
            +{s.positiveCount}
          </span>
        )}
        {s.negativeCount > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)' }}>
            -{s.negativeCount}
          </span>
        )}
        <svg width="7" height="12" viewBox="0 0 7 12">
          <path d="M1 1l5 5-5 5" stroke="var(--app-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
    </button>
  );
}

// ─── Mobile bottom sheet ──────────────────────────────────────────────────────

function MobileSheet({ subject, onClose }: { subject: SubjectGrades; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end fade-backdrop"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="w-full max-h-[92dvh] flex flex-col rounded-t-3xl slide-up"
        style={{ background: 'var(--app-bg)', border: '1px solid var(--app-border)', borderBottom: 'none' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-0 flex-shrink-0" style={{ background: 'var(--app-border)' }} />
        {/* Sheet header */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--app-separator)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
            style={{ background: averageColor(subject.average) }}>
            {subject.average > 0 ? subject.average.toFixed(1) : '–'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black leading-tight" style={{ color: 'var(--app-text-primary)' }}>{subject.subjectName}</h2>
            <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>{subject.teacherName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full press-scale flex-shrink-0" style={{ background: 'var(--app-card)' }}>
            <X size={16} color="var(--app-text-secondary)" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-10">
          <SubjectDetail subject={subject} />
        </div>
      </div>
    </div>
  );
}

// ─── Desktop sidebar subject row ──────────────────────────────────────────────

function SidebarRow({ s, active, onClick }: { s: SubjectGrades; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left press-scale"
      style={{
        background: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
        border: `1px solid ${active ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : 'transparent'}`,
      }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-xs flex-shrink-0"
        style={{ background: averageColor(s.average) }}>
        {s.average > 0 ? s.average.toFixed(1) : '–'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: active ? 'var(--accent)' : 'var(--app-text-primary)' }}>
          {s.subjectName}
        </p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--app-text-secondary)' }}>
          {s.grades.length} {s.grades.length === 1 ? 'Note' : 'Noten'} · {s.teacherName}
        </p>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        {s.positiveCount > 0 && <span className="text-[10px] font-bold" style={{ color: 'var(--tint)' }}>+{s.positiveCount}</span>}
        {s.negativeCount > 0 && <span className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>-{s.negativeCount}</span>}
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GradesPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<SubjectGrades | null>(null);
  const [sheet, setSheet] = useState<SubjectGrades | null>(null);
  const cacheRef = useRef<SubjectGrades[] | null>(null);

  const load = useCallback(async () => {
    if (cacheRef.current) { setSubjects(cacheRef.current); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const res = await fetchGrades();
      const parsed = parseGrades(res);
      cacheRef.current = parsed;
      setSubjects(parsed);
      if (parsed.length > 0) setSelected(parsed[0]);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') router.replace('/login');
      else setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const allGrades = subjects.flatMap((s) => s.grades);
  const overallAvg = allGrades.length ? allGrades.reduce((a, g) => a + g.markDisplayValue, 0) / allGrades.length : null;
  const pos = allGrades.filter((g) => g.markDisplayValue >= 6).length;
  const neg = allGrades.filter((g) => g.markDisplayValue < 6).length;

  // ── Stats bar shared between mobile + desktop overview ──
  const statsBar = (
    <div className="grid grid-cols-3" style={{ borderTop: '1px solid var(--app-separator)' }}>
      {[
        { label: 'Positiv', val: pos, color: 'var(--tint)' },
        { label: 'Negativ', val: neg, color: 'var(--danger)' },
        { label: 'Gesamt', val: allGrades.length, color: 'var(--app-text-primary)' },
      ].map((stat, i) => (
        <div key={stat.label} className="py-3 text-center"
          style={i > 0 ? { borderLeft: '1px solid var(--app-separator)' } : undefined}>
          <p className="font-black" style={{ color: stat.color }}>{stat.val}</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--app-text-tertiary)' }}>{stat.label}</p>
        </div>
      ))}
    </div>
  );

  return (
    <AuthGuard>
      <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--app-bg)' }}>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Spinner size={28} /></div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-6"><ErrorView message={error} onRetry={load} /></div>
        ) : subjects.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <EmptyView icon={<BarChart2 size={56} color="var(--app-text-tertiary)" />} title="Keine Noten" subtitle="Es wurden noch keine Noten erfasst." />
          </div>
        ) : (
          <>
            {/* ════ MOBILE (< lg) ════ */}
            <div className="lg:hidden flex-1 overflow-y-auto">
              <div className="px-4 pt-5 pb-3">
                <h1 className="text-[26px] font-black tracking-tight" style={{ color: 'var(--app-text-primary)' }}>Noten</h1>
              </div>
              <div className="px-4 pb-10 flex flex-col gap-3">
                {/* Overview */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
                  <div className="px-5 pt-5 pb-4 flex items-center justify-between gap-4"
                    style={{ background: overallAvg != null ? `linear-gradient(135deg, color-mix(in srgb, ${averageColor(overallAvg)} 14%, var(--app-surface)) 0%, var(--app-surface) 65%)` : undefined }}>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--app-text-tertiary)' }}>Gesamtschnitt</p>
                      <p className="text-5xl font-black leading-none tabular-nums" style={{ color: overallAvg != null ? averageColor(overallAvg) : 'var(--app-text-primary)' }}>
                        {overallAvg != null ? overallAvg.toFixed(2) : '–'}
                      </p>
                      <div className="mt-2"><OverallSparkline subjects={subjects} /></div>
                    </div>
                    <DonutChart subjects={subjects} size={110} />
                  </div>
                  {statsBar}
                </div>
                {subjects.map((s) => (
                  <MobileSubjectRow key={s.lessonId} s={s} onOpen={() => setSheet(s)} />
                ))}
              </div>
            </div>

            {/* ════ DESKTOP (≥ lg) ════ */}
            <div className="hidden lg:flex flex-1 overflow-hidden">

              {/* ── Left sidebar ── */}
              <div className="flex flex-col overflow-hidden flex-shrink-0"
                style={{ width: '360px', borderRight: '1px solid var(--app-border)' }}>
                {/* Sidebar header */}
                <div className="px-5 pt-5 pb-4 flex-shrink-0">
                  <h1 className="text-xl font-black tracking-tight" style={{ color: 'var(--app-text-primary)' }}>Noten</h1>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
                    {subjects.length} Fächer · {allGrades.length} Noten
                  </p>
                </div>

                {/* Compact overview card */}
                <div className="px-3 pb-3 flex-shrink-0">
                  <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
                    <div className="px-4 pt-4 pb-3 flex items-center gap-3"
                      style={{ background: overallAvg != null ? `linear-gradient(135deg, color-mix(in srgb, ${averageColor(overallAvg)} 14%, var(--app-surface)) 0%, var(--app-surface) 65%)` : undefined }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--app-text-tertiary)' }}>Gesamtschnitt</p>
                        <p className="text-4xl font-black leading-none tabular-nums" style={{ color: overallAvg != null ? averageColor(overallAvg) : 'var(--app-text-primary)' }}>
                          {overallAvg != null ? overallAvg.toFixed(2) : '–'}
                        </p>
                        <div className="mt-2"><OverallSparkline subjects={subjects} size="lg" /></div>
                      </div>
                      <DonutChart subjects={subjects} size={100} />
                    </div>
                    {statsBar}
                  </div>
                </div>

                {/* Subject list */}
                <div className="flex-1 overflow-y-auto px-3 pb-4">
                  <p className="text-[9px] font-semibold uppercase tracking-widest mb-1.5 px-1" style={{ color: 'var(--app-text-tertiary)' }}>Fächer</p>
                  <div className="flex flex-col gap-0.5">
                    {subjects.map((s) => (
                      <SidebarRow key={s.lessonId} s={s} active={selected?.lessonId === s.lessonId} onClick={() => setSelected(s)} />
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Right detail panel ── */}
              <div className="flex-1 overflow-y-auto">
                {selected ? (
                  <div className="max-w-xl mx-auto px-6 py-6">
                    {/* Panel header */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                        style={{ background: averageColor(selected.average) }}>
                        {selected.average > 0 ? selected.average.toFixed(1) : '–'}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black leading-tight" style={{ color: 'var(--app-text-primary)' }}>
                          {selected.subjectName}
                        </h2>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
                          {selected.teacherName} · {selected.grades.length} {selected.grades.length === 1 ? 'Note' : 'Noten'}
                        </p>
                      </div>
                    </div>
                    <SubjectDetail subject={selected} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-2" style={{ color: 'var(--app-text-tertiary)' }}>
                    <BarChart2 size={36} />
                    <p className="text-sm">Fach aus der Liste wählen</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {sheet && <MobileSheet subject={sheet} onClose={() => setSheet(null)} />}
      </div>
    </AuthGuard>
  );
}
