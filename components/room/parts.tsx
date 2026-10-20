'use client';

import { useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type Ref } from 'react';
import { Paths } from '@/components/pixel/SceneSvg';
import { STAR, gameIcon, itemSprite } from '@/components/pixel/collectibles';
import type { Sprite } from '@/components/pixel/sprite';
import { prefersReducedMotion } from '@/lib/motion';
import s from './room.module.css';

// The small pieces room A+2/05's views share: the gold-star counter, the
// effects that carry rewards to the bar on top (stars bursting out of a
// thing and flying into the counter, an item flying into the backpack), and
// sprites as icons. The room shows no text of its own; what a reward is
// called goes to screen readers only.

/** A point on the stage, in CSS pixels from its top left. */
export interface XY {
  x: number;
  y: number;
}

/** A sprite as a small picture, its box fitted to the drawing. */
export function SpriteIcon({ sprite, box, className, label }: { sprite: Sprite; box: [number, number, number, number]; className?: string; label?: string }) {
  return (
    <svg
      viewBox={box.join(' ')}
      className={`spr ${className ?? ''}`}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Paths sprite={sprite} />
    </svg>
  );
}

export const StarIcon = ({ className }: { className?: string }) => <SpriteIcon sprite={STAR} box={[-0.5, -0.5, 8, 8]} className={className} />;
export const ItemIcon = ({ id, className, label }: { id: string; className?: string; label?: string }) => (
  <SpriteIcon sprite={itemSprite(id)} box={[-1, -2, 14, 15]} className={className} label={label} />
);
export const GameIcon = ({ id, className }: { id: string; className?: string }) => <SpriteIcon sprite={gameIcon(id)} box={[-1, -1, 14, 14]} className={className} />;

/**
 * The gold stars. Stars still on their way (`pending`) aren't counted yet:
 * the number goes up as each one lands, and the counter bumps.
 */
export function StarCount({ stars, pending = 0, label, starRef }: { stars: number; pending?: number; label: string; starRef?: Ref<HTMLSpanElement> }) {
  const shown = Math.max(0, stars - pending);
  const [last, setLast] = useState(shown);
  const [bump, setBump] = useState(0);
  if (last !== shown) {
    if (shown > last) setBump((b) => b + 1);
    setLast(shown);
  }
  return (
    <span className={s.chip}>
      <span ref={starRef} key={`i${bump}`} className={bump ? s.bump : undefined}><StarIcon className={s.chipStar} /></span>
      <span aria-hidden="true" className={s.tnum}>{shown}</span>
      <span className="visually-hidden" aria-live="polite">{label}</span>
    </span>
  );
}

// ── A thing's name ───────────────────────────────────────────────────────

export interface TipApi {
  show: (text: string, at: XY) => void;
  hide: () => void;
}

/**
 * The name of the thing under the pointer, just above it. Moved through
 * `api`, so following the pointer redraws only this, not the room.
 */
export function Tip({ api }: { api: Ref<TipApi> }) {
  const [tip, setTip] = useState<{ text: string; at: XY } | null>(null);
  useImperativeHandle(api, () => ({
    show: (text, at) => setTip((old) => (old && old.text === text && old.at.x === at.x && old.at.y === at.y ? old : { text, at })),
    hide: () => setTip(null),
  }), []);
  if (!tip) return null;
  return <span key={tip.text} className={s.tip} style={{ left: tip.at.x, top: tip.at.y }} aria-hidden="true">{tip.text}</span>;
}

// ── Rewards on their way ─────────────────────────────────────────────────

interface Particle {
  id: number;
  kind: 'star' | 'spark' | 'item';
  item?: string;
  from: XY;
  to: XY;
  delay: number;
  /** Two random numbers of its own, so a re-run draws the same path. */
  r1: number;
  r2: number;
  onLand?: () => void;
}

const T = (p: XY, k: number, r: number) => `translate(${p.x}px, ${p.y}px) scale(${k}) rotate(${r}deg)`;

