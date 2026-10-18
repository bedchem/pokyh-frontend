// How scrolling feels on the public pages, in one place: the base glide and
// distance per wheel notch (Lenis), how fast each homepage scene moves under
// the wheel, and how long each scene is. A scene is marked with
// `data-scroll-pace="<name>"`; while it covers the middle of the screen the
// wheel moves at its pace (SmoothScroll.tsx eases between them, so speed never
// jumps). The lengths keep the same content-per-scroll everywhere: the flight
// at the start gets more room, the long pinned parts after it less.
//
// Touch screens keep their native scrolling (only the lengths apply there).
// Every value can be tuned per deployment without a code change through
// NEXT_PUBLIC_SCROLL_TUNING, a JSON object with any subset of these keys,
// e.g. {"pace":{"hero":0.5},"length":{"hero":260}}.

export interface ScrollTuning {
  /** Lenis smoothing: share of the remaining distance covered per frame at 60 fps (lower = longer glide). */
  lerp: number;
  /** Distance of one wheel notch relative to the browser's own. */
  wheel: number;
  /** How quickly the wheel speed follows when a new scene takes over (per second). */
  blend: number;
  /** Wheel speed per scene, relative to `wheel`. */
  pace: Record<'hero' | 'manifest' | 'features' | 'mensa' | 'appOpen' | 'getIn' | 'page', number>;
  /** Scene lengths in large-viewport units (--lvh). */
  length: {
    hero: number;
    manifest: number;
    /** Carousel: per function, plus the room for its entry and exit. */
    featureEach: number;
    featureExtra: number;
    appOpen: number;
  };
  /** How quickly the hero's camera catches up with the scroll position (per second). */
  heroFollow: number;
}

export type ScrollPace = keyof ScrollTuning['pace'];

const DEFAULTS: ScrollTuning = {
  lerp: 0.068,
  wheel: 0.66,
  blend: 5,
  pace: { hero: 0.45, manifest: 1, features: 0.82, mensa: 1, appOpen: 1, getIn: 1, page: 1 },
  length: { hero: 260, manifest: 215, featureEach: 68, featureExtra: 150, appOpen: 160 },
  heroFollow: 7,
};

function overrides(): Partial<ScrollTuning> {
  const raw = process.env.NEXT_PUBLIC_SCROLL_TUNING;
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' ? (value as Partial<ScrollTuning>) : {};
  } catch {
    return {};
  }
}

const positive = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback);

function merge(): ScrollTuning {
  const o = overrides();
  const pace = { ...DEFAULTS.pace };
  for (const k of Object.keys(pace) as ScrollPace[]) pace[k] = positive(o.pace?.[k], pace[k]);
  const length = { ...DEFAULTS.length };
  for (const k of Object.keys(length) as (keyof ScrollTuning['length'])[]) length[k] = positive(o.length?.[k], length[k]);
  return {
    lerp: Math.min(1, positive(o.lerp, DEFAULTS.lerp)),
    wheel: positive(o.wheel, DEFAULTS.wheel),
    blend: positive(o.blend, DEFAULTS.blend),
    pace,
    length,
    heroFollow: positive(o.heroFollow, DEFAULTS.heroFollow),
  };
}

export const SCROLL: ScrollTuning = merge();

export function isPace(value: string | undefined | null): value is ScrollPace {
  return !!value && value in SCROLL.pace;
}
