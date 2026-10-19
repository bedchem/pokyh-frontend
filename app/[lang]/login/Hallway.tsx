'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Paths, SpritePalette } from '@/components/pixel/SceneSvg';
import { CLOUD_LOOP, bubble, buildHallway, clockHands, mark, sweat, thinking, topOf } from '@/components/pixel/hallway';
import { MASCOT_SHADOW, MH, MW, mascot, type Pose } from '@/components/pixel/mascot';
import { isOffensive } from '@/lib/mascot-filter';
import { loginDict } from '@/lib/i18n/dictionaries/login';
import { useT } from '@/providers/LocaleProvider';
import { prefersReducedMotion } from '@/lib/motion';

// The mascot of the sign-in page (drawn in components/pixel/mascot.ts) and
// the school hallway it stands in (components/pixel/hallway.ts). It answers
// the form: a magnifier while the school is searched ("!" when there are
// results, "?" when there are none), a wave and "Hallo, …!" while the name is
// typed, both hands over its eyes for the password (peeking when the password
// is shown), wide eyes and then a thumb up when the browser fills the form,
// a wobble and a drop of sweat at an error, a cheer when signing in works.
// Otherwise it blinks, breathes and follows the pointer with its eyes. The
// open locker shuts while the password is typed. `HallwayScene` fills the
// panel beside the form on desktops; `MascotBadge` is the small one above it
// on phones. Decorative only (aria-hidden).

export type MascotEvent = { kind: 'autofill' | 'error' | 'success' | 'picked'; n: number } | null;

export interface MascotState {
  step: 'school' | 'account';
  focus: 'school' | 'user' | 'password' | null;
  query: string;
  search: 'idle' | 'short' | 'loading' | 'done' | 'error';
  results: number;
  username: string;
  showPw: boolean;
  loading: boolean;
  /** Counts keystrokes: each one makes it hop. */
  keys: number;
  event: MascotEvent;
}

type Phase = 'surprise' | 'thumb' | 'error' | 'picked' | 'success' | null;

interface Look {
  pose: Pose;
  blink?: boolean;
  wave?: boolean;
  mark?: '!' | '?';
  sweat?: boolean;
  think?: boolean;
  /** What it says; `name` is fitted to the room there is. */
  say?: { key: 'mascotHello' | 'mascotGo' | 'mascotOops' } | { key: 'mascotHelloName'; name: string };
  motion: 'bob' | 'hop' | 'jump' | 'shake';
  locker: 'open' | 'shut';
}

/** The moments that play out on their own after an event. */
function usePhase(event: MascotEvent): Phase {
  const [phase, setPhase] = useState<Phase>(null);
  useEffect(() => {
    if (!event) return;
    const steps: Array<[Phase, number]> =
      event.kind === 'autofill' ? [['surprise', 0], ['thumb', 950], [null, 2700]]
      : event.kind === 'error' ? [['error', 0], [null, 2600]]
      : event.kind === 'picked' ? [['picked', 0], [null, 900]]
      : [['success', 0]];
    const timers = steps.map(([p, at]) => setTimeout(() => setPhase(p), at));
    return () => timers.forEach(clearTimeout);
  }, [event]);
  return phase;
}

