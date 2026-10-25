'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useT } from '@/providers/LocaleProvider';
import { frontpageDict } from '@/lib/i18n/dictionaries/frontpage';
import { prefersReducedMotion, useGsap } from '@/lib/motion';
import { schoolClock } from '@/lib/school-day';
import { useLenis } from '@/components/site/SmoothScroll';
import { finishIntro } from './shared';
import { INTRO_KEY } from './introKey';

// The curtain of the first visit: a greeting for the time of day at school,
// a counter to 100, then the night lifts away with a curved edge and the hero
// starts. Once per browser session; never for reduced motion. The inline
// script in the page hides it before the first paint on later visits.

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Decided once per page load, so a re-run of the effect cannot skip it.
let decision: boolean | null = null;
function shouldPlay(): boolean {
  if (decision !== null) return decision;
  let seen = false;
  try {
    seen = sessionStorage.getItem(INTRO_KEY) === '1';
    sessionStorage.setItem(INTRO_KEY, '1');
  } catch {
    seen = false;
  }
  decision = !seen && !prefersReducedMotion();
  return decision;
}

export default function Intro() {
  const t = useT(frontpageDict);
  const root = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const [playing, setPlaying] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [date, setDate] = useState('');

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!shouldPlay()) {
      el.style.display = 'none';
      finishIntro();
      return;
    }
    const { minute } = schoolClock();
    setGreeting(minute < 660 ? t('introMorning') : minute < 1080 ? t('introDay') : minute < 1320 ? t('introEvening') : t('introNight'));
    setDate(new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Rome' }).format(new Date()));
    setPlaying(true);
  }, [t]);

  // Nothing scrolls while the curtain is down.
  useEffect(() => {
    if (!playing) return;
    lenis?.stop();
    document.documentElement.style.overflow = 'hidden';
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = '';
    };
  }, [playing, lenis]);

  useGsap(({ gsap, SplitText, scope: el }) => {
    if (!playing || !greeting) return;
    el.style.animation = 'none';
    const split = SplitText.create(el.querySelector('[data-greet]'), { type: 'chars', mask: 'chars' });
    const count = el.querySelector<HTMLElement>('[data-count]')!;
    const n = { v: 0 };

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(split.chars, { yPercent: 110, duration: 1.1, stagger: 0.035 }, 0.1)
      .from(el.querySelectorAll('[data-intro-meta]'), { opacity: 0, y: 12, duration: 0.8, stagger: 0.06 }, 0.2)
      .to(n, {
        v: 100,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => { count.textContent = String(Math.round(n.v)).padStart(3, '0'); },
      }, 0.15)
      .fromTo(el.querySelector('[data-bar]'), { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0.15)
      .to(split.chars, { yPercent: -110, duration: 0.7, stagger: 0.02, ease: 'expo.in' }, 1.6)
      .to(el.querySelectorAll('[data-intro-meta]'), { opacity: 0, duration: 0.3 }, 1.7)
      .add(() => finishIntro(), 2.05)
      .to(el, { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, 1.95)
      .fromTo(
        el.querySelector('[data-edge]'),
        { scaleY: 0 },
        { scaleY: 1, duration: 0.6, ease: 'power2.in', yoyo: true, repeat: 1 },
        1.95,
      )
      .add(() => {
        decision = false;
        el.style.display = 'none';
        setPlaying(false);
      });

    return () => {
      tl.kill();
      split.revert();
    };
  }, root, [playing, greeting]);

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="home-intro fixed inset-0 z-[70] flex flex-col justify-between bg-[var(--night)] px-5 pb-6 pt-6 text-white md:px-10 md:pb-9 md:pt-8"
    >
      <div className="flex items-start justify-between text-[14px] font-medium text-[var(--mute)] md:text-[15px]">
        <span data-intro-meta>POKYH</span>
        <span data-intro-meta>{date}</span>
      </div>

      <p data-greet className="font-display text-[clamp(64px,16vw,260px)] leading-[0.9] tracking-[-0.06em]">
        {greeting || ' '}
      </p>

      <div>
        <div className="flex items-end justify-between">
          <span data-intro-meta className="text-[14px] font-medium text-[var(--mute)] md:text-[15px]">
            {t('introLoading')}
          </span>
          <span data-count className="font-display text-[clamp(48px,9vw,140px)] leading-[0.8] tabular-nums tracking-[-0.05em]">
            000
          </span>
        </div>
        <span data-bar className="mt-5 block h-px w-full origin-left bg-white/40" />
      </div>

      {/* The curved bottom edge while the curtain lifts */}
      <span
        data-edge
        className="pointer-events-none absolute inset-x-0 top-full block h-[16vw] origin-top bg-[var(--night)]"
        style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%', transform: 'scaleY(0)' }}
      />
    </div>
  );
}
