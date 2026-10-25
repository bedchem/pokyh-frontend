'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowCounterClockwise, CaretLeft, ShareNetwork, X } from '@phosphor-icons/react';
import MascotFigure from '@/components/pixel/MascotFigure';
import { SpritePalette } from '@/components/pixel/SceneSvg';
import { useFirstName } from '@/components/app/hooks';
import { useSession } from '@/providers/SessionProvider';
import { useDateLocale, useLocale, useT } from '@/providers/LocaleProvider';
import { recapDict } from '@/lib/i18n/dictionaries/recap';
import { RECAP_DOCKED_EVENT, fetchRecap, markRecapView, type ClientRecap, type RecapPokyh } from '@/lib/recap';
import { loadUntisRecap, type RecapProgress } from '@/lib/recap-data';
import { dateOfNum, type UntisRecap } from '@/lib/recap-figures';
import { buildStory, summaryItems, type Fmt, type Text, type Value } from '@/lib/recap-story';
import { holdPageCover } from '@/lib/page-cover';
import { ONGOING, REACTIONS, type FieldParticles, type LocalParticles, type Reaction } from './reactions';
import { THEMES, themeBackground } from './themes';
import { shareSummary } from './share';
import s from './recap.module.css';

// A recap as a story, page after page: a figure, what it means, and the
// mascot's take on it (lib/recap-story.ts decides the pages, ./reactions.ts
// how the mascot reacts). "Weiter", a tap on the right, a swipe to the left
// or → go on; a tap on the left, a swipe right or ← go back; a swipe down
// or Esc closes. Nothing moves on by itself.
//
// Going on, the page's text leaves upwards and blurs while the next one
// rises in line by line, its number counting up; the background's colours
// cross over and the mascot walks to its place on the new page, changing
// its face on the way. With reduced motion everything simply fades.
//
// The first page is there at once; its button shows how far the figures are
// (the WebUntis ones are worked out on this device, lib/recap-data.ts) and
// starts the story when they are. That the story was shown — and watched
// to the end — is kept on the POKYH server (POST /recaps/:id/view).

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_IN = [0.4, 0, 1, 1] as const;

const pad = (n: number) => String(n).padStart(2, '0');

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
    const n = kind === 'confetti' ? 30 : kind === 'stars' ? 16 : kind === 'rain' ? 34 : 0;
    return Array.from({ length: n }, () => ({ x: r(), y: r(), a: r(), b: r(), c: r(), d: r() }));
  }, [kind, seed]);
  return (
    <motion.div className={s.field} aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.6, delay: 0.25 } }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
      {kind === 'alarm' && <span className={s.alarm} />}
      {pieces.map((p, i) => {
        if (kind === 'confetti') {
          return <span key={i} className={s.confetti} style={{ left: `${p.x * 100}%`, '--s': `${6 + Math.round(p.a * 5)}px`, '--c': CONFETTI[i % CONFETTI.length], '--d': `${2.8 + p.b * 2.4}s`, '--w': `${-p.c * 5}s`, '--x': `${(p.d - 0.5) * 120}px`, '--r': `${(p.a - 0.5) * 900}deg` } as CSSProperties} />;
        }
        if (kind === 'stars') {
          return <span key={i} className={s.star} style={{ left: `${4 + p.x * 92}%`, top: `${8 + p.y * 62}%`, '--d': `${1.6 + p.b * 2.2}s`, '--w': `${-p.c * 3}s` } as CSSProperties} />;
        }
        return <span key={i} className={s.drop} style={{ left: `${p.x * 104}%`, '--d': `${0.7 + p.b * 0.6}s`, '--w': `${-p.c * 2}s` } as CSSProperties} />;
      })}
    </motion.div>
  );
}