function lookFor(s: MascotState, phase: Phase, eyes: [number, number]): Look {
  const base = { motion: 'bob', locker: 'open' } as const;
  if (phase === 'success') return { ...base, pose: { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'cheer' }, say: { key: 'mascotGo' }, motion: 'jump' };
  if (phase === 'error') return { ...base, pose: { eyes: 'open', look: [0, 1], mouth: 'wobble', arms: 'down' }, sweat: true, say: { key: 'mascotOops' }, motion: 'shake' };
  if (phase === 'surprise') return { ...base, pose: { eyes: 'wide', look: [0, 0], mouth: 'o', arms: 'down' }, mark: '!', motion: 'jump' };
  if (phase === 'thumb') return { ...base, pose: { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'thumb' } };
  if (phase === 'picked') return { ...base, pose: { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'cheer' }, motion: 'jump' };
  if (s.loading) return { ...base, pose: { eyes: 'open', look: [1, 0], mouth: 'smile', arms: 'down' }, think: true };
  const typing = s.keys > 0 ? 'hop' : 'bob';
  if (s.step === 'account' && s.focus === 'password') {
    return s.showPw
      ? { ...base, pose: { eyes: 'open', look: [1, 1], mouth: 'o', arms: 'peek' }, motion: typing, locker: 'shut' }
      : { ...base, pose: { eyes: 'closed', look: [0, 0], mouth: 'flat', arms: 'cover' }, motion: typing, locker: 'shut' };
  }
  if (s.step === 'account' && s.focus === 'user') {
    const name = s.username.trim();
    return name
      ? { ...base, pose: { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'wave' }, wave: true, say: { key: 'mascotHelloName', name }, motion: typing }
      : { ...base, pose: { eyes: 'open', look: [1, 0], mouth: 'smile', arms: 'wave' }, wave: true, say: { key: 'mascotHello' } };
  }
  if (s.step === 'school' && (s.focus === 'school' || s.query.trim())) {
    if (s.search === 'done' && s.results > 0) return { ...base, pose: { eyes: 'open', look: [1, 0], mouth: 'grin', arms: 'lens' }, mark: '!', motion: typing };
    if ((s.search === 'done' && !s.results) || s.search === 'error') return { ...base, pose: { eyes: 'open', look: [0, 0], mouth: 'wobble', arms: 'lens' }, mark: '?', motion: typing };
    return { ...base, pose: { eyes: 'open', look: [1, 0], mouth: 'o', arms: 'lens' }, motion: typing };
  }
  return { ...base, pose: { eyes: 'open', look: eyes, mouth: 'smile', arms: 'down' }, blink: true };
}

/**
 * The text of a speech bubble; a long name goes on more lines
 * (components/pixel/hallway.ts, bubble). A name the mascot shouldn't say
 * (lib/mascot-filter.ts) gets a plain hello instead.
 */
function useSay() {
  const t = useT(loginDict);
  return (say: NonNullable<Look['say']>) => {
    if (say.key !== 'mascotHelloName') return t(say.key);
    return isOffensive(say.name) ? t('mascotHello') : t('mascotHelloName', { name: say.name });
  };
}

/** The mascot at (0, 0): its shadow, the body with its frames, and what's above its head. */
function Mascot({ look, motionKey, marks = 'above' }: { look: Look; motionKey: string; marks?: 'above' | 'beside' }) {
  const base = mascot(look.pose);
  // Waving: the hand goes out, up, in towards the head and up again.
  const wave = look.wave ? mascot({ ...look.pose, arms: 'wave2' }) : null;
  const wave3 = look.wave ? mascot({ ...look.pose, arms: 'wave3' }) : null;
  const blink = !wave && look.blink && look.pose.eyes === 'open' ? mascot({ ...look.pose, eyes: 'blink' }) : null;
  const [mx, my] = marks === 'above' ? [16, -10] : [MW, 2];
  return (
    <>
      <Paths sprite={MASCOT_SHADOW} />
      <g key={motionKey} className={`ms-${look.motion}`}>
        <g className={look.motion === 'bob' ? 'ms-breathe' : undefined}>
          <g className={wave ? 'ms-frame-a' : blink ? 'ms-open' : undefined}><Paths sprite={base} /></g>
          {wave && <g className="ms-frame-b"><Paths sprite={wave} /></g>}
          {wave3 && <g className="ms-frame-c"><Paths sprite={wave3} /></g>}
          {blink && <g className="ms-blink"><Paths sprite={blink} /></g>}
          {look.sweat && <g className="ms-drip"><Paths sprite={sweat(31, 3)} /></g>}
        </g>
        {look.mark && <g className="ms-pop"><Paths sprite={mark(look.mark, mx, my)} /></g>}
        {look.think && <g className="ms-pop"><Paths sprite={thinking(marks === 'above' ? 24 : MW - 2, marks === 'above' ? -9 : 1)} /></g>}
      </g>
    </>
  );
}

function motionKey(look: Look, s: MascotState) {
  return look.motion === 'hop' ? `h${s.keys}` : look.motion === 'bob' ? 'bob' : `${look.motion}${s.event?.n ?? 0}`;
}

