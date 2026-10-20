'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CaretLeft, CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import { Paths, SpritePalette } from '@/components/pixel/SceneSvg';
import { BACKPACK, PAPER_BALL, ROOM_H, ROOM_W, SKY_LOOP, SPOTS, buildClassroom, chalk, noteSprite, wipe, type Box, type Spot } from '@/components/pixel/classroom';
import { bubble, clockHands } from '@/components/pixel/hallway';
import { FEET, MH, MW } from '@/components/pixel/mascot';
import MascotFigure, { usePointerLook, type Look } from '@/components/pixel/MascotFigure';
import { discoAt, duckAt, emptyCanAt, itemSprite, lampAt, lightsAt, plantAt, trophyAt } from '@/components/pixel/collectibles';
import { Sprite, type Pt } from '@/components/pixel/sprite';
import { useT } from '@/providers/LocaleProvider';
import { roomDict, type RoomKey } from '@/lib/i18n/dictionaries/room';
import { prefersReducedMotion } from '@/lib/motion';
import { DISCOVERIES, DISCOVERY_STARS, DUCK_ODDS, GOLDEN_ODDS, GOLDEN_STARS, PAPER_MAX, PAPER_PER_THROW, SECRET_CODE, WELCOME_STARS, type Discovery, type Item, type ItemId } from './catalog';
import { discover, grant, unlock, useRoomSave, welcome } from './store';
import { closeView, openView, wayInto, type RoomView } from './route';
import Vending from './Vending';
import Handheld from './Handheld';
import Backpack from './Backpack';
import { SpriteIcon, StarCount, Tip, useFx, type TipApi, type XY } from './parts';
import s from './room.module.css';

// Room A+2/05: the secret classroom behind the door of the sign-in hallway
// (app/[lang]/login). The room itself is the interface: its things are the
// buttons, and nothing in it is written out. A click makes a thing do
// something: the board is wiped and shows the next bit of chalk, the window
// changes the weather and a draught blows the curtains in, the switch puts
// the light out, the poster's rocket lifts off and lands again, the clock
// rings and races ahead, the globe spins, the red book drops a note, the
// apple is eaten, the bin wobbles and throws paper all over the floor (a
// click on a ball throws it back in), the notebook's flip book makes the
// mascot do a somersault; the note from the red book can be picked up. A
// thing's name shows beside the pointer. The first time, each of these
// (a discovery) bursts into gold stars that fly into the counter. The
// mascot answers with a word in its speech bubble, now and then with a
// golden moment. The vending machine sells cosmetic things for the stars,
// the console holds five little games, the backpack (in the bar on top)
// keeps what was collected (./Vending.tsx, ./Handheld.tsx, ./Backpack.tsx). Everything stays in this browser (./store.ts) and has
// nothing to do with signing in.

type Weather = 'sun' | 'clouds' | 'rain' | 'snow';
const WEATHER: Weather[] = ['sun', 'clouds', 'rain', 'snow'];

/** The weather on arrival: snow only in winter, rain more often in spring and autumn. */
function firstWeather(month: number): Weather {
  const r = Math.random();
  if (month === 11 || month <= 1) return r < 0.4 ? 'snow' : r < 0.7 ? 'clouds' : 'sun';
  if (month >= 2 && month <= 4) return r < 0.25 ? 'rain' : r < 0.5 ? 'clouds' : 'sun';
  if (month >= 8 && month <= 10) return r < 0.3 ? 'rain' : r < 0.55 ? 'clouds' : 'sun';
  return r < 0.15 ? 'clouds' : 'sun';
}

/** The chalk messages: lines split by "|", a doodle after "#". */
const CHALK: RoomKey[] = ['chalk1', 'chalk2', 'chalk3', 'chalk4', 'chalk5', 'chalk6', 'chalk7', 'chalk8'];
function parseChalk(text: string): { lines: string[]; doodle?: 'mascot' | 'heart' | 'star' | 'cat' } {
  const [body, doodle] = text.split('#');
  return { lines: body.split('|'), doodle: doodle as 'mascot' | 'heart' | 'star' | 'cat' | undefined };
}

/** What the mascot does when clicked, in turn. */
const REACTIONS: Array<{ look: Look; say: RoomKey }> = [
  { look: { pose: { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'wave' }, wave: true, motion: 'bob' }, say: 'mascotHi' },
  { look: { pose: { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'cheer' }, motion: 'jump' }, say: 'mascotYay' },
  { look: { pose: { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'thumb' }, motion: 'hop' }, say: 'mascotThumb' },
  { look: { pose: { eyes: 'wide', look: [0, -1], mouth: 'o', arms: 'down' }, mark: '?', motion: 'hop' }, say: 'mascotHuh' },
  { look: { pose: { eyes: 'open', look: [1, 0], mouth: 'smile', arms: 'lens' }, motion: 'bob' }, say: 'mascotLook' },
];
const ANGRY: Look = { pose: { eyes: 'angry', look: [0, 0], mouth: 'frown', arms: 'fists' }, anger: true, motion: 'fume' };
const GOLDEN: Look = { pose: { eyes: 'stars', look: [0, 0], mouth: 'grin', arms: 'cheer' }, motion: 'jump' };
const MUNCH: Look = { pose: { eyes: 'happy', look: [0, 0], mouth: 'o', arms: 'down' }, motion: 'hop' };
const SLURP: Look = { pose: { eyes: 'closed', look: [0, 0], mouth: 'o', arms: 'down' }, motion: 'bob' };
// The white energy can: wide awake and fizzing for a few seconds, then worn out.
const HYPER: Look = { pose: { eyes: 'wide', look: [0, 0], mouth: 'grin', arms: 'cheer' }, mark: '!', zap: true, motion: 'buzz' };
const CRASH: Look = { pose: { eyes: 'closed', look: [0, 1], mouth: 'wobble', arms: 'down' }, sweat: true, motion: 'bob' };
const STARE_UP: Look = { pose: { eyes: 'wide', look: [-1, -1], mouth: 'o', arms: 'down' }, mark: '!', motion: 'hop' };
const STARE_APPLE: Look = { pose: { eyes: 'wide', look: [1, -1], mouth: 'o', arms: 'down' }, motion: 'hop' };
const SHIVER: Look = { pose: { eyes: 'closed', look: [0, 0], mouth: 'wobble', arms: 'down' }, motion: 'shake' };
const DIZZY: Look = { pose: { eyes: 'closed', look: [0, 0], mouth: 'wobble', arms: 'down' }, sweat: true, motion: 'shake' };
const HOPEFUL: Look = { pose: { eyes: 'wide', look: [1, -1], mouth: 'grin', arms: 'cheer' }, motion: 'jump' };
const FLIP: Look = { pose: { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'cheer' }, motion: 'flip' };