function Local({ kind, seed }: { kind: LocalParticles; seed: string }) {
  const r = useMemo(() => {
    const next = seeded(seed + kind);
    return Array.from({ length: 6 }, () => [next(), next(), next()] as const);
  }, [kind, seed]);
  return (
    <span className={s.local} aria-hidden="true">
      {kind === 'sparkle' && r.map(([x, y, d], i) => (
        <span key={i} className={s.spark} style={{ left: `${8 + x * 84}%`, top: `${6 + y * 60}%`, '--d': `${1.2 + d * 1.4}s`, '--w': `${-d * 2}s` } as CSSProperties} />
      ))}
      {kind === 'zzz' && [0, 1, 2].map((i) => (
        <span key={i} className={s.zzz} style={{ fontSize: `${14 + i * 6}px`, '--w': `${i * 1}s`, '--x': `${16 + i * 8}px` } as CSSProperties}>z</span>
      ))}
      {kind === 'hearts' && r.slice(0, 4).map(([x, , d], i) => (
        <span key={i} className={s.heart} style={{ left: `${30 + x * 40}%`, '--d': `${2.2 + d}s`, '--w': `${i * 0.7}s`, '--x': `${(x - 0.5) * 50}px` } as CSSProperties} />
      ))}
    </span>
  );
}