/** Where the pointer is, seen from the mascot: -1, 0 or 1 on each axis. */
function usePointerLook(target: React.RefObject<Element | null>, centre: () => { x: number; y: number } | null) {
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

/** The time for the clock on the wall, once a minute. */
function useMinute() {
  const [now, setNow] = useState<{ h: number; m: number } | null>(null);
  useEffect(() => {
    const tick = () => { const d = new Date(); setNow({ h: d.getHours(), m: d.getMinutes() }); };
    const first = setTimeout(tick, 0);
    const every = setInterval(tick, 20_000);
    return () => { clearTimeout(first); clearInterval(every); };
  }, []);
  return now;
}

export function HallwayScene({ state }: { state: MascotState }) {
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const clipId = useId();
  const phase = usePhase(state.event);
  const now = useMinute();
  const say = useSay();

  // The scene in pixels of the drawing: about 112 rows high, as wide as the panel allows.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const px = Math.min(9, Math.max(4, height / 112));
      const next = { w: Math.ceil(width / px), h: Math.ceil(height / px) };
      setSize((old) => (old && old.w === next.w && old.h === next.h ? old : next));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hall = useMemo(() => (size ? buildHallway(size.w, size.h) : null), [size]);
  const eyes = usePointerLook(root, () => {
    const el = root.current;
    if (!el || !hall) return null;
    const r = el.getBoundingClientRect();
    const scale = Math.max(r.width / hall.w, r.height / hall.h);
    return {
      x: r.left + (r.width - hall.w * scale) / 2 + (hall.mascot[0] + MW / 2) * scale,
      y: r.top + (r.height - hall.h * scale) + (hall.mascot[1] + MH / 2) * scale,
    };
  });
  const look = lookFor(state, phase, eyes);

  let speech = null;
  if (hall && look.say) {
    const [mx, my] = hall.mascot;
    // As wide as the hallway leaves beside the mascot, at most about 25 letters.
    const room = Math.min(100, hall.w - (mx + 32) - 10);
    speech = bubble(say(look.say), mx + 30, my + 6, room);
  }

  return (
    <div ref={root} className="login-hall relative h-full overflow-hidden rounded-[36px]" aria-hidden="true">
      <SpritePalette />
      {hall && (
        <svg
          viewBox={`0 0 ${hall.w} ${hall.h}`}
          preserveAspectRatio="xMidYMax slice"
          className="spr login-hall-in absolute inset-0 h-full w-full"
          shapeRendering="crispEdges"
        >
          <defs>
            <clipPath id={clipId}>
              {hall.panes.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />)}
            </clipPath>
          </defs>
          <Paths sprite={hall.back} />
          <g className="hw-day">
            <Paths sprite={hall.day} />
            <g clipPath={`url(#${clipId})`}>
              <g className="hw-clouds" style={{ '--hw-loop': `-${CLOUD_LOOP}px` } as React.CSSProperties}><Paths sprite={hall.clouds} /></g>
            </g>
          </g>
          <g className="hw-night">
            <Paths sprite={hall.night} />
            <g className="hw-stars"><Paths sprite={hall.stars} /></g>
          </g>
          <g key={look.locker} className="hw-locker"><Paths sprite={look.locker === 'open' ? hall.lockerOpen : hall.lockerShut} /></g>
          {now && <Paths sprite={clockHands(hall.clock[0], hall.clock[1], now.h, now.m)} />}
          <g transform={`translate(${hall.mascot[0]} ${hall.mascot[1]})`}>
            <Mascot look={look} motionKey={motionKey(look, state)} />
          </g>
          {speech && <g key={look.say?.key} className="ms-pop"><Paths sprite={speech} /></g>}
        </svg>
      )}
    </div>
  );
}

/** The small mascot above the form on phones, with its speech bubble beside it. */
export function MascotBadge({ state }: { state: MascotState }) {
  const phase = usePhase(state.event);
  const say = useSay();
  const look = lookFor(state, phase, [1, 0]);
  const W = 120;
  const speech = look.say ? bubble(say(look.say), MW - 2, 17, W - MW - 8) : null;
  // A bubble on more lines grows upwards: the drawing makes room for it.
  const top = Math.min(-2, speech ? topOf(speech) - 1 : -2);
  return (
    <>
      <SpritePalette />
      <svg viewBox={`0 ${top} ${W} ${MH - top}`} className="spr block w-[240px] max-w-full" shapeRendering="crispEdges" aria-hidden="true" overflow="visible">
        <Mascot look={look} motionKey={motionKey(look, state)} marks="beside" />
        {speech && <g key={look.say?.key} className="ms-pop"><Paths sprite={speech} /></g>}
      </svg>
    </>
  );
}