/** Where a discovery's stars come from: the thing it is about (none: the middle of the stage). */
const SPOT_OF: Record<Discovery, Spot | null> = {
  board: 'board', poster: 'poster', switch: 'switch', clock: 'clock', book: 'shelf', globe: 'globe', window: 'window',
  apple: 'mascot', bin: 'bin', notebook: 'notebook', friend: 'mascot', golden: 'mascot', code: null, stuck: null,
};

/** One time in `odds`. */
const lucky = (odds: number) => Math.random() < 1 / odds;
/** What the note from the red book says: the keypad's secret, as a countdown. */
const NOTE = SECRET_CODE.split('').join('-');

/** A whole number from 0 to n - 1. */
const roll = (n: number) => Math.floor(Math.random() * n);

/** Somewhere on the bare floor in view (`from`–`to`) for a paper ball (not under a desk, the bin or behind the front row). */
function landing(room: Scene, from: number, to: number): Pt {
  for (let i = 0; i < 24; i++) {
    const x = from + 4 + roll(to - from - 8);
    const y = room.oy + 93 + roll(27);
    if (!room.floorBlocks.some(([bx, by, bw, bh]) => x >= bx - 2 && x < bx + bw + 2 && y >= by && y < by + bh + 4)) return [x, y];
  }
  return [room.ox + 130, room.oy + 96];
}
/** The clicks of the last `ms` milliseconds, this one included. */
const clicksWithin = (times: number[], ms: number) => {
  const at = Date.now();
  return [...times.filter((x) => at - x < ms), at];
};

/**
 * The scene's size: the whole core in view where it fits at a good size;
 * otherwise (phones, tablets standing up) about a third of the room at a
 * time, to pan.
 */
function layoutFor(W: number, H: number) {
  const fit = Math.min(W / ROOM_W, H / ROOM_H);
  const px = fit >= 4 ? fit : Math.min(H / ROOM_H, Math.max(4, W / 80), 7);
  return { px, w: Math.max(ROOM_W, Math.ceil(W / px)), h: Math.max(ROOM_H, Math.ceil(H / px)), pan: ROOM_W * px > W + 1 };
}

/**
 * The room goes on this far (pixels of the drawing) beyond the panel on
 * either side, so the view moving to the vending machine or the window
 * (when it zooms in, or pans to the end on a phone) never runs out of room.
 */
const MARGIN = 56;

type Scene = ReturnType<typeof buildClassroom>;
const scenes = new Map<string, Scene>();
/** The room for a panel `w` × `h` pixels of the drawing wide, with its margins. */
function sceneFor(w: number, h: number, pan: boolean): Scene {
  const k = `${w}x${h}${pan ? 'p' : ''}`;
  let scene = scenes.get(k);
  if (!scene) {
    const total = w + MARGIN * 2;
    // Panning, all of it can come into view; otherwise the margins only while zooming.
    scene = buildClassroom(total, h, pan ? [0, total] : [MARGIN, MARGIN + w]);
    scenes.set(k, scene);
  }
  return scene;
}

/** Turns every sprite of a scene into its paths once, so drawing it later costs nothing. */
function warm(v: unknown, depth = 0) {
  if (v instanceof Sprite) { v.paths(); return; }
  if (depth > 3 || !v || typeof v !== 'object') return;
  for (const x of Object.values(v)) warm(x, depth + 1);
}

/**
 * Builds the room for a stage of W × H pixels ahead of time (the sign-in
 * page calls it while the door is being approached), so it appears at once.
 */
export function prepareRoom(W: number, H: number) {
  const { w, h, pan } = layoutFor(W, H);
  warm(sceneFor(w, h, pan));
}

/** The thing the view zooms to on the way into each view (the backpack is in the bar on top). */
const SUB_VIEWS: Record<Exclude<RoomView, 'room'>, Spot | null> = { shop: 'vending', console: 'console', bag: null };

interface Reaction {
  look: Look;
  say?: string;
  n: number;
  ms: number;
  next?: Omit<Reaction, 'n' | 'next'>;
}

/** Something thrown or falling through the room, along a path relative to where it starts. */
interface Flight {
  id: number;
  sprite: Sprite;
  at: Pt;
  path: Pt[];
  ms: number;
  done?: () => void;
}

/** A throw: x evenly, y as a parabola up by `h` and down to `dy`; whole pixels. */
function arc(dx: number, dy: number, h: number, n = 22): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [Math.round(dx * t), Math.round(dy * t - 4 * h * t * (1 - t))];
  });
}

/** A piece of paper falling: swaying from side to side, slowly. */
function flutter(dx: number, dy: number, n = 28): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [Math.round(dx * t + Math.sin(t * Math.PI * 3) * 5 * (1 - t)), Math.round(dy * (0.35 * t + 0.65 * t * t))];
  });
}

