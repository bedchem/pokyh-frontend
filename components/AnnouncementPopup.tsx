'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CaretLeft, CaretRight, Check, Megaphone, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { fetchDuePopups, markSeen, type ActivePopup, type PopupAudience } from '@/lib/popups';
import { isPageCovered, subscribePageCover } from '@/lib/page-cover';
import { useT } from '@/providers/LocaleProvider';
import { uiDict } from '@/lib/i18n/dictionaries/ui';
import { commonDict } from '@/lib/i18n/dictionaries/common';

// Shows admin announcement popups as one stack, for signed-in users inside
// the app and for guests on the public pages (the admin picks the audience).
// "Weiter" steps through the stack, the dots show where you are and the last
// popup ends with "Fertig".
//
// Every popup has to be on screen for MIN_VIEW_MS first: until then a countdown
// sits where the X goes and nothing closes or skips it (X, backdrop, Esc,
// Weiter/Fertig, later dots). Going back to an earlier popup stays possible.
// A popup counts as seen once it has been on screen that long; closing the
// stack counts every popup in it as seen, so skipped ones don't come back on
// the next page load or sign-in.
//
// The stack only opens once the page has stayed put for SETTLE_MS (and no intro
// cover is up), and it steps aside the moment a navigation starts. Redirects
// right after a page load (expired session → /login, the installed app skipping
// the landing page) would otherwise flash a popup and take it away again.
//
// `html` is rendered and sanitised by the backend (services/popupRender.ts);
// its content styles live in globals.css under `.popup-content`. The card is
// built like the shared sheets (components/ui/Sheet.tsx) and buttons.

const RECHECK_MS = 10 * 60 * 1000;
const SETTLE_MS = 1500;
const MIN_VIEW_MS = 3000;
// Beyond this the dots stop being countable at a glance, show "3 / 9" instead.
const MAX_DOTS = 7;
const RING_R = 15;
const RING_C = 2 * Math.PI * RING_R;

const keyOf = (p: ActivePopup) => `${p.id}:${p.revision}`;

// The parts of the Navigation API's NavigateEvent used below (not in every TS DOM lib yet).
type NavigateEventLike = Event & { destination?: { url: string; sameDocument: boolean } };

