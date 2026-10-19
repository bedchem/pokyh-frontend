'use client';

import { useEffect, useState } from 'react';
import { FACES } from '@/components/pixel/handheld';
import { useT } from '@/providers/LocaleProvider';
import { roomDict } from '@/lib/i18n/dictionaries/room';
import { SpriteIcon } from '../parts';
import { shuffle, usePad, type GameProps } from './shared';
import s from '../room.module.css';

// Memory: twelve cards, six pairs of the mascot's faces. Turn two; a pair
// stays open, two different ones turn back. The fewer moves, the better.

interface Card {
  face: number;
  open: boolean;
  done: boolean;
}

const COLS = 4;

function deal(): Card[] {
  const faces = shuffle(FACES.map((_, i) => i)).slice(0, 6);
  return shuffle([...faces, ...faces]).map((face) => ({ face, open: false, done: false }));
}

export default function Memory({ bus, onEnd, paused }: GameProps) {
  const t = useT(roomDict);
  const [cards, setCards] = useState(deal);
  const [cursor, setCursor] = useState(0);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const open = cards.map((c, i) => (c.open && !c.done ? i : -1)).filter((i) => i >= 0);

  const allDone = cards.every((c) => c.done);
  useEffect(() => {
    if (!allDone) return;
    const id = window.setTimeout(() => onEnd(moves), 600);
    return () => window.clearTimeout(id);
  }, [allDone, moves, onEnd]);

  // Two open: a pair stays, two different ones turn back.
  const flip = (i: number) => {
    if (paused || locked || cards[i].open || cards[i].done) return;
    setCursor(i);
    setCards((old) => old.map((c, j) => (j === i ? { ...c, open: true } : c)));
    if (open.length !== 1) return;
    const a = open[0];
    const pair = cards[a].face === cards[i].face;
    setMoves((m) => m + 1);
    setLocked(true);
    window.setTimeout(() => {
      setCards((old) => old.map((c, j) => (j === a || j === i ? (pair ? { ...c, done: true } : { ...c, open: false }) : c)));
      setLocked(false);
    }, pair ? 260 : 760);
  };

  usePad(bus, (key, down) => {
    if (!down || paused) return;
    if (key === 'left') setCursor((c) => (c % COLS ? c - 1 : c + COLS - 1));
    else if (key === 'right') setCursor((c) => (c % COLS === COLS - 1 ? c - COLS + 1 : c + 1));
    else if (key === 'up') setCursor((c) => (c - COLS + cards.length) % cards.length);
    else if (key === 'down') setCursor((c) => (c + COLS) % cards.length);
    else if (key === 'a') flip(cursor);
  });

  return (
    <div className={s.gMemory}>
      <div className={s.gBar}>
        <span>{t('memoryMoves', { n: moves })}</span>
        <span>{t('memoryPairs', { n: cards.filter((c) => c.done).length / 2, total: 6 })}</span>
      </div>
      <div className={s.memoryGrid} role="grid" aria-label={t('game_memory')}>
        {cards.map((c, i) => (
          <button
            key={i}
            type="button"
            className={s.memoryCard}
            data-open={c.open || c.done ? '' : undefined}
            data-done={c.done ? '' : undefined}
            data-cursor={cursor === i ? '' : undefined}
            onClick={() => flip(i)}
            aria-label={c.open || c.done ? t('memoryCardFace', { n: i + 1, face: t(`face_${FACES[c.face].id}` as Parameters<typeof t>[0]) }) : t('memoryCard', { n: i + 1 })}
          >
            <span className={s.memoryBack} aria-hidden="true" />
            <span className={s.memoryFace} aria-hidden="true">
              <SpriteIcon sprite={FACES[c.face].sprite} box={[4, 0, 32, 26]} className={s.memoryIcon} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
