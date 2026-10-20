'use client';

import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';
import { Paths } from './SceneSvg';
import { anger, bolt, mark, steam, sweat, thinking } from './hallway';
import { LENS_GLASS, MASCOT_SHADOW, MW, mascot, type Pose } from './mascot';
import { wearSprite } from './collectibles';

// The mascot as it moves in a scene (inside an <svg> with the sprite
// palette): its shadow, the body with the frames of its animations
// (breathing, blinking, waving, hopping, jumping, shaking, fuming, buzzing,
// a somersault; the classes in app/globals.css), what it wears (room A+2/05,
// components/room) and the signs above its head, and the glass of the
// magnifier, which the eye shows through. Used by the sign-in hallway and
// room A+2/05.

export interface Look {
  pose: Pose;
  blink?: boolean;
  wave?: boolean;
  mark?: '!' | '?';
  sweat?: boolean;
  think?: boolean;
  anger?: boolean;
  /** Fizzing with energy (room A+2/05's energy can): bolts flash around it. */
  zap?: boolean;
  motion: 'bob' | 'hop' | 'jump' | 'shake' | 'fume' | 'buzz' | 'flip';
}

/** What the mascot wears: a hat and something on its face (ids from components/room/catalog.ts). */
export interface Wear {
  head?: string | null;
  face?: string | null;
}

// Angry: steam off the left of the head, the sign above it (the speech
// bubble has the right).
const STEAM = steam(1, -6);
const ANGER = anger(22, -9);
// Energy: bolts on both sides of the body, flashing in turn.
const BOLTS = [[bolt(-3, 2), bolt(37, 14)], [bolt(-2, 14), bolt(36, 0)]].map(([a, b]) => a.paste(b));

/** The pose with the face it wears: star or heart eyes instead of open ones. */
function worn(pose: Pose, wear?: Wear): Pose {
  const eyes = wear?.face === 'stareyes' ? 'stars' : wear?.face === 'hearteyes' ? 'hearts' : null;
  return eyes && (pose.eyes === 'open' || pose.eyes === 'wide' || pose.eyes === 'blink') ? { ...pose, eyes } : pose;
}

/** The mascot at (0, 0). `marks` puts the signs above its head or beside it (small drawings). */
export default function MascotFigure({ look, motionKey, marks = 'above', wear }: { look: Look; motionKey: string; marks?: 'above' | 'beside'; wear?: Wear }) {
  const pose = worn(look.pose, wear);
  const base = mascot(pose);
  // Waving: the hand goes out, up, in towards the head and up again.
  const wave = look.wave ? mascot({ ...pose, arms: 'wave2' }) : null;
  const wave3 = look.wave ? mascot({ ...pose, arms: 'wave3' }) : null;
  const blink = !wave && look.blink && pose.eyes === 'open' ? mascot({ ...pose, eyes: 'blink' }) : null;
  const [mx, my] = marks === 'above' ? [16, -10] : [MW, 2];
  // Hats sit on the head; glasses only over open eyes (not shut, covered or behind the magnifier).
  const hat = wear?.head ? wearSprite(wear.head) : null;
  const glasses = wear?.face === 'shades' && !['closed', 'happy'].includes(pose.eyes) && pose.arms !== 'cover' && pose.arms !== 'peek' && pose.arms !== 'lens' ? wearSprite('shades') : null;
  const top = hat ? (wear?.head === 'crown' ? -9 : wear?.head === 'headphones' ? -6 : -14) : 0;
  return (
    <>
      <Paths sprite={MASCOT_SHADOW} />
      <g key={motionKey} className={`ms-${look.motion}`}>
        <g className={look.motion === 'bob' ? 'ms-breathe' : undefined}>
          <g className={wave ? 'ms-frame-a' : blink ? 'ms-open' : undefined}><Paths sprite={base} /></g>
          {wave && <g className="ms-frame-b"><Paths sprite={wave} /></g>}
          {wave3 && <g className="ms-frame-c"><Paths sprite={wave3} /></g>}
          {blink && <g className="ms-blink"><Paths sprite={blink} /></g>}
          {pose.arms === 'lens' && <Paths sprite={LENS_GLASS} />}
          {glasses && <Paths sprite={glasses} />}
          {hat && <Paths sprite={hat} />}
          {look.sweat && <g className="ms-drip"><Paths sprite={sweat(31, 3)} /></g>}
        </g>
        {look.mark && <g className="ms-pop"><Paths sprite={mark(look.mark, mx, my + Math.min(0, top))} /></g>}
        {look.think && <g className="ms-pop"><Paths sprite={thinking(marks === 'above' ? 24 : MW - 2, marks === 'above' ? -9 + Math.min(0, top) : 1)} /></g>}
        {look.zap && (
          <>
            <g className="ms-zap-a"><Paths sprite={BOLTS[0]} /></g>
            <g className="ms-zap-b"><Paths sprite={BOLTS[1]} /></g>
          </>
        )}
        {look.anger && (
          <g className="ms-pop">
            <g className="ms-steam"><Paths sprite={STEAM} /></g>
            <g className="ms-throb"><Paths sprite={ANGER} /></g>
          </g>
        )}
      </g>
    </>
  );
}

/** Where the pointer is, seen from the mascot: -1, 0 or 1 on each axis. */
export function usePointerLook(target: React.RefObject<Element | null>, centre: () => { x: number; y: number } | null) {
  const [look, setLook] = useState<[number, number]>([1, 0]);
  const centreRef = useRef(centre);
  useEffect(() => { centreRef.current = centre; });
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const c = centreRef.current();
        if (!c) return;
        const dx = e.clientX - c.x;
        const dy = e.clientY - c.y;
        const lx = dx < -60 ? -1 : dx > 60 ? 1 : 0;
        const ly = dy < -90 ? -1 : dy > 90 ? 1 : 0;
        setLook((old) => (old[0] === lx && old[1] === ly ? old : [lx, ly]));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame); };
  }, [target]);
  return look;
}
