import { TONE, type SiteTone } from './PageIntro';

// A person on GitHub, drawn the way GitHub draws a year of work: a grid of
// small squares, seven rows deep. Here the squares spell the first letter of
// the name; the rest is quiet background activity (decorative, not real
// data). On hover the letter lights up from left to right. Nothing is loaded
// from GitHub itself.

const ROWS = 7;
const COLS = 19;

// 5 × 7 pixel letters, one string per row.
const GLYPHS: Record<string, string[]> = {
  N: ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X', 'X...X', 'X...X'],
  R: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'],
  P: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X....', 'X....', 'X....'],
};

/** Deterministic noise in 0..1, so server and browser draw the same grid. */
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export default function GithubCard({
  name,
  handle,
  tone,
  label,
}: {
  name: string;
  handle: string;
  tone: SiteTone;
  label: string;
}) {
  const glyph = GLYPHS[name[0].toUpperCase()] ?? GLYPHS.P;
  const start = Math.floor((COLS - 5) / 2);
  const seed = [...handle].reduce((a, c) => a + c.charCodeAt(0), 0);

  const cells = Array.from({ length: ROWS * COLS }, (_, i) => {
    // Column-major, like GitHub: weeks left to right, days top to bottom.
    const col = Math.floor(i / ROWS);
    const row = i % ROWS;
    const on = col >= start && col < start + 5 && glyph[row][col - start] === 'X';
    const n = noise(seed + i);
    const level = on ? 4 : n > 0.9 ? 2 : n > 0.68 ? 1 : 0;
    return { col, row, on, level };
  });

  return (
    <a
      href={`https://github.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`gh-card squircle group block rounded-[28px] p-5 md:rounded-[36px] md:p-8 ${TONE[tone]}`}
    >
      <div
        aria-hidden="true"
        className="grid gap-[3px] md:gap-1"
        style={{ gridTemplateRows: `repeat(${ROWS}, 1fr)`, gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridAutoFlow: 'column' }}
      >
        {cells.map((c, i) => (
          <span
            key={i}
            data-on={c.on ? '' : undefined}
            className={`gh-cell aspect-square rounded-[3px] md:rounded-[4px] gh-l${c.level}`}
            style={{ transitionDelay: `${c.col * 22}ms` }}
          />
        ))}
      </div>
      <div className="mt-7 flex flex-wrap items-end justify-between gap-4 md:mt-9">
        <div>
          <p className="text-[clamp(40px,5.4vw,76px)] font-extrabold leading-[0.9] tracking-[-0.055em]">{name}</p>
          <p className="mono mt-3 text-[15px] opacity-80">@{handle}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold">
          <span className="border-b-2 border-current pb-0.5">{label}</span>
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
        </span>
      </div>
    </a>
  );
}
