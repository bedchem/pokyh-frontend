import type { ReactNode } from 'react';

// Small pixel-art scenes for states where something went wrong or there is
// nothing to show, drawn in the squares of the public pages' GitHub cards
// (rounded pixels, the app's own colours) and animated in steps, like a
// sprite. Reduced motion shows them still (app.css). Below each: the plain
// sentence, the technical reason in small type, and an action.
//
//   unplugged  a plug that keeps reaching for its socket — connection, loading
//   search     a magnifier that finds nothing — something isn't there
//   lock       a padlock whose shackle won't stay shut — the session ended
//   empty      a tumbleweed rolling past a cactus — nothing here yet
//   holiday    a sun, a beach umbrella and rolling waves — a week without school
//   sun        just the sun, rays shining in turns — a day without school
//   cancelled  a calendar page with a blinking cross — every lesson cancelled
//   event      a flag in the wind — a day-long event
//   swap       two arrows trading places — every lesson substituted

export type PixelSprite = 'unplugged' | 'search' | 'lock' | 'empty' | 'holiday' | 'sun' | 'cancelled' | 'event' | 'swap';

type Px = [number, number];

function pixels(rows: string[], ox = 0, oy = 0): Px[] {
  const out: Px[] = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') out.push([ox + x, oy + y]); }));
  return out;
}

function Pixels({ list, className, fill }: { list: Px[]; className?: string; fill: string }) {
  return (
    <g className={className} fill={fill}>
      {list.map(([x, y]) => <rect key={`${x}-${y}`} x={x + 0.06} y={y + 0.06} width={0.88} height={0.88} rx={0.2} />)}
    </g>
  );
}

const FAINT = 'color-mix(in srgb, var(--ink) 20%, transparent)';

// ── unplugged ──
const CABLE = pixels(['#####', '#....', '#....'], 0, 8);
const PLUG = pixels(['#####.', '######', '######', '######', '######', '######', '#####.'], 5, 5);
const PRONGS = pixels(['##', '..', '..', '..', '##'], 11, 6);
const SOCKET = pixels(['.######', '#######', '##.####', '#######', '#######', '#######', '##.####', '#######', '.######'], 19, 4);
const SPARK = pixels(['.#.', '###', '.#.'], 15, 4);
const SPARK2 = pixels(['#.#', '...', '#.#'], 15, 10);

function Unplugged() {
  return (
    <>
      <Pixels list={SOCKET} fill={FAINT} />
      <g className="px-plug">
        <Pixels list={CABLE} fill="var(--ink-3)" />
        <Pixels list={PLUG} fill="var(--accent)" />
        <Pixels list={PRONGS} fill="var(--ink-2)" />
      </g>
      <Pixels list={SPARK} className="px-spark" fill="var(--star)" />
      <Pixels list={SPARK2} className="px-spark px-spark-late" fill="var(--star)" />
    </>
  );
}

// ── search ──
const PAGE_LINES = pixels([
  '########...######..',
  '...................',
  '#####..#########...',
  '...................',
  '######..####..#####',
], 4, 10);
const LENS = pixels(['..###..', '.#...#.', '#.....#', '#.....#', '#.....#', '.#...#.', '..###..'], 0, 0);
const HANDLE = pixels(['#..', '.#.', '..#'], 6, 6);
const QUESTION = pixels(['###', '..#', '.##', '...', '.#.'], 0, 0);

function Search() {
  return (
    <>
      <Pixels list={PAGE_LINES} fill={FAINT} />
      <g className="px-lens">
        <Pixels list={LENS} fill="var(--accent)" />
        <Pixels list={HANDLE} fill="var(--ink-2)" />
      </g>
      <g className="px-question" transform="translate(21 1)">
        <Pixels list={QUESTION} fill="var(--star)" />
      </g>
    </>
  );
}

