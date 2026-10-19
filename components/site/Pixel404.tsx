import type { CSSProperties } from 'react';

// The 404 in pixel art, in the style of the app's pixel scenes (rounded
// pixels, the app's own colours): three chunky digits that drop into place
// one after the other, a question mark blinking inside the zero, and a
// tumbleweed rolling past a cactus underneath, because there is nothing here.
// Plain SVG with CSS animation (globals.css, .nf-*), so the standalone 404
// document can use it too.

type Px = [number, number];

function pixels(rows: string[], ox = 0, oy = 0): Px[] {
  const out: Px[] = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') out.push([ox + x, oy + y]); }));
  return out;
}

const FOUR = [
  '....##.',
  '...###.',
  '..####.',
  '.##.##.',
  '##..##.',
  '#######',
  '#######',
  '....##.',
  '....##.',
];
const ZERO = [
  '.#####.',
  '##...##',
  '##...##',
  '##...##',
  '##...##',
  '##...##',
  '##...##',
  '##...##',
  '.#####.',
];
const QUESTION = ['.#.', '#.#', '..#', '.#.', '...', '.#.'];

const W = 52;
const H = 20;
const DIGITS_X = [11, 22, 33] as const;
const DIGITS_Y = 1;

const GROUND = pixels(['####.######.#####..#######.####.#####.####.#######.#'], 0, 17);
const CACTUS = pixels([
  '...#...',
  '..###..',
  '..###.#',
  '#.###.#',
  '#.###.#',
  '#.#####',
  '#####..',
  '..###..',
  '..###..',
], 44, 8);
const WEED = pixels(['.####.', '#.#..#', '##.##.', '#.##.#', '#..#.#', '.####.'], 0, 11);
const DUST = pixels(['..#', '#..'], -4, 15);

function Group({ list, className, fill, style }: { list: Px[]; className?: string; fill: string; style?: CSSProperties }) {
  return (
    <g className={className} fill={fill} style={style}>
      {list.map(([x, y]) => <rect key={`${x}-${y}`} x={x + 0.06} y={y + 0.06} width={0.88} height={0.88} rx={0.2} />)}
    </g>
  );
}

export default function Pixel404({ className = '', label }: { className?: string; label?: string }) {
  const digits = [FOUR, ZERO, FOUR];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`nf-art ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <Group list={GROUND} fill="var(--nf-faint)" />
      <Group list={CACTUS} fill="var(--nf-cactus)" />
      {digits.map((rows, i) => (
        <g key={i} className="nf-digit" style={{ animationDelay: `${0.12 + i * 0.14}s` }}>
          {/* A darker copy one pixel down and right: the digits stand out of the page */}
          <Group list={pixels(rows, DIGITS_X[i] + 1, DIGITS_Y + 1)} fill="var(--nf-depth)" />
          <Group list={pixels(rows, DIGITS_X[i], DIGITS_Y)} fill="var(--nf-ink)" />
        </g>
      ))}
      <Group list={pixels(QUESTION, DIGITS_X[1] + 2, DIGITS_Y + 2)} className="nf-question" fill="var(--nf-star)" />
      <g className="nf-tumble">
        <Group list={DUST} className="nf-dust" fill="var(--nf-faint)" />
        <g className="nf-hop">
          <Group list={WEED} className="nf-turn" fill="var(--nf-weed)" />
        </g>
      </g>
    </svg>
  );
}
