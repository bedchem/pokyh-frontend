'use client';

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

// The five letters of the name as the homepage's tiles, on the sign-in page.
// They answer the typing: each key makes the next one hop; a wrong password
// makes them shake, a successful sign-in sends a wave through them.
// `NameTiles` is the small row above the form on phones; `NameStage` the
// large scene beside it on desktops, where the tiles also float, lean
// towards the pointer and jump when clicked. Decorative only.

export const TILES = [
  { letter: 'P', tone: 'bg-periwinkle text-periwinkle-ink', tilt: -6 },
  { letter: 'O', tone: 'bg-butter text-butter-ink', tilt: 4 },
  { letter: 'K', tone: 'bg-sage text-sage-ink', tilt: -3 },
  { letter: 'Y', tone: 'bg-blush text-blush-ink', tilt: 5 },
  { letter: 'H', tone: 'bg-[var(--mint)] text-[var(--mint-ink)]', tilt: -4 },
];

export type TileMood = { kind: 'hop'; tile: number; n: number } | { kind: 'shake' | 'wave'; n: number } | null;

/** Animation key and class of tile `i` for the current mood (a new key restarts the animation). */
function motionOf(mood: TileMood, i: number): { key: string; hop: boolean; delay?: number } {
  if (mood?.kind === 'hop' && mood.tile === i) return { key: `h${mood.n}`, hop: true };
  if (mood?.kind === 'wave') return { key: `w${mood.n}`, hop: true, delay: i * 70 };
  return { key: 'still', hop: false };
}

export function NameTiles({ mood }: { mood: TileMood }) {
  return (
    <div aria-hidden="true" className={`flex gap-1.5 ${mood?.kind === 'shake' ? 'login-shake' : ''}`} key={mood?.kind === 'shake' ? `s${mood.n}` : 'tiles'}>
      {TILES.map((tile, i) => {
        const m = motionOf(mood, i);
        return (
          <span key={i} className="block" style={{ rotate: `${tile.tilt}deg` }}>
            <span
              key={m.key}
              className={`login-tile grid size-9 place-items-center rounded-[11px] text-[17px] font-extrabold ${tile.tone} ${m.hop ? 'login-hop' : ''}`}
              style={m.delay ? { animationDelay: `${m.delay}ms` } : undefined}
            >
              {tile.letter}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// Where each tile stands on the stage (percent of its width/height), how far
// it leans with the pointer (depth) and how it floats (seconds).
const STAGE = [
  { x: 9, y: 34, depth: 1.4, float: 6.2 },
  { x: 26, y: 47, depth: 0.8, float: 7.1 },
  { x: 43, y: 31, depth: 1.8, float: 5.6 },
  { x: 60, y: 49, depth: 1.1, float: 6.8 },
  { x: 77, y: 36, depth: 1.5, float: 7.6 },
];

export function NameStage({ mood, onTap }: { mood: TileMood; onTap: (tile: number) => void }) {
  const root = useRef<HTMLDivElement>(null);

  // The tiles lean towards the pointer, anywhere on the page.
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      const mx = (e.clientX / window.innerWidth - 0.5) * 2;
      const my = (e.clientY / window.innerHeight - 0.5) * 2;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--mx', mx.toFixed(3));
        el.style.setProperty('--my', my.toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={root} className="login-stage relative h-full overflow-hidden rounded-[36px]">
      <div className={`absolute inset-0 ${mood?.kind === 'shake' ? 'login-shake' : ''}`} key={mood?.kind === 'shake' ? `s${mood.n}` : 'stage'}>
        {TILES.map((tile, i) => {
          const spot = STAGE[i];
          const m = motionOf(mood, i);
          return (
            <div
              key={i}
              className="login-float absolute"
              style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: '15%', animationDuration: `${spot.float}s`, animationDelay: `${-i * 1.3}s` }}
            >
              {/* The shadow on the floor stays put and shrinks while the tile is in the air. */}
              <span key={m.key} aria-hidden="true" className={`login-floor absolute -bottom-[18%] left-[12%] h-[14%] w-[76%] rounded-[50%] ${m.hop ? 'login-floor-hop' : ''}`} style={m.delay ? { animationDelay: `${m.delay}ms` } : undefined} />
              <div
                className="login-lean"
                style={{
                  rotate: `${tile.tilt}deg`,
                  transform: `translate3d(calc(var(--mx, 0) * ${spot.depth * 10}px), calc(var(--my, 0) * ${spot.depth * 8}px), 0) rotateX(calc(var(--my, 0) * ${-spot.depth * 7}deg)) rotateY(calc(var(--mx, 0) * ${spot.depth * 9}deg))`,
                }}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={() => onTap(i)}
                  key={m.key}
                  className={`login-tile login-tile-big grid aspect-square w-full place-items-center rounded-[26%] font-extrabold ${tile.tone} ${m.hop ? 'login-hop' : ''}`}
                  style={m.delay ? { animationDelay: `${m.delay}ms` } : undefined}
                >
                  {tile.letter}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
