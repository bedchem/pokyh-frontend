'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CaretLeft, X } from '@phosphor-icons/react';
import MascotFigure from '@/components/pixel/MascotFigure';
import { SpritePalette } from '@/components/pixel/SceneSvg';
import { useFirstName } from '@/components/app/hooks';
import { useSession } from '@/providers/SessionProvider';
import { useDateLocale, useLocale, useT } from '@/providers/LocaleProvider';
import { recapDict } from '@/lib/i18n/dictionaries/recap';
import { RECAP_DOCKED_EVENT, fetchRecap, markRecapView, type ClientRecap, type RecapPokyh } from '@/lib/recap';
import { loadUntisRecap, type RecapProgress } from '@/lib/recap-data';
import { dateOfNum, type UntisRecap } from '@/lib/recap-figures';
import { ABSENCE_LIMIT, buildStory, summaryItems, type Fmt, type Slide, type Text, type Value } from '@/lib/recap-story';
import { holdPageCover } from '@/lib/page-cover';
import PixelText from './PixelText';
import RecapSummary from './RecapSummary';
import { cover, fillAll, patternFor, reveal } from './pixelWipe';
import { ONGOING, REACTIONS, topRow, type FieldParticles, type LocalParticles, type Reaction } from './reactions';
import { THEMES, dotPattern, tilePattern } from './themes';
import s from './recap.module.css';

// A recap as a story in pixel art, page after page: a figure, what it
// means and the mascot's take on it (lib/recap-story.ts decides the pages,
// ./reactions.ts how the mascot reacts). Each page is a little scene — a
// sky in the page's colour, the ground the mascot stands on — and the pages
// turn with block wipes like an old handheld's screens (./pixelWipe.ts): the
// card fills with blocks in the next page's colours in one of nine patterns,
// the page changes underneath, the blocks clear. Then the text steps in line
// by line, the figure counts up in the pixel font and the mascot drops in.
//
// "Weiter", a tap on the right, a swipe to the left or → go on; a tap on the
// left, a swipe right or ← go back; a swipe down or Esc closes, and the card
// flies into the button in the top bar. Nothing moves on by itself. The last
// page is the card to share (./RecapSummary.tsx). With reduced motion the
// pages simply change.
//
// On a wide screen (WIDE) the story fills it: the text in a column on the
// left, the mascot large on the right, the ground across the whole width
// with the buttons on it; the last page puts the poster beside its
// settings. Phones and upright screens keep the one column.
//
// The first page is there at once; its button shows how far the figures are
// (the WebUntis ones are worked out on this device, lib/recap-data.ts) and
// starts the story when they are. That the story was shown — and watched to
// the end — is kept on the POKYH server (POST /recaps/:id/view).

const pad = (n: number) => String(n).padStart(2, '0');

/** Wide screens, laid out in two columns; the same query as in recap.module.css. */
const WIDE = '(min-width: 640px) and (min-aspect-ratio: 4/5)';

const onResize = (changed: () => void) => {
  window.addEventListener('resize', changed);
  return () => window.removeEventListener('resize', changed);
};

function useWide(): boolean {
  return useSyncExternalStore(onResize, () => window.matchMedia(WIDE).matches, () => false);
}

// CSS pixels per font pixel for a page's figure: as on phones below 640 px,
// then growing with the screen — on wide screens with its height, as the
// text has a column of its own there.
function figureSize(): number {
  if (window.matchMedia(WIDE).matches) return Math.min(40, Math.max(9, Math.floor(window.innerHeight / 36)));
  return window.innerWidth < 640 ? 13 : Math.min(20, Math.floor(window.innerWidth / 36));
}

function useFigureSize(): number {
  return useSyncExternalStore(onResize, figureSize, () => 13);
}

