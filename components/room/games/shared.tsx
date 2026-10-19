'use client';

import { useEffect, useRef } from 'react';
import { Paths } from '@/components/pixel/SceneSvg';
import { textPixels, Sprite } from '@/components/pixel/sprite';
import type { Pad } from '@/components/pixel/handheld';

// What the tablet's games share (components/room/Handheld.tsx): the buttons
// of the handheld as a stream of presses, the pixel font for titles and
// numbers, shuffling.

export type { Pad };
export type PadListener = (key: Pad, down: boolean) => void;

export interface PadBus {
  listen: (fn: PadListener) => () => void;
}

export function createPadBus(): PadBus & { emit: PadListener } {
  const listeners = new Set<PadListener>();
  return {
    listen: (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    emit: (key, down) => listeners.forEach((l) => l(key, down)),
  };
}

/** Listens to the handheld's buttons for as long as the component is there. */
export function usePad(bus: PadBus, fn: PadListener) {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; });
  useEffect(() => bus.listen((k, d) => ref.current(k, d)), [bus]);
}

export interface GameProps {
  bus: PadBus;
  /** The game is over with this score. */
  onEnd: (score: number) => void;
  /** Paused (the menu of START): timers stand still. */
  paused: boolean;
}

/** Text in the pixel font, as tall as `height` (CSS) and as wide as it comes. */
export function PixelText({ text, height, className, tone = 'pp4' }: { text: string; height: number | string; className?: string; tone?: string }) {
  const t = textPixels(text, 0, 0);
  const s = new Sprite().fill(t.points, tone);
  return (
    <svg viewBox={`-0.5 -0.5 ${t.width + 1} 6`} style={{ height, width: 'auto' }} className={`spr ${className ?? ''}`} shapeRendering="crispEdges" aria-hidden="true">
      <Paths sprite={s} />
    </svg>
  );
}

export function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A countdown in tenths of a second that stands still while paused; calls `onZero` once. */
export function useCountdown(ms: number, paused: boolean, onTick: (left: number) => void) {
  const left = useRef(ms);
  const tick = useRef(onTick);
  useEffect(() => { tick.current = onTick; });
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      if (left.current <= 0) return;
      left.current = Math.max(0, left.current - 100);
      tick.current(left.current);
    }, 100);
    return () => window.clearInterval(id);
  }, [paused]);
  return {
    add: (delta: number) => { left.current = Math.max(0, left.current + delta); tick.current(left.current); },
  };
}
