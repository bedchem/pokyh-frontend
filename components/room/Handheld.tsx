'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentType } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Paths, SpritePalette } from '@/components/pixel/SceneSvg';
import { handheld, type Pad } from '@/components/pixel/handheld';
import { roomBackdrop } from '@/components/pixel/vending';
import { useT } from '@/providers/LocaleProvider';
import { roomDict, type RoomKey } from '@/lib/i18n/dictionaries/room';
import { prefersReducedMotion } from '@/lib/motion';
import { GAME_IDS, GAME_RULES, PERFECT_BONUS, type GameId } from './catalog';
import { finishGame, useRoomSave, type GameResult } from './store';
import { GameIcon, StarIcon } from './parts';
import { PixelText, createPadBus, usePad, type GameProps } from './games/shared';
import Memory from './games/Memory';
import Maths from './games/Maths';
import Catch from './games/Catch';
import Timetable from './games/Timetable';
import Puzzle from './games/Puzzle';
import s from './room.module.css';

// The tablet on the desk of room 2B, turned on: a little handheld with five
// games (./games). The cross of arrows, A, B, SELECT and START work with a
// click or a finger, and with the keyboard (arrows or WASD; Enter, Space or
// K for A; Backspace, J or Escape for B; P for START). Every game starts
// with its rules, plays, and ends with the score, the stars for it (one to
// three, the same rules for every game: components/room/catalog.ts) and the
// gold stars they bring.

const GAMES: Record<GameId, ComponentType<GameProps>> = { memory: Memory, maths: Maths, catch: Catch, timetable: Timetable, puzzle: Puzzle };

type Screen =
  | { kind: 'boot' }
  | { kind: 'menu' }
  | { kind: 'intro'; game: GameId }
  | { kind: 'play'; game: GameId; run: number }
  | { kind: 'result'; game: GameId; result: GameResult };

const KEYMAP: Record<string, Pad> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
  Enter: 'a', ' ': 'a', k: 'a',
  Backspace: 'b', j: 'b', Escape: 'b',
  p: 'start', Shift: 'select',
};

