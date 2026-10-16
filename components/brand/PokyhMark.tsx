'use client';

import { useEffect, useState } from 'react';
import { schoolClock } from '@/lib/school-day';

// The POKYH mark: a plate that is also a clock face (12 ticks, "P" in the
// middle), flanked by fork and knife. Drawn flat from the Android vector
// (res/drawable/ic_pokyh_mark.xml). `tile` bakes in the indigo square of the
// app icon; without it the glyph uses currentColor. `live` puts an indigo dot
// on the rim at the school's current time.

// Rounded so server and client render byte-identical attributes.
const r2d = (v: number) => Math.round(v * 100) / 100;
const TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const r1 = 24;
  const r2 = i % 3 === 0 ? 19.5 : 21;
  return {
    x1: r2d(54 + Math.sin(a) * r1),
    y1: r2d(54 - Math.cos(a) * r1),
    x2: r2d(54 + Math.sin(a) * r2),
    y2: r2d(54 - Math.cos(a) * r2),
  };
});

function useSchoolMinute(enabled: boolean): number | null {
  const [minute, setMinute] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const tick = () => setMinute(schoolClock().minute);
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [enabled]);
  return minute;
}

export default function PokyhMark({
  size = 32,
  tile = false,
  live = false,
  className,
  title,
}: {
  size?: number;
  tile?: boolean;
  live?: boolean;
  className?: string;
  title?: string;
}) {
  const minute = useSchoolMinute(live);
  const fg = tile ? '#FFFFFF' : 'currentColor';
  const angle = minute == null ? 0 : ((minute % 720) / 720) * Math.PI * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 108 108"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {tile && <rect width="108" height="108" rx="26" fill="#5B54D6" />}
      {tile && <circle cx="54" cy="54" r="26" fill="#3F3994" />}
      <circle cx="54" cy="54" r="27" fill="none" stroke={fg} strokeWidth="3.4" />
      <g stroke={fg} strokeWidth="2.4" strokeLinecap="round" opacity={tile ? 0.75 : 0.5}>
        {TICKS.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
        ))}
      </g>
      <path
        fill={fg}
        d="M46.4 41h7.4c5 0 9.1 4.1 9.1 9.1s-4.1 9.1-9.1 9.1h-3v7.6h-4.4V41Zm4.4 4.2v9.8c2.7 0 4.9-2.2 4.9-4.9s-2.2-4.9-4.9-4.9Z"
      />
      <path fill={fg} d="M10 26h2v13h-2zM14 26h2v13h-2zM18 26h2v13h-2zM10 39h10l-3 5h-4zM13.6 44h2.8v38h-2.8z" />
      <path fill={fg} d="M93 46V30c0-3 1.4-5.2 3.4-6.4V82h-2.8V46Z" />
      {minute != null && (
        <circle
          cx={r2d(54 + Math.sin(angle) * 27)}
          cy={r2d(54 - Math.cos(angle) * 27)}
          r="5.2"
          fill="#6366F1"
          stroke={tile ? '#5B54D6' : 'var(--canvas)'}
          strokeWidth="2.4"
        />
      )}
    </svg>
  );
}