// ── lock ──
const SHACKLE = pixels(['..#####..', '.#.....#.', '.#.....#.', '.#.....#.'], 9, 1);
const BODY = pixels(['#########', '#########', '####.####', '####.####', '#########', '#########'], 9, 5);
const KEY_GLINT = pixels(['#', '.', '#'], 22, 6);

function Lock() {
  return (
    <>
      <g className="px-shackle">
        <Pixels list={SHACKLE} fill="var(--ink-2)" />
      </g>
      <Pixels list={BODY} fill="var(--accent)" />
      <Pixels list={KEY_GLINT} className="px-spark" fill="var(--star)" />
    </>
  );
}

// ── empty ──
const SAND_LINE = pixels(['###.#######.#####..######.#'], 0, 13);
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
  '..###..',
], 19, 3);
const TUMBLEWEED = pixels([
  '.####.',
  '#.#..#',
  '##.##.',
  '#.##.#',
  '#..#.#',
  '.####.',
], 0, 7);
const DUST = pixels(['..#', '#..'], -4, 11);

function Empty() {
  // The weed rolls across (outer group), hops (middle) and turns a quarter
  // per step (inner); the dust behind it blinks.
  return (
    <>
      <Pixels list={SAND_LINE} fill={FAINT} />
      <Pixels list={CACTUS} fill="var(--success)" />
      <g className="px-tumble" transform="translate(8 0)">
        <Pixels list={DUST} className="px-blink" fill={FAINT} />
        <g className="px-hop">
          <g className="px-turn">
            <Pixels list={TUMBLEWEED} fill="var(--butter-ink)" />
          </g>
        </g>
      </g>
    </>
  );
}

// ── holiday ──
const SUN = pixels(['.###.', '#####', '#####', '#####', '.###.'], 3, 3);
// Eight rays in a full ring: the inner pixel always shines, the tip flickers.
const RAYS_A: Px[] = [[5, 1], [5, 9], [1, 5], [9, 5], [2, 2], [8, 2], [2, 8], [8, 8]];
const RAYS_B: Px[] = [[5, 0], [5, 10], [0, 5], [10, 5], [1, 1], [9, 1], [1, 9], [9, 9]];
const CANOPY_A = pixels(['...###...', '.#.###.#.', '##.###.##'], 14, 3);
const CANOPY_B = pixels(['..#...#..', '.#.#.#.#.', '..#...#..'], 14, 3);
const POLE = pixels(['#', '#', '#', '#', '#', '#', '#'], 18, 6);
const SAND = pixels(['.....######################.'], 0, 13);
const WAVES = pixels([
  '.##...##...##...##...##...##...##..',
  '#..#.#..#.#..#.#..#.#..#.#..#.#..#.',
], -4, 15);

function Holiday() {
  return (
    <>
      <Pixels list={SUN} fill="var(--star)" />
      <Pixels list={RAYS_A} fill="var(--star)" />
      <Pixels list={RAYS_B} className="px-ray" fill="var(--star)" />
      <Pixels list={SAND} fill="color-mix(in srgb, var(--star) 55%, transparent)" />
      <Pixels list={POLE} fill="var(--ink-3)" />
      <Pixels list={CANOPY_A} fill="var(--danger)" />
      <Pixels list={CANOPY_B} fill="var(--star)" />
      <g className="px-waves"><Pixels list={WAVES} fill="color-mix(in srgb, var(--accent) 60%, transparent)" /></g>
    </>
  );
}

// ── sun ──
// Just the sun: a round body and eight rays whose tips flicker.
const SUN_BIG = pixels(['..###..', '.#####.', '#######', '#######', '#######', '.#####.', '..###..'], 10, 5);
const SUN_RAYS_A: Px[] = [[13, 3], [13, 13], [8, 8], [18, 8], [9, 4], [17, 4], [9, 12], [17, 12]];
const SUN_RAYS_B: Px[] = [[13, 2], [13, 14], [7, 8], [19, 8], [8, 3], [18, 3], [8, 13], [18, 13]];

