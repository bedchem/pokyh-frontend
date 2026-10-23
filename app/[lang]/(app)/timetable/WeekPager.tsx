'use client';

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { animate, useMotionValue, type AnimationPlaybackControls } from 'framer-motion';
import s from './timetable.module.css';

/** Movement before a touch counts as a swipe (and no longer as a tap). */
const LOCK_PX = 8;
/** Share of the width past which letting go turns the week. */
const TURN_SHARE = 0.22;
/** Speed (px/s) at which a short flick turns the week anyway. */
const FLICK_SPEED = 420;
/** A trackpad swipe turns the week once it has moved this share of the width. */
const WHEEL_TURN_SHARE = 0.3;
/** Quiet time that ends a trackpad gesture, its momentum included. */
const WHEEL_END_MS = 160;
/** How far back the finger's speed is measured when it lets go. */
const VELOCITY_WINDOW_MS = 90;
/** A click right after a swipe belonged to the swipe, not to the lesson under it. */
const CLICK_AFTER_DRAG_MS = 350;
const SPRING = { type: 'spring', stiffness: 360, damping: 38, mass: 1, restDelta: 0.5, restSpeed: 8 } as const;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The weeks side by side: the shown one with the one before and after it, so a swipe drags the
 * neighbour in under the finger. Letting go past a fifth of the width (or with a flick) turns the
 * week, anything less springs back. Two-finger trackpad swipes do the same.
 *
 * `x` is how far the shown week sits from the centre. When `offset` moves by one (a swipe, the
 * arrows, the keyboard) the neighbour takes over the centre at exactly the place it was drawn and
 * glides the rest of the way, so a swipe started before the last one settled carries on from
 * where the weeks are. A longer jump (Heute, another school year) fades the new week in.
 */
