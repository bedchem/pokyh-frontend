import type { CSSProperties } from 'react';
import s from './skeleton.module.css';

// Loading placeholders shaped like what they stand for (see skeleton.module.css
// for the shared sweep). Text lines are `Line`, round things `Dot`, anything
// else `Bone`; the composed placeholders below match the real rows.

export function Bone({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={`${s.sk} ${className}`} style={style} />;
}

/** A line of text: `w` is its width, the height follows the type size. */
export function Line({ w = '60%', h = 12, className = '' }: { w?: string | number; h?: number; className?: string }) {
  return <Bone className={`!rounded-full ${className}`} style={{ width: w, height: h }} />;
}

export function Dot({ size = 40, className = '' }: { size?: number; className?: string }) {
  return <Bone className={`!rounded-full shrink-0 ${className}`} style={{ width: size, height: size }} />;
}

/** Screen-reader text for a loading region; the placeholders themselves are hidden. */
export function LoadingLabel({ children }: { children: string }) {
  return <span role="status" className="visually-hidden">{children}</span>;
}

/** Rows of a list card: an optional leading column, a bar, two lines and a trailing chip. */
export function RowsSkeleton({
  rows = 3,
  lead = 'square',
  trailing = false,
  bare = false,
}: {
  rows?: number;
  lead?: 'time' | 'square' | 'round' | 'none';
  trailing?: boolean;
  /** Rows straight on the canvas instead of inside a card. */
  bare?: boolean;
}) {
  // Slightly different widths per row read as text, identical ones as a grid.
  const widths = ['62%', '48%', '70%', '54%', '66%', '44%'];
  return (
    <span aria-hidden="true" className={`flex flex-col gap-0.5 text-ink ${bare ? '' : 'squircle rounded-[24px] bg-surface p-2'}`}>
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="flex items-center gap-3.5 px-3 py-3">
          {lead === 'time' && (
            <span className="flex w-[46px] shrink-0 flex-col gap-1.5">
              <Line w={40} h={11} />
              <Line w={34} h={11} />
            </span>
          )}
          {lead === 'time' && <Bone className="!rounded-full" style={{ width: 6, height: 38 }} />}
          {lead === 'square' && <Bone className="!rounded-[13px] shrink-0" style={{ width: 44, height: 44 }} />}
          {lead === 'round' && <Dot size={44} />}
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <Line w={widths[i % widths.length]} h={14} />
            <Line w={`calc(${widths[(i + 2) % widths.length]} - 18%)`} h={11} />
          </span>
          {trailing && <Line w={i % 2 ? 38 : 52} h={22} />}
        </span>
      ))}
    </span>
  );
}