function useFmt(): Fmt {
  const { tag } = useDateLocale();
  const { locale } = useLocale();
  return useMemo<Fmt>(() => ({
    date: (n) => dateOfNum(n).toLocaleDateString(tag, { weekday: 'long', day: 'numeric', month: 'long' }),
    day: (iso) => {
      const [y, m, d] = iso.split('-').map(Number);
      return new Date(y!, m! - 1, d!).toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric' });
    },
    // 1 January 2024 was a Monday.
    weekday: (i) => new Date(2024, 0, 1 + i).toLocaleDateString(tag, { weekday: 'long' }),
    time: (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`,
    num: (n, digits = 0) => new Intl.NumberFormat(tag, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n),
    dish: (name) => (locale === 'it' ? name.it : locale === 'en' ? name.en : name.de),
  }), [tag, locale]);
}

// ── Pieces of a page ────────────────────────────────────────────────────────

/** A seeded random sequence, so a page's particles stay where they are. */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const CONFETTI = ['#fde047', '#f472b6', '#60a5fa', '#34d399', '#fb923c', '#c4b5fd', '#f87171'];

function Field({ kind, seed }: { kind: FieldParticles; seed: string }) {
  const pieces = useMemo(() => {
    const r = seeded(seed + kind);
    const n = kind === 'confetti' ? 28 : kind === 'stars' ? 14 : kind === 'rain' ? 30 : 0;
    return Array.from({ length: n }, () => ({ x: r(), y: r(), a: r(), b: r(), c: r(), d: r() }));
  }, [kind, seed]);
  if (kind === 'alarm') {
    return <div className={s.hazard} aria-hidden="true"><span /><span /><span /><span /></div>;
  }
  return (
    <div className={s.field} aria-hidden="true">
      {pieces.map((p, i) => {
        if (kind === 'confetti') {
          const size = 6 + Math.round(p.a * 2) * 2;
          return <span key={i} className={s.confetti} style={{ left: `${p.x * 100}%`, '--s': `${size}px`, '--c': CONFETTI[i % CONFETTI.length], '--d': `${2.8 + p.b * 2.4}s`, '--w': `${-p.c * 5}s`, '--x': `${Math.round((p.d - 0.5) * 12) * 10}px`, '--r': `${Math.round((p.a - 0.5) * 8) * 90}deg` } as CSSProperties} />;
        }
        if (kind === 'stars') {
          return <span key={i} className={s.star} style={{ left: `${4 + p.x * 92}%`, top: `${8 + p.y * 58}%`, '--d': `${1.4 + p.b * 2}s`, '--w': `${-p.c * 3}s` } as CSSProperties} />;
        }
        return <span key={i} className={s.rain} style={{ left: `${p.x * 104}%`, '--d': `${0.7 + p.b * 0.5}s`, '--w': `${-p.c * 2}s` } as CSSProperties} />;
      })}
    </div>
  );
}

const HEART = 'M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z';

function Local({ kind, seed }: { kind: LocalParticles; seed: string }) {
  const r = useMemo(() => {
    const next = seeded(seed + kind);
    return Array.from({ length: 6 }, () => [next(), next(), next()] as const);
  }, [kind, seed]);
  return (
    <span className={s.local} aria-hidden="true">
      {kind === 'sparkle' && r.map(([x, y, d], i) => (
        <span key={i} className={s.spark} style={{ left: `${8 + x * 84}%`, top: `${6 + y * 58}%`, '--d': `${1 + d * 1.2}s`, '--w': `${-d * 2}s` } as CSSProperties} />
      ))}
      {kind === 'zzz' && [0, 1, 2].map((i) => (
        <span key={i} className={s.zzz} style={{ '--z': `${10 + i * 5}px`, '--w': `${i}s`, '--x': `${16 + i * 8}px` } as CSSProperties}>
          <PixelText text="Z" size={2 + i} min={1} />
        </span>
      ))}
      {kind === 'hearts' && r.slice(0, 4).map(([x, , d], i) => (
        <svg key={i} viewBox="0 0 7 6" className={s.heart} shapeRendering="crispEdges" style={{ left: `${28 + x * 44}%`, '--d': `${2.2 + d}s`, '--w': `${i * 0.7}s`, '--x': `${Math.round((x - 0.5) * 5) * 10}px` } as CSSProperties}>
          <path d={HEART} fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}

/** The mascot as it reacts: its first motion, then calm, the first one again every `repeat` ms. */
function Figure({ reaction, id }: { reaction: Reaction; id: string }) {
  const first = reaction.look.motion;
  const [phase, setPhase] = useState({ n: 0, moving: true });
  useEffect(() => {
    if (ONGOING.has(first)) return;
    const timers: number[] = [window.setTimeout(() => setPhase((p) => ({ ...p, moving: false })), 1100)];
    const again = reaction.repeat
      ? window.setInterval(() => {
          setPhase((p) => ({ n: p.n + 1, moving: true }));
          timers.push(window.setTimeout(() => setPhase((p) => ({ ...p, moving: false })), 1000));
        }, reaction.repeat)
      : undefined;
    return () => { timers.forEach(clearTimeout); clearInterval(again); };
  }, [first, reaction.repeat]);
  const look = { ...reaction.look, motion: phase.moving ? first : reaction.settle ?? 'bob' };
  return (
    <svg viewBox="-6 -18 52 55" className={`spr ${s.figure}`} shapeRendering="crispEdges" aria-hidden="true">
      <MascotFigure look={look} motionKey={`${id}-${phase.n}`} wear={reaction.wear} />
    </svg>
  );
}

function useCountUp(value: Extract<Value, { kind: 'count' }>, reduced: boolean): number {
  const from = value.from ?? 0;
  const [counted, setCounted] = useState(from);
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const start = performance.now() + 420;
    const span = Math.abs(value.n - from);
    const duration = span < 5 ? 500 : span < 50 ? 900 : 1300;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setCounted(from + (value.n - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value.n, from, reduced]);
  return reduced ? value.n : counted;
}

/** A page's figure, `size` CSS pixels per font pixel at most; a word or a name at about half that. */
function BigValue({ value, tag, reduced, size, lines = 2 }: { value: Value; tag: string; reduced: boolean; size: number; lines?: number }) {
  if (value.kind === 'text') return <PixelText text={value.text} size={Math.round(size * 0.54)} min={3} lines={lines} />;
  return <CountValue value={value} tag={tag} reduced={reduced} size={size} />;
}

function CountValue({ value, tag, reduced, size }: { value: Extract<Value, { kind: 'count' }>; tag: string; reduced: boolean; size: number }) {
  const shown = useCountUp(value, reduced);
  const digits = value.decimals ?? 0;
  const text = new Intl.NumberFormat(tag, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(digits === 0 ? Math.round(shown) : shown);
  return <PixelText text={`${value.prefix ?? ''}${text}${value.suffix ?? ''}`} size={size} min={4} />;
}

/** The absence rate in 20 blocks, coloured by how far along they are, with the limit's flag. */
function Meter({ value, label }: { value: number; label: string }) {
  const span = Math.max(40, value * 1.25);
  const per = span / 20;
  const on = Math.max(value > 0 ? 1 : 0, Math.round(value / per));
  const color = (i: number) => {
    const at = (i + 1) * per;
    return at <= 10 ? '#4ade80' : at <= 20 ? '#facc15' : at <= ABSENCE_LIMIT ? '#fb923c' : '#f87171';
  };
  const limitAt = `${(ABSENCE_LIMIT / span) * 100}%`;
  return (
    <div className={s.meter} aria-hidden="true">
      <div className={s.cells}>
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} className={s.cell} data-on={i < on ? '' : undefined} style={{ '--c': color(i), '--i': i } as CSSProperties} />
        ))}
      </div>
      <span className={s.limit} style={{ left: limitAt }} />
      <span className={s.limitLabel} style={{ left: limitAt }}>{label}</span>
    </div>
  );
}

// ── The story ───────────────────────────────────────────────────────────────

export interface RecapPreviewData {
  pokyh: RecapPokyh | null;
  untis: UntisRecap | null;
  firstName?: string;
}

export default function RecapStory({ recap, onClose, preview }: {
  recap: ClientRecap;
  onClose: () => void;
  /** Figures to show instead of the account's (the development preview, RecapPreview.tsx): nothing is loaded or kept. */
  preview?: RecapPreviewData;
}) {
  const t = useT(recapDict);
  const fmt = useFmt();
  const { tag } = useDateLocale();
  const { user } = useSession();
  const ownName = useFirstName();
  const firstName = preview?.firstName ?? ownName;
  const reduced = !!useReducedMotion();
  const wide = useWide();
  const figure = useFigureSize();

  // The answers of a try (`attempt`); undefined while it is under way.
  const [pokyhResult, setPokyhResult] = useState<{ attempt: number; value: RecapPokyh | null } | null>(null);
  const [untisResult, setUntisResult] = useState<{ attempt: number; value: UntisRecap | null; failed: boolean } | null>(null);
  const [progress, setProgress] = useState<RecapProgress | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  // Where the card flies to as it closes: the button in the top bar.
  const [dock, setDock] = useState<{ x: number; y: number; scale: number } | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const wipe = useRef<HTMLCanvasElement>(null);
  const turning = useRef(false);
  const queued = useRef(0);
  const at = useRef(0);
  const finished = useRef(false);
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const studentId = user?.studentId ?? 0;
  const untisUser = !!user && user.isUntisUser !== false && studentId > 0;
  const sectionsKey = recap.sections.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the same parts, whatever the array
  const sections = useMemo(() => recap.sections, [sectionsKey]);
  const needsUntis = !preview && untisUser && sections.some((x) => x !== 'pokyh');

  // Shown: on every device of the account from now on (the server keeps it).
  useEffect(() => { if (!preview) void markRecapView(recap.id, false); }, [recap.id, preview]);
  // Popups and the like wait while the story is open.
  useEffect(() => holdPageCover(), []);

  useEffect(() => {
    if (preview) return;
    let alive = true;
    fetchRecap(recap.id)
      .then((r) => { if (alive) setPokyhResult({ attempt, value: r.pokyh }); })
      .catch(() => { if (alive) setPokyhResult({ attempt, value: null }); });
    return () => { alive = false; };
  }, [recap.id, attempt, preview]);

  useEffect(() => {
    if (!needsUntis) return;
    let alive = true;
    loadUntisRecap(studentId, recap.periodFrom, recap.periodTo, sections, (p) => { if (alive) setProgress(p); })
      .then((u) => { if (alive) setUntisResult({ attempt, value: u, failed: false }); })
      .catch(() => { if (alive) setUntisResult({ attempt, value: null, failed: true }); });
    return () => { alive = false; };
  }, [needsUntis, studentId, recap.periodFrom, recap.periodTo, sections, attempt]);

  const pokyh = preview ? preview.pokyh : pokyhResult?.attempt === attempt ? pokyhResult.value : undefined;
  const untis = preview ? preview.untis : !needsUntis ? null : untisResult?.attempt === attempt ? untisResult.value : undefined;
  const untisFailed = needsUntis && untisResult?.attempt === attempt && untisResult.failed;

  const ready = pokyh !== undefined && untis !== undefined;
  const nothing = ready && !untis && !pokyh;
  const input = useMemo(() => ({
    title: recap.title, firstName, periodFrom: recap.periodFrom, periodTo: recap.periodTo, sections,
    untis: untis ?? null, pokyh: pokyh ?? null,
  }), [recap.title, recap.periodFrom, recap.periodTo, firstName, sections, untis, pokyh]);
  const slides = useMemo(() => {
    const all = buildStory(input, fmt);
    return ready && !nothing ? all : all.slice(0, 1);
  }, [input, fmt, ready, nothing]);
  const items = useMemo(() => summaryItems(input, fmt), [input, fmt]);
  const current = Math.min(index, slides.length - 1);
  const slide: Slide = slides[current]!;
  const theme = THEMES[slide.theme];
  const reaction = REACTIONS[slide.mood];
  const last = current === slides.length - 1 && slides.length > 1;
  useEffect(() => { at.current = current; }, [current]);

  useEffect(() => {
    if (!last || finished.current || preview) return;
    finished.current = true;
    void markRecapView(recap.id, true);
  }, [last, recap.id, preview]);

  // The story opens out of blocks: full before the first paint, then an iris.
  useLayoutEffect(() => {
    const canvas = wipe.current;
    if (!canvas || reduced) return;
    const colors = { fill: THEMES.night.accent, alt: THEMES.night.edge };
    fillAll(canvas, colors);
    turning.current = true;
    void reveal(canvas, 'iris', colors, 3).then(() => { turning.current = false; });
  }, [reduced]);

  // Turns to a page; taps during a turn add up and the next turn goes that
  // far at once, so quick taps are never lost.
  const goTo = useCallback(async (first: number) => {
    if (turning.current) return;
    const canvas = wipe.current;
    if (reduced || !canvas) {
      if (first >= 0 && first < slides.length) setIndex(first);
      return;
    }
    turning.current = true;
    let next = first;
    while (next !== at.current && next >= 0 && next < slides.length) {
      const target = THEMES[slides[next]!.theme];
      const colors = { fill: target.bg, alt: target.chip };
      const pattern = patternFor(slides[next]!.id, next);
      const seed = next * 13 + 7;
      await cover(canvas, pattern, colors, seed);
      setIndex(next);
      at.current = next;
      // The new page painted under the blocks before they clear.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await reveal(canvas, pattern, colors, seed);
      const step = queued.current;
      queued.current = 0;
      if (!step) break;
      next = Math.min(slides.length - 1, Math.max(0, next + step));
    }
    turning.current = false;
  }, [slides, reduced]);

  const go = useCallback((step: 1 | -1) => {
    if (step === 1 && (!ready || nothing)) return;
    if (turning.current) { queued.current += step; return; }
    void goTo(at.current + step);
  }, [ready, nothing, goTo]);

  // Closing sends the card into the button beside the search, which bumps as it lands.
  const close = useCallback(() => {
    const target = [...document.querySelectorAll<HTMLElement>('[data-recap-banner]')].find((el) => el.getClientRects().length > 0);
    const box = card.current?.getBoundingClientRect();
    if (target && box && !reduced) {
      const b = target.getBoundingClientRect();
      setDock({
        x: b.left + b.width / 2 - (box.left + box.width / 2),
        y: b.top + b.height / 2 - (box.top + box.height / 2),
        scale: Math.max(0.04, b.height / box.height),
      });
      window.setTimeout(() => window.dispatchEvent(new Event(RECAP_DOCKED_EVENT)), 520);
    }
    requestAnimationFrame(() => onClose());
  }, [onClose, reduced]);

  // Keys: → Space Enter on, ← back, Esc closes. Focus stays in the story.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    card.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      // Inside the last page's sheet or menu the keys are theirs.
      const owner = (e.target as HTMLElement | null)?.closest?.('[role="dialog"]');
      const inSheet = !!owner && owner !== card.current;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (inSheet) return;
      else if (e.key === 'ArrowRight' || ((e.key === ' ' || e.key === 'Enter') && !(e.target instanceof HTMLButtonElement))) { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'Tab' && card.current) {
        const focusable = [...card.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')];
        if (!focusable.length) return;
        const first = focusable[0]!;
        const lastEl = focusable[focusable.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); before?.focus?.({ preventScroll: true }); };
  }, [go, close]);

  const summary = slide.layout === 'summary';
  const onPointerDown = (e: ReactPointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY, moved: false }; };
  const onPointerUp = (e: ReactPointerEvent) => {
    const start = swipe.current;
    if (!start || summary) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { start.moved = true; go(dx < 0 ? 1 : -1); }
    else if (dy > 110 && dy > Math.abs(dx)) { start.moved = true; close(); }
  };
  // A tap on the left third goes back, anywhere else on; buttons and the last page do their own.
  const onClick = (e: React.MouseEvent) => {
    if (swipe.current?.moved) { swipe.current = null; return; }
    if (summary || (e.target as HTMLElement).closest('button, a')) return;
    const rect = card.current?.getBoundingClientRect();
    if (!rect) return;
    go(e.clientX < rect.left + rect.width * 0.3 ? -1 : 1);
  };

  const say = (x?: Text) => (x ? t(x.key, x.vars) : '');
  const body: Text[] = [...(slide.body ?? [])];
  if (slide.layout === 'intro' && nothing) body.push({ key: 'errorAll' });
  else if (slide.layout === 'intro' && untisFailed) body.push({ key: 'errorUntis' });
  const listMax = Math.max(1, ...(slide.list ?? []).map((r) => r.value));
  const loaded = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 12) : 0;
  const cardStyle = {
    '--rc-bg': theme.bg, '--rc-dots': dotPattern(theme), '--rc-ground': theme.ground, '--rc-tiles': tilePattern(theme),
    '--rc-edge': theme.edge, '--rc-chip': theme.chip, '--rc-soft': theme.soft, '--rc-accent': theme.accent, '--rc-accent-ink': theme.accentInk,
  } as CSSProperties;
  let line = 0;
  const nextLine = () => ({ '--i': line++ } as CSSProperties);

  return (
    <motion.div
      className={s.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.15 } }}
      exit={{ opacity: 0, transition: { duration: dock ? 0.45 : 0.2, delay: 0.05 } }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <SpritePalette />
      <motion.div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-label={`${t('storyLabel')}: ${recap.title}`}
        tabIndex={-1}
        className={`${s.card} ${s.px}`}
        style={cardStyle}
        exit={reduced || !dock
          ? { opacity: 0, transition: { duration: 0.18 } }
          : { x: dock.x, y: dock.y, scale: dock.scale, opacity: [1, 1, 0], transition: { duration: 0.5, ease: [0.6, 0, 0.25, 1], opacity: { duration: 0.5, times: [0, 0.8, 1] } } }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={onClick}
      >
        <div className={s.ground} aria-hidden="true" />
        {reaction.field && !reduced && !summary && <Field key={`${slide.id}-${reaction.field}`} kind={reaction.field} seed={slide.id} />}

        <div className={s.top}>
          <div className={s.bars} aria-hidden="true">
            {slides.length > 1 && slides.map((x, i) => (
              <span key={x.id} className={s.bar} data-state={i < current ? 'done' : i === current ? 'now' : 'next'}><span /></span>
            ))}
          </div>
          <button type="button" className={`${s.close} ${s.px}`} onClick={close} aria-label={t('close')}>
            <X size={19} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <p className="visually-hidden" aria-live="polite">{slides.length > 1 ? t('slideOf', { n: current + 1, total: slides.length }) : ''}</p>

        {summary ? (
          <RecapSummary
            key={slide.id}
            t={t}
            title={recap.title}
            firstName={firstName}
            items={items}
            onReplay={() => void goTo(0)}
            wide={wide}
          />
        ) : (
          <>
            <div key={slide.id} className={s.page} data-layout={slide.layout}>
              {slide.lead && <p className={`${s.lead} ${s.in}`} style={nextLine()}>{say(slide.lead)}</p>}
              {slide.value && (
                <div className={`${s.value} ${s.in}`} style={nextLine()}>
                  <BigValue value={slide.value} tag={tag} reduced={reduced} size={figure} lines={slide.layout === 'intro' ? 3 : 2} />
                </div>
              )}
              {slide.unit && <p className={`${s.unit} ${s.in}`} style={nextLine()}>{say(slide.unit)}</p>}
              {slide.meter && (
                <div className={s.in} style={nextLine()}>
                  <Meter value={slide.meter.value} label={t('rateLimit')} />
                </div>
              )}
              {slide.list && slide.list.length > 0 && (
                <div className={`${s.list} ${s.in}`} style={nextLine()}>
                  {slide.list.map((row, i) => (
                    <div key={`${row.labelKey ?? row.label}-${i}`} className={s.row}>
                      <div className={s.rowHead}>
                        <span>{row.labelKey ? t(row.labelKey) : row.label}</span>
                        <span>{row.display}</span>
                      </div>
                      <div className={s.track}>
                        <div className={s.fill} style={{ '--w': `${Math.max(4, (row.value / listMax) * 100)}%`, '--i': i } as CSSProperties} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {body.map((b, i) => (
                <p key={`${b.key}-${i}`} className={`${s.body} ${s.in}`} style={nextLine()}>{say(b)}</p>
              ))}
            </div>

            {/* The figure's drawing runs from row -18 to 37 (Figure's viewBox): --head is where its top is drawn. */}
            <div key={`m-${slide.id}`} className={s.mascot} data-place={slide.place} style={{ '--head': `${((37 - topRow(reaction)) / 55) * 100}%` } as CSSProperties}>
              {slide.quip && (
                <>
                  <span className={`${s.bubble} ${s.px}`}>{say(slide.quip)}</span>
                  <span className={s.tail} aria-hidden="true" />
                </>
              )}
              <div className={s.drop}>
                {reaction.local && !reduced && <Local kind={reaction.local} seed={slide.id} />}
                <Figure reaction={reaction} id={slide.id} />
              </div>
            </div>

            <div className={s.bottom}>
              {/* Wide screens with a mouse: the keys, beside the buttons. */}
              {wide && (
                <p className={s.keys} aria-hidden="true">
                  <kbd className={`${s.key} ${s.px}`}><ArrowLeft size={14} weight="bold" /></kbd>
                  <kbd className={`${s.key} ${s.px}`}><ArrowRight size={14} weight="bold" /></kbd>
                  <span>{t('keysTurn')}</span>
                  <kbd className={`${s.key} ${s.px}`}>Esc</kbd>
                  <span>{t('keysClose')}</span>
                </p>
              )}
              <button type="button" className={`${s.back} ${s.px}`} onClick={() => go(-1)} disabled={current === 0} aria-label={t('back')}>
                <CaretLeft size={22} weight="bold" aria-hidden="true" />
              </button>
              {nothing ? (
                <button type="button" className={`${s.next} ${s.px}`} onClick={() => setAttempt((n) => n + 1)}>{t('retry')}</button>
              ) : (
                <button type="button" className={`${s.next} ${s.px}`} disabled={!ready} aria-busy={!ready} onClick={() => go(1)}>
                  {!ready
                    ? (progress && progress.total > 0 ? t('loading', { done: progress.done, total: progress.total }) : t('loadingShort'))
                    : current === 0 ? t('start') : t('next')}
                  {!ready && (
                    <span className={s.loadCells} aria-hidden="true">
                      {Array.from({ length: 12 }, (_, i) => <span key={i} data-on={i < loaded ? '' : undefined} />)}
                    </span>
                  )}
                </button>
              )}
            </div>
          </>
        )}

        <canvas ref={wipe} className={s.wipe} aria-hidden="true" />
      </motion.div>
    </motion.div>
  );
}
