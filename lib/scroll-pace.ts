// How scrolling feels on the public pages, in one place.
//
// The slow, gliding feel of the redesign (owner's choice, again since
// 2026-10-19): a wheel notch or a trackpad stroke moves the page about two
// thirds of the browser's own distance and the page glides after it. The
// homepage scenes set their own pace on top (`pace`): the flight at the start
// is calmest, the carousel a little calmer than the rest. Phones and tablets
// keep their native scrolling and the base lengths.
//
// Mouse wheels and trackpads are still told apart (`lerp`, `gear` per input),
// so either can be tuned on its own; by default both feel the same.
//
// Every value can be tuned per deployment without a code change through
// NEXT_PUBLIC_SCROLL_TUNING, a JSON object with any subset of these keys,
// e.g. {"lerp":{"precise":0.5},"stretch":{"hero":1.8}}.

export type InputKind = 'wheel' | 'precise';

export interface ScrollTuning {
  /**
   * Smoothing per input, as the share of the remaining distance covered per
   * frame at 60 fps: "wheel" for mouse wheels (notches), "precise" for
   * trackpads and smooth mice, which arrive smooth already (higher = closer).
   */
  lerp: Record<InputKind, number>;
  /** Distance moved per input distance: a mouse notch, a trackpad stroke. */
  gear: Record<InputKind, number>;
  /** How quickly the wheel speed follows when a new scene takes over (per second). */
  blend: number;
  /** Speed per homepage scene, relative to `gear` (below 1: calmer); eased between scenes. */
  pace: Record<'hero' | 'manifest' | 'features' | 'mensa' | 'appOpen' | 'getIn' | 'page', number>;
  /** Scene lengths in large-viewport units (--lvh), as on touch screens. */
  length: {
    hero: number;
    manifest: number;
    /** Carousel: per function, plus the room for its entry and exit. */
    featureEach: number;
    featureExtra: number;
    appOpen: number;
  };
  /** How much longer each pinned scene is with a mouse or trackpad (1: as on touch screens). */
  stretch: Record<SceneStretch, number>;
  /** How quickly the hero's camera catches up with the scroll position (per second). */
  heroFollow: number;
}

export type ScrollPace = keyof ScrollTuning['pace'];
export type SceneStretch = 'hero' | 'manifest' | 'features' | 'appOpen';

const DEFAULTS: ScrollTuning = {
  lerp: { wheel: 0.068, precise: 0.068 },
  gear: { wheel: 0.66, precise: 0.66 },
  blend: 5,
  pace: { hero: 0.45, manifest: 1, features: 0.82, mensa: 1, appOpen: 1, getIn: 1, page: 1 },
  length: { hero: 260, manifest: 215, featureEach: 68, featureExtra: 150, appOpen: 160 },
  stretch: { hero: 1, manifest: 1, features: 1, appOpen: 1 },
  heroFollow: 7,
};

type Overrides = Partial<Omit<ScrollTuning, 'lerp' | 'gear'>> & {
  // A single number (the earlier form) sets the mouse wheel value.
  lerp?: number | Partial<Record<InputKind, number>>;
  gear?: Partial<Record<InputKind, number>>;
  wheel?: number;
};

function overrides(): Overrides {
  const raw = process.env.NEXT_PUBLIC_SCROLL_TUNING;
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' ? (value as Overrides) : {};
  } catch {
    return {};
  }
}

const positive = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback);
const share = (v: unknown, fallback: number) => Math.min(1, positive(v, fallback));

function merged<K extends string>(base: Record<K, number>, given: unknown, clamp = positive): Record<K, number> {
  const out = { ...base };
  const source: Partial<Record<K, unknown>> = given && typeof given === 'object' ? (given as Partial<Record<K, unknown>>) : {};
  for (const k of Object.keys(out) as K[]) out[k] = clamp(source[k], out[k]);
  return out;
}

function merge(): ScrollTuning {
  const o = overrides();
  const lerp = typeof o.lerp === 'number'
    ? { ...DEFAULTS.lerp, wheel: share(o.lerp, DEFAULTS.lerp.wheel) }
    : merged(DEFAULTS.lerp, o.lerp, share);
  const gear = merged(DEFAULTS.gear, o.gear);
  if (typeof o.wheel === 'number') gear.wheel = positive(o.wheel, gear.wheel);
  return {
    lerp,
    gear,
    blend: positive(o.blend, DEFAULTS.blend),
    pace: merged(DEFAULTS.pace, o.pace),
    length: merged(DEFAULTS.length, o.length),
    stretch: merged(DEFAULTS.stretch, o.stretch),
    heroFollow: positive(o.heroFollow, DEFAULTS.heroFollow),
  };
}

export const SCROLL: ScrollTuning = merge();

export function isPace(value: string | undefined | null): value is ScrollPace {
  return !!value && value in SCROLL.pace;
}

/** Media query of a desktop (mouse or trackpad), where the scenes are stretched. */
export const FINE_POINTER = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

/** CSS custom properties with each scene's stretch, set for fine pointers only. */
export function stretchCss(selector: string): string {
  const vars = (Object.entries(SCROLL.stretch) as [SceneStretch, number][]).map(([k, v]) => `--stretch-${k}:${v}`).join(';');
  return `@media ${FINE_POINTER}{${selector}{${vars}}}`;
}

/** Height of a scene of `base` large-viewport units, stretched on desktops. */
export function sceneHeight(scene: SceneStretch, base: number): string {
  return `calc(${base} * var(--lvh) * var(--stretch-${scene}, 1))`;
}

/**
 * The large viewport's height in pixels as the page measured it
 * (components/ViewportScript.tsx), for distances in scroll animations: the
 * window's own height changes while a phone's browser bars slide.
 */
export function largeViewport(): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--lvh').trim();
  const px = v.endsWith('px') ? parseFloat(v) * 100 : NaN;
  return Number.isFinite(px) && px > 0 ? px : window.innerHeight;
}

/**
 * Which kind of device a wheel event comes from. Chromium and Safari tell it
 * by the legacy wheelDeltaY (classic notches are multiples of 120), Firefox
 * mice by line units; otherwise a quick stream of small steps is a trackpad.
 */
export function inputKind(event: WheelEvent, sincePreviousMs: number): InputKind {
  if (event.deltaMode !== 0) return 'wheel';
  const legacy = (event as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY;
  if (typeof legacy === 'number' && legacy !== 0 && Math.abs(legacy) % 120 === 0) return 'wheel';
  if (event.deltaX !== 0 && event.deltaY !== 0) return 'precise';
  if (Math.abs(event.deltaY) < 50 && (sincePreviousMs < 60 || !Number.isInteger(event.deltaY))) return 'precise';
  if (typeof legacy === 'number' && legacy !== 0 && Math.abs(legacy) === Math.abs(event.deltaY) * 3) return 'precise';
  return 'wheel';
}