export default function Handheld({ onClose, onToast }: { onClose: () => void; onToast: (text: string, stars: number) => void }) {
  const t = useT(roomDict);
  const save = useRoomSave();
  const titleId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ W: number; H: number } | null>(null);
  const [screen, setScreen] = useState<Screen>(() => (prefersReducedMotion() ? { kind: 'menu' } : { kind: 'boot' }));
  const [pick, setPick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [down, setDown] = useState<Pad | null>(null);
  const bus = useMemo(() => createPadBus(), []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ W: e.contentRect.width, H: e.contentRect.height }));
    ro.observe(el);
    root.current?.querySelector<HTMLElement>('[data-first]')?.focus({ preventScroll: true });
    return () => ro.disconnect();
  }, []);

  // Switched on: the logo, then the games.
  useEffect(() => {
    if (screen.kind !== 'boot') return;
    const id = window.setTimeout(() => setScreen({ kind: 'menu' }), 1500);
    return () => window.clearTimeout(id);
  }, [screen.kind]);

  // The keyboard works the buttons. On a focused button Enter and Space press it instead.
  useEffect(() => {
    const onKey = (e: KeyboardEvent, pressed: boolean) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const pad = KEYMAP[e.key] ?? KEYMAP[e.key.toLowerCase()];
      if (!pad) return;
      const onControl = e.target instanceof HTMLElement && e.target.closest('button, a, input');
      if (onControl && (e.key === 'Enter' || e.key === ' ')) return;
      e.preventDefault();
      if (pressed && e.repeat && pad !== 'left' && pad !== 'right') return;
      bus.emit(pad, pressed);
      setDown(pressed ? pad : null);
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [bus]);

  const end = useCallback((game: GameId, score: number) => {
    const result = finishGame(game, score);
    setScreen({ kind: 'result', game, result });
    setPaused(false);
    if (result.earned > 0) onToast(t('toastGame', { game: t(`game_${game}` as RoomKey) }), result.earned);
    if (result.trophy) onToast(t('toastItem', { name: t('item_trophy') }), 0);
  }, [onToast, t]);

  // What A, B and START do around the games (the games listen for themselves).
  usePad(bus, (key, pressed) => {
    if (!pressed) return;
    if (screen.kind === 'boot' && (key === 'a' || key === 'start')) setScreen({ kind: 'menu' });
    else if (screen.kind === 'menu') {
      if (key === 'left' || key === 'up') setPick((p) => (p - 1 + GAME_IDS.length) % GAME_IDS.length);
      else if (key === 'right' || key === 'down') setPick((p) => (p + 1) % GAME_IDS.length);
      else if (key === 'a' || key === 'start') setScreen({ kind: 'intro', game: GAME_IDS[pick] });
      else if (key === 'b') onClose();
    } else if (screen.kind === 'intro') {
      if (key === 'a' || key === 'start') setScreen({ kind: 'play', game: screen.game, run: Date.now() });
      else if (key === 'b') setScreen({ kind: 'menu' });
    } else if (screen.kind === 'play') {
      if (key === 'start' || (key === 'b' && !paused)) setPaused((p) => !p);
      else if (paused && key === 'a') setPaused(false);
      else if (paused && key === 'b') { setPaused(false); setScreen({ kind: 'intro', game: screen.game }); }
    } else if (screen.kind === 'result') {
      if (key === 'a') setScreen({ kind: 'play', game: screen.game, run: Date.now() });
      else if (key === 'b' || key === 'start') setScreen({ kind: 'menu' });
    }
  });

  // ── The device ────────────────────────────────────────────────────────
  const tall = box ? box.W / box.H < 1.1 : false;
  const device = handheld(tall ? 'tall' : 'wide');
  // Below the bar with the stars and the way back.
  const top = box && box.W <= 520 ? 58 : 76;
  const px = box ? Math.min((box.W * (tall ? 0.96 : 0.9)) / device.w, ((box.H - top) * 0.97) / device.h, tall ? 4.4 : 5.6) : 3;
  const bw = box ? Math.ceil(box.W / px) + 2 : 0;
  const bh = box ? Math.ceil(box.H / px) + 2 : 0;
  const backdrop = useMemo(() => (bw && bh ? roomBackdrop(bw, bh, Math.round(bh * 0.55)) : null), [bw, bh]);
  const [sx, sy, sw, sh] = device.screen;
  const tap = (pad: Pad) => ({
    onPointerDown: (e: React.PointerEvent) => { e.currentTarget.setPointerCapture(e.pointerId); bus.emit(pad, true); setDown(pad); },
    onPointerUp: () => { bus.emit(pad, false); setDown(null); },
    onPointerCancel: () => { bus.emit(pad, false); setDown(null); },
    // From the keyboard (a focused button): a press and a release.
    onClick: (e: React.MouseEvent) => { if (e.detail === 0) { bus.emit(pad, true); bus.emit(pad, false); } },
  });

  const game = screen.kind === 'menu' ? GAME_IDS[pick] : 'game' in screen ? screen.game : null;
  const Game = screen.kind === 'play' ? GAMES[screen.game] : null;
  const playing = screen.kind === 'play' ? screen.game : null;
  const onEnd = useCallback((score: number) => { if (playing) end(playing, score); }, [playing, end]);

  return (
    <div ref={root} className={s.sub} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <SpritePalette />
      {backdrop && (
        <svg viewBox={`0 0 ${bw} ${bh}`} preserveAspectRatio="xMidYMax slice" className={`spr ${s.backdrop}`} shapeRendering="crispEdges" aria-hidden="true">
          <Paths sprite={backdrop} />
        </svg>
      )}
      <h2 id={titleId} className="visually-hidden">{t('tabletTitle')}</h2>
      <div className={s.device} style={{ width: device.w * px, height: device.h * px, top: `calc(50% + ${top / 2 - 4}px)` }}>
        <svg viewBox={`0 0 ${device.w} ${device.h}`} className="spr absolute inset-0 h-full w-full" shapeRendering="crispEdges" aria-hidden="true">
          <Paths sprite={device.body} />
          <g className={s.ledOn}><Paths sprite={device.led} /></g>
        </svg>

        <div
          className={s.screen}
          data-game={game ?? undefined}
          data-kind={screen.kind}
          style={{ left: sx * px, top: sy * px, width: sw * px, height: sh * px, '--u': `${px}px` } as React.CSSProperties}
        >
          {screen.kind === 'boot' && (
            <div className={s.boot}>
              <PixelText text="POKYH" height="22%" tone="la3" className={s.bootLogo} />
              <p className={s.bootSub}>{t('bootLine')}</p>
            </div>
          )}

          {screen.kind === 'menu' && (
            <div className={s.menu}>
              <p className={s.menuTop}>
                <span>{t('menuTitle')}</span>
                <span className={s.menuStars}><StarIcon className={s.screenStar} />{save.stars}</span>
              </p>
              <div className={s.menuPick}>
                <button type="button" className={s.menuArrow} onClick={() => setPick((p) => (p - 1 + GAME_IDS.length) % GAME_IDS.length)} aria-label={t('menuPrev')}>
                  <CaretLeft size={16} weight="bold" aria-hidden="true" />
                </button>
                <button type="button" data-first="" className={s.menuCard} onClick={() => setScreen({ kind: 'intro', game: GAME_IDS[pick] })} aria-label={`${t(`game_${GAME_IDS[pick]}` as RoomKey)}, ${t('starsOf', { n: save.rated[GAME_IDS[pick]] ?? 0 })}`}>
                  <GameIcon id={GAME_IDS[pick]} className={s.menuIcon} />
                  <PixelText text={t(`game_${GAME_IDS[pick]}` as RoomKey)} height="1.5em" tone={GAME_IDS[pick] === 'timetable' ? 'ik2' : 'pp4'} className={s.menuName} />
                  <Stars n={save.rated[GAME_IDS[pick]] ?? 0} />
                </button>
                <button type="button" className={s.menuArrow} onClick={() => setPick((p) => (p + 1) % GAME_IDS.length)} aria-label={t('menuNext')}>
                  <CaretRight size={16} weight="bold" aria-hidden="true" />
                </button>
              </div>
              <p className={s.menuDots} aria-hidden="true">{GAME_IDS.map((g, i) => <span key={g} data-on={i === pick ? '' : undefined} />)}</p>
              <p className={s.menuHelp}>{t('menuHelp')}</p>
            </div>
          )}

          {screen.kind === 'intro' && (
            <div className={s.intro}>
              <PixelText text={t(`game_${screen.game}` as RoomKey)} height="2em" tone={screen.game === 'timetable' ? 'ik2' : 'pp4'} className={s.introTitle} />
              <p className={s.introText}>{t(`how_${screen.game}` as RoomKey)}</p>
              <p className={s.introRule}>{t(`rule_${screen.game}` as RoomKey, { a: GAME_RULES[screen.game].stars[1], b: GAME_RULES[screen.game].stars[2] })}</p>
              {save.best[screen.game] !== undefined && <p className={s.introBest}>{t('best', { score: t(`score_${screen.game}` as RoomKey, { n: save.best[screen.game]! }) })}</p>}
              <div className={s.screenActions}>
                <button type="button" data-first="" className={s.screenKey} onClick={() => setScreen({ kind: 'play', game: screen.game, run: Date.now() })}>{t('keyStart')}</button>
                <button type="button" className={s.screenKeyQuiet} onClick={() => setScreen({ kind: 'menu' })}>{t('keyMenu')}</button>
              </div>
            </div>
          )}

          {screen.kind === 'play' && Game && (
            <>
              <Game key={screen.run} bus={bus} paused={paused} onEnd={onEnd} />
              {paused && (
                <div className={s.pause} role="dialog" aria-label={t('pause')}>
                  <PixelText text={t('pause')} height="2em" tone={screen.game === 'timetable' ? 'ik2' : 'pp4'} />
                  <div className={s.screenActions}>
                    <button type="button" className={s.screenKey} onClick={() => setPaused(false)}>{t('keyResume')}</button>
                    <button type="button" className={s.screenKeyQuiet} onClick={() => { setPaused(false); setScreen({ kind: 'intro', game: screen.game }); }}>{t('keyQuit')}</button>
                  </div>
                </div>
              )}
            </>
          )}

          {screen.kind === 'result' && (
            <div className={s.result} aria-live="polite">
              <PixelText text={screen.result.stars === 3 ? t('resultGreat') : screen.result.stars ? t('resultDone') : t('resultTry')} height="2em" tone={screen.game === 'timetable' ? 'ik2' : 'pp4'} />
              <p className={s.resultScore}>{t(`score_${screen.game}` as RoomKey, { n: screen.result.score })}</p>
              <Stars n={screen.result.stars} big />
              <p className={s.resultEarned}>
                {screen.result.earned > 0 ? (
                  <><StarIcon className={s.screenStar} /> {t('resultEarned', { n: screen.result.earned })}{screen.result.perfectBonus ? ` ${t('resultBonus', { n: PERFECT_BONUS })}` : ''}</>
                ) : t('resultNone')}
              </p>
              {screen.result.best && <p className={s.resultBest}>{t('resultBest')}</p>}
              {screen.result.trophy && <p className={s.resultBest}>{t('resultTrophy')}</p>}
              <div className={s.screenActions}>
                <button type="button" data-first="" className={s.screenKey} onClick={() => setScreen({ kind: 'play', game: screen.game, run: Date.now() })}>{t('keyAgain')}</button>
                <button type="button" className={s.screenKeyQuiet} onClick={() => setScreen({ kind: 'menu' })}>{t('keyMenu')}</button>
              </div>
            </div>
          )}
        </div>

        {(Object.keys(device.pads) as Pad[]).map((pad) => {
          const [x, y, w, h] = device.pads[pad];
          return (
            <button
              key={pad}
              type="button"
              className={s.pad}
              data-round={pad === 'a' || pad === 'b' ? '' : undefined}
              data-down={down === pad ? '' : undefined}
              aria-label={t(`pad_${pad}` as RoomKey)}
              style={{ left: x * px, top: y * px, width: w * px, height: h * px }}
              {...tap(pad)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Stars({ n, big }: { n: number; big?: boolean }) {
  return (
    <span className={big ? s.starsBig : s.starsSmall} aria-hidden="true">
      {[1, 2, 3].map((i) => <span key={i} data-on={i <= n ? '' : undefined} style={{ animationDelay: `${i * 160}ms` }}>★</span>)}
    </span>
  );
}
