'use client';

import { useState } from 'react';
import { useT } from '@/providers/LocaleProvider';
import { roomDict } from '@/lib/i18n/dictionaries/room';
import { PixelText, shuffle, useCountdown, usePad, type GameProps } from './shared';
import s from '../room.module.css';

// Quick maths on the chalkboard: 45 seconds, as many sums as you can. Four
// answers to choose from; a right one is worth a point and a second more, a
// wrong one costs three seconds. They get harder as you go: plus and minus,
// then times, then divided.

const TIME = 45_000;

interface Sum {
  text: string;
  answer: number;
  options: number[];
}

const rnd = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));

function next(level: number): Sum {
  let a: number;
  let b: number;
  let text: string;
  let answer: number;
  const op = level < 3 ? rnd(0, 1) : level < 6 ? rnd(0, 2) : rnd(0, 3);
  if (op === 0) { a = rnd(2, 12 + level * 4); b = rnd(2, 9 + level * 3); text = `${a} + ${b}`; answer = a + b; }
  else if (op === 1) { a = rnd(6, 15 + level * 4); b = rnd(1, a - 1); text = `${a} - ${b}`; answer = a - b; }
  else if (op === 2) { a = rnd(2, 9); b = rnd(2, level < 8 ? 9 : 12); text = `${a} × ${b}`; answer = a * b; }
  else { b = rnd(2, 9); answer = rnd(2, 9); a = b * answer; text = `${a} ÷ ${b}`; }
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const w = answer + (Math.random() < 0.5 ? -1 : 1) * rnd(1, op >= 2 ? 6 : 4);
    if (w >= 0 && w !== answer) wrong.add(w);
  }
  return { text, answer, options: shuffle([answer, ...wrong]) };
}

export default function Maths({ bus, onEnd, paused }: GameProps) {
  const t = useT(roomDict);
  const [sum, setSum] = useState(() => next(0));
  const [score, setScore] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [left, setLeft] = useState(TIME);
  const [flash, setFlash] = useState<{ right: boolean; n: number } | null>(null);
  const [over, setOver] = useState(false);

  const clock = useCountdown(TIME, paused || over, (ms) => {
    setLeft(ms);
    if (ms <= 0 && !over) {
      setOver(true);
      window.setTimeout(() => onEnd(score), 500);
    }
  });

  const answer = (i: number) => {
    if (paused || over) return;
    const right = sum.options[i] === sum.answer;
    setFlash({ right, n: Date.now() });
    if (right) {
      setScore((n) => n + 1);
      clock.add(1000);
      setSum(next(Math.floor((score + 1) / 3)));
    } else clock.add(-3000);
  };

  usePad(bus, (key, down) => {
    if (!down || paused || over) return;
    if (key === 'left' || key === 'right') setCursor((c) => c ^ 1);
    else if (key === 'up' || key === 'down') setCursor((c) => c ^ 2);
    else if (key === 'a') answer(cursor);
  });

  return (
    <div className={s.gMaths}>
      <div className={s.gBar}>
        <span>{t('mathsScore', { n: score })}</span>
        <span className={s.timer} aria-label={t('timeLeft', { n: Math.ceil(left / 1000) })}>
          <span style={{ width: `${Math.min(100, (left / TIME) * 100)}%` }} data-low={left < 8000 ? '' : undefined} />
        </span>
      </div>
      <div className={s.mathsSum}>
        {flash && <span key={flash.n} className={s.flash} data-right={flash.right ? '' : undefined} aria-hidden="true">{flash.right ? '+1' : '-3s'}</span>}
        <PixelText text={`${sum.text} = ?`} height="100%" className={s.mathsText} tone="pp3" />
        <span className="visually-hidden" aria-live="polite">{sum.text.replace('×', '·')} = ?</span>
      </div>
      <div className={s.mathsAnswers}>
        {sum.options.map((o, i) => (
          <button key={`${sum.text}-${o}`} type="button" className={s.mathsAnswer} data-cursor={cursor === i ? '' : undefined} onClick={() => { setCursor(i); answer(i); }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
