'use client';

import { useEffect, useRef, useState } from 'react';
import { Paths } from '@/components/pixel/SceneSvg';
import { CATCHER, fallingSprite } from '@/components/pixel/handheld';
import { Sprite, disc, rect } from '@/components/pixel/sprite';
import { useT } from '@/providers/LocaleProvider';
import { roomDict } from '@/lib/i18n/dictionaries/room';
import { usePad, type GameProps } from './shared';
import s from '../room.module.css';

// Pixel catch: school things fall from the sky; the little mascot catches
// them. Pencils, books and apples are a point each, a gold star three; ink
// blots and spiders cost a heart. Forty-five seconds, three hearts, faster
// and faster. Arrows or a finger on the field move it.

const W = 64;
const H = 48;
const TOP = 39;
const TIME = 45_000;
const GOOD = ['pencil', 'book', 'apple'];
const BAD = ['ink', 'spider'];

interface Thing {
  id: number;
  kind: string;
  x: number;
  y: number;
}

const SPRITES = Object.fromEntries([...GOOD, ...BAD, 'star'].map((k) => [k, fallingSprite(k)]));

const FIELD = (() => {
  const sky = new Sprite();
  for (let y = 0; y < H; y++) sky.fill(rect(0, y, W, 1), y < 14 ? 'sk2' : y < 30 ? 'sk3' : 'sk4');
  sky.mass([...disc(10, 8, 2.4), ...disc(14, 7, 3), ...disc(18, 8.5, 2.2), ...rect(9, 8, 10, 2)], 'pp', { outline: false });
  sky.mass([...disc(44, 15, 2), ...disc(48, 14, 2.6), ...disc(51, 15.5, 1.8), ...rect(43, 15, 9, 2)], 'pp', { outline: false });
  sky.fill(rect(0, H - 2, W, 2), 'gn2').fill(rect(0, H - 2, W, 1), 'gn3');
  return sky;
})();

export default function Catch({ bus, onEnd, paused }: GameProps) {
  const t = useT(roomDict);
  const field = useRef<SVGSVGElement>(null);
  const g = useRef({ x: 27.5, things: [] as Thing[], spawnIn: 600, time: 0, score: 0, lives: 3, left: false, right: false, target: null as number | null, step: 0, n: 0, hurt: 0, ended: false });
  const pausedRef = useRef(paused);
  const endRef = useRef(onEnd);
  useEffect(() => { pausedRef.current = paused; endRef.current = onEnd; });
  // What is drawn: a copy of the game's state, taken every frame.
  const [view, setView] = useState({ x: 27.5, things: [] as Thing[], score: 0, lives: 3, time: 0, step: 0, hurt: 0 });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(50, now - last);
      last = now;
      const st = g.current;
      if (pausedRef.current || st.ended) return;
      st.time += dt;
      // Moving: towards the finger, or with the arrows held.
      const speed = 0.05 * dt;
      const before = st.x;
      if (st.target !== null) st.x += Math.max(-speed, Math.min(speed, st.target - st.x));
      else st.x += (st.right ? speed : 0) - (st.left ? speed : 0);
      st.x = Math.max(0, Math.min(W - 9, st.x));
      if (Math.abs(st.x - before) > 0.01) st.step += dt;
      // New things, more often and faster as time goes on.
      st.spawnIn -= dt;
      if (st.spawnIn <= 0) {
        const p = st.time / TIME;
        st.spawnIn = 900 - p * 520;
        const r = Math.random();
        const kind = r < 0.05 ? 'star' : r < 0.27 + p * 0.12 ? BAD[Math.floor(Math.random() * BAD.length)] : GOOD[Math.floor(Math.random() * GOOD.length)];
        st.things.push({ id: ++st.n, kind, x: Math.floor(Math.random() * (W - 7)), y: -7 });
      }
      const fall = (0.016 + (st.time / TIME) * 0.022) * dt;
      for (const th of st.things) th.y += fall;
      // Caught: it meets the mascot's head.
      st.things = st.things.filter((th) => {
        if (th.y + 7 >= TOP && th.y < TOP + 4 && th.x + 6 >= st.x && th.x <= st.x + 8) {
          if (BAD.includes(th.kind)) { st.lives -= 1; st.hurt = st.time; }
          else st.score += th.kind === 'star' ? 3 : 1;
          return false;
        }
        return th.y < H;
      });
      if (st.time >= TIME || st.lives <= 0) {
        st.ended = true;
        window.setTimeout(() => endRef.current(st.score), 500);
      }
      setView({ x: st.x, things: st.things.map((th) => ({ ...th })), score: st.score, lives: st.lives, time: st.time, step: st.step, hurt: st.hurt });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  usePad(bus, (key, down) => {
    const st = g.current;
    if (key === 'left') { st.left = down; st.target = null; }
    if (key === 'right') { st.right = down; st.target = null; }
  });

  // A finger or the mouse on the field: the mascot walks there.
  const toward = (e: React.PointerEvent) => {
    const r = field.current?.getBoundingClientRect();
    if (!r) return;
    g.current.target = ((e.clientX - r.left) / r.width) * W - 4.5;
  };

  const st = view;
  const hurt = st.time - st.hurt < 400 && st.hurt > 0;
  return (
    <div className={s.gCatch}>
      <div className={s.gBar}>
        <span>{t('catchScore', { n: st.score })}</span>
        <span aria-label={t('catchLives', { n: st.lives })} className={s.hearts}>
          {[0, 1, 2].map((i) => <span key={i} data-on={i < st.lives ? '' : undefined}>♥</span>)}
        </span>
        <span className={s.tnum}>{Math.max(0, Math.ceil((TIME - st.time) / 1000))}s</span>
      </div>
      <svg
        ref={field}
        viewBox={`0 0 ${W} ${H}`}
        className={`spr ${s.catchField}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={t('catchField')}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); toward(e); }}
        onPointerMove={(e) => { if (e.buttons || e.pointerType !== 'mouse') toward(e); }}
        onPointerUp={() => { g.current.target = null; }}
        onPointerCancel={() => { g.current.target = null; }}
      >
        <Paths sprite={FIELD} />
        {st.things.map((th) => (
          <g key={th.id} transform={`translate(${Math.round(th.x)} ${Math.round(th.y)})`}><Paths sprite={SPRITES[th.kind]} /></g>
        ))}
        <g transform={`translate(${Math.round(st.x)} ${TOP})`} opacity={hurt && Math.floor(st.time / 80) % 2 ? 0.35 : 1}>
          <Paths sprite={CATCHER[Math.floor(st.step / 140) % 2]} />
        </g>
      </svg>
    </div>
  );
}
