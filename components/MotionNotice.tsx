'use client';

import { useEffect, useState } from 'react';
import { Sparkle, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { useT } from '@/providers/LocaleProvider';
import { motionDict, type MotionKey } from '@/lib/i18n/dictionaries/motion';
import { COOKIE_CONSENT_EVENT, cookieChoiceNeeded } from '@/lib/cookie-consent';

// Devices with "reduce motion" switched on get POKYH without its animations,
// on purpose: every page is complete and still (lib/motion.ts, the
// prefers-reduced-motion rules in the stylesheets). Plenty of people have the
// setting on without knowing (a system default, a battery saver), so this
// notice says what they are seeing and where the setting is, the way
// plattnericus.dev does it.
//
// Shown again on every visit, as long as the setting is on, and only quieted
// for this tab once closed: whoever turns the setting back on never sees a
// stale "closed" flag, and whoever keeps it on is not asked each page. It waits
// for the cookie banner, never moves in (it is about motion), and when the
// setting changes while the page is open a public page reloads, since its
// scroll scenes are only set up once on load; the app's motion follows the
// setting by itself.

const QUERY = '(prefers-reduced-motion: reduce)';
const DISMISSED_KEY = 'pokyh_motion_notice_closed';

type Os = 'windows' | 'mac' | 'ios' | 'android' | 'other';

function detectOs(): Os {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  // iPadOS asks for the desktop site and calls itself a Mac, but has touch.
  if (/macintosh|mac os x/i.test(ua)) return navigator.maxTouchPoints > 1 ? 'ios' : 'mac';
  if (/windows/i.test(ua)) return 'windows';
  return 'other';
}

function dismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export default function MotionNotice({ paused = false, inApp = false }: { paused?: boolean; inApp?: boolean }) {
  const t = useT(motionDict);
  const [os, setOs] = useState<Os | null>(null);
  const [cookieOpen, setCookieOpen] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const sync = () => setOs(mq.matches && !dismissed() ? detectOs() : null);
    // Read after hydration: the server knows neither the setting nor the storage.
    const first = window.requestAnimationFrame(() => {
      setCookieOpen(cookieChoiceNeeded());
      sync();
    });

    const onChange = () => {
      // The app's motion follows the setting live; a public page's scroll
      // scenes are only built on load, so it starts over.
      if (!document.getElementById('app-main')) window.location.reload();
      else sync();
    };
    const onChoice = () => setCookieOpen(false);
    mq.addEventListener('change', onChange);
    window.addEventListener(COOKIE_CONSENT_EVENT, onChoice);
    return () => {
      window.cancelAnimationFrame(first);
      mq.removeEventListener('change', onChange);
      window.removeEventListener(COOKIE_CONSENT_EVENT, onChoice);
    };
  }, []);

  if (!os || paused || cookieOpen) return null;

  const close = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Storage blocked: closed for this page view only.
    }
    setOs(null);
  };

  return (
    <div
      role="region"
      aria-label={t('label')}
      data-motion-notice=""
      className={`fixed inset-x-3 z-[70] sm:inset-x-auto sm:right-6 sm:w-[min(440px,calc(100vw-48px))] ${
        inApp ? 'bottom-[calc(72px+var(--safe-bottom)+12px)] lg:bottom-6' : 'bottom-[max(12px,var(--safe-bottom))] sm:bottom-6'
      }`}
    >
      <div className="squircle flex gap-3.5 rounded-[24px] bg-surface p-4 text-ink shadow-[var(--shadow-float)] sm:p-5">
        <span aria-hidden="true" className="hidden size-10 shrink-0 place-items-center rounded-[13px] bg-periwinkle text-periwinkle-ink sm:grid">
          <Sparkle size={20} weight="bold" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="pt-0.5 text-[15.5px] font-extrabold leading-snug tracking-[-0.02em]">{t('title')}</p>
            <button
              type="button"
              onClick={close}
              aria-label={t('close')}
              className="-mr-1.5 -mt-1.5 grid size-9 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-inset hover:text-ink"
            >
              <X size={17} weight="bold" />
            </button>
          </div>
          <p className="mt-1.5 text-[14px] leading-[1.55] text-ink-2">{t('body')}</p>
          <p className="mt-2.5 text-[14px] leading-[1.55] text-ink-2">
            {t('howTo')} <span className="font-semibold text-ink">{t(os as MotionKey)}</span>
          </p>
          <p className="mt-1.5 text-[13px] leading-[1.5] text-ink-3">{t('reload')}</p>
          <Button variant="quiet" size="sm" onClick={close} className="mt-3.5">{t('ok')}</Button>
        </div>
      </div>
    </div>
  );
}
