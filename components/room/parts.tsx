'use client';

import { useEffect, useRef, useState } from 'react';
import { Paths } from '@/components/pixel/SceneSvg';
import { STAR, gameIcon, itemSprite } from '@/components/pixel/collectibles';
import { mascot } from '@/components/pixel/mascot';
import type { Sprite } from '@/components/pixel/sprite';
import { prefersReducedMotion } from '@/lib/motion';
import s from './room.module.css';

// The small pieces room 2B's views share: the text box at the bottom (an old
// game's dialogue box, typed out), the gold-star counter, the notes that a
// reward came in, and sprites as icons.

export interface Line {
  text: string;
  /** Who speaks: the mascot (its face beside the text) or the room. */
  who: 'mascot' | 'room';
  n: number;
}

export interface Toast {
  id: number;
  text: string;
  stars: number;
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

const FACE = mascot({ eyes: 'open', look: [0, 0], mouth: 'smile', arms: 'down' });

/** The gold stars, with a "+n" that rises when more come in. */
export function StarCount({ stars, label }: { stars: number; label: string }) {
  const [shown, setShown] = useState(stars);
  const [gain, setGain] = useState<{ n: number; key: number } | null>(null);
  if (shown !== stars) {
    if (stars > shown) setGain({ n: stars - shown, key: stars });
    setShown(stars);
  }
  return (
    <span className={s.chip} title={label}>
      <StarIcon className={s.chipStar} />
      <span aria-hidden="true" className={s.tnum}>{stars}</span>
      <span className="visually-hidden" aria-live="polite">{label}</span>
      {gain && <span key={gain.key} className={s.gain} aria-hidden="true">+{gain.n}</span>}
    </span>
  );
}

/** Rewards that came in: a line each, for a few seconds. */
export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className={s.toasts} role="status" aria-live="polite">
      {toasts.map((x) => (
        <p key={x.id} className={s.toast}>
          {x.stars > 0 && (
            <span className={s.toastStars}>
              <StarIcon className={s.toastStar} />+{x.stars}
            </span>
          )}
          <span>{x.text}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * The text box: typed out letter by letter (all at once with reduced
 * motion); a click or Enter shows the rest, the next one closes it. It goes
 * away on its own after a while. Screen readers get the whole text at once.
 */
export function Dialog({ line, onClose, closeLabel }: { line: Line; onClose: () => void; closeLabel: string }) {
  const [typed, setTyped] = useState({ n: line.n, count: 0 });
  const reduced = useRef(false);
  const count = typed.n === line.n ? typed.count : 0;
  const done = count >= line.text.length;

  useEffect(() => { reduced.current = prefersReducedMotion(); }, []);
  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(() => setTyped({ n: line.n, count: reduced.current ? line.text.length : count + 2 }), 22);
    return () => window.clearTimeout(id);
  }, [count, done, line]);
  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(onClose, Math.max(4200, line.text.length * 70));
    return () => window.clearTimeout(id);
  }, [done, line, onClose]);

  const press = () => (done ? onClose() : setTyped({ n: line.n, count: line.text.length }));
  return (
    <div className={s.dialogWrap}>
      <button type="button" className={s.dialog} onClick={press} aria-label={done ? closeLabel : undefined}>
        {line.who === 'mascot' && <SpriteIcon sprite={FACE} box={[5, 1, 30, 24]} className={s.dialogFace} />}
        <span className={s.dialogText} aria-hidden="true">
          {line.text.slice(0, count)}
          <span className={s.dialogRest}>{line.text.slice(count)}</span>
        </span>
        {done && <span className={s.dialogMore} aria-hidden="true">▼</span>}
      </button>
      <p className="visually-hidden" role="status" aria-live="polite">{line.text}</p>
    </div>
  );
}