/** The mascot as it reacts: its first motion, then calm, the first one again every `repeat` ms. */
function Figure({ reaction, id, svgRef }: { reaction: Reaction; id: string; svgRef?: React.Ref<SVGSVGElement> }) {
  const first = reaction.look.motion;
  const [phase, setPhase] = useState({ n: 0, moving: true });
  useEffect(() => {
    if (ONGOING.has(first)) return;
    const timers: number[] = [window.setTimeout(() => setPhase((p) => ({ ...p, moving: false })), 1000)];
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
    <svg ref={svgRef} viewBox="-6 -18 52 56" className={`spr ${s.figure}`} shapeRendering="crispEdges" aria-hidden="true">
      <MascotFigure look={look} motionKey={`${id}-${phase.n}`} wear={reaction.wear} />
    </svg>
  );
}

function CountUp({ value, tag, reduced }: { value: Extract<Value, { kind: 'count' }>; tag: string; reduced: boolean }) {
  const from = value.from ?? 0;
  const [counted, setShown] = useState(from);
  const shown = reduced ? value.n : counted;
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const start = performance.now() + 380;
    const span = Math.abs(value.n - from);
    const duration = span < 5 ? 600 : span < 50 ? 1000 : 1500;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      // Fast at first, slowing down into the figure.
      const eased = p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setShown(from + (value.n - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value.n, from, reduced]);
  const digits = value.decimals ?? 0;
  const text = new Intl.NumberFormat(tag, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(digits === 0 ? Math.round(shown) : shown);
  return <>{value.prefix}{text}{value.suffix}</>;
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

  // The answers of a try (`attempt`); undefined while it is under way.
  const [pokyhResult, setPokyhResult] = useState<{ attempt: number; value: RecapPokyh | null } | null>(null);
  const [untisResult, setUntisResult] = useState<{ attempt: number; value: UntisRecap | null; failed: boolean } | null>(null);
  const [progress, setProgress] = useState<RecapProgress | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [shareNote, setShareNote] = useState<string | null>(null);
  // Where the card flies to as it closes: the banner in the top bar.
  const [dock, setDock] = useState<{ x: number; y: number; scale: number } | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const mascotSvg = useRef<SVGSVGElement>(null);
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
  }), [recap, firstName, sections, untis, pokyh]);
  const slides = useMemo(() => {
    const all = buildStory(input, fmt);
    return ready && !nothing ? all : all.slice(0, 1);
  }, [input, fmt, ready, nothing]);
  const items = useMemo(() => summaryItems(input, fmt), [input, fmt]);
  const at = Math.min(index, slides.length - 1);
  const slide = slides[at]!;
  const theme = THEMES[slide.theme];
  const reaction = REACTIONS[slide.mood];
  const last = at === slides.length - 1 && slides.length > 1;

  useEffect(() => {
    if (!last || finished.current || preview) return;
    finished.current = true;
    void markRecapView(recap.id, true);
  }, [last, recap.id, preview]);

  // Closing sends the card into the banner beside the search, which bumps as it lands.
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
      window.setTimeout(() => window.dispatchEvent(new Event(RECAP_DOCKED_EVENT)), 560);
    }
    requestAnimationFrame(() => onClose());
  }, [onClose, reduced]);

  const go = useCallback((step: 1 | -1) => {
    if (step === 1 && (!ready || nothing)) return;
    setIndex((i) => {
      const next = Math.min(slides.length - 1, Math.max(0, i + step));
      if (next !== i) setDir(step);
      return next;
    });
  }, [ready, nothing, slides.length]);

  // Keys: → Space Enter on, ← back, Esc closes. Focus stays in the story.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    card.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight' || ((e.key === ' ' || e.key === 'Enter') && !(e.target instanceof HTMLButtonElement))) { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'Tab' && card.current) {
        const focusable = [...card.current.querySelectorAll<HTMLElement>('button:not([disabled])')];
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

  const onPointerDown = (e: ReactPointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY, moved: false }; };
  const onPointerUp = (e: ReactPointerEvent) => {
    const start = swipe.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { start.moved = true; go(dx < 0 ? 1 : -1); }
    else if (dy > 110 && dy > Math.abs(dx)) { start.moved = true; close(); }
  };
  // A tap on the left third goes back, anywhere else on; buttons do their own.
  const onClick = (e: React.MouseEvent) => {
    if (swipe.current?.moved) { swipe.current = null; return; }
    if ((e.target as HTMLElement).closest('button')) return;
    const rect = card.current?.getBoundingClientRect();
    if (!rect) return;
    go(e.clientX < rect.left + rect.width * 0.3 ? -1 : 1);
  };

  async function share() {
    const result = await shareSummary({
      title: recap.title,
      period: `${fmt.day(recap.periodFrom)} – ${fmt.day(recap.periodTo)}`,
      items: items.map((i) => ({ label: t(i.label), value: i.value })),
      thanks: t('summaryThanks'),
      theme,
      mascot: mascotSvg.current,
      fileName: 'pokyh-recap.png',
    });
    if (result === 'saved') {
      setShareNote(t('shareSaved'));
      window.setTimeout(() => setShareNote(null), 2200);
    }
  }

  const say = (x?: Text) => (x ? t(x.key, x.vars) : '');
  const introBody: Text[] = [...(slide.body ?? [])];
  if (slide.layout === 'intro' && nothing) introBody.push({ key: 'errorAll' });
  else if (slide.layout === 'intro' && untisFailed) introBody.push({ key: 'errorUntis' });

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.085, delayChildren: reduced ? 0 : 0.12 } },
    exit: (d: number) => (reduced
      ? { opacity: 0, transition: { duration: 0.2 } }
      : { opacity: 0, y: d > 0 ? -34 : 34, filter: 'blur(8px)', transition: { duration: 0.32, ease: EASE_IN } }),
  };
  const item: Variants = {
    hidden: (d: number) => (reduced ? { opacity: 0 } : { opacity: 0, y: d > 0 ? 28 : -28, filter: 'blur(12px)' }),
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: reduced ? 0.25 : 0.72, ease: EASE_OUT } },
  };
  const big: Variants = {
    hidden: (d: number) => (reduced ? { opacity: 0 } : { opacity: 0, y: d > 0 ? 36 : -36, scale: 0.9, filter: 'blur(14px)' }),
    show: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: reduced ? { duration: 0.25 } : { type: 'spring', stiffness: 170, damping: 19, mass: 0.9 } },
  };

  const listMax = Math.max(1, ...(slide.list ?? []).map((r) => r.value));
  const meterSpan = slide.meter ? Math.max(40, slide.meter.value * 1.25) : 40;
  const loadingShare = progress && progress.total > 0 ? progress.done / progress.total : 0;
  const cardStyle = { '--rc-accent': theme.accent, '--rc-accent-ink': theme.accentInk } as CSSProperties;

  return (
    <motion.div
      className={s.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3 } }}
      exit={{ opacity: 0, transition: { duration: dock ? 0.5 : 0.28, delay: 0.05 } }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <SpritePalette />
      <motion.div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-label={`${t('storyLabel')}: ${recap.title}`}
        tabIndex={-1}
        className={s.card}
        style={cardStyle}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: reduced ? { duration: 0.2 } : { type: 'spring', stiffness: 220, damping: 26 } }}
        exit={reduced
          ? { opacity: 0 }
          : dock
            ? { x: dock.x, y: dock.y, scale: dock.scale, borderRadius: 400, opacity: [1, 1, 0], transition: { duration: 0.56, ease: [0.6, 0, 0.25, 1], opacity: { duration: 0.56, times: [0, 0.75, 1] } } }
            : { opacity: 0, scale: 0.96, y: 60, transition: { duration: 0.28, ease: EASE_IN } }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={onClick}
      >
        {/* The background's colours cross over from page to page. */}
        <AnimatePresence initial={false}>
          <motion.div
            key={slide.theme}
            className={s.bg}
            style={{ background: themeBackground(theme) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: reduced ? 0.2 : 0.9, ease: 'easeInOut' } }}
            exit={{ opacity: 0, transition: { duration: reduced ? 0.2 : 0.9, ease: 'easeInOut', delay: 0.15 } }}
          />
        </AnimatePresence>
        <div className={s.aurora} aria-hidden="true" />
        <div className={s.grain} aria-hidden="true" />
        <AnimatePresence>{reaction.field && !reduced && <Field key={`${slide.id}-${reaction.field}`} kind={reaction.field} seed={slide.id} />}</AnimatePresence>

        <div className={s.top}>
          <div className={s.bars} aria-hidden="true">
            {slides.length > 1 && slides.map((x, i) => (
              <span key={x.id} className={s.bar} data-state={i < at ? 'done' : i === at ? 'now' : 'next'}><span /></span>
            ))}
          </div>
          <button type="button" className={s.close} onClick={close} aria-label={t('close')}>
            <X size={19} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <p className="visually-hidden" aria-live="polite">{slides.length > 1 ? t('slideOf', { n: at + 1, total: slides.length }) : ''}</p>

        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={slide.id}
            className={s.page}
            data-layout={slide.layout}
            variants={container}
            custom={dir}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {slide.lead && <motion.p variants={item} custom={dir} className={s.lead}>{say(slide.lead)}</motion.p>}
            {slide.value && (
              <motion.p variants={big} custom={dir} className={s.value} data-kind={slide.value.kind}>
                {slide.value.kind === 'count' ? <CountUp value={slide.value} tag={tag} reduced={reduced} /> : slide.value.text}
              </motion.p>
            )}
            {slide.unit && <motion.p variants={item} custom={dir} className={s.unit}>{say(slide.unit)}</motion.p>}

            {slide.meter && (
              <motion.div variants={item} custom={dir} className={s.meter} aria-hidden="true">
                <div className={s.meterTrack}>
                  {/* The whole scale is drawn and uncovered up to the rate, so its colours stay put. */}
                  <motion.div
                    className={s.meterFill}
                    initial={{ clipPath: 'inset(0 100% 0 0 round 99px)' }}
                    animate={{
                      clipPath: `inset(0 ${100 - Math.max(slide.meter.value > 0 ? 2 : 0, (slide.meter.value / meterSpan) * 100)}% 0 0 round 99px)`,
                      transition: { delay: reduced ? 0 : 0.55, duration: reduced ? 0 : 1.3, ease: EASE_OUT },
                    }}
                  />
                </div>
                <span className={s.meterLimit} style={{ left: `${(slide.meter.limit / meterSpan) * 100}%` }} />
                <span className={s.meterLabel} style={{ left: `${(slide.meter.limit / meterSpan) * 100}%` }}>{t('rateLimit')}</span>
              </motion.div>
            )}

            {slide.list && slide.list.length > 0 && (
              <motion.div variants={item} custom={dir} className={s.list}>
                {slide.list.map((row, i) => (
                  <div key={`${row.labelKey ?? row.label}-${i}`} className={s.row}>
                    <div className={s.rowHead}>
                      <span>{row.labelKey ? t(row.labelKey) : row.label}</span>
                      <span>{row.display}</span>
                    </div>
                    <div className={s.track}>
                      <motion.div
                        className={s.fill}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: row.value / listMax, transition: { delay: reduced ? 0 : 0.45 + i * 0.09, duration: reduced ? 0 : 0.9, ease: EASE_OUT } }}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {slide.layout === 'summary' && (
              <>
                <motion.p variants={item} custom={dir} className={s.lead}>{fmt.day(recap.periodFrom)} – {fmt.day(recap.periodTo)}</motion.p>
                <motion.div variants={item} custom={dir} className={s.summary}>
                  {items.map((x) => (
                    <div key={x.label} className={s.stat}>
                      <span className={s.statValue} data-long={x.value.length > 7 ? '' : undefined}>{x.value}</span>
                      <span className={s.statLabel}>{t(x.label)}</span>
                    </div>
                  ))}
                </motion.div>
                <motion.p variants={item} custom={dir} className={s.thanks}>{shareNote ?? t('summaryThanks')}</motion.p>
              </>
            )}

            {(slide.layout === 'intro' ? introBody : slide.body ?? []).map((b, i) => (
              <motion.p key={`${b.key}-${i}`} variants={item} custom={dir} className={s.body}>{say(b)}</motion.p>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* One mascot for the whole story: it walks to its place on each page. */}
        <motion.div
          layout={!reduced}
          className={s.mascot}
          data-place={slide.place}
          data-layout={slide.layout}
          transition={{ layout: { type: 'spring', stiffness: 110, damping: 18, mass: 1 } }}
        >
          <span className={s.glow} aria-hidden="true" />
          <AnimatePresence>
            {slide.quip && (
              <motion.span
                key={slide.id}
                className={s.bubble}
                style={{ transformOrigin: '50% 100%' }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: reduced ? { duration: 0.2 } : { delay: 0.6, type: 'spring', stiffness: 460, damping: 22 } }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.14 } }}
              >
                {say(slide.quip)}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.div
            key={slide.mood}
            initial={reduced ? false : { scale: 0.82, y: 6 }}
            animate={{ scale: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 14 } }}
            style={{ transformOrigin: '50% 90%' }}
          >
            {reaction.local && !reduced && <Local kind={reaction.local} seed={slide.id} />}
            <Figure reaction={reaction} id={slide.id} svgRef={slide.layout === 'summary' ? mascotSvg : undefined} />
          </motion.div>
        </motion.div>

        <div className={s.bottom}>
          {slide.layout === 'summary' ? (
            <>
              <button type="button" className={s.back} onClick={() => { setDir(-1); setIndex(0); finished.current = true; }} aria-label={t('replay')}>
                <ArrowCounterClockwise size={21} weight="bold" aria-hidden="true" />
              </button>
              <button type="button" className={s.quiet} onClick={() => void share()}>
                <span className="inline-flex items-center justify-center gap-2"><ShareNetwork size={18} weight="bold" aria-hidden="true" />{t('share')}</span>
              </button>
              <button type="button" className={s.next} style={{ background: theme.accent, color: theme.accentInk }} onClick={close}>
                {t('done')}
              </button>
            </>
          ) : (
            <>
              <button type="button" className={s.back} onClick={() => go(-1)} disabled={at === 0} aria-label={t('back')}>
                <CaretLeft size={22} weight="bold" aria-hidden="true" />
              </button>
              {nothing ? (
                <button type="button" className={s.next} style={{ background: theme.accent, color: theme.accentInk }} onClick={() => setAttempt((n) => n + 1)}>
                  {t('retry')}
                </button>
              ) : (
                <button
                  type="button"
                  className={s.next}
                  style={{ background: theme.accent, color: theme.accentInk }}
                  data-loading={ready ? undefined : ''}
                  disabled={!ready}
                  aria-busy={!ready}
                  onClick={() => go(1)}
                >
                  {!ready && <span className={s.nextProgress} style={{ transform: `scaleX(${loadingShare})` }} aria-hidden="true" />}
                  {!ready
                    ? (progress && progress.total > 0 ? t('loading', { done: progress.done, total: progress.total }) : t('loadingShort'))
                    : at === 0 ? t('start') : t('next')}
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
