'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDateLocale, useT } from '@/providers/LocaleProvider';
import { profileDict } from '@/lib/i18n/dictionaries/profile';
import { levelOf, type ActivityDay } from '@/lib/account-activity';
import { Bone } from './Skeleton';

// The profile's activity, drawn the way GitHub draws contributions: one
// column per week (Monday on top), one square per day, the stronger the
// indigo the more was going on. Hover, focus or tap a day for its figures.
// The squares come in column by column when the grid appears. A whole school
// year draws smaller squares; where it is wider than the screen, it opens at
// today and scrolls back.

const LEVEL_BG = [
  'color-mix(in srgb, var(--ink) 7%, transparent)',
  'color-mix(in srgb, var(--accent) 28%, transparent)',
  'color-mix(in srgb, var(--accent) 48%, transparent)',
  'color-mix(in srgb, var(--accent) 72%, transparent)',
  'var(--accent)',
];

function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function ActivityGridSkeleton({ weeks = 14 }: { weeks?: number }) {
  return (
    <div aria-hidden="true" className="grid w-fit gap-[5px] text-ink" style={{ gridTemplateColumns: `repeat(${weeks}, 24px)`, gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, 24px)' }}>
      {Array.from({ length: weeks * 7 }, (_, i) => <Bone key={i} className="!rounded-[6px]" />)}
    </div>
  );
}

export default function ActivityGrid({ days }: { days: ActivityDay[] }) {
  const t = useT(profileDict);
  const { tag } = useDateLocale();
  const [active, setActive] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const { cells, weeks, months } = useMemo(() => {
    const first = days[0] ? parseDay(days[0].date) : new Date();
    const lead = (first.getDay() + 6) % 7; // Monday = 0
    const list: Array<ActivityDay | null> = [...Array.from({ length: lead }, () => null), ...days];
    const weekCount = Math.ceil(list.length / 7);
    const labels: Array<{ col: number; label: string }> = [];
    let lastMonth = -1;
    for (let col = 0; col < weekCount; col++) {
      const day = list.slice(col * 7, col * 7 + 7).find((d): d is ActivityDay => d !== null);
      if (!day) continue;
      const m = parseDay(day.date).getMonth();
      if (m !== lastMonth) {
        labels.push({ col, label: parseDay(day.date).toLocaleDateString(tag, { month: 'short' }) });
        lastMonth = m;
      }
    }
    return { cells: list, weeks: weekCount, months: labels };
  }, [days, tag]);

  const describe = (d: ActivityDay) => {
    const date = parseDay(d.date).toLocaleDateString(tag, { weekday: 'short', day: 'numeric', month: 'short' });
    if (!d.active) return `${date} · ${t('cellNone')}`;
    const parts = [date];
    if (d.logins) parts.push(d.logins === 1 ? t('cellLoginOne') : t('cellLogins', { n: d.logins }));
    if (d.activeSeconds >= 60) {
      const m = Math.round(d.activeSeconds / 60);
      parts.push(t('cellMinutes', { d: m < 60 ? t('minutes', { n: m }) : t('hoursMinutes', { h: Math.floor(m / 60), m: m % 60 }) }));
    }
    if (parts.length === 1) parts.push(t('daysOnline').replace(/^\w/, (c) => c));
    return parts.join(' · ');
  };

  const weekdayLabels = useMemo(() => {
    const monday = new Date(2024, 0, 1); // a Monday
    return [0, 2, 4].map((i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { row: i, label: d.toLocaleDateString(tag, { weekday: 'short' }).replace('.', '') };
    });
  }, [tag]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks]);

  const shown = active !== null ? cells[active] : null;
  const col = active !== null ? Math.floor(active / 7) : 0;
  const row = active !== null ? active % 7 : 0;
  const CELL = 'var(--cell)';
  const GAP = 'var(--gap)';
  const dense = weeks > 20;
  const stagger = Math.min(28, 900 / Math.max(1, weeks));

  return (
    <div ref={scroller} className="overflow-x-auto pb-1 [scrollbar-width:none]">
      <div
        className={`relative w-fit ${dense ? '[--cell:13px] [--gap:3px] sm:[--cell:15px] lg:[--cell:16px]' : '[--cell:20px] [--gap:5px] sm:[--cell:24px]'}`}
        onMouseLeave={() => setActive(null)}
      >
        <div className="mb-2 grid pl-9 text-[12px] font-semibold text-ink-3" style={{ gridTemplateColumns: `repeat(${weeks}, calc(${CELL} + ${GAP}))` }} aria-hidden="true">
          {months.map((m) => (
            <span key={m.col} style={{ gridColumnStart: m.col + 1 }} className="whitespace-nowrap">{m.label}</span>
          ))}
        </div>
        <div className="flex">
          <div className="relative w-9 shrink-0 text-[12px] font-semibold text-ink-3" aria-hidden="true">
            {weekdayLabels.map((w) => (
              <span key={w.row} className="absolute left-0" style={{ top: `calc(${w.row} * (${CELL} + ${GAP}) + ${CELL} / 2 - 8px)` }}>{w.label}</span>
            ))}
          </div>
          <div
            role="grid"
            aria-label={t('activity')}
            className="grid gap-[var(--gap)]"
            style={{ gridTemplateColumns: `repeat(${weeks}, ${CELL})`, gridTemplateRows: `repeat(7, ${CELL})`, gridAutoFlow: 'column' }}
          >
            {cells.map((d, i) =>
              d ? (
                <button
                  key={d.date}
                  type="button"
                  role="gridcell"
                  aria-label={describe(d)}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive(i)}
                  className={`${dense ? 'rounded-[4px]' : 'rounded-[6px]'} outline-offset-2 transition-[transform,background-color] duration-200 hover:scale-[1.18] [animation:grid-cell-in_0.5s_var(--ease-out)_both]`}
                  style={{
                    background: LEVEL_BG[levelOf(d)],
                    animationDelay: `${Math.round(Math.floor(i / 7) * stagger)}ms`,
                    boxShadow: i === cells.length - 1 ? '0 0 0 2px var(--canvas), 0 0 0 3.5px color-mix(in srgb, var(--ink) 35%, transparent)' : undefined,
                  }}
                />
              ) : (
                <span key={`pad-${i}`} aria-hidden="true" />
              ),
            )}
          </div>
        </div>

        {shown && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[10px] bg-ink px-2.5 py-1.5 text-[12.5px] font-semibold text-canvas dark:bg-[#2E2E34] dark:text-ink shadow-[var(--shadow-float)] [animation:rise_0.18s_var(--ease-out)_both]"
            style={{
              left: `calc(36px + ${col} * (${CELL} + ${GAP}) + ${CELL} / 2)`,
              top: `calc(26px + ${row} * (${CELL} + ${GAP}) - 6px)`,
            }}
          >
            {describe(shown)}
          </div>
        )}
      </div>
    </div>
  );
}

export function GridLegend() {
  const t = useT(profileDict);
  return (
    <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-3">
      <span className="mr-1">{t('less')}</span>
      {LEVEL_BG.map((bg, i) => <span key={i} className="size-3.5 rounded-[4px]" style={{ background: bg }} aria-hidden="true" />)}
      <span className="ml-1">{t('more')}</span>
    </div>
  );
}
