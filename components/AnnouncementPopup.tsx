'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Megaphone, X } from 'lucide-react';
import { fetchDuePopups, markSeen, type ActivePopup, type PopupAudience } from '@/lib/popups';
import { useT } from '@/providers/LocaleProvider';
import { uiDict } from '@/lib/i18n/dictionaries/ui';
import { commonDict } from '@/lib/i18n/dictionaries/common';

// Shows admin announcement popups as one stack, for signed-in users inside
// the app and for guests on the public pages (the admin picks the audience).
// "Weiter" steps through the stack, the dots show where you are and the last
// popup ends with "Fertig". Closing (X, backdrop, Esc) closes the whole stack
// and counts every popup in it as seen, so the ones skipped by closing don't
// come back on the next page load or sign-in.
// `html` is rendered and sanitised by the backend (services/popupRender.ts);
// its content styles live in globals.css under `.popup-content`.

const RECHECK_MS = 10 * 60 * 1000;
// Beyond this the dots stop being countable at a glance — show "3 / 9" instead.
const MAX_DOTS = 7;

const keyOf = (p: ActivePopup) => `${p.id}:${p.revision}`;

export default function AnnouncementPopup({ audience, paused = false }: { audience: PopupAudience; paused?: boolean }) {
  const [stack, setStack] = useState<ActivePopup[]>([]);
  const [index, setIndex] = useState(0);
  // null until the user moves through the stack, so opening doesn't also slide the content.
  const [direction, setDirection] = useState<'next' | 'back' | null>(null);
  const t = useT(uiDict);
  const tc = useT(commonDict);
  const lastCheck = useRef(0);
  const dialog = useRef<HTMLDivElement>(null);
  const current = stack[index];
  const isOpen = !paused && !!current;
  const isLast = index >= stack.length - 1;

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
      .catch(() => { /* popups are optional — never surface a failure */ });
  }, [audience, paused]);

  useEffect(() => {
    check();
    // Long-lived tabs still get the next daily slot when the user comes back.
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [check]);

  // Counts as seen the moment it is displayed, not when it is dismissed.
  useEffect(() => {
    if (isOpen) markSeen([current]);
  }, [isOpen, current]);

  useEffect(() => {
    if (isOpen) dialog.current?.focus({ preventScroll: true });
  }, [isOpen]);

  const close = useCallback(() => {
    markSeen(stack);
    setStack([]);
    setIndex(0);
    setDirection(null);
  }, [stack]);

  const goTo = useCallback((i: number) => {
    if (i === index || i < 0 || i >= stack.length) return;
    setDirection(i < index ? 'back' : 'next');
    setIndex(i);
  }, [index, stack.length]);

  const next = useCallback(() => (isLast ? close() : goTo(index + 1)), [isLast, close, goTo, index]);

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
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:px-4 sm:py-8 fade-backdrop"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
      onClick={close}
    >
      <div className="relative w-full sm:max-w-lg slide-up" onClick={(e) => e.stopPropagation()}>
        {/* The popups still waiting peek out above the card. */}
        <div aria-hidden className="popup-layer absolute inset-x-10 -top-[18px] h-10 rounded-t-[24px]" style={{ opacity: waiting >= 2 ? 0.55 : 0 }} />
        <div aria-hidden className="popup-layer absolute inset-x-5 -top-[9px] h-10 rounded-t-[26px]" style={{ opacity: waiting >= 1 ? 1 : 0 }} />

        <div
          className="relative max-h-[90dvh] overflow-hidden flex flex-col outline-none rounded-t-[28px] sm:rounded-[28px]"
          style={{ background: 'var(--app-surface)', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}
          ref={dialog}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcement-title"
        >
          <div className="flex items-start gap-3 px-5 pt-5 pb-3 flex-shrink-0">
            <div key={keyOf(current)} className={`flex-1 min-w-0 ${step}`}>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>
                <Megaphone size={12} /> {t('popupLabel')}
              </p>
              <h2 id="announcement-title" className="text-[19px] font-bold leading-snug" style={{ color: 'var(--app-text-primary)' }}>
                {current.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              className="popup-icon-btn w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
              aria-label={tc('close')}
            >
              <X size={18} />
            </button>
          </div>

          <div key={keyOf(current)} className={`flex-1 overflow-y-auto px-5 min-h-0 ${step}`}>
            <div className="popup-content" dangerouslySetInnerHTML={{ __html: current.html }} />
          </div>

          {/* Back · dots (centred) · Weiter/Fertig */}
          <div
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 pt-4 flex-shrink-0"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
          >
            <div className="justify-self-start">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  className="popup-ghost-btn h-11 pl-2 pr-3 rounded-xl inline-flex items-center gap-0.5 text-[14px] font-semibold"
                  aria-label={tc('back')}
                >
                  <ChevronLeft size={18} />
                  <span className="hidden min-[380px]:inline">{tc('back')}</span>
                </button>
              )}
            </div>

            {stack.length > MAX_DOTS ? (
              <p className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--app-text-secondary)' }} aria-live="polite">
                {index + 1} / {stack.length}
              </p>
            ) : stack.length > 1 ? (
              <div className="flex items-center">
                {stack.map((p, i) => (
                  <button
                    key={keyOf(p)}
                    type="button"
                    onClick={() => goTo(i)}
                    className="popup-dot-hit h-8 px-[3px] flex items-center"
                    aria-label={t('popupStep', { n: i + 1, total: stack.length })}
                    aria-current={i === index ? 'step' : undefined}
                  >
                    <span className="popup-dot" data-active={i === index} />
                  </button>
                ))}
              </div>
            ) : <span />}

            <button
              type="button"
              onClick={next}
              className="popup-primary-btn justify-self-end h-11 pl-5 pr-4 rounded-xl inline-flex items-center gap-1.5 text-[15px] font-semibold"
            >
              {isLast ? t('popupDone') : t('popupNext')}
              {isLast ? <Check size={17} strokeWidth={2.5} /> : <ChevronRight size={18} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