export default function Classroom({ view, onLeave }: { view: RoomView; onLeave: () => void }) {
  const t = useT(roomDict);
  const save = useRoomSave();
  const titleId = useId();
  const maskId = useId();
  const clipId = useId();
  const stage = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const starChip = useRef<HTMLSpanElement>(null);
  const bagButton = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState<{ W: number; H: number } | null>(null);
  const [arrived, setArrived] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Where the view zooms to (a thing and how far the room was panned).
  const [zoom, setZoom] = useState<{ spot: Spot; left: number } | null>(null);
  const [scroll, setScroll] = useState({ left: false, right: false });

  // What happens in the room this visit (not remembered).
  const [weather, setWeather] = useState<Weather>(() => firstWeather(new Date().getMonth()));
  const [lightsOn, setLightsOn] = useState(true);
  const [board, setBoard] = useState(() => Math.floor(Date.now() / 86_400_000) % CHALK.length);
  const [wiping, setWiping] = useState(-1);
  const [bookOut, setBookOut] = useState(false);
  const [note, setNote] = useState<'none' | 'falling' | 'down'>('none');
  const [globeTurn, setGlobeTurn] = useState(0);
  const [clockSkip, setClockSkip] = useState(0);
  const [apple, setApple] = useState<'on' | 'flying' | 'gone' | 'back'>('on');
  const [papers, setPapers] = useState<Array<{ id: number; at: Pt }>>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  // Counters that restart a thing's animation each time it is clicked.
  const [moves, setMoves] = useState({ rocket: 0, ring: 0, bin: 0, blow: 0, flip: 0 });
  const [rocketUp, setRocketUp] = useState(false);
  // What the mascot is doing; `next` follows on its own when it is over.
  const [reaction, setReaction] = useState<Reaction | null>(null);
  // Stars on their way to the counter, things new in the backpack, what screen readers hear.
  const [pending, setPending] = useState(0);
  const [fresh, setFresh] = useState(0);
  const [said, setSaid] = useState({ text: '', n: 0 });
  const counts = useRef({ clock: [] as number[], globe: [] as number[], mascot: [] as number[], mascotTotal: 0, bin: 0, paper: 0, n: 0 });
  const { fx, layer: fxLayer } = useFx();
  const tip = useRef<TipApi>(null);

  // ── Size ───────────────────────────────────────────────────────────────
  // Measured before the first paint, so the room is there in the first frame.
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = (width: number, height: number) => {
      if (!width || !height) return;
      setBox((old) => (old && Math.abs(old.W - width) < 1 && Math.abs(old.H - height) < 1 ? old : { W: width, H: height }));
    };
    measure(el.clientWidth, el.clientHeight);
    const ro = new ResizeObserver(([entry]) => measure(entry.contentRect.width, entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const layout = box ? layoutFor(box.W, box.H) : null;
  const lw = layout?.w;
  const lh = layout?.h;
  const panning = layout?.pan ?? false;
  const room = useMemo(() => (lw && lh ? sceneFor(lw, lh, panning) : null), [lw, lh, panning]);
  const px = layout?.px ?? 1;

  // On a narrow screen the room pans: it starts at the board and the mascot.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !room || !layout?.pan) return;
    el.scrollLeft = (room.ox + 112) * px - el.clientWidth / 2;
  }, [room, layout?.pan, px]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const next = { left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 };
    setScroll((old) => (old.left === next.left && old.right === next.right ? old : next));
  };
  useEffect(() => { onScroll(); }, [room]);
  const pan = (dir: -1 | 1) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.6, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

  // ── Where things are on the stage ─────────────────────────────────────
  const onStage = useCallback((x: number, y: number): XY | null => {
    const w = world.current;
    const st = stage.current;
    if (!w || !st || !room) return null;
    const a = w.getBoundingClientRect();
    const b = st.getBoundingClientRect();
    const k = a.width / (room.w * px);
    return { x: a.left - b.left + x * px * k, y: a.top - b.top + y * px * k };
  }, [room, px]);
  const centreOf = useCallback((spot: Spot | null): XY => {
    const st = stage.current;
    const mid = { x: (st?.clientWidth ?? 0) / 2, y: (st?.clientHeight ?? 0) / 2 };
    if (!spot || !room) return mid;
    const [x, y, w, h] = room.spots[spot];
    return onStage(x + w / 2, y + h / 2) ?? mid;
  }, [room, onStage]);
  /** A point of the window (from the machine or the console) on the stage. */
  const fromScreen = useCallback((p: XY): XY => {
    const r = stage.current?.getBoundingClientRect();
    return r ? { x: p.x - r.left, y: p.y - r.top } : p;
  }, []);
  const middleOf = useCallback((el: Element | null): XY => {
    const r = el?.getBoundingClientRect();
    const st = stage.current?.getBoundingClientRect();
    return r && st ? { x: r.left - st.left + r.width / 2, y: r.top - st.top + r.height / 2 } : { x: 30, y: 30 };
  }, []);

  // ── Saying things, earning stars ──────────────────────────────────────
  /** For screen readers only. */
  const say = useCallback((text: string) => {
    counts.current.n += 1;
    setSaid({ text, n: counts.current.n });
  }, []);
  const burst = useCallback((from: XY, n: number) => {
    setPending((p) => p + n);
    fx.stars(from, middleOf(starChip.current), n, () => setPending((p) => Math.max(0, p - 1)));
  }, [fx, middleOf]);
  const found = useCallback((id: Discovery, from?: XY) => {
    if (!discover(id)) return;
    say(`${t('toastFound', { name: t(`found_${id}` as RoomKey) })}, ${t('resultEarned', { n: DISCOVERY_STARS })}`);
    burst(from ?? centreOf(SPOT_OF[id]), DISCOVERY_STARS);
  }, [t, say, burst, centreOf]);
  /** Something new for the backpack: it flies into the button on top. */
  const gotItem = useCallback((id: ItemId, from: XY) => {
    say(t('toastItem', { name: t(`item_${id}` as RoomKey) }));
    fx.item(id, from, middleOf(bagButton.current), () => setFresh((n) => n + 1));
  }, [fx, middleOf, say, t]);
  const react = useCallback((look: Look, text?: string, ms = 2200) => {
    counts.current.n += 1;
    setReaction({ look, say: text, n: counts.current.n, ms });
  }, []);
  const fly = useCallback((f: Omit<Flight, 'id'>) => {
    counts.current.n += 1;
    const id = counts.current.n;
    setFlights((old) => [...old, { ...f, id }]);
  }, []);
  const landed = useCallback((id: number) => setFlights((old) => old.filter((f) => f.id !== id)), []);
  const move = (k: keyof typeof moves) => setMoves((m) => ({ ...m, [k]: m[k] + 1 }));

  useEffect(() => {
    if (!reaction) return;
    const id = window.setTimeout(() => setReaction(reaction.next ? { ...reaction.next, n: -reaction.n } : null), reaction.ms);
    return () => window.clearTimeout(id);
  }, [reaction]);

  // Arriving: the warm light the door opened onto stays up until the way in
  // (the hallway's panel growing into this one) is over, then clears while
  // the room settles. The stars of the first visit come after.
  useEffect(() => {
    const way = wayInto();
    let on = true;
    const arrive = () => { if (on) setArrived(true); };
    const id = window.setTimeout(arrive, prefersReducedMotion() ? 0 : way ? 1400 : 60);
    way?.then(arrive, arrive);
    return () => { on = false; window.clearTimeout(id); };
  }, []);
  useEffect(() => {
    if (!arrived) return;
    const id = window.setTimeout(() => {
      if (!welcome()) return;
      say(t('toastWelcome'));
      react(REACTIONS[0].look, t('mascotHi'), 2600);
      burst(centreOf('mascot'), WELCOME_STARS);
    }, prefersReducedMotion() ? 0 : 650);
    return () => window.clearTimeout(id);
  }, [arrived, burst, centreOf, react, say, t]);

  // The board's sponge: three strokes, then the next chalk.
  useEffect(() => {
    if (wiping < 0) return;
    const id = window.setTimeout(() => {
      if (wiping < 2) setWiping(wiping + 1);
      else {
        setWiping(-1);
        setBoard((b) => (b + 1) % CHALK.length);
      }
    }, 140);
    return () => window.clearTimeout(id);
  }, [wiping]);

  // The clock racing twelve hours ahead, then back to the real time.
  useEffect(() => {
    if (clockSkip <= 0) return;
    const id = window.setTimeout(() => setClockSkip((m) => (m >= 720 ? 0 : m + 24)), 40);
    return () => window.clearTimeout(id);
  }, [clockSkip]);

  // The globe spinning fast, then slower until it stops.
  useEffect(() => {
    if (globeTurn <= 0) return;
    const id = window.setTimeout(() => setGlobeTurn((n) => n - 1), 45 + (18 - globeTurn) * 13);
    return () => window.clearTimeout(id);
  }, [globeTurn]);

  // The teacher gets a new apple a while after the last one was eaten.
  useEffect(() => {
    if (apple !== 'gone') return;
    const id = window.setTimeout(() => setApple('back'), 9000);
    return () => window.clearTimeout(id);
  }, [apple]);

  const now = useMinute();

  // The focus comes into the room as soon as it is drawn (the door it came through is gone).
  const ready = room !== null;
  useEffect(() => {
    if (ready) stage.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [ready]);

  // ── The things in the room ────────────────────────────────────────────
  const act = (spot: Spot) => {
    if (!room) return;
    const c = counts.current;
    const [mx, my] = room.mascot;
    switch (spot) {
      case 'window': {
        const next = WEATHER[(WEATHER.indexOf(weather) + 1) % WEATHER.length];
        setWeather(next);
        move('blow');
        if (next === 'snow') react(SHIVER, t('mascotBrr'), 1800);
        found('window');
        break;
      }
      case 'poster':
        if (rocketUp) return;
        setRocketUp(true);
        move('rocket');
        react(STARE_UP, t('mascotWow'), 2400);
        found('poster');
        if (prefersReducedMotion()) setRocketUp(false);
        break;
      case 'switch':
        setLightsOn((on) => !on);
        if (lightsOn) found('switch');
        break;
      case 'board':
        if (wiping >= 0) return;
        setWiping(0);
        found('board');
        break;
      case 'clock':
        move('ring');
        setClockSkip(24);
        react(HOPEFUL, t('mascotBreak'), 1800);
        found('clock');
        break;
      case 'globe': {
        c.globe = clicksWithin(c.globe, 8000);
        setGlobeTurn(18);
        if (c.globe.length >= 3) {
          c.globe = [];
          react(DIZZY, t('mascotDizzy'), 2400);
        }
        found('globe');
        break;
      }
      case 'shelf':
        setBookOut((o) => !o);
        if (note === 'none' && !save.owned.includes('note')) {
          // The red book comes out and a note flutters to the floor: the keypad's secret.
          setNote('falling');
          const [bx, by] = room.bookAt;
          const [nx, ny] = room.noteAt;
          fly({ sprite: noteSprite(NOTE), at: [bx - 8, by], path: flutter(nx - bx + 8, ny - by), ms: 1600, done: () => setNote('down') });
          found('book');
        }
        break;
      case 'apple': {
        if (apple === 'flying' || apple === 'gone') return;
        // Up and over into the mascot's mouth.
        setApple('flying');
        react(STARE_APPLE, undefined, 700);
        const [ax, ay] = room.appleAt;
        fly({
          sprite: room.apple, at: [0, 0], path: arc(mx + 17 - ax, my + 14 - ay, 16), ms: 620,
          done: () => {
            setApple('gone');
            react(MUNCH, t('mascotYum'), 2000);
            found('apple', centreOf('mascot'));
          },
        });
        break;
      }
      case 'bin': {
        c.bin += 1;
        move('bin');
        const [bx, by] = room.binTop;
        if (c.bin > 1 && !save.owned.includes('duck') && lucky(DUCK_ODDS)) {
          // The duck at the bottom of the bin hops out onto its desk.
          const [dx, dy] = room.decor.duck;
          fly({ sprite: itemSprite('duck'), at: [bx - 6, by - 10], path: arc(dx - bx + 5, dy - by - 1, 26, 30), ms: 900, done: () => { if (unlock('duck')) gotItem('duck', onStage(dx + 4, dy - 4) ?? centreOf('bin')); } });
        } else {
          // Paper balls fly out in all directions and land all over the floor.
          const throws = Math.min(PAPER_PER_THROW, PAPER_MAX - c.paper);
          c.paper += Math.max(0, throws);
          for (let i = 0; i < throws; i++) {
            const to = layout?.pan ? landing(room, 0, room.w) : landing(room, MARGIN, room.w - MARGIN);
            const id = ++c.n;
            const far = Math.abs(to[0] - bx);
            window.setTimeout(() => fly({
              sprite: PAPER_BALL, at: [bx - 2, by - 4], path: arc(to[0] - bx, to[1] - by, 12 + roll(10) + far * 0.12, 26), ms: 480 + Math.min(520, far * 4),
              done: () => setPapers((old) => [...old, { id, at: to }]),
            }), i * 110);
          }
        }
        found('bin');
        break;
      }
      case 'notebook':
        move('flip');
        react(FLIP, t('mascotFlip'), 1400);
        found('notebook');
        break;
      case 'mascot': {
        c.mascot = clicksWithin(c.mascot, 3500);
        c.mascotTotal += 1;
        if (c.mascot.length >= 7) {
          c.mascot = [];
          react(ANGRY, t('mascotAngry'), 2600);
        } else if (lucky(GOLDEN_ODDS)) {
          react(GOLDEN, t('mascotGolden'), 3000);
          grant(GOLDEN_STARS);
          say(`${t('toastGolden')}, ${t('resultEarned', { n: GOLDEN_STARS })}`);
          burst(centreOf('mascot'), GOLDEN_STARS);
          found('golden');
        } else {
          const r = REACTIONS[(c.mascotTotal - 1) % REACTIONS.length];
          react(r.look, t(r.say));
        }
        if (c.mascotTotal >= 5) found('friend');
        break;
      }
      case 'vending':
        go('shop');
        break;
      case 'console':
        go('console');
        break;
    }
  };

  /** A paper ball on the floor, clicked: thrown back into the bin. */
  const pickUp = (id: number) => {
    const p = papers.find((q) => q.id === id);
    if (!p || !room) return;
    tip.current?.hide();
    setPapers((old) => old.filter((q) => q.id !== id));
    counts.current.paper -= 1;
    const [bx, by] = room.binTop;
    const far = Math.abs(bx - p.at[0]);
    fly({ sprite: PAPER_BALL, at: [p.at[0] - 2, p.at[1] - 4], path: arc(bx - p.at[0], by - p.at[1], 14 + far * 0.14, 26), ms: 480 + Math.min(520, far * 4), done: () => move('bin') });
  };
  /** The note from the red book, picked up off the floor: into the backpack. */
  const takeNote = () => {
    if (!room) return;
    tip.current?.hide();
    setNote('none');
    const [nx, ny] = room.noteAt;
    if (unlock('note')) gotItem('note', onStage(nx + 10, ny + 4) ?? centreOf('shelf'));
  };

  // A thing's name (its data-tip) beside the pointer (a mouse or a pen), or
  // above the thing for the keyboard's focus.
  const tipMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const r = stage.current?.getBoundingClientRect();
    const text = e.currentTarget.dataset.tip;
    if (e.pointerType === 'touch' || !r || !text) return;
    tip.current?.show(text, { x: Math.min(r.width - 80, Math.max(80, e.clientX - r.left)), y: e.clientY - r.top - 18 });
  }, []);
  const tipFocus = useCallback((e: React.FocusEvent<HTMLElement>) => {
    const r = stage.current?.getBoundingClientRect();
    const text = e.currentTarget.dataset.tip;
    if (!r || !text || !e.currentTarget.matches(':focus-visible')) return;
    const b = e.currentTarget.getBoundingClientRect();
    tip.current?.show(text, { x: Math.min(r.width - 80, Math.max(80, b.left - r.left + b.width / 2)), y: Math.max(40, b.top - r.top - 10) });
  }, []);
  const tipOff = useCallback(() => tip.current?.hide(), []);
  const hoverable = { onPointerMove: tipMove, onPointerLeave: tipOff, onFocus: tipFocus, onBlur: tipOff };

  // Into the machine or the console: the view moves to it first; the
  // backpack opens straight from the bar. Back in the room, the focus
  // returns to what opened it.
  const opener = useRef<Spot | 'bag' | null>(null);
  useEffect(() => {
    if (view !== 'room' || !opener.current) return;
    const el = opener.current === 'bag' ? bagButton.current : stage.current?.querySelector<HTMLElement>(`[data-spot="${opener.current}"]`);
    el?.focus({ preventScroll: true });
    opener.current = null;
  }, [view]);
  const go = (next: Exclude<RoomView, 'room'>) => {
    const spot = SUB_VIEWS[next];
    opener.current = spot ?? 'bag';
    tip.current?.hide();
    if (next === 'bag') setFresh(0);
    if (view !== 'room' || !spot) { openView(next); return; }
    setZoom({ spot, left: scroller.current?.scrollLeft ?? 0 });
    window.setTimeout(() => openView(next), prefersReducedMotion() ? 0 : 360);
  };
  const backToRoom = useCallback(() => { void closeView('room'); }, []);

  const leave = () => {
    if (leaving) return;
    setLeaving(true);
    // The frame starts to shrink back into the hallway as the light comes up.
    onLeave();
  };

  // A snack or a drink from the machine is had in the room; back in the room the view zooms out.
  const [snack, setSnack] = useState<{ item: Item; n: number } | null>(null);
  const fed = useCallback((item: Item) => setSnack({ item, n: Date.now() }), []);
  // The energy cans emptied this visit stay on the floor.
  const [cans, setCans] = useState(0);
  const [seenView, setSeenView] = useState(view);
  if (seenView !== view) {
    setSeenView(view);
    if (view === 'bag') setFresh(0);
    if (view === 'room') {
      setZoom(null);
      if (snack) {
        setSnack(null);
        if (snack.item.id === 'monster') {
          setCans((n) => n + 1);
          setReaction({ look: HYPER, say: t('mascotHyper'), n: snack.n, ms: 4200, next: { look: CRASH, say: t('mascotCrash'), ms: 2000 } });
        } else {
          const drink = snack.item.drink;
          setReaction({ look: drink ? SLURP : MUNCH, say: t(drink ? 'mascotSlurp' : 'mascotMunch'), n: snack.n, ms: 2200 });
        }
      }
    }
  }

  // ── The mascot ────────────────────────────────────────────────────────
  const eyes = usePointerLook(stage, () => {
    const r = world.current?.getBoundingClientRect();
    if (!r || !room) return null;
    return { x: r.left + (room.mascot[0] + MW / 2) * px, y: r.top + (room.mascot[1] + MH / 2) * px };
  });
  const look: Look = reaction?.look ?? { pose: { eyes: 'open', look: eyes, mouth: 'smile', arms: 'down' }, blink: true, motion: 'bob' };
  const sub = view !== 'room';

  if (!room || !layout || !box) {
    return <div ref={stage} className={s.stage} />;
  }

  const [mx, my] = room.mascot;
  const speech = reaction?.say ? bubble(reaction.say, mx + 30, my + 6, Math.min(70, room.w - mx - 40)) : null;
  const chalkSprite = chalkFor(t(CHALK[board]), room.board);
  const hands = now ? clockHands(room.clock[0], room.clock[1], (now.h + Math.floor((now.m + clockSkip) / 60)) % 24, (now.m + clockSkip) % 60) : null;
  const decor = new Set(save.decor);
  const W = room.w * px;
  const H = room.h * px;
  // Bottom-anchored: a scene a little taller than the panel loses its top rows.
  const offY = box.H - H;

  // Not panning, the margins lie beyond the panel's edges.
  const shift = layout.pan ? 0 : MARGIN * px;

  // Zoomed towards a thing: its middle to the middle of the panel, larger.
  let worldStyle: React.CSSProperties | undefined;
  if (zoom && !prefersReducedMotion()) {
    const [bx, by, bw, bh] = room.spots[zoom.spot];
    const ox = (bx + bw / 2) * px;
    const oy = (by + bh / 2) * px;
    const cx = ox - shift - zoom.left;
    const cy = oy + offY;
    const k = Math.min(3.2, Math.max(1.6, (box.H * 0.8) / (bh * px)));
    worldStyle = { transformOrigin: `${ox}px ${oy}px`, transform: `translate(${box.W / 2 - cx}px, ${box.H / 2 - cy}px) scale(${k})` };
  }

  return (
    <section aria-labelledby={titleId} className={s.stage} ref={stage} data-arrived={arrived ? '' : undefined} data-leaving={leaving ? '' : undefined}>
      <SpritePalette />
      <h1 id={titleId} tabIndex={-1} className="visually-hidden">{t('title')}</h1>
      <p className="visually-hidden" role="status" aria-live="polite">{said.text}</p>

      <div className={s.hud}>
        <StarCount stars={save.stars} pending={pending} label={t('starsLabel', { n: save.stars })} starRef={starChip} />
        <span className={s.chip} title={t('foundLabel', { n: save.found.length, total: DISCOVERIES.length })}>
          <MagnifyingGlass size={15} weight="bold" aria-hidden="true" />
          <span aria-hidden="true">{save.found.length}/{DISCOVERIES.length}</span>
          <span className="visually-hidden">{t('foundLabel', { n: save.found.length, total: DISCOVERIES.length })}</span>
        </span>
        {view !== 'bag' && (
          <button
            ref={bagButton}
            type="button"
            className={`${s.chip} ${s.chipButton}`}
            onClick={() => go('bag')}
            aria-label={fresh ? `${t('bagOpen')}, ${t('bagNew')}` : t('bagOpen')}
            aria-haspopup="dialog"
          >
            <span key={`b${fresh}`} className={fresh ? s.bump : undefined}><SpriteIcon sprite={BACKPACK} box={[-1, -1, 13, 19]} className={s.chipBag} /></span>
            {fresh > 0 && <span className={s.dot} aria-hidden="true">{fresh}</span>}
          </button>
        )}
      </div>

      <button type="button" className={`key key-sm ${s.back}`} onClick={sub ? backToRoom : leave} aria-label={sub ? t('backRoom') : t('back')}>
        <ArrowLeft size={17} weight="bold" aria-hidden="true" />
        <span className={s.backText} aria-hidden="true">{sub ? t('backRoom') : t('back')}</span>
      </button>

      <div
        ref={scroller}
        onScroll={onScroll}
        className={s.scroller}
        data-pan={layout.pan ? '' : undefined}
        data-zoomed={zoom ? '' : undefined}
        inert={sub ? true : undefined}
        aria-hidden={sub ? true : undefined}
      >
        <div ref={world} className={s.world} style={{ width: W, height: H, marginTop: Math.min(0, offY), marginLeft: -shift, ...worldStyle }}>
          <svg viewBox={`0 0 ${room.w} ${room.h}`} width={W} height={H} className={`spr ${s.scene}`} shapeRendering="crispEdges" aria-hidden="true">
            <defs>
              <clipPath id={clipId}>
                {room.panes.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />)}
              </clipPath>
              <mask id={maskId}>
                <rect x={0} y={0} width={room.w} height={room.h} fill="#fff" />
                {room.bright.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} fill="#000" />)}
              </mask>
            </defs>
            <Paths sprite={room.back} />
            <g className={s.lamps}><Paths sprite={room.lampLight} /></g>
            <Sky room={room} weather={weather} clipId={clipId} />
            {moves.blow ? (
              <g key={`w${moves.blow}`}>
                <g className={s.drapeRest}><Paths sprite={room.curtains[0]} /></g>
                <g className={s.drapeBlown}><Paths sprite={room.curtains[1]} /></g>
              </g>
            ) : <Paths sprite={room.curtains[0]} />}
            <Rocket room={room} n={moves.rocket} up={rocketUp} onDown={() => setRocketUp(false)} />
            <Paths sprite={lightsOn ? room.switchOn : room.switchOff} />
            <g key={wiping < 0 ? `c${board}` : 'w'} className={wiping < 0 ? s.chalkIn : undefined}>
              <Paths sprite={chalkSprite} />
            </g>
            {wiping >= 0 && <Paths sprite={wipe(room.board, wiping)} />}
            <g key={`k${moves.ring}`} className={moves.ring ? s.ring : undefined}>
              <Paths sprite={room.clockFace} />
              {hands && <Paths sprite={hands} />}
            </g>
            <Paths sprite={room.globe[globeTurn % 4]} />
            <Paths sprite={bookOut ? room.book.out : room.book.in} />
            {(apple === 'on' || apple === 'back') && <g key={apple} className={apple === 'back' ? s.popIn : undefined}><Paths sprite={room.apple} /></g>}
            <g key={`b${moves.bin}`} className={moves.bin ? s.wobble : undefined}><Paths sprite={room.bin} /></g>
            <Decor room={room} decor={decor} layer="back" />
            {note === 'down' && <Paths sprite={cached(`note${room.noteAt.join(',')}`, () => new Sprite().paste(noteSprite(NOTE), room.noteAt[0], room.noteAt[1]))} />}
            {papers.filter((p) => p.at[1] <= my + FEET).map((p) => <g key={p.id} transform={`translate(${p.at[0] - 2} ${p.at[1] - 4})`}><Paths sprite={PAPER_BALL} /></g>)}
            {cans > 0 && <Paths sprite={cached(`can${room.decor.can.join(',')}`, () => emptyCanAt(room.decor.can[0], room.decor.can[1]))} />}
            {flights.map((f) => <SceneFlight key={f.id} f={f} onEnd={landed} />)}
            <g transform={`translate(${mx} ${my})`}>
              <MascotFigure look={look} motionKey={reaction ? `r${reaction.n}` : 'idle'} wear={save.wear} />
            </g>
            {papers.filter((p) => p.at[1] > my + FEET).map((p) => <g key={p.id} transform={`translate(${p.at[0] - 2} ${p.at[1] - 4})`}><Paths sprite={PAPER_BALL} /></g>)}
            <Paths sprite={room.front} />
            {moves.flip ? (
              <g key={`n${moves.flip}`}>
                <g className={s.nbShut}><Paths sprite={room.notebook[0]} /></g>
                <g className={s.nbUp}><Paths sprite={room.notebook[1]} /></g>
                <g className={s.nbOver}><Paths sprite={room.notebook[2]} /></g>
              </g>
            ) : <Paths sprite={room.notebook[0]} />}
            <g className={s.screen}>
              <g className={s.frameA}><Paths sprite={room.screen[0]} /></g>
              <g className={s.frameB}><Paths sprite={room.screen[1]} /></g>
            </g>
            {!lightsOn && <rect x={0} y={0} width={room.w} height={room.h} fill="var(--s-dim)" mask={`url(#${maskId})`} className={s.dim} />}
            {!lightsOn && <Paths sprite={room.glow} />}
            <g className={s.sign}>
              <g className={s.frameA}><Paths sprite={room.sign[0]} /></g>
              <g className={s.frameB}><Paths sprite={room.sign[1]} /></g>
            </g>
            <Decor room={room} decor={decor} layer="glow" />
            {speech && <g key={reaction?.n} className="ms-pop"><Paths sprite={speech} /></g>}
          </svg>

          {SPOTS.map((spot) => {
            const [x, y, w, h] = room.spots[spot];
            return (
              <button
                key={spot}
                type="button"
                data-spot={spot}
                className={s.spot}
                onClick={() => act(spot)}
                aria-label={t(`spot_${spot}` as RoomKey)}
                aria-haspopup={spot === 'vending' || spot === 'console' ? 'dialog' : undefined}
                style={{ left: x * px, top: y * px, width: w * px, height: h * px }}
                data-tip={t(`spot_${spot}` as RoomKey)}
                {...hoverable}
              >
                <span className={s.corners} aria-hidden="true" />
              </button>
            );
          })}
          {note === 'down' && (
            <button
              type="button"
              className={s.spot}
              onClick={takeNote}
              aria-label={t('spot_note')}
              style={{ left: (room.noteAt[0] - 1) * px, top: (room.noteAt[1] - 1) * px, width: 23 * px, height: 12 * px }}
              data-tip={t('spot_note')}
              {...hoverable}
            >
              <span className={s.corners} aria-hidden="true" />
            </button>
          )}
          {papers.map((p) => {
            const size = Math.max(7 * px, 34);
            return (
              <button
                key={p.id}
                type="button"
                className={s.spot}
                onClick={() => pickUp(p.id)}
                aria-label={t('spot_paper')}
                style={{ left: p.at[0] * px - size / 2, top: (p.at[1] - 2) * px - size / 2, width: size, height: size }}
                data-tip={t('spot_paper')}
                {...hoverable}
              >
                <span className={s.corners} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      {layout.pan && !sub && (
        <>
          {scroll.left && (
            <button type="button" className={s.panLeft} onClick={() => pan(-1)} aria-label={t('panLeft')}>
              <CaretLeft size={20} weight="bold" aria-hidden="true" />
            </button>
          )}
          {scroll.right && (
            <button type="button" className={s.panRight} onClick={() => pan(1)} aria-label={t('panRight')}>
              <CaretRight size={20} weight="bold" aria-hidden="true" />
            </button>
          )}
        </>
      )}

      {view === 'shop' && (
        <Vending
          onClose={backToRoom}
          onFed={fed}
          onItem={(id, from) => gotItem(id, fromScreen(from))}
          onFound={(id) => found(id)}
        />
      )}
      {view === 'console' && (
        <Handheld
          onEarn={(n, from) => burst(fromScreen(from), n)}
          onItem={(id, from) => gotItem(id, fromScreen(from))}
          announce={say}
        />
      )}
      {view === 'bag' && <Backpack onClose={backToRoom} />}

      {!sub && <Tip api={tip} />}
      {fxLayer}
      <span className={s.into} aria-hidden="true" />
    </section>
  );
}

// ── Pieces of the scene ──────────────────────────────────────────────────

const chalkCache = new Map<string, ReturnType<typeof chalk>>();
function chalkFor(text: string, area: Box) {
  const k = `${text}@${area.join(',')}`;
  let sprite = chalkCache.get(k);
  if (!sprite) {
    const { lines, doodle } = parseChalk(text);
    sprite = chalk(lines, area, doodle);
    chalkCache.set(k, sprite);
  }
  return sprite;
}

/** Something thrown or falling: moved pixel by pixel along its path, then gone. */
function SceneFlight({ f, onEnd }: { f: Flight; onEnd: (id: number) => void }) {
  const ref = useRef<SVGGElement>(null);
  const ended = useRef(false);
  useLayoutEffect(() => {
    const el = ref.current;
    const end = () => {
      if (!ended.current) { ended.current = true; f.done?.(); }
      onEnd(f.id);
    };
    if (!el?.animate || prefersReducedMotion()) { end(); return; }
    const anim = el.animate(f.path.map(([x, y]) => ({ transform: `translate(${x}px, ${y}px)`, easing: 'steps(1, end)' })), { duration: f.ms, fill: 'forwards' });
    anim.onfinish = end;
    return () => { anim.onfinish = null; anim.cancel(); };
  }, [f, onEnd]);
  return (
    <g transform={`translate(${f.at[0]} ${f.at[1]})`}>
      <g ref={ref}><Paths sprite={f.sprite} /></g>
    </g>
  );
}

/**
 * The poster's rocket: on its pad until clicked, then it lifts off in a
 * puff of smoke, flies out of the top of the room (growing as it comes off
 * the poster) and comes back down onto the pad, its flame on.
 */
function Rocket({ room, n, up, onDown }: { room: Scene; n: number; up: boolean; onDown: () => void }) {
  const { rocket } = room;
  if (!up) return <Paths sprite={rocket.body} />;
  return (
    <>
      <g key={`s${n}`} className={s.smoke}><Paths sprite={rocket.smoke} /></g>
      <g
        key={`r${n}`}
        className={s.rocketFly}
        style={{ '--up': `${-(rocket.at[1] + 30)}px` } as React.CSSProperties}
        onAnimationEnd={(e) => { if (e.target === e.currentTarget) onDown(); }}
      >
        <g className={s.flame}>
          <g className={s.frameA}><Paths sprite={rocket.flame[0]} /></g>
          <g className={s.frameB}><Paths sprite={rocket.flame[1]} /></g>
        </g>
        <Paths sprite={rocket.body} />
      </g>
    </>
  );
}

/** Outside the window: sky, sun or moon, clouds drifting, rain or snow falling. */
function Sky({ room, weather, clipId }: { room: Scene; weather: Weather; clipId: string }) {
  const grey = weather === 'rain' || weather === 'snow';
  return (
    <g clipPath={`url(#${clipId})`}>
      <g className={s.day}>
        <Paths sprite={grey ? room.sky.grey : room.sky.day} />
        {weather === 'sun' && <Paths sprite={room.sky.sun} />}
        <Paths sprite={room.sky.scenery} />
      </g>
      <g className={s.night}>
        <Paths sprite={room.sky.night} />
        {!grey && <g className={s.twinkle}><Paths sprite={room.sky.stars} /></g>}
        {weather === 'sun' && <Paths sprite={room.sky.moon} />}
        <Paths sprite={room.sky.sceneryNight} />
      </g>
      {weather !== 'sun' && (
        <g className={s.clouds} style={{ '--loop': `-${SKY_LOOP}px` } as React.CSSProperties}><Paths sprite={room.clouds} /></g>
      )}
      {weather === 'rain' && <g className={s.rain}><Paths sprite={room.rain} /></g>}
      {weather === 'snow' && <g className={s.snow}><Paths sprite={room.snow} /></g>}
    </g>
  );
}

const discoCache = new Map<string, [Sprite, Sprite]>();
function discoFor(x: number, top: number) {
  const k = `${x},${top}`;
  let v = discoCache.get(k);
  if (!v) { v = discoAt(x, top); discoCache.set(k, v); }
  return v;
}

const decorCache = new Map<string, Sprite>();
function cached(k: string, make: () => Sprite) {
  let v = decorCache.get(k);
  if (!v) { v = make(); decorCache.set(k, v); }
  return v;
}

/** The decorations put up in the room; the lights' layer is drawn above the dark of a switched-off room. */
function Decor({ room, decor, layer }: { room: Scene; decor: Set<string>; layer: 'back' | 'glow' }) {
  const d = room.decor;
  const at = (p: [number, number]) => p.join(',');
  if (layer === 'back') {
    return (
      <>
        {decor.has('plant') && <Paths sprite={cached(`plant${at(d.plant)}`, () => plantAt(d.plant[0], d.plant[1]))} />}
        {decor.has('trophy') && <Paths sprite={cached(`trophy${at(d.trophy)}`, () => trophyAt(d.trophy[0], d.trophy[1]))} />}
        {decor.has('duck') && <Paths sprite={cached(`duck${at(d.duck)}`, () => duckAt(d.duck[0], d.duck[1]))} />}
      </>
    );
  }
  const lamp = decor.has('lavalamp') ? lampAt(d.lamp[0], d.lamp[1]) : null;
  const lights = decor.has('lights') ? lightsAt(d.lights[0], d.lights[1]) : null;
  const disco = decor.has('disco') ? discoFor(d.disco[0], d.disco[1]) : null;
  return (
    <>
      {lamp && (
        <g className={s.lava}>
          <g className={s.frameA}><Paths sprite={lamp[0]} /></g>
          <g className={s.frameB}><Paths sprite={lamp[1]} /></g>
        </g>
      )}
      {lights && (
        <g className={s.twinkle2}>
          <g className={s.frameA}><Paths sprite={lights[0]} /></g>
          <g className={s.frameB}><Paths sprite={lights[1]} /></g>
        </g>
      )}
      {disco && (
        <g className={s.party}>
          <g className={s.frameA}><Paths sprite={disco[0]} /></g>
          <g className={s.frameB}><Paths sprite={disco[1]} /></g>
        </g>
      )}
    </>
  );
}

/** The time for the clock, once a minute. */
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
