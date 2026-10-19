import type { CSSProperties } from 'react';

// The 404 in pixel art, in the style of the app's pixel scenes (rounded
// pixels, the app's own colours): three chunky digits that drop into place
// one after the other, and next to them the missing page as a ghost: a sheet
// of ruled school paper with a folded corner, two eyes and a fluttering hem.
// It floats up and down, fades now and then, blinks; its shadow on the ground
// shrinks as it rises. Plain SVG with CSS animation (globals.css, .nf-*), so
// the standalone 404 document can use it too.

type Px = [number, number];

function pixels(rows: string[], ox = 0, oy = 0): Px[] {
  const out: Px[] = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') out.push([ox + x, oy + y]); }));
  return out;
}

/** The pixels around a shape, for an outline that holds on a light background. */
function outline(shape: Px[]): Px[] {
  const on = new Set(shape.map(([x, y]) => `${x},${y}`));
  const out = new Map<string, Px>();
  for (const [x, y] of shape) {
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]] as Px[]) {
      if (!on.has(`${nx},${ny}`)) out.set(`${nx},${ny}`, [nx, ny]);
    }
  }
  return [...out.values()];
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

const W = 60;
const H = 20;
const DIGITS_X = [5, 16, 27] as const;
const DIGITS_Y = 1;

const GROUND = pixels(['####.######.#####..#######.####.#####.####.#######.####.###'], 0, 17);

// The ghost; (GX, GY) is the top left of the sheet.
const GX = 41;
const GY = 3;
const SHEET = pixels([
  '.#######...',
  '#########..',
  '##########.',
  '###########',
  '###########',
  '###########',
  '###########',
  '###########',
  '###########',
  '###########',
], GX, GY);
// The hem flutters between two frames.
const HEM_A = pixels(['#.##.##.##.'], GX, GY + 10);
const HEM_B = pixels(['.##.##.##.#'], GX, GY + 10);
const OUTLINE_A = outline([...SHEET, ...HEM_A]);
const OUTLINE_B = outline([...SHEET, ...HEM_B]);
// The top right corner is folded down.
const FOLD = pixels(['#..', '##.'], GX + 8, GY + 1);
const LINES = pixels([
  '.######....',
  '...........',
  '...........',
  '...........',
  '...........',
  '...........',
  '.#########.',
], GX, GY + 2);
const EYES = pixels(['#...#', '#...#'], GX + 3, GY + 4);
const EYES_SHUT = pixels(['#...#'], GX + 3, GY + 5);
const CHEEKS = pixels(['#.....#'], GX + 2, GY + 6);
const MOUTH = pixels(['#'], GX + 5, GY + 7);
// Its shadow: wide while it hangs low, narrow when it rises.
const SHADOW_WIDE = pixels(['#.#.#.#.#'], GX + 1, 16);
const SHADOW_NARROW = pixels(['#.#.#'], GX + 3, 16);

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
      {digits.map((rows, i) => (
        <g key={i} className="nf-digit" style={{ animationDelay: `${0.12 + i * 0.14}s` }}>
          {/* A darker copy one pixel down and right: the digits stand out of the page */}
          <Group list={pixels(rows, DIGITS_X[i] + 1, DIGITS_Y + 1)} fill="var(--nf-depth)" />
          <Group list={pixels(rows, DIGITS_X[i], DIGITS_Y)} fill="var(--nf-ink)" />
        </g>
      ))}

      <Group list={SHADOW_WIDE} className="nf-shadow" fill="var(--nf-faint)" />
      <Group list={SHADOW_NARROW} className="nf-shadow nf-shadow-high" fill="var(--nf-faint)" />
      <g className="nf-ghost">
        <g className="nf-fade">
          <g className="nf-hem">
            <Group list={OUTLINE_A} fill="var(--nf-outline)" />
            <Group list={HEM_A} fill="var(--nf-paper)" />
          </g>
          <g className="nf-hem nf-hem-alt">
            <Group list={OUTLINE_B} fill="var(--nf-outline)" />
            <Group list={HEM_B} fill="var(--nf-paper)" />
          </g>
          <Group list={SHEET} fill="var(--nf-paper)" />
          <Group list={FOLD} fill="var(--nf-fold)" />
          <Group list={LINES} fill="var(--nf-line)" />
          <Group list={CHEEKS} fill="var(--nf-cheek)" />
          <Group list={EYES} className="nf-eyes" fill="var(--nf-eye)" />
          <Group list={EYES_SHUT} className="nf-eyes nf-eyes-shut" fill="var(--nf-eye)" />
          <Group list={MOUTH} fill="var(--nf-eye)" />
        </g>
      </g>
    </svg>
  );
}
