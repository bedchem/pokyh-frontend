'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence } from 'framer-motion';
import MascotFigure, { type Look } from '@/components/pixel/MascotFigure';
import { SpritePalette } from '@/components/pixel/SceneSvg';
import { useSession } from '@/providers/SessionProvider';
import { useRoutePath, useT } from '@/providers/LocaleProvider';
import { recapDict } from '@/lib/i18n/dictionaries/recap';
import { isPageCovered } from '@/lib/page-cover';
import { RECAP_DOCKED_EVENT, closeRecap, dueAutoRecap, forgetRecaps, openRecap, recapServerState, recapState, refreshRecaps, subscribeRecaps } from '@/lib/recap';
import { loadUntisRecap } from '@/lib/recap-data';
import s from './recap.module.css';

// Recaps in the app frame (components/app/AppShell.tsx): the host loads the
// account's recaps, opens one by itself after signing in as long as no
// device of the account has shown it (the server keeps that), and shows the
// story; the banner beside the search in the top bar opens it again. While
// a recap waits, its WebUntis figures are loaded in the background, so the
// story usually starts at once.

const RecapStory = dynamic(() => import('./RecapStory'), { ssr: false });

const REFRESH_MS = 15 * 60_000;
/** The story opens by itself only once the page has been quiet this long. */
const SETTLE_MS = 2200;
const CHECK_MS = 600;

export function useRecaps() {
  return useSyncExternalStore(subscribeRecaps, recapState, recapServerState);
}

// Anything else asking for attention first: the cookie choice, a popup, a
// sheet, the privacy notice at sign-in.
function somethingElseOpen(): boolean {
  return isPageCovered() || !!document.querySelector('[role="dialog"], #privacy-banner-title');
}

export default function RecapHost() {
  const { user } = useSession();
  const { recaps, open } = useRecaps();
  const path = useRoutePath();
  const account = user?.username ?? null;
  const autoTried = useRef<string | null>(null);

  useEffect(() => {
    if (!account) { forgetRecaps(); return; }
    void refreshRecaps();
    const timer = window.setInterval(() => void refreshRecaps(), REFRESH_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') void refreshRecaps(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [account]);

  // The figures of the newest recap not watched to its end, ahead of time.
  const waiting = recaps?.find((r) => !r.finishedAt) ?? null;
  const studentId = user?.isUntisUser === false ? 0 : user?.studentId ?? 0;
  useEffect(() => {
    if (!waiting || !studentId || !waiting.sections.some((x) => x !== 'pokyh')) return;
    const timer = window.setTimeout(() => {
      loadUntisRecap(studentId, waiting.periodFrom, waiting.periodTo, waiting.sections).catch(() => { /* the story tries again */ });
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [waiting, studentId]);

  // Opens by itself once nothing else is on screen for a moment.
  useEffect(() => {
    if (!recaps || open || path === '/login') return;
    const due = dueAutoRecap(recaps);
    if (!due || autoTried.current === due.id) return;
    let quiet = 0;
    let timer = 0;
    const check = () => {
      quiet = somethingElseOpen() || document.visibilityState !== 'visible' ? 0 : quiet + CHECK_MS;
      if (quiet >= CHECK_MS * 3) {
        autoTried.current = due.id;
        openRecap(due.id);
        return;
      }
      timer = window.setTimeout(check, CHECK_MS);
    };
    timer = window.setTimeout(check, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [recaps, open, path]);

  const current = open ? recaps?.find((r) => r.id === open) ?? null : null;
  return <AnimatePresence>{current && <RecapStory key={current.id} recap={current} onClose={closeRecap} />}</AnimatePresence>;
}

const BANNER_LOOK: Look = { pose: { eyes: 'happy', look: [0, 0], mouth: 'grin', arms: 'wave' }, wave: true, motion: 'bob' };

function MiniMascot() {
  return (
    <svg viewBox="-2 -6 44 40" className="spr" shapeRendering="crispEdges" aria-hidden="true">
      <MascotFigure look={BANNER_LOOK} motionKey="banner" />
    </svg>
  );
}

/**
 * The recap in the top bar, beside the search: a banner on wider screens,
 * a round button with a turning ring (like a story) on phones. It bumps when
 * a closed story goes into it.
 */
export function RecapBanner() {
  const t = useT(recapDict);
  const { recaps, open } = useRecaps();
  const [bump, setBump] = useState(0);
  useEffect(() => {
    const onDocked = () => setBump((n) => n + 1);
    window.addEventListener(RECAP_DOCKED_EVENT, onDocked);
    return () => window.removeEventListener(RECAP_DOCKED_EVENT, onDocked);
  }, []);

  const recap = recaps?.[0];
  if (!recap) return null;
  const isNew = !recap.finishedAt;
  const label = `${isNew ? t('bannerNew') : t('bannerSeen')}: ${recap.title}`;
  const style = { visibility: open ? 'hidden' : undefined } as const;

  return (
    <>
      <SpritePalette />
      <button
        key={`wide-${bump}`}
        type="button"
        data-recap-banner=""
        onClick={() => openRecap(recap.id)}
        className={`${s.banner} ${recap.openedAt ? '' : s.bannerNew} hidden md:flex`}
        style={style}
        aria-label={label}
      >
        <span className={s.bannerFace}><MiniMascot /></span>
        <span className={s.bannerText}>
          <span>{isNew ? t('bannerNew') : t('bannerSeen')}</span>
          <small className="max-w-[220px] truncate">{isNew ? t('bannerOpen') : t('bannerAgain')} · {recap.title}</small>
        </span>
      </button>
      <button
        key={`ring-${bump}`}
        type="button"
        data-recap-banner=""
        onClick={() => openRecap(recap.id)}
        className={`${s.ring} ${isNew ? s.ringNew : ''} ${s.dock} md:hidden`}
        style={style}
        aria-label={label}
      >
        <MiniMascot />
      </button>
    </>
  );
}
