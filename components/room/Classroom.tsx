'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CaretLeft, CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import { Paths, SpritePalette } from '@/components/pixel/SceneSvg';
import { ROOM_H, ROOM_W, SKY_LOOP, SPOTS, buildClassroom, chalk, wipe, type Box, type Spot } from '@/components/pixel/classroom';
import { bubble, clockHands } from '@/components/pixel/hallway';
import { MH, MW } from '@/components/pixel/mascot';
import MascotFigure, { usePointerLook, type Look } from '@/components/pixel/MascotFigure';
import { discoAt, duckAt, emptyCanAt, lampAt, lightsAt, plantAt, trophyAt } from '@/components/pixel/collectibles';
import { useT } from '@/providers/LocaleProvider';
import { roomDict, type RoomKey } from '@/lib/i18n/dictionaries/room';
import { prefersReducedMotion } from '@/lib/motion';
import { DISCOVERIES, DISCOVERY_STARS, DUCK_ODDS, GOLDEN_ODDS, GOLDEN_STARS, WELCOME_STARS, type Discovery, type Item } from './catalog';
import { discover, grant, unlock, useRoomSave, welcome } from './store';
import { closeView, openView, type RoomView } from './route';
import Vending from './Vending';
import Handheld from './Handheld';
import Backpack from './Backpack';
import { Dialog, StarCount, Toasts, type Line, type Toast } from './parts';
import s from './room.module.css';

// Room 2B: the secret classroom behind the door of the sign-in hallway
// (app/[lang]/login). The room itself is the interface: its things are the
// buttons. The board wipes and shows the next bit of chalk, the window
// changes the weather, the switch puts the light out, the poster, the clock,
// the globe, the red book, the apple, the bin and the notebook each hide a
// little secret (a discovery: two gold stars, once). The mascot answers a
// click, now and then with a golden moment. The vending machine sells
// cosmetic things for the stars, the tablet holds five little games, the
// backpack keeps what was collected (./Vending.tsx, ./Handheld.tsx,
// ./Backpack.tsx). Everything stays in this browser (./store.ts) and has
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

const BIN_NOTES: RoomKey[] = ['bin1', 'bin2', 'bin3', 'bin4', 'bin5', 'bin6'];
const BOOKS: RoomKey[] = ['book1', 'book2', 'book3', 'book4', 'book5'];
const GLOBE: RoomKey[] = ['globe1', 'globe2', 'globe3', 'globe4'];

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

/** One time in `odds`. */
const lucky = (odds: number) => Math.random() < 1 / odds;
const pickOne = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
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

const SUB_VIEWS: Partial<Record<RoomView, Spot>> = { snacks: 'vending', tablet: 'tablet', bag: 'backpack' };

interface Reaction {
  look: Look;
  say?: string;
  n: number;
  ms: number;
  next?: Omit<Reaction, 'n' | 'next'>;
}

