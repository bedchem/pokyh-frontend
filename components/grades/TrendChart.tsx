'use client';

import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

// The grade trend of one subject. A smooth curve through the grades in the
// order they were given (monotone, so it never swings past a grade), a soft
// fill under it, and a thinner line for the running average. The pass mark
// (6) is drawn across, the band below it faintly red. Points are green when
// passing and red when not; simulated grades are hollow on a dashed stretch.
// The curve draws itself in when the grades change; hovering shows a card.

export interface TrendPoint {
  value: number;
  date: number;
  label: string;
  isCustom: boolean;
}

const H = 300;
const PAD = { top: 34, right: 18, bottom: 34, left: 34 };

/** Monotone cubic (Fritsch–Carlson) through points, as an SVG path. */
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0].x},${pts[0].y}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    m.push((pts[i + 1].y - pts[i].y) / (dx[i] || 1));
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t.push(0);
    else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      t.push((w1 + w2) / (w1 / m[i - 1] + w2 / m[i]));
    }
  }
  t.push(m[n - 2]);
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${pts[i].x + h},${pts[i].y + t[i] * h} ${pts[i + 1].x - h},${pts[i + 1].y - t[i + 1] * h} ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
}

function fmt(v: number): string {
  return String(Math.round(v * 100) / 100);
}

export default function TrendChart({
  points,
  dateText,
  averageLabel,
  ownLabel,
  passLabel,
}: {
  points: TrendPoint[];
  dateText: (d: number) => string;
  averageLabel: string;
  ownLabel: string;
  passLabel: string;
}) {
  const id = useId().replace(/:/g, '');
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

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
    const line = smoothPath(real);
    const area = real.length > 1 ? `${line} L${real[real.length - 1].x},${PAD.top + innerH} L${real[0].x},${PAD.top + innerH} Z` : '';
    return { pts, avg, line, area, simLine: smoothPath(sim), avgLine: smoothPath(avg) };
    // x and y are derived from w, yMin and the point count only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, w, yMin]);

  // Restart the drawing animation whenever the grades change.
  const drawKey = points.map((p) => `${p.value}${p.isCustom ? 'c' : ''}`).join('|') + `@${Math.round(w / 40)}`;
  const grid = Array.from({ length: yMax - yMin + 1 }, (_, i) => yMax - i);
  const passY = y(6);
  const hp = hover !== null ? geo.pts[hover] : null;
  const ha = hover !== null ? geo.avg[hover] : null;
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 90))));

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0;
    let dist = Infinity;
    geo.pts.forEach((p, i) => {
      const d = Math.abs(p.x - px);
      if (d < dist) { dist = d; best = i; }
    });
    setHover(best);
  }

  return (
    <div ref={box} className="relative w-full select-none">
      <svg
        width={w}
        height={H}
        viewBox={`0 0 ${w} ${H}`}
        className="block touch-pan-y"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={points.map((p) => `${p.label} ${fmt(p.value)}`).join(', ')}
      >
        <defs>
          <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`plot-${id}`}>
            <rect x={PAD.left - 6} y={PAD.top - 20} width={innerW + 12} height={innerH + 40} />
          </clipPath>
        </defs>

        {/* Below the pass mark */}
        <rect x={PAD.left} y={passY} width={innerW} height={PAD.top + innerH - passY} fill="var(--danger)" opacity="0.06" rx="10" />

        {grid.map((g) => (
          <g key={g}>
            <line x1={PAD.left} x2={PAD.left + innerW} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeWidth={g === 6 ? 0 : 1} strokeDasharray={g % 2 ? '2 5' : undefined} />
            <text x={PAD.left - 12} y={y(g)} textAnchor="end" dominantBaseline="central" className="fill-[var(--ink-3)] text-[11.5px] font-semibold tnum">{g}</text>
          </g>
        ))}
        <line x1={PAD.left} x2={PAD.left + innerW} y1={passY} y2={passY} stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.6" />
        <text x={PAD.left + innerW} y={passY - 8} textAnchor="end" className="fill-[var(--danger-ink)] text-[11px] font-bold">{passLabel}</text>

        <g clipPath={`url(#plot-${id})`} key={drawKey}>
          {geo.area && <path d={geo.area} fill={`url(#fill-${id})`} className="trend-area" />}
          {points.length > 1 && (
            <path d={geo.avgLine} fill="none" stroke="var(--ink-3)" strokeWidth="1.75" strokeLinecap="round" strokeDasharray="1 5" className="trend-fade" />
          )}
          {geo.line && (
            <path d={geo.line} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="trend-draw" />
          )}
          {geo.simLine && points.some((p) => p.isCustom) && (
            <path d={geo.simLine} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 6" opacity="0.75" className="trend-fade" />
          )}

          {geo.pts.map(({ x: px, y: py, p }, i) => {
            const pass = p.value >= 6;
            const active = hover === i;
            return (
              <g key={i} className="trend-pop" style={{ animationDelay: `${0.25 + (i / Math.max(1, points.length)) * 0.6}s`, transformOrigin: `${px}px ${py}px` }}>
                <circle cx={px} cy={py} r={active ? 9 : 7} fill="var(--surface)" style={{ transition: 'r 0.2s var(--ease-out)' }} />
                <circle
                  cx={px}
                  cy={py}
                  r={active ? 6 : 4.5}
                  fill={p.isCustom ? 'var(--surface)' : pass ? 'var(--success)' : 'var(--danger)'}
                  stroke={p.isCustom ? 'var(--accent)' : 'none'}
                  strokeWidth={p.isCustom ? 2.5 : 0}
                  style={{ transition: 'r 0.2s var(--ease-out)' }}
                />
                {(points.length <= 12 || active) && (
                  <text x={px} y={py - 15} textAnchor="middle" className="fill-[var(--ink)] text-[12px] font-extrabold tnum">{fmt(p.value)}</text>
                )}
              </g>
            );
          })}
        </g>

        {geo.pts.map(({ x: px, p }, i) => (i % labelEvery === 0 || i === points.length - 1) && (
          <text key={`d${i}`} x={px} y={H - 10} textAnchor="middle" className="fill-[var(--ink-3)] text-[11px] font-semibold">
            {p.isCustom ? ownLabel : dateText(p.date)}
          </text>
        ))}

        {hp && <line x1={hp.x} x2={hp.x} y1={PAD.top - 10} y2={PAD.top + innerH} stroke="var(--ink)" strokeOpacity="0.18" strokeWidth="1.5" />}
      </svg>

      {hp && ha && (
        <div
          className="pointer-events-none absolute z-10 min-w-[150px] rounded-[16px] bg-surface p-3 shadow-[var(--shadow-float)] [animation:rise_0.18s_var(--ease-out)_both]"
          style={{
            left: Math.min(Math.max(hp.x - 75, 0), w - 160),
            top: Math.max(0, hp.y - 112),
          }}
        >
          <p className="text-[12px] font-semibold text-ink-3">{hp.p.isCustom ? ownLabel : dateText(hp.p.date)}</p>
          <p className="mt-0.5 truncate text-[13.5px] font-semibold">{hp.p.label}</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <span className={`text-[24px] font-extrabold leading-none tracking-[-0.04em] tnum ${hp.p.value >= 6 ? 'text-success-ink' : 'text-danger-ink'}`}>{fmt(hp.p.value)}</span>
            <span className="text-right text-[12px] text-ink-2">
              {averageLabel}
              <span className="block text-[14px] font-bold text-ink tnum">{ha.v.toFixed(2)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
