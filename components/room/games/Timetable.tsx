'use client';

import { useEffect, useState } from 'react';
import { Sprite, grid } from '@/components/pixel/sprite';
import { useT } from '@/providers/LocaleProvider';
import { roomDict, type RoomKey } from '@/lib/i18n/dictionaries/room';
import { SpriteIcon } from '../parts';
import { shuffle, usePad, type GameProps } from './shared';
import s from '../room.module.css';

// Timetable challenge: a day's plan shows for a moment; then the lessons
// come shuffled and you put them back in order, first lesson first. Five
// days, from three lessons to seven; a wrong lesson costs one of two
// hearts and shows the day again. The score is the days done.

export const SUBJECTS = ['maths', 'german', 'english', 'art', 'music', 'sport', 'bio', 'history'] as const;
type Subject = (typeof SUBJECTS)[number];

const ICON_ART: Record<Subject, [string[], string]> = {
  maths: [['..#..', '..#..', '#####', '..#..', '..#..'], 'ac'],
  german: [['.###.', '#...#', '#####', '#...#', '#...#'], 'rd'],
  english: [['#.#.#', '.###.', '#####', '.###.', '#.#.#'], 'wt'],
  art: [['...##', '..##.', '.##..', '##...', '#....'], 'or'],
  music: [['..###', '..#.#', '..#..', '###..', '##...'], 'ik'],
  sport: [['.###.', '#.#.#', '#####', '#.#.#', '.###.'], 'gd'],
  bio: [['..##.', '.####', '####.', '.##..', '#....'], 'gn'],
  history: [['#####', '.#.#.', '.#.#.', '.#.#.', '#####'], 'wd'],
};
const ICONS = Object.fromEntries(SUBJECTS.map((id) => [id, new Sprite().mass(grid(ICON_ART[id][0]), ICON_ART[id][1], { outline: false })])) as Record<Subject, Sprite>;

const LENGTHS = [3, 4, 5, 6, 7];

type Phase = 'show' | 'build' | 'miss' | 'over' | 'done';

export default function Timetable({ bus, onEnd, paused }: GameProps) {
  const t = useT(roomDict);
  const [round, setRound] = useState(0);
  const [plan, setPlan] = useState<Subject[]>(() => shuffle([...SUBJECTS]).slice(0, LENGTHS[0]));
  const [pool, setPool] = useState<Subject[]>([]);
  const [placed, setPlaced] = useState(0);
  const [phase, setPhase] = useState<Phase>('show');
  const [lives, setLives] = useState(2);
  const [cursor, setCursor] = useState(0);
  const [wrong, setWrong] = useState<Subject | null>(null);
  const showFor = 1400 + plan.length * 650;

  // Showing the day, then hiding it; a miss shows the right lesson for a moment.
  useEffect(() => {
    if (paused) return;
    if (phase === 'show') {
      const id = window.setTimeout(() => { setPool(shuffle(plan)); setPlaced(0); setCursor(0); setPhase('build'); }, showFor);
      return () => window.clearTimeout(id);
    }
    if (phase === 'miss') {
      const id = window.setTimeout(() => { setWrong(null); setPhase('show'); }, 1100);
      return () => window.clearTimeout(id);
    }
    if (phase === 'over') {
      const id = window.setTimeout(() => onEnd(round), 1300);
      return () => window.clearTimeout(id);
    }
    if (phase === 'done') {
      const id = window.setTimeout(() => {
        if (round + 1 >= LENGTHS.length) { onEnd(LENGTHS.length); return; }
        setRound(round + 1);
        setPlan(shuffle([...SUBJECTS]).slice(0, LENGTHS[round + 1]));
        setPhase('show');
      }, 800);
      return () => window.clearTimeout(id);
    }
  }, [phase, paused, plan, showFor, round, onEnd]);

  const choose = (i: number) => {
    if (phase !== 'build' || paused) return;
    const subject = pool[i];
    if (subject === plan[placed]) {
      const rest = pool.filter((_, j) => j !== i);
      setPool(rest);
      setCursor((c) => Math.min(c, Math.max(0, rest.length - 1)));
      if (placed + 1 === plan.length) setPhase('done');
      setPlaced(placed + 1);
    } else {
      setWrong(subject);
      if (lives <= 1) { setLives(0); setPhase('over'); return; }
      setLives(lives - 1);
      setPhase('miss');
    }
  };

  usePad(bus, (key, down) => {
    if (!down || phase !== 'build' || paused) return;
    if (key === 'left' || key === 'up') setCursor((c) => (c - 1 + pool.length) % pool.length);
    else if (key === 'right' || key === 'down') setCursor((c) => (c + 1) % pool.length);
    else if (key === 'a') choose(cursor);
  });

  const name = (id: Subject) => t(`subj_${id}` as RoomKey);
  const visible = phase === 'show';

  return (
    <div className={s.gTimetable}>
      <div className={s.gBar}>
        <span>{t('ttDay', { n: round + 1, total: LENGTHS.length })}</span>
        <span className={s.hearts} aria-label={t('catchLives', { n: lives })}>
          {[0, 1].map((i) => <span key={i} data-on={i < lives ? '' : undefined}>♥</span>)}
        </span>
      </div>
      <p className={s.ttHint} aria-live="polite">
        {phase === 'show' ? t('ttRemember') : phase === 'build' ? t('ttBuild', { n: placed + 1 }) : phase === 'miss' || phase === 'over' ? t('ttMiss', { name: name(plan[placed]) }) : t('ttDone')}
      </p>
      <div className={s.ttBody}>
        <ol className={s.ttPlan}>
          {plan.map((id, i) => {
            const shown = visible || i < placed || ((phase === 'miss' || phase === 'over') && i === placed) || phase === 'done';
            return (
              <li key={`${round}-${i}`} className={s.ttLesson} data-subject={shown ? id : undefined} data-next={phase === 'build' && i === placed ? '' : undefined}>
                <span className={s.ttNum}>{i + 1}</span>
                {shown ? (
                  <>
                    <SpriteIcon sprite={ICONS[id]} box={[-1, -1, 7, 7]} className={s.ttIcon} />
                    <span className="truncate">{name(id)}</span>
                  </>
                ) : <span aria-label={t('ttEmpty')}>…</span>}
              </li>
            );
          })}
        </ol>
        {phase !== 'show' && (
          <div className={s.ttPool}>
            {pool.map((id, i) => (
              <button
                key={`${round}-${id}`}
                type="button"
                className={s.ttChip}
                data-subject={id}
                data-cursor={cursor === i ? '' : undefined}
                data-wrong={wrong === id ? '' : undefined}
                disabled={phase !== 'build'}
                onClick={() => { setCursor(i); choose(i); }}
              >
                <SpriteIcon sprite={ICONS[id]} box={[-1, -1, 7, 7]} className={s.ttIcon} />
                <span className="truncate">{name(id)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {visible && <span key={`bar${round}-${lives}`} className={s.ttBar} style={{ animationDuration: `${showFor}ms` }} aria-hidden="true" />}
    </div>
  );
}
