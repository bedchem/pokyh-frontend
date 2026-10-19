'use client';

import { useEffect, useState } from 'react';
import { Paths } from '@/components/pixel/SceneSvg';
import { puzzlePicture } from '@/components/pixel/handheld';
import { useT } from '@/providers/LocaleProvider';
import { roomDict } from '@/lib/i18n/dictionaries/room';
import { usePad, type GameProps } from './shared';
import s from '../room.module.css';

// Mascot puzzle: a picture of the mascot in room 2B, cut into nine squares,
// one missing, the rest shuffled. Slide them back: a click on a square next
// to the gap, or the arrows (the square beside the gap moves into it).
// SELECT shows the numbers. The fewer moves, the better.

const N = 3;
const EMPTY = N * N - 1;
const PICTURE = puzzlePicture();

const neighbours = (i: number) => [i - N, i + N, i % N ? i - 1 : -1, i % N < N - 1 ? i + 1 : -1].filter((j) => j >= 0 && j < N * N);

/** Solvable for sure: random slides away from the solved picture. */
function scramble(): number[] {
  let board = Array.from({ length: N * N }, (_, i) => i);
  let gap = EMPTY;
  let prev = -1;
  for (let k = 0; k < 90 || board.every((v, i) => v === i); k++) {
    const options = neighbours(gap).filter((j) => j !== prev);
    const j = options[Math.floor(Math.random() * options.length)];
    board = board.map((v, i) => (i === gap ? board[j] : i === j ? EMPTY : v));
    prev = gap;
    gap = j;
  }
  return board;
}

export default function Puzzle({ bus, onEnd, paused }: GameProps) {
  const t = useT(roomDict);
  const [board, setBoard] = useState(scramble);
  const [moves, setMoves] = useState(0);
  const [numbers, setNumbers] = useState(false);
  const solved = board.every((v, i) => v === i);
  const gap = board.indexOf(EMPTY);

  useEffect(() => {
    if (!solved) return;
    const id = window.setTimeout(() => onEnd(moves), 900);
    return () => window.clearTimeout(id);
  }, [solved, moves, onEnd]);

  const slide = (i: number) => {
    if (paused || solved || !neighbours(gap).includes(i)) return;
    setBoard((old) => old.map((v, j) => (j === gap ? old[i] : j === i ? EMPTY : v)));
    setMoves((m) => m + 1);
  };

  usePad(bus, (key, down) => {
    if (!down || paused) return;
    // The square on the far side of the gap moves into it.
    if (key === 'up' && gap + N < N * N) slide(gap + N);
    else if (key === 'down' && gap - N >= 0) slide(gap - N);
    else if (key === 'left' && gap % N < N - 1) slide(gap + 1);
    else if (key === 'right' && gap % N > 0) slide(gap - 1);
    else if (key === 'select') setNumbers((n) => !n);
  });

  return (
    <div className={s.gPuzzle}>
      <div className={s.gBar}>
        <span>{t('puzzleMoves', { n: moves })}</span>
        <button type="button" className={s.gSmall} onClick={() => setNumbers((n) => !n)} aria-pressed={numbers}>{t('puzzleNumbers')}</button>
      </div>
      <div className={s.puzzleBoard} data-solved={solved ? '' : undefined} role="grid" aria-label={t('game_puzzle')}>
        {board.map((v, i) => {
          if (v === EMPTY && !solved) return <span key="gap" className={s.puzzleGap} style={{ gridRow: Math.floor(i / N) + 1, gridColumn: (i % N) + 1 }} />;
          const sx = (v % N) * 16;
          const sy = Math.floor(v / N) * 16;
          return (
            <button
              key={v}
              type="button"
              className={s.puzzleTile}
              style={{ gridRow: Math.floor(i / N) + 1, gridColumn: (i % N) + 1 }}
              onClick={() => slide(i)}
              disabled={solved}
              aria-label={t('puzzleTile', { n: v + 1 })}
              data-movable={neighbours(gap).includes(i) ? '' : undefined}
            >
              <svg viewBox={`${sx} ${sy} 16 16`} className="spr h-full w-full" shapeRendering="crispEdges" aria-hidden="true">
                <Paths sprite={PICTURE} />
              </svg>
              {numbers && <span className={s.puzzleNum} aria-hidden="true">{v + 1}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