export default function AnnouncementPopup({ audience, route, paused = false }: {
  audience: PopupAudience;
  route: string;
  paused?: boolean;
}) {
  const [stack, setStack] = useState<ActivePopup[]>([]);
  const [index, setIndex] = useState(0);
  // null until the user moves through the stack, so opening doesn't also slide the content.
  const [direction, setDirection] = useState<'next' | 'back' | null>(null);
  // The route the page has settled on; while it differs from settleKey the stack is held back.
  const [settledKey, setSettledKey] = useState<string | null>(null);
  // Popups that have been on screen for MIN_VIEW_MS in this stack.
  const [viewed, setViewed] = useState<ReadonlySet<string>>(() => new Set());
  const [countdown, setCountdown] = useState<{ key: string; seconds: number } | null>(null);
  const covered = useSyncExternalStore(subscribePageCover, isPageCovered, () => false);
  const t = useT(uiDict);
  const tc = useT(commonDict);
  const lastCheck = useRef(0);
  const overlay = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  // True from the start of a navigation away until the page has settled again.
  const away = useRef(false);

  const settleKey = paused || covered ? null : route;
  const current = stack[index];
  const currentKey = current ? keyOf(current) : null;
  const isOpen = settleKey !== null && settledKey === settleKey && !!current;
  const isLast = index >= stack.length - 1;
  const locked = currentKey !== null && !viewed.has(currentKey);
  const secondsLeft = countdown?.key === currentKey ? countdown.seconds : Math.ceil(MIN_VIEW_MS / 1000);

  const check = useCallback(() => {
    if (paused || Date.now() - lastCheck.current < RECHECK_MS) return;
    lastCheck.current = Date.now();
    fetchDuePopups(audience)
      .then((due) => {
        if (due.length === 0) return;
        setStack((s) => {
          const known = new Set(s.map(keyOf));
          return [...s, ...due.filter((p) => !known.has(keyOf(p)))];
        });
      })
      .catch(() => { /* popups are optional - never surface a failure */ });
  }, [audience, paused]);

  useEffect(() => {
    check();
    // Long-lived tabs still get the next daily slot when the user comes back.
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [check]);

  // Settle: open only after the page has stayed on this route for SETTLE_MS, and
  // step aside as soon as a navigation to another page starts.
  useEffect(() => {
    if (settleKey === null) return;
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        away.current = false;
        overlay.current?.style.removeProperty('visibility');
        setSettledKey(settleKey);
      }, SETTLE_MS);
    };
    const leave = () => {
      window.clearTimeout(timer);
      // Hidden and paused right away: a router navigation holds the state update
      // below back until the next page has loaded.
      away.current = true;
      overlay.current?.style.setProperty('visibility', 'hidden');
      // The router pushes history inside a React insertion effect, and the
      // Navigation API fires `navigate` synchronously from there, where React
      // forbids state updates: update once that commit has finished.
      queueMicrotask(() => { if (away.current) setSettledKey(null); });
    };
    const onNavigate = (e: Event) => {
      const { destination } = e as NavigateEventLike;
      if (!destination || new URL(destination.url).pathname === window.location.pathname) return;
      leave();
      // A completed in-app move re-arms through the route change; this covers a cancelled one.
      if (destination.sameDocument) arm();
    };
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) arm(); };
    const navigation = (window as unknown as { navigation?: EventTarget }).navigation;
    arm();
    navigation?.addEventListener('navigate', onNavigate);
    window.addEventListener('pokyh-session-expired', leave);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.clearTimeout(timer);
      navigation?.removeEventListener('navigate', onNavigate);
      window.removeEventListener('pokyh-session-expired', leave);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [settleKey]);

  // Minimum viewing time. requestAnimationFrame doesn't run in background tabs,
  // so only time the popup is really visible counts; the per-frame cap keeps the
  // first frame after coming back from jumping ahead.
  useEffect(() => {
    if (!isOpen || !locked || !current) return;
    const popup = current;
    const key = keyOf(popup);
    let elapsed = 0;
    let last: number | null = null;
    let shown = -1;
    let frame = requestAnimationFrame(function tick(now) {
      if (last !== null && !away.current) elapsed += Math.min(now - last, 100);
      last = now;
      ring.current?.style.setProperty('stroke-dashoffset', String(RING_C * Math.min(elapsed / MIN_VIEW_MS, 1)));
      if (elapsed >= MIN_VIEW_MS) {
        markSeen([popup]);
        setViewed((v) => new Set(v).add(key));
        return;
      }
      const seconds = Math.ceil((MIN_VIEW_MS - elapsed) / 1000);
      if (seconds !== shown) {
        shown = seconds;
        setCountdown({ key, seconds });
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, locked, current]);

  useEffect(() => {
    if (isOpen) dialog.current?.focus({ preventScroll: true });
  }, [isOpen]);

  const close = useCallback(() => {
    if (locked) return;
    markSeen(stack);
    setStack([]);
    setIndex(0);
    setDirection(null);
    setViewed(new Set());
    setCountdown(null);
  }, [locked, stack]);

  // Back is always allowed; forward only to popups already viewed, or to the
  // next one once the current one has been viewed.
  const canReach = useCallback((i: number) => {
    if (i < 0 || i >= stack.length || i === index) return false;
    return i < index || viewed.has(keyOf(stack[i])) || (i === index + 1 && !locked);
  }, [stack, index, viewed, locked]);

  const goTo = useCallback((i: number) => {
    if (!canReach(i)) return;
    setDirection(i < index ? 'back' : 'next');
    setCountdown(null);
    setIndex(i);
  }, [canReach, index]);

  const next = useCallback(() => {
    if (locked) return;
    if (isLast) close();
    else goTo(index + 1);
  }, [locked, isLast, close, goTo, index]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') goTo(index + 1);
      else if (e.key === 'ArrowLeft') goTo(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close, goTo, index]);

  if (!isOpen) return null;

  const waiting = stack.length - 1 - index;
  const step = direction === 'next' ? 'popup-step-next' : direction === 'back' ? 'popup-step-back' : '';

  return (
    <div
      ref={overlay}
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
      onClick={close}
    >
      <div className="absolute inset-0 bg-[#0b0b0d]/45 fade-backdrop" aria-hidden="true" />
      <div className="relative w-full sm:max-w-[520px] slide-up" onClick={(e) => e.stopPropagation()}>
        {/* The popups still waiting peek out above the card. */}
        <div aria-hidden className="popup-layer absolute inset-x-10 -top-[18px] h-10 rounded-t-[24px]" style={{ opacity: waiting >= 2 ? 0.4 : 0 }} />
        <div aria-hidden className="popup-layer absolute inset-x-5 -top-[9px] h-10 rounded-t-[26px]" style={{ opacity: waiting >= 1 ? 0.75 : 0 }} />

        <div
          className="squircle relative flex max-h-[90dvh] flex-col overflow-hidden rounded-t-[28px] bg-surface text-ink shadow-[var(--shadow-float)] outline-none sm:rounded-[28px]"
          ref={dialog}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcement-title"
        >
          <div className="flex flex-shrink-0 items-start gap-4 px-6 pb-3 pt-6">
            <div key={currentKey} className={`min-w-0 flex-1 ${step}`}>
              <p className="mb-1.5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-accent-ink">
                <Megaphone size={16} weight="fill" aria-hidden="true" /> {t('popupLabel')}
              </p>
              <h2 id="announcement-title" className="text-[22px] font-extrabold leading-tight tracking-[-0.03em] [overflow-wrap:anywhere]">
                {current.title}
              </h2>
            </div>
            {locked ? (
              <div
                role="timer"
                aria-label={t('popupWait', { n: secondsLeft })}
                className="relative -mr-1 grid size-10 flex-shrink-0 place-items-center rounded-full bg-inset"
              >
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden>
                  <circle cx="18" cy="18" r={RING_R} fill="none" strokeWidth="2.5" style={{ stroke: 'var(--line)' }} />
                  <circle
                    ref={ring}
                    cx="18"
                    cy="18"
                    r={RING_R}
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={RING_C}
                    style={{ stroke: 'var(--accent)' }}
                  />
                </svg>
                <span className="relative text-[13px] font-bold tabular-nums" aria-hidden>
                  {secondsLeft}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={close}
                className="popup-fade -mr-2 -mt-1 grid size-10 flex-shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-inset hover:text-ink"
                aria-label={tc('close')}
              >
                <X size={20} weight="bold" />
              </button>
            )}
          </div>

          <div key={currentKey} className={`min-h-0 flex-1 overflow-y-auto px-6 pt-1 ${step}`}>
            <div className="popup-content" dangerouslySetInnerHTML={{ __html: current.html }} />
          </div>

          {/* Back · dots (centred) · Weiter/Fertig */}
          <div
            className="mt-5 grid flex-shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-line px-6 pt-4"
            style={{ paddingBottom: 'max(20px, var(--safe-bottom))' }}
          >
            <div className="justify-self-start">
              {index > 0 && (
                <Button variant="quiet" onClick={() => goTo(index - 1)} aria-label={tc('back')} className="pl-3 pr-4">
                  <CaretLeft size={17} weight="bold" aria-hidden="true" />
                  <span className="hidden min-[380px]:inline">{tc('back')}</span>
                </Button>
              )}
            </div>

            {stack.length > MAX_DOTS ? (
              <p className="text-[13px] font-semibold tabular-nums text-ink-2" aria-live="polite">
                {index + 1} / {stack.length}
              </p>
            ) : stack.length > 1 ? (
              <div className="flex items-center">
                {stack.map((p, i) => (
                  <button
                    key={keyOf(p)}
                    type="button"
                    onClick={() => goTo(i)}
                    disabled={i !== index && !canReach(i)}
                    className="popup-dot-hit flex h-8 items-center px-[3px]"
                    aria-label={t('popupStep', { n: i + 1, total: stack.length })}
                    aria-current={i === index ? 'step' : undefined}
                  >
                    <span className="popup-dot" data-active={i === index} />
                  </button>
                ))}
              </div>
            ) : <span />}

            <Button onClick={next} disabled={locked} className="justify-self-end pl-5 pr-4">
              {isLast ? t('popupDone') : t('popupNext')}
              {isLast ? <Check size={17} weight="bold" aria-hidden="true" /> : <CaretRight size={17} weight="bold" aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
