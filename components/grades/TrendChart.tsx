'use client';

import { useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { fmtNum } from '@/lib/grades';

// The grade trend of one subject, read at a glance. A legend says what the
// lines are: the grades in the order they were given (straight lines between
// them, as each grade is a single event, with a faint wash under it), the
// running average as a quieter line that ends in its current value, and the
// pass mark (6) as a dashed threshold with the band below it barely tinted.
// Only the latest grade carries its number; every other value is in the
// list below and in the card that follows the pointer or the arrow keys.
// Grades below the pass mark are red dots; simulated ones are hollow on a
// dashed stretch. The lines draw themselves in when the grades change.

export interface TrendPoint {
  value: number;
  date: number;
  label: string;
  isCustom: boolean;
}

const PAD = { top: 26, right: 58, bottom: 34, left: 30 };

function linePath(pts: Array<{ x: number; y: number }>): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

export default function TrendChart({
  points,
  dateText,
  averageLabel,
  ownLabel,
  gradesLabel,
  passLabel,
}: {
  points: TrendPoint[];
  dateText: (d: number) => string;
  averageLabel: string;
  ownLabel: string;
  /** Legend name of the grade line. */
  gradesLabel: string;
  /** Legend name of the pass mark, e.g. "Genügend ab 6". */
  passLabel: string;
}) {
  const id = useId().replace(/:/g, '');
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  const H = w < 480 ? 250 : 290;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setW(Math.max(280, el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const values = points.map((p) => p.value);
  const yMin = Math.min(4, Math.floor(Math.min(...values, 10)));
  const yMax = 10;
  const innerW = w - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * innerH;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);

  const geo = useMemo(() => {
    const pts = points.map((p, i) => ({ x: x(i), y: y(p.value), p }));
    let sum = 0;
    const avg = points.map((p, i) => {
      sum += p.value;
      return { x: x(i), y: y(sum / (i + 1)), v: sum / (i + 1) };
    });
    const lastReal = points.reduce((last, p, i) => (!p.isCustom ? i : last), -1);
    const real = lastReal >= 0 ? pts.slice(0, lastReal + 1) : [];
    const sim = lastReal >= 0 && lastReal < pts.length - 1 ? pts.slice(lastReal) : lastReal < 0 ? pts : [];
    const line = linePath(real);
    const base = PAD.top + innerH;
    const area = real.length > 1 ? `${line} L${real[real.length - 1].x.toFixed(1)},${base} L${real[0].x.toFixed(1)},${base} Z` : '';
    return { pts, avg, line, area, simLine: sim.length > 1 ? linePath(sim) : '', avgLine: linePath(avg) };
    // x and y are derived from w, H, yMin and the point count only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, w, H, yMin]);

  // Restart the drawing animation whenever the grades change.
  const drawKey = points.map((p) => `${p.value}${p.isCustom ? 'c' : ''}`).join('|') + `@${Math.round(w / 40)}`;
  const grid = Array.from({ length: yMax - yMin + 1 }, (_, i) => yMax - i);
  const passY = y(6);
  const last = geo.pts[geo.pts.length - 1];
  const lastAvg = geo.avg[geo.avg.length - 1];
  const hp = hover !== null ? geo.pts[hover] : null;
  const ha = hover !== null ? geo.avg[hover] : null;
  const hasCustom = points.some((p) => p.isCustom);

  // Dates under the axis: as many as fit, the first and last always, set
  // inward at the edges so they are never cut off.
  const fit = Math.max(2, Math.floor(innerW / 84));
  const labelEvery = Math.max(1, Math.ceil(points.length / fit));
  const dateIdx = points.map((_, i) => i).filter((i) => i % labelEvery === 0);
  if (points.length && dateIdx[dateIdx.length - 1] !== points.length - 1) {
    if (dateIdx.length > 1 && x(points.length - 1) - x(dateIdx[dateIdx.length - 1]) < 70) dateIdx.pop();
    dateIdx.push(points.length - 1);
  }

  function nearest(px: number) {
    let best = 0;
    let dist = Infinity;
    geo.pts.forEach((p, i) => {
      const d = Math.abs(p.x - px);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  }
  function onMove(e: PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(nearest(e.clientX - r.left));
  }
  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    const n = points.length;
    if (!n) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setHover((h) => {
        if (e.key === 'Home') return 0;
        if (e.key === 'End') return n - 1;
        const from = h ?? (e.key === 'ArrowRight' ? -1 : n);
        return Math.min(n - 1, Math.max(0, from + (e.key === 'ArrowRight' ? 1 : -1)));
      });
    } else if (e.key === 'Escape') setHover(null);
  }

  // The card sits above the point, or below it when there is no room above.
  const cardW = 168;
  const cardAbove = hp ? hp.y - 96 > 0 : true;

  return (
    <div className="w-full select-none">
      {/* Legend: what each line is */}
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 pb-3 text-[13px] font-semibold text-ink-2">
        <li className="flex items-center gap-2">
          <svg width="22" height="10" aria-hidden="true"><line x1="1" x2="21" y1="5" y2="5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" /><circle cx="11" cy="5" r="3.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5" /></svg>
          {gradesLabel}
        </li>
        {points.length > 1 && (
          <li className="flex items-center gap-2">
            <svg width="22" height="10" aria-hidden="true"><line x1="1" x2="21" y1="5" y2="5" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" /></svg>
            {averageLabel}
          </li>
        )}
        {hasCustom && (
          <li className="flex items-center gap-2">
            <svg width="22" height="10" aria-hidden="true"><line x1="1" x2="21" y1="5" y2="5" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" /><circle cx="11" cy="5" r="3.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" /></svg>
            {ownLabel}
          </li>
        )}
        <li className="flex items-center gap-2">
          <svg width="22" height="10" aria-hidden="true"><line x1="1" x2="21" y1="5" y2="5" stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
          {passLabel}
        </li>
      </ul>

      <div ref={box} className="relative w-full">
        <svg
          width={w}
          height={H}
          viewBox={`0 0 ${w} ${H}`}
          className="block touch-pan-y rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          tabIndex={0}
          role="img"
          aria-label={points.map((p) => `${p.isCustom ? ownLabel : dateText(p.date)}: ${p.label} ${fmtNum(p.value)}`).join(', ')}
        >
          <defs>
            <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Below the pass mark */}
          <rect x={PAD.left} y={passY} width={innerW} height={PAD.top + innerH - passY} fill="var(--danger)" opacity="0.045" />

          {grid.map((g) => (
            <g key={g}>
              {g !== 6 && <line x1={PAD.left} x2={PAD.left + innerW} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeWidth="1" />}
              <text
                x={PAD.left - 10}
                y={y(g)}
                textAnchor="end"
                dominantBaseline="central"
                className={`tnum text-[11.5px] ${g === 6 ? 'fill-[var(--danger-ink)] font-bold' : 'fill-[var(--ink-3)] font-semibold'}`}
              >
                {g}
              </text>
            </g>
          ))}
          <line x1={PAD.left} x2={PAD.left + innerW} y1={passY} y2={passY} stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.7" />

          <g key={drawKey}>
            {geo.area && <path d={geo.area} fill={`url(#fill-${id})`} className="trend-area" />}
            {points.length > 1 && (
              <path d={geo.avgLine} fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" className="trend-fade" />
            )}
            {geo.line && (
              <path d={geo.line} fill="none" stroke="var(--accent)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="trend-draw" />
            )}
            {geo.simLine && (
              <path d={geo.simLine} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 5" className="trend-fade" />
            )}

            {/* The running average's current value, at the end of its line */}
            {points.length > 1 && lastAvg && (
              <text x={lastAvg.x + 10} y={lastAvg.y} dominantBaseline="central" className="trend-fade tnum fill-[var(--ink-2)] text-[12px] font-bold">
                Ø {fmtNum(lastAvg.v)}
              </text>
            )}

            {hp && <line x1={hp.x} x2={hp.x} y1={PAD.top - 8} y2={PAD.top + innerH} stroke="var(--ink)" strokeOpacity="0.16" strokeWidth="1" />}

            {geo.pts.map(({ x: px, y: py, p }, i) => {
              const pass = p.value >= 6;
              const active = hover === i;
              return (
                <g key={i} className="trend-pop" style={{ animationDelay: `${0.2 + (i / Math.max(1, points.length)) * 0.6}s`, transformOrigin: `${px}px ${py}px` }}>
                  <circle
                    cx={px}
                    cy={py}
                    r={active ? 6 : 4.5}
                    fill={p.isCustom ? 'var(--surface)' : pass ? 'var(--accent)' : 'var(--danger)'}
                    stroke={p.isCustom ? 'var(--accent)' : 'var(--surface)'}
                    strokeWidth={2}
                    style={{ transition: 'r 0.2s var(--ease-out)' }}
                  />
                </g>
              );
            })}

            {/* The latest grade carries its number */}
            {last && hover === null && (
              <g className="trend-fade">
                <rect x={last.x - 19} y={last.y - 30} width="38" height="20" rx="10" fill="var(--ink)" />
                <text x={last.x} y={last.y - 20} textAnchor="middle" dominantBaseline="central" className="tnum fill-[var(--canvas)] text-[12px] font-extrabold">
                  {fmtNum(last.p.value)}
                </text>
              </g>
            )}
          </g>

          {dateIdx.map((i) => {
            const px = geo.pts[i].x;
            const anchor = i === 0 && points.length > 1 ? 'start' : i === points.length - 1 && points.length > 1 ? 'end' : 'middle';
            return (
              <text key={`d${i}`} x={anchor === 'start' ? px - 4 : anchor === 'end' ? px + 4 : px} y={H - 10} textAnchor={anchor} className="fill-[var(--ink-3)] text-[11px] font-semibold">
                {points[i].isCustom ? ownLabel : dateText(points[i].date)}
              </text>
            );
          })}
        </svg>

        {hp && ha && (
          <div
            className="pointer-events-none absolute z-10 rounded-[14px] bg-surface px-3 py-2.5 shadow-[var(--shadow-float)] [animation:rise_0.16s_var(--ease-out)_both]"
            style={{
              width: cardW,
              left: Math.min(Math.max(hp.x - cardW / 2, 0), w - cardW),
              top: cardAbove ? hp.y - 92 : hp.y + 16,
            }}
          >
            <p className="truncate text-[12px] font-semibold text-ink-3">{hp.p.isCustom ? ownLabel : dateText(hp.p.date)} · {hp.p.label}</p>
            <div className="mt-1.5 flex items-end justify-between gap-3">
              <span className={`text-[24px] font-extrabold leading-none tracking-[-0.04em] ${hp.p.value >= 6 ? 'text-ink' : 'text-danger-ink'}`}>{fmtNum(hp.p.value)}</span>
              <span className="text-right text-[11.5px] leading-tight text-ink-2">
                {averageLabel}
                <span className="block text-[14px] font-bold text-ink tnum">Ø {fmtNum(ha.v)}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