function framesFor(p: Particle): Keyframe[] {
  const { from, to, r1, r2 } = p;
  if (p.kind === 'spark') {
    // A little star falling out: tossed up a bit, then down and gone.
    const vx = (r1 * 2 - 1) * 46;
    const up = { x: from.x + vx * 0.5, y: from.y - 16 - r2 * 22 };
    const down = { x: from.x + vx, y: from.y + 34 + r2 * 34 };
    return [
      { offset: 0, transform: T(from, 0.5, 0), opacity: 1, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)' },
      { offset: 0.32, transform: T(up, 1, vx), opacity: 1, easing: 'cubic-bezier(0.5, 0, 1, 0.6)' },
      { offset: 1, transform: T(down, 0.7, vx * 2), opacity: 0 },
    ];
  }
  if (p.kind === 'item') {
    // Hops out, then flies into the backpack.
    const peak = { x: from.x + (to.x - from.x) * 0.2, y: Math.min(from.y, to.y) - 50 };
    return [
      { offset: 0, transform: T(from, 0.5, 0), opacity: 0, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)' },
      { offset: 0.08, opacity: 1 },
      { offset: 0.4, transform: T(peak, 1.25, -8), easing: 'cubic-bezier(0.6, 0, 0.9, 0.4)' },
      { offset: 1, transform: T(to, 0.4, 0), opacity: 1 },
    ];
  }
  // A star to keep: bursts out of the thing, hangs a moment, falls a little,
  // then is drawn into the counter.
  const a = ((-90 + (r1 * 2 - 1) * 62) * Math.PI) / 180;
  const d = 48 + r2 * 40;
  const out = { x: from.x + Math.cos(a) * d, y: from.y + Math.sin(a) * d };
  const fall = { x: out.x + Math.cos(a) * d * 0.15, y: out.y + 22 + r2 * 14 };
  const spin = r1 > 0.5 ? 1 : -1;
  return [
    { offset: 0, transform: T(from, 0.3, 0), opacity: 0, easing: 'cubic-bezier(0.15, 0.85, 0.35, 1)' },
    { offset: 0.05, opacity: 1 },
    { offset: 0.34, transform: T(out, 1.2, spin * 30), easing: 'cubic-bezier(0.35, 0, 0.65, 1)' },
    { offset: 0.55, transform: T(fall, 1, spin * 50), easing: 'cubic-bezier(0.6, 0, 0.92, 0.4)' },
    { offset: 1, transform: T(to, 0.6, spin * 180), opacity: 1 },
  ];
}

const DURATION = { star: 1150, spark: 900, item: 1000 };

function FxParticle({ p, onDone }: { p: Particle; onDone: (id: number) => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const landed = useRef(false);
  useLayoutEffect(() => {
    const el = ref.current;
    const land = () => {
      if (!landed.current) { landed.current = true; p.onLand?.(); }
      onDone(p.id);
    };
    if (!el?.animate) { land(); return; }
    const anim = el.animate(framesFor(p), { duration: DURATION[p.kind], delay: p.delay, fill: 'both' });
    anim.onfinish = land;
    return () => { anim.onfinish = null; anim.cancel(); };
  }, [p, onDone]);
  return (
    <span ref={ref} className={p.kind === 'item' ? s.fxItem : p.kind === 'spark' ? s.fxSpark : s.fxStar}>
      {p.kind === 'item' ? <ItemIcon id={p.item!} className="h-full w-full" /> : <StarIcon className="h-full w-full" />}
    </span>
  );
}

export interface Fx {
  /** `count` stars from `from` into the counter at `to`, each calling `onLand`; little ones fall out around them. */
  stars: (from: XY, to: XY, count: number, onLand: () => void) => void;
  /** An item from `from` into the backpack at `to`. */
  item: (id: string, from: XY, to: XY, onLand: () => void) => void;
}

/** The layer the rewards fly in (over the bar on top), and what sends them. With reduced motion they land at once. */
export function useFx(): { fx: Fx; layer: React.ReactNode } {
  const [list, setList] = useState<Particle[]>([]);
  const next = useRef(0);
  const add = useCallback((ps: Array<Omit<Particle, 'id' | 'r1' | 'r2'>>) => {
    setList((old) => [...old, ...ps.map((p) => ({ ...p, id: ++next.current, r1: Math.random(), r2: Math.random() }))]);
  }, []);
  const drop = useCallback((id: number) => setList((old) => old.filter((p) => p.id !== id)), []);
  const fx = useMemo<Fx>(() => ({
    stars: (from, to, count, onLand) => {
      if (prefersReducedMotion()) { for (let i = 0; i < count; i++) onLand(); return; }
      add([
        ...Array.from({ length: count }, (_, i) => ({ kind: 'star' as const, from, to, delay: i * 90, onLand })),
        ...Array.from({ length: 4 + count }, (_, i) => ({ kind: 'spark' as const, from, to: from, delay: i * 35 })),
      ]);
    },
    item: (id, from, to, onLand) => {
      if (prefersReducedMotion()) { onLand(); return; }
      add([{ kind: 'item', item: id, from, to, delay: 0, onLand }]);
    },
  }), [add]);
  const layer = (
    <div className={s.fx} aria-hidden="true">
      {list.map((p) => <FxParticle key={p.id} p={p} onDone={drop} />)}
    </div>
  );
  return { fx, layer };
}