export default function WeekPager({
  offset,
  min,
  max,
  locked,
  onStep,
  children,
}: {
  offset: number;
  min: number;
  max: number;
  /** A sheet is open over the week: no swiping. */
  locked: boolean;
  /** Turn one week on (1) or back (-1). The pager glides once `offset` follows. */
  onStep: (by: 1 | -1) => void;
  /** The content of one week. */
  children: (offset: number) => ReactNode;
}) {
  const pagerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const width = useRef(0);
  const shown = useRef(offset);
  /** The finger's anchor while one is dragging: x = base + its distance from `from`. */
  const drag = useRef<{ base: number; from: number } | null>(null);
  const live = useRef({ offset, min, max, locked, onStep });
  /** The speed a swipe let go with, for the glide that continues it in the new week. */
  const handoff = useRef(0);

  useLayoutEffect(() => {
    live.current = { offset, min, max, locked, onStep };
  });

  // x drives the track straight away (not on the next frame), so a new week and its
  // position always reach the screen together.
  useLayoutEffect(() => {
    const paint = (v: number) => {
      if (trackRef.current) trackRef.current.style.transform = `translate3d(${v}px,0,0)`;
    };
    paint(x.get());
    return x.on('change', paint);
  }, [x]);

  useLayoutEffect(() => {
    const el = pagerRef.current;
    if (!el) return;
    const update = () => { width.current = el.clientWidth; };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The shown week changed: carry the motion over to the new centre.
  useLayoutEffect(() => {
    const d = offset - shown.current;
    shown.current = offset;
    if (d === 0) return;
    const w = width.current;
    // React may hand over the new week before the glide has drawn a frame.
    const velocity = handoff.current || x.getVelocity();
    handoff.current = 0;
    anim.current?.stop();
    if (Math.abs(d) === 1 && w > 0) {
      x.jump(clamp(x.get() + d * w, -w, w));
      if (drag.current) {
        drag.current.base += d * w;
        return;
      }
      if (reducedMotion()) x.jump(0);
      else anim.current = animate(x, 0, { ...SPRING, velocity });
      return;
    }
    drag.current = null;
    x.jump(0);
    if (!reducedMotion()) {
      stageRef.current?.animate(
        [{ opacity: 0, transform: `translate3d(${Math.sign(d) * 36}px,0,0)` }, { opacity: 1, transform: 'none' }],
        { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
    }
  }, [offset, x]);

  useEffect(() => {
    const el = pagerRef.current;
    if (!el) return;

    /** Past the last week there is nothing to drag in: the track only gives a little. */
    const resist = (v: number) => {
      const w = width.current;
      const { offset: o, min: lo, max: hi } = live.current;
      if ((v > 0 && o <= lo) || (v < 0 && o >= hi)) return clamp(v * 0.25, -w * 0.15, w * 0.15);
      return clamp(v, -w, w);
    };

    const settle = (velocity: number) => {
      anim.current?.stop();
      if (reducedMotion()) x.jump(0);
      else anim.current = animate(x, 0, { ...SPRING, velocity });
    };

    /** Let go: turn the week, or spring back. */
    const release = (velocity: number, turnShare: number) => {
      const w = width.current;
      const pos = x.get();
      const { offset: o, min: lo, max: hi } = live.current;
      let by: 0 | 1 | -1 = 0;
      if (pos < -w * turnShare || velocity < -FLICK_SPEED) by = 1;
      else if (pos > w * turnShare || velocity > FLICK_SPEED) by = -1;
      // Flung back the other way: stay.
      if ((by === 1 && velocity > FLICK_SPEED / 2) || (by === -1 && velocity < -FLICK_SPEED / 2)) by = 0;
      if ((by === 1 && o >= hi) || (by === -1 && o <= lo)) by = 0;
      if (!by) { settle(velocity); return; }
      // Glide on at once; when the new week arrives the motion is handed over to it.
      anim.current?.stop();
      if (reducedMotion()) x.jump(-by * w);
      else anim.current = animate(x, -by * w, { ...SPRING, velocity });
      handoff.current = velocity;
      live.current.onStep(by);
    };

    // ── Touch, pen and mouse ──────────────────────────────────────────────
    let pointer: { id: number; x0: number; y0: number; swiping: boolean; samples: Array<[number, number]> } | null = null;
    let dragEndedAt = -Infinity;

    const onDown = (e: PointerEvent) => {
      if (pointer || live.current.locked || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      pointer = { id: e.pointerId, x0: e.clientX, y0: e.clientY, swiping: false, samples: [] };
    };

    const onMove = (e: PointerEvent) => {
      if (!pointer || e.pointerId !== pointer.id) return;
      const dx = e.clientX - pointer.x0;
      if (!pointer.swiping) {
        const dy = e.clientY - pointer.y0;
        if (Math.abs(dx) < LOCK_PX && Math.abs(dy) < LOCK_PX) return;
        // Mostly up or down: not a swipe.
        if (Math.abs(dy) > Math.abs(dx)) { pointer = null; return; }
        pointer.swiping = true;
        anim.current?.stop();
        drag.current = { base: x.get(), from: e.clientX };
        try { el.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      }
      e.preventDefault();
      const d = drag.current;
      if (!d) return;
      x.set(resist(d.base + e.clientX - d.from));
      const now = e.timeStamp;
      pointer.samples.push([now, x.get()]);
      while (pointer.samples.length > 2 && now - pointer.samples[0][0] > VELOCITY_WINDOW_MS) pointer.samples.shift();
    };

    const onUp = (e: PointerEvent) => {
      if (!pointer || e.pointerId !== pointer.id) return;
      const { swiping, samples } = pointer;
      pointer = null;
      if (!swiping) return;
      drag.current = null;
      dragEndedAt = performance.now();
      let velocity = 0;
      const last = samples[samples.length - 1];
      // A finger that stood still before lifting has no speed left.
      if (e.type === 'pointerup' && samples.length > 1 && e.timeStamp - last[0] < 60) {
        const first = samples[0];
        velocity = ((last[1] - first[1]) / Math.max(1, last[0] - first[0])) * 1000;
      }
      release(velocity, TURN_SHARE);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (performance.now() - dragEndedAt < CLICK_AFTER_DRAG_MS) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    // ── Two-finger trackpad swipes ────────────────────────────────────────
    let wheel: { base: number; moved: number } | null = null;
    let wheelSpent = false;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;

    const endWheelSoon = () => {
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        wheelSpent = false;
        if (!wheel) return;
        wheel = null;
        release(0, TURN_SHARE);
      }, WHEEL_END_MS);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || live.current.locked) return;
      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);
      if (wheelSpent) {
        // The rest of a gesture that already turned the week, momentum included: used up.
        if (ax > ay) e.preventDefault();
        endWheelSoon();
        return;
      }
      if (!wheel && (ax === 0 || ax <= ay * 1.2)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? width.current : 1;
      if (!wheel) {
        anim.current?.stop();
        wheel = { base: x.get(), moved: 0 };
      }
      wheel.moved -= e.deltaX * unit;
      x.set(resist(wheel.base + wheel.moved));
      endWheelSoon();
      if (Math.abs(x.get()) > width.current * WHEEL_TURN_SHARE) {
        wheel = null;
        wheelSpent = true;
        release(0, WHEEL_TURN_SHARE);
      }
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('click', onClickCapture, true);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('click', onClickCapture, true);
      el.removeEventListener('wheel', onWheel);
      clearTimeout(wheelTimer);
    };
  }, [x]);

  useEffect(() => () => anim.current?.stop(), []);

  const weeks = [-1, 0, 1].map(k => offset + k).filter(o => o >= min && o <= max);

  return (
    <div ref={pagerRef} className={s.pager}>
      <div ref={stageRef} className={s.stage}>
        <div ref={trackRef} className={s.track}>
          {weeks.map(o => (
            <div
              key={o}
              className={s.pane}
              style={{ transform: `translate3d(${(o - offset) * 100}%,0,0)` }}
              aria-hidden={o !== offset || undefined}
              inert={o !== offset || undefined}
            >
              {children(o)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