export default function Classroom({ view, onLeave }: { view: RoomView; onLeave: () => void }) {
  const t = useT(roomDict);
  const save = useRoomSave();
  const titleId = useId();
  const maskId = useId();
  const clipId = useId();
  const stage = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
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
  const [peeled, setPeeled] = useState(false);
  const [bookOut, setBookOut] = useState(false);
  const [globeTurn, setGlobeTurn] = useState(0);
  const [clockSkip, setClockSkip] = useState(0);
  const [appleGone, setAppleGone] = useState(false);
  // What the mascot is doing; `next` follows on its own when it is over.
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [line, setLine] = useState<Line | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counts = useRef({ clock: [] as number[], mascot: [] as number[], mascotTotal: 0, bin: 0, apple: 0, book: 0, globe: 0, n: 0 });

  // ── Size ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      setBox((old) => (old && Math.abs(old.W - width) < 1 && Math.abs(old.H - height) < 1 ? old : { W: width, H: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const layout = box ? layoutFor(box.W, box.H) : null;
  const lw = layout?.w;
  const lh = layout?.h;
  const room = useMemo(() => (lw && lh ? buildClassroom(lw, lh) : null), [lw, lh]);
  const px = layout?.px ?? 1;

  // On a narrow screen the room pans: it starts at the board and the mascot.
  useEffect(() => {
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

  // ── Saying things, earning stars ──────────────────────────────────────
  const say = useCallback((text: string, who: Line['who'] = 'room') => {
    counts.current.n += 1;
    setLine({ text, who, n: counts.current.n });
  }, []);
  const toast = useCallback((text: string, stars: number) => {
    counts.current.n += 1;
    const id = counts.current.n;
    setToasts((old) => [...old.slice(-2), { id, text, stars }]);
    window.setTimeout(() => setToasts((old) => old.filter((x) => x.id !== id)), 3200);
  }, []);
  const found = useCallback((id: Discovery) => {
    if (discover(id)) toast(t('toastFound', { name: t(`found_${id}` as RoomKey) }), DISCOVERY_STARS);
  }, [t, toast]);
  const react = useCallback((look: Look, text?: string, ms = 2200) => {
    counts.current.n += 1;
    setReaction({ look, say: text, n: counts.current.n, ms });
  }, []);

  useEffect(() => {
    if (!reaction) return;
    const id = window.setTimeout(() => setReaction(reaction.next ? { ...reaction.next, n: -reaction.n } : null), reaction.ms);
    return () => window.clearTimeout(id);
  }, [reaction]);

  // Arriving: the warm wall the door opened onto clears, the stars of the first visit.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setArrived(true);
      if (welcome()) {
        say(t('welcome', { n: WELCOME_STARS }), 'mascot');
        toast(t('toastWelcome'), WELCOME_STARS);
        react(REACTIONS[0].look, t('mascotHi'), 2600);
      }
    }, prefersReducedMotion() ? 0 : 120);
    return () => window.clearTimeout(id);
  }, [react, say, t, toast]);

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

  // The clock racing ahead, then back to the real time.
  useEffect(() => {
    if (clockSkip <= 0) return;
    const id = window.setTimeout(() => setClockSkip((m) => (m >= 720 ? 0 : m + 24)), 40);
    return () => window.clearTimeout(id);
  }, [clockSkip]);

  // The globe turning a few times.
  useEffect(() => {
    if (globeTurn <= 0) return;
    const id = window.setTimeout(() => setGlobeTurn((n) => n - 1), 90);
    return () => window.clearTimeout(id);
  }, [globeTurn]);

  const now = useMinute();

  // The focus comes into the room as soon as it is drawn (the door it came through is gone).
  const ready = room !== null;
  useEffect(() => {
    if (ready) stage.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [ready]);

  // ── The things in the room ────────────────────────────────────────────
  const act = (spot: Spot) => {
    const c = counts.current;
    switch (spot) {
      case 'window': {
        const next = WEATHER[(WEATHER.indexOf(weather) + 1) % WEATHER.length];
        setWeather(next);
        say(t(`weather_${next}` as RoomKey));
        found('window');
        break;
      }
      case 'poster':
        setPeeled((p) => !p);
        say(peeled ? t('posterBack') : t('posterPeel'));
        if (!peeled) found('poster');
        break;
      case 'switch':
        setLightsOn((on) => !on);
        say(lightsOn ? (save.decor.includes('disco') ? t('lightsParty') : t('lightsOff')) : t('lightsOn'));
        if (lightsOn) found('switch');
        break;
      case 'board':
        if (wiping >= 0) return;
        setWiping(0);
        say(t('boardWipe'));
        found('board');
        break;
      case 'clock': {
        c.clock = clicksWithin(c.clock, 4000);
        if (c.clock.length >= 3) {
          c.clock = [];
          setClockSkip(24);
          say(t('clockSpin'));
          found('clock');
        } else say(t('clockTick'));
        break;
      }
      case 'globe':
        setGlobeTurn(12);
        say(t(GLOBE[c.globe++ % GLOBE.length]));
        found('globe');
        break;
      case 'shelf':
        if (!bookOut) {
          setBookOut(true);
          say(t('bookSecret'));
          found('book');
        } else {
          setBookOut(false);
          say(t(BOOKS[c.book++ % BOOKS.length]));
        }
        break;
      case 'apple':
        if (appleGone) return;
        if (c.apple === 0) {
          c.apple = 1;
          say(t('appleLook'));
          react({ pose: { eyes: 'wide', look: [1, -1], mouth: 'o', arms: 'down' }, motion: 'hop' }, t('mascotApple'));
        } else {
          setAppleGone(true);
          say(t('appleEat'));
          react(MUNCH, t('mascotMunch'));
          found('apple');
        }
        break;
      case 'bin': {
        c.bin += 1;
        const first = !save.found.includes('bin');
        if (!first && !save.owned.includes('duck') && lucky(DUCK_ODDS) && unlock('duck')) {
          say(t('binDuck'));
          toast(t('toastItem', { name: t('item_duck') }), 0);
        } else say(t(c.bin === 1 ? BIN_NOTES[0] : pickOne(BIN_NOTES)));
        found('bin');
        break;
      }
      case 'notebook':
        say(t('notebook'));
        react(REACTIONS[1].look, t('mascotFlip'));
        found('notebook');
        break;
      case 'mascot': {
        c.mascot = clicksWithin(c.mascot, 3500);
        c.mascotTotal += 1;
        if (c.mascot.length >= 7) {
          c.mascot = [];
          react(ANGRY, t('mascotAngry'), 2600);
          say(t('mascotAngryLine'), 'mascot');
        } else if (lucky(GOLDEN_ODDS)) {
          react(GOLDEN, t('mascotGolden'), 3000);
          say(t('golden', { n: GOLDEN_STARS }), 'mascot');
          grant(GOLDEN_STARS);
          toast(t('toastGolden'), GOLDEN_STARS);
          found('golden');
        } else {
          const r = REACTIONS[(c.mascotTotal - 1) % REACTIONS.length];
          react(r.look, t(r.say));
        }
        if (c.mascotTotal >= 5) found('friend');
        break;
      }
      case 'vending':
        go('snacks', spot);
        break;
      case 'tablet':
        go('tablet', spot);
        break;
      case 'backpack':
        go('bag', spot);
        break;
    }
  };

  // Into the machine, the tablet or the backpack: the view moves to it first.
  // Back in the room, the focus returns to the thing.
  const opener = useRef<Spot | null>(null);
  useEffect(() => {
    if (view !== 'room' || !opener.current) return;
    stage.current?.querySelector<HTMLElement>(`[data-spot="${opener.current}"]`)?.focus({ preventScroll: true });
    opener.current = null;
  }, [view]);
  const go = (next: RoomView, spot: Spot) => {
    opener.current = spot;
    setLine(null);
    setZoom({ spot, left: scroller.current?.scrollLeft ?? 0 });
    window.setTimeout(() => openView(next), prefersReducedMotion() ? 0 : 360);
  };
  const backToRoom = useCallback(() => { void closeView('room'); }, []);

  const leave = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onLeave, prefersReducedMotion() ? 0 : 240);
  };

  // Escape: closes what is said first.
  useEffect(() => {
    if (view !== 'room') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLine(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view]);

  // A snack or a drink from the machine is had in the room; back in the room the view zooms out.
  const [snack, setSnack] = useState<{ item: Item; name: string; n: number } | null>(null);
  const fed = useCallback((item: Item, name: string) => setSnack({ item, name, n: Date.now() }), []);
  // The energy cans emptied this visit stay on the teacher's desk.
  const [cans, setCans] = useState(0);
  const [seenView, setSeenView] = useState(view);
  if (seenView !== view) {
    setSeenView(view);
    if (view === 'room') {
      setZoom(null);
      if (snack) {
        setSnack(null);
        if (snack.item.id === 'monster') {
          setCans((n) => n + 1);
          setReaction({ look: HYPER, say: t('mascotHyper'), n: snack.n, ms: 4200, next: { look: CRASH, say: t('mascotCrash'), ms: 2000 } });
          setLine({ text: t('monsterDrunk'), who: 'mascot', n: snack.n });
        } else {
          const drink = snack.item.drink;
          setReaction({ look: drink ? SLURP : MUNCH, say: t(drink ? 'mascotSlurp' : 'mascotMunch'), n: snack.n, ms: 2200 });
          setLine({ text: t(drink ? 'drinkDrunk' : 'snackEaten', { name: snack.name }), who: 'mascot', n: snack.n });
        }
      }
    }
  }

  // ── The mascot ────────────────────────────────────────────────────────
  const eyes = usePointerLook(stage, () => {
    const el = scroller.current;
    if (!el || !room) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left - el.scrollLeft + (room.mascot[0] + MW / 2) * px, y: r.top + (room.mascot[1] + MH / 2) * px - ((room.h * px) - r.height) };
  });
  const look: Look = reaction?.look ?? { pose: { eyes: 'open', look: eyes, mouth: 'smile', arms: 'down' }, blink: true, motion: 'bob' };
  const sub = SUB_VIEWS[view];

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

  // Zoomed towards a thing: its middle to the middle of the panel, larger.
  let worldStyle: React.CSSProperties | undefined;
  if (zoom && !prefersReducedMotion()) {
    const [bx, by, bw, bh] = room.spots[zoom.spot];
    const { left } = zoom;
    const cx = (bx + bw / 2) * px - left;
    const cy = (by + bh / 2) * px + offY;
    const k = Math.min(3.2, Math.max(1.6, (box.H * 0.8) / (bh * px)));
    worldStyle = { transformOrigin: `${cx + left}px ${cy - offY}px`, transform: `translate(${box.W / 2 - cx}px, ${box.H / 2 - cy}px) scale(${k})` };
  }

  return (
    <section aria-labelledby={titleId} className={s.stage} ref={stage} data-arrived={arrived ? '' : undefined} data-leaving={leaving ? '' : undefined}>
      <SpritePalette />
      <h1 id={titleId} tabIndex={-1} className="visually-hidden">{t('title')}</h1>

      <div className={s.hud}>
        <StarCount stars={save.stars} label={t('starsLabel', { n: save.stars })} />
        <span className={s.chip} title={t('foundLabel', { n: save.found.length, total: DISCOVERIES.length })}>
          <MagnifyingGlass size={15} weight="bold" aria-hidden="true" />
          <span aria-hidden="true">{save.found.length}/{DISCOVERIES.length}</span>
          <span className="visually-hidden">{t('foundLabel', { n: save.found.length, total: DISCOVERIES.length })}</span>
        </span>
      </div>
      <Toasts toasts={toasts} />

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
        <div className={s.world} style={{ width: W, height: H, marginTop: Math.min(0, offY), ...worldStyle }}>
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
            {peeled && <Paths sprite={room.posterPeel} />}
            <Paths sprite={lightsOn ? room.switchOn : room.switchOff} />
            <g key={wiping < 0 ? `c${board}` : 'w'} className={wiping < 0 ? s.chalkIn : undefined}>
              <Paths sprite={chalkSprite} />
            </g>
            {wiping >= 0 && <Paths sprite={wipe(room.board, wiping)} />}
            {hands && <Paths sprite={hands} />}
            <Paths sprite={room.globe[globeTurn % 4]} />
            <Paths sprite={bookOut ? room.book.out : room.book.in} />
            {!appleGone && <Paths sprite={room.apple} />}
            <Decor room={room} decor={decor} lightsOn={lightsOn} layer="back" />
            {cans > 0 && <Paths sprite={cached(`can${room.decor.can.join(',')}`, () => emptyCanAt(room.decor.can[0], room.decor.can[1]))} />}
            <g transform={`translate(${mx} ${my})`}>
              <MascotFigure look={look} motionKey={reaction ? `r${reaction.n}` : 'idle'} wear={save.wear} />
            </g>
            <Paths sprite={room.front} />
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
            <Decor room={room} decor={decor} lightsOn={lightsOn} layer="glow" />
            {speech && <g key={reaction?.n} className="ms-pop"><Paths sprite={speech} /></g>}
          </svg>

          {SPOTS.map((spot) => {
            const [x, y, w, h] = room.spots[spot];
            const label = t(`spot_${spot}` as RoomKey);
            return (
              <button
                key={spot}
                type="button"
                data-spot={spot}
                className={s.spot}
                onClick={() => act(spot)}
                aria-label={label}
                aria-haspopup={spot === 'vending' || spot === 'tablet' || spot === 'backpack' ? 'dialog' : undefined}
                style={{ left: x * px, top: y * px, width: w * px, height: h * px }}
              >
                <span className={s.corners} aria-hidden="true" />
                <span className={s.tag} aria-hidden="true" data-below={y * px < 40 ? '' : undefined}>{label}</span>
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

      {!sub && line && <Dialog line={line} onClose={() => setLine(null)} closeLabel={t('dialogClose')} />}

      {view === 'snacks' && <Vending onClose={backToRoom} onFed={fed} onToast={toast} onFound={found} />}
      {view === 'tablet' && <Handheld onClose={backToRoom} onToast={toast} />}
      {view === 'bag' && <Backpack onClose={backToRoom} />}

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

/** Outside the window: sky, sun or moon, clouds drifting, rain or snow falling. */
function Sky({ room, weather, clipId }: { room: NonNullable<ReturnType<typeof buildClassroom>>; weather: Weather; clipId: string }) {
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

const decorCache = new Map<string, ReturnType<typeof plantAt>>();
function cached(k: string, make: () => ReturnType<typeof plantAt>) {
  let v = decorCache.get(k);
  if (!v) { v = make(); decorCache.set(k, v); }
  return v;
}

/** The decorations put up in the room; the lights' layer is drawn above the dark of a switched-off room. */
function Decor({ room, decor, lightsOn, layer }: { room: NonNullable<ReturnType<typeof buildClassroom>>; decor: Set<string>; lightsOn: boolean; layer: 'back' | 'glow' }) {
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
  const disco = decor.has('disco') ? discoAt(d.disco[0], d.disco[1], { w: room.w, floor: room.floor }) : null;
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
      {disco && <Paths sprite={disco.ball} />}
      {disco && !lightsOn && (
        <g className={s.party}>
          <g className={s.frameA}><Paths sprite={disco.spots[0]} /></g>
          <g className={s.frameB}><Paths sprite={disco.spots[1]} /></g>
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

