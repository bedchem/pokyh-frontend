'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { pixelLines, pixelPath, pixelWidth } from './pixelFont';

// Text in the recap's pixel font (./pixelFont.ts), as large as `size` CSS
// pixels per font pixel and as small as needed to fit its box: a figure
// shrinks to one line, a name may wrap onto `lines` lines first. Whole
// pixels only, so it stays crisp. Read out as the plain text.

// The largest size from `size` down to `min` at which the text fits `width` on `lines` lines.
function fitText(text: string, width: number, size: number, min: number, lines: number): { lines: string[]; size: number } {
  if (!width) return { lines: [text], size };
  for (let s = size; s >= min; s--) {
    const fit = Math.floor(width / s);
    const set = lines > 1 ? pixelLines(text, fit) : [text];
    if (set.length <= lines && Math.max(...set.map(pixelWidth)) <= fit) return { lines: set, size: s };
  }
  return { lines: lines > 1 ? pixelLines(text, Math.floor(width / min)).slice(0, lines) : [text], size: min };
}

export default function PixelText({
  text,
  size,
  min = 2,
  lines = 1,
  align = 'left',
  className = '',
}: {
  text: string;
  /** CSS pixels per font pixel at most. */
  size: number;
  min?: number;
  /** Lines it may wrap onto before it shrinks. */
  lines?: number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}) {
  const box = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layout = fitText(text, width, size, min, lines);

  const path = pixelPath(layout.lines, 1, align);
  return (
    <span ref={box} className={className} style={{ display: 'block', textAlign: align }}>
      <svg
        role="img"
        aria-label={text}
        width={path.width * layout.size}
        height={path.height * layout.size}
        viewBox={`0 0 ${Math.max(1, path.width)} ${Math.max(1, path.height)}`}
        shapeRendering="crispEdges"
        style={{ display: 'inline-block', maxWidth: '100%', height: 'auto', overflow: 'visible' }}
      >
        <path d={path.d} fill="currentColor" />
      </svg>
    </span>
  );
}
