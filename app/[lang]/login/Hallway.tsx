'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Paths, SpritePalette } from '@/components/pixel/SceneSvg';
import { CLOUD_LOOP, bubble, buildHallway, clockHands, topOf, type Doorway } from '@/components/pixel/hallway';
import { MH, MW } from '@/components/pixel/mascot';
import MascotFigure, { usePointerLook, type Look as FigureLook } from '@/components/pixel/MascotFigure';
import { useRoomSave } from '@/components/room/store';
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
// A word it must not say (lib/mascot-filter.ts) in the name or the school
// search makes it angry: brows down, fists up, red in the face, fuming.
// Otherwise it blinks, breathes and follows the pointer with its eyes. The
// open locker shuts while the password is typed. `HallwayScene` fills the
// panel beside the form on desktops, with the door of room 2B; `MascotBadge`
// is the small one above it on phones, without the door. Decorative only
// (aria-hidden), apart from the door.

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

interface Look extends FigureLook {
  /** What it says; `name` is fitted to the room there is. */
  say?: { key: 'mascotHello' | 'mascotGo' | 'mascotOops' | 'mascotAngry' | 'mascotBack' } | { key: 'mascotHelloName'; name: string };
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
  const angry: Look = { ...base, pose: { eyes: 'angry', look: [0, 0], mouth: 'frown', arms: 'fists' }, anger: true, say: { key: 'mascotAngry' }, motion: 'fume' };
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
    if (name && isOffensive(name)) return angry;
    return name
      ? { ...base, pose: { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'wave' }, wave: true, say: { key: 'mascotHelloName', name }, motion: typing }
      : { ...base, pose: { eyes: 'open', look: [1, 0], mouth: 'smile', arms: 'wave' }, wave: true, say: { key: 'mascotHello' } };
  }
  if (s.step === 'school' && (s.focus === 'school' || s.query.trim())) {
    if (s.query.trim() && isOffensive(s.query)) return angry;
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

function motionKey(look: Look, s: MascotState) {
  return look.motion === 'hop' ? `h${s.keys}` : look.motion === 'bob' ? 'bob' : `${look.motion}${s.event?.n ?? 0}`;
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

/**
 * The door of room 2B, step by step: shut, opening in two steps, open, the
 * view going in (`zoom`); coming back out it shuts behind you.
 */
type DoorStep = 'shut' | 'ajar0' | 'ajar1' | 'open' | 'zoom' | 'back' | 'out' | 'close1' | 'close0';
const DOOR_NEXT: Partial<Record<DoorStep, [DoorStep, number]>> = {
  ajar0: ['ajar1', 110],
  ajar1: ['open', 120],
  open: ['zoom', 240],
  back: ['out', 60],
  out: ['close1', 620],
  close1: ['close0', 150],
  close0: ['shut', 130],
};
const ZOOM_MS = 780;

/**
 * The drawing's transform: moved and grown towards the doorway at (x, y)
 * while `zoomed` (fast at the end, like a step through it), easing back out
 * otherwise. Only when it moves: a transform would blur nothing, but a
 * standing one costs a layer.
 */
function zoomInto(x: number, y: number, dx: number, dy: number, k: number, zoomed: boolean, door: DoorStep): React.CSSProperties | undefined {
  const origin = `${x}px ${y}px`;
  if (zoomed) return { transformOrigin: origin, transform: `translate(${dx}px, ${dy}px) scale(${k})`, transition: door === 'zoom' ? `transform ${ZOOM_MS}ms cubic-bezier(0.6, 0, 0.85, 0.35)` : 'none' };
  if (door === 'out') return { transformOrigin: origin, transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' };
  return undefined;
}

interface DoorProps {
  /** The door was opened and the view has gone through it (room 2B, components/room). */
  onDoor?: () => void;
  /** The pointer or the focus is on the door: time to fetch the room. */
  onDoorIntent?: () => void;
  /** Counts the times someone came back out of the room: the door shuts behind them. */
  returns?: number;
}

/** The door's state: its steps, the pointer on it, the wave on coming back. */
function useDoor({ onDoor, onDoorIntent, returns = 0 }: DoorProps) {
  const button = useRef<HTMLButtonElement>(null);
  const [door, setDoor] = useState<DoorStep>('shut');
  const [hover, setHover] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [seenReturns, setSeenReturns] = useState(returns);
  if (seenReturns !== returns) {
    setSeenReturns(returns);
    // Back out: first still at the doorway, then the view pulls back and the door shuts.
    setDoor('back');
    setWelcome(true);
  }

  useEffect(() => {
    const step = DOOR_NEXT[door];
    if (step) {
      const id = window.setTimeout(() => setDoor(step[0]), prefersReducedMotion() ? Math.min(step[1], 60) : step[1]);
      return () => window.clearTimeout(id);
    }
    if (door === 'zoom') {
      const id = window.setTimeout(() => onDoor?.(), prefersReducedMotion() ? 0 : ZOOM_MS);
      return () => window.clearTimeout(id);
    }
  }, [door, onDoor]);

  useEffect(() => {
    if (!welcome) return;
    const id = window.setTimeout(() => setWelcome(false), 2800);
    return () => window.clearTimeout(id);
  }, [welcome]);

  // Back out of the room with the keyboard: the focus returns to the door.
  useEffect(() => {
    if (!returns) return;
    const id = window.setTimeout(() => {
      if (!document.activeElement || document.activeElement === document.body) button.current?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(id);
  }, [returns]);

  const knock = () => {
    if (door !== 'shut') return;
    onDoorIntent?.();
    setHover(false);
    setDoor(prefersReducedMotion() ? 'open' : 'ajar0');
  };

  const opening = door === 'ajar0' || door === 'ajar1' || door === 'open' || door === 'zoom';
  return {
    door,
    opening,
    welcome,
    /** Zoomed into the doorway (going in, and the moment of coming back). */
    zoomed: (door === 'zoom' || door === 'back') && !prefersReducedMotion(),
    lit: door === 'ajar1' || door === 'open' || door === 'zoom' || door === 'back' || door === 'out' || door === 'close1',
    leaf: (d: Doorway) =>
      door === 'shut' ? (hover ? d.hover : d.shut)
      : door === 'ajar0' || door === 'close0' ? d.ajar[0]
      : door === 'ajar1' || door === 'close1' ? d.ajar[1]
      : d.open,
    button: {
      ref: button,
      type: 'button' as const,
      onClick: knock,
      onPointerEnter: () => { setHover(true); onDoorIntent?.(); },
      onPointerLeave: () => setHover(false),
      onFocus: () => { setHover(true); onDoorIntent?.(); },
      onBlur: () => setHover(false),
      disabled: opening,
      className: 'login-door',
    },
  };
}

/** The mascot's look while the door moves: wide eyes as it opens, a wave on coming back. */
function doorLook(d: ReturnType<typeof useDoor>, state: MascotState, phase: Phase): Look | null {
  if (d.opening) return { pose: { eyes: 'wide', look: [1, 0], mouth: 'o', arms: 'down' }, mark: '!', motion: 'jump', locker: 'open' };
  if (d.welcome && !phase && !state.query.trim() && state.focus !== 'password') return { pose: { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'wave' }, wave: true, say: { key: 'mascotBack' }, motion: 'bob', locker: 'open' };
  return null;
}

export function HallwayScene({ state, ...doorProps }: { state: MascotState } & DoorProps) {
  const t = useT(loginDict);
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number; W: number; H: number } | null>(null);
  const clipId = useId();
  const phase = usePhase(state.event);
  const now = useMinute();
  const say = useSay();
  const d = useDoor(doorProps);
  // What it got in room 2B (components/room), it wears out here too.
  const { wear } = useRoomSave();

  // The scene in pixels of the drawing: about 112 rows high, as wide as the
  // panel allows, and never so large that the door is cut off.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const px = Math.min(9, Math.max(4, height / 112), width / 106);
      const next = { w: Math.ceil(width / px), h: Math.ceil(height / px), W: width, H: height };
      setSize((old) => (old && old.w === next.w && old.h === next.h && old.W === next.W && old.H === next.H ? old : next));
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
  const look: Look = doorLook(d, state, phase) ?? lookFor(state, phase, eyes);

  let speech = null;
  if (hall && look.say) {
    const [mx, my] = hall.mascot;
    // As wide as the hallway leaves beside the mascot, at most about 25 letters.
    const room = Math.min(100, hall.w - (mx + 32) - 10);
    speech = bubble(say(look.say), mx + 30, my + 6, room);
  }

  // Where the drawing lies in the panel (it fills it, anchored at the bottom).
  let place: { scale: number; x: number; y: number } | null = null;
  if (hall && size) {
    const scale = Math.max(size.W / hall.w, size.H / hall.h);
    place = { scale, x: (size.W - hall.w * scale) / 2, y: size.H - hall.h * scale };
  }
  const leaf = hall ? d.leaf(hall.door) : null;

  // Going in: the view moves to the doorway and grows until the room fills it.
  let zoom: React.CSSProperties | undefined;
  if (hall && place && size) {
    const [cx, cy] = hall.door.centre;
    const X = place.x + cx * place.scale;
    const Y = place.y + cy * place.scale;
    const k = Math.max(size.W / (25 * place.scale), size.H / (60 * place.scale)) * 1.3;
    zoom = zoomInto(X, Y, size.W / 2 - X, size.H / 2 - Y, k, d.zoomed, d.door);
  }

  return (
    <div ref={root} className="login-hall relative h-full overflow-hidden rounded-[36px]" style={{ viewTransitionName: 'login-stage' }}>
      <SpritePalette />
      {hall && (
        <svg
          viewBox={`0 0 ${hall.w} ${hall.h}`}
          preserveAspectRatio="xMidYMax slice"
          className="spr login-hall-in absolute inset-0 h-full w-full"
          shapeRendering="crispEdges"
          aria-hidden="true"
          style={zoom}
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
          {d.lit && <Paths sprite={hall.door.spill} />}
          {leaf && <Paths sprite={leaf} />}
          <g key={look.locker} className="hw-locker"><Paths sprite={look.locker === 'open' ? hall.lockerOpen : hall.lockerShut} /></g>
          {now && <Paths sprite={clockHands(hall.clock[0], hall.clock[1], now.h, now.m)} />}
          <g transform={`translate(${hall.mascot[0]} ${hall.mascot[1]})`}>
            <MascotFigure look={look} motionKey={d.opening ? 'door' : motionKey(look, state)} wear={wear} />
          </g>
          {speech && <g key={look.say?.key} className="ms-pop"><Paths sprite={speech} /></g>}
          {/* At the end of the way in, the room's warm wall fills the view. */}
          <rect x={0} y={0} width={hall.w} height={hall.h} className="hw-into" data-on={d.zoomed ? '' : undefined} />
        </svg>
      )}
      {hall && place && (
        <button
          {...d.button}
          aria-label={t('doorLabel')}
          style={{
            left: place.x + hall.door.box[0] * place.scale,
            top: place.y + hall.door.box[1] * place.scale,
            width: hall.door.box[2] * place.scale,
            height: hall.door.box[3] * place.scale,
          }}
        />
      )}
    </div>
  );
}

// On phones the mascot stands on its own above the form, its speech bubble
// beside it; the door of room 2B is only in the hallway on desktops. The
// drawing keeps room above the head for a bubble on two lines (or a hat), so
// the form below doesn't move while it talks.
const BADGE_W = 112;

/** The small mascot above the form on phones, with its speech bubble. */
export function MascotBadge({ state }: { state: MascotState }) {
  const phase = usePhase(state.event);
  const say = useSay();
  const { wear } = useRoomSave();
  const look = lookFor(state, phase, [1, 0]);
  const speech = look.say ? bubble(say(look.say), MW - 2, 17, BADGE_W - MW - 4) : null;
  const top = Math.min(wear.head ? -16 : -12, speech ? topOf(speech) - 1 : 0);
  return (
    <>
      <SpritePalette />
      <svg
        viewBox={`0 ${top} ${BADGE_W} ${MH - top}`}
        className="spr block w-[252px] max-w-full"
        shapeRendering="crispEdges"
        aria-hidden="true"
        overflow="visible"
      >
        <MascotFigure look={look} motionKey={motionKey(look, state)} marks="beside" wear={wear} />
        {speech && <g key={look.say?.key} className="ms-pop"><Paths sprite={speech} /></g>}
      </svg>
    </>
  );
}