function Sun() {
  return (
    <>
      <Pixels list={SUN_RAYS_A} fill="var(--star)" />
      <Pixels list={SUN_RAYS_B} className="px-ray" fill="var(--star)" />
      <Pixels list={SUN_BIG} fill="var(--star)" />
    </>
  );
}

// ── cancelled ──
const CAL_RINGS = pixels(['.#.....#.'], 9, 2);
const CAL_TOP = pixels(['#########', '#########'], 9, 3);
const CAL_BODY = pixels(['#########', '#########', '#########', '#########', '#########', '#########', '#########', '#########'], 9, 5);
const CAL_X = pixels(['#...#', '.#.#.', '..#..', '.#.#.', '#...#'], 11, 7);

function Cancelled() {
  return (
    <>
      <Pixels list={CAL_BODY} fill={FAINT} />
      <Pixels list={CAL_TOP} fill="var(--accent)" />
      <Pixels list={CAL_RINGS} fill="var(--ink-2)" />
      <Pixels list={CAL_X} className="px-blink" fill="var(--danger)" />
    </>
  );
}

// ── event ──
const FLAG_POLE = pixels(['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'], 9, 3);
const FLAG_A = pixels(['########', '#########', '########', '#######.'], 10, 3);
const FLAG_B = pixels(['#######.', '########', '#########', '########'], 10, 3);
const GROUND = pixels(['#########'], 5, 15);

function Event() {
  return (
    <>
      <Pixels list={GROUND} fill={FAINT} />
      <Pixels list={FLAG_POLE} fill="var(--ink-2)" />
      <Pixels list={FLAG_A} className="px-flag" fill="var(--accent)" />
      <Pixels list={FLAG_B} className="px-flag px-flag-alt" fill="var(--accent)" />
    </>
  );
}

// ── swap (substitutions) ──
const ARROW_R = pixels(['.....#...', '.....##..', '#########', '.....##..', '.....#...']);
const ARROW_L = pixels(['...#.....', '..##.....', '#########', '..##.....', '...#.....']);

function Swap() {
  return (
    <>
      <g className="px-arrow-r" transform="translate(8 2)"><Pixels list={ARROW_R} fill="var(--accent)" /></g>
      <g className="px-arrow-l" transform="translate(10 9)"><Pixels list={ARROW_L} fill="var(--ink-2)" /></g>
    </>
  );
}

const SPRITES: Record<PixelSprite, () => ReactNode> = {
  unplugged: Unplugged,
  search: Search,
  lock: Lock,
  empty: Empty,
  holiday: Holiday,
  sun: Sun,
  cancelled: Cancelled,
  event: Event,
  swap: Swap,
};

export function PixelSpriteArt({ sprite = 'unplugged', className = '', width }: { sprite?: PixelSprite; className?: string; width?: string }) {
  return (
    <svg viewBox="0 0 27 17" className={className} style={width ? { width } : undefined} aria-hidden="true" overflow="hidden">
      {SPRITES[sprite]()}
    </svg>
  );
}

export default function PixelState({
  title,
  detail,
  action,
  sprite = 'unplugged',
  compact = false,
  className = '',
}: {
  title: string;
  /** The technical reason, shown small under the sentence. */
  detail?: string;
  action?: ReactNode;
  sprite?: PixelSprite;
  /** Smaller, for use inside a list or a card. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div role="status" className={`rise flex flex-col items-center px-4 text-center ${compact ? 'py-6' : 'py-10'} ${className}`}>
      <PixelSpriteArt sprite={sprite} className={compact ? 'w-[104px]' : 'w-[150px]'} />
      <p className={`max-w-[36ch] font-bold tracking-[-0.015em] ${compact ? 'mt-4 text-[15px]' : 'mt-6 text-[16.5px]'}`}>{title}</p>
      {detail && <p className="mono mt-1.5 max-w-[48ch] text-[12.5px] text-ink-3 [overflow-wrap:anywhere]">{detail}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
