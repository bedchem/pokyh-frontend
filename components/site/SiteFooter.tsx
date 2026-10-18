'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useLocalizeHref, useRoutePath, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { siteDict, type SiteKey } from '@/lib/i18n/dictionaries/site';
import { metaDict } from '@/lib/i18n/dictionaries/meta';
import { SOURCE_URL } from '@/lib/site-links';
import { COOKIE_SETTINGS_EVENT } from '@/components/CookieSettingsButton';
import { ensureGsap, prefersReducedMotion, useGsap } from '@/lib/motion';
import { useLenis } from './SmoothScroll';
import { ThemeSegments } from './ThemeToggle';
import { LanguageSegments } from './LanguageButton';

// The end of every public page: the line of the app and the ways in (not on
// the homepage, which already ends with them), the links, and the five
// letters of the name as tiles that drop onto the floor and jump when you
// tap them.

type FooterLink = { key: SiteKey; href: string; external?: boolean };

const COLUMNS: { title: SiteKey; links: FooterLink[] }[] = [
  {
    title: 'footerProduct',
    links: [
      { key: 'navFeatures', href: '/#funktionen' },
      { key: 'navWebuntis', href: '/webuntis' },
      { key: 'navTools', href: '/tools' },
      { key: 'navMensa', href: '/mensa' },
      { key: 'navGet', href: '/get' },
      { key: 'navCompare', href: '/comparison' },
    ],
  },
  {
    title: 'footerProject',
    links: [
      { key: 'navAbout', href: '/about' },
      { key: 'navFaq', href: '/faq' },
      { key: 'github', href: SOURCE_URL, external: true },
    ],
  },
  {
    title: 'footerLegal',
    links: [
      { key: 'imprint', href: '/legal/impressum' },
      { key: 'privacy', href: '/legal/datenschutz' },
      { key: 'terms', href: '/legal/nutzungsbedingungen' },
      { key: 'cookies', href: '/legal/cookies' },
    ],
  },
];

// The category tones (fill and ink), the same as the tiles of the opening.
const TILES = [
  { letter: 'P', tone: 'bg-periwinkle text-periwinkle-ink', tilt: -7 },
  { letter: 'O', tone: 'bg-butter text-butter-ink', tilt: 4 },
  { letter: 'K', tone: 'bg-sage text-sage-ink', tilt: -3 },
  { letter: 'Y', tone: 'bg-blush text-blush-ink', tilt: 6 },
  { letter: 'H', tone: 'bg-[var(--mint)] text-[var(--mint-ink)]', tilt: -5 },
];

const linkClass = 'text-[16px] text-white/70 transition-colors hover:text-white';

export default function SiteFooter() {
  const t = useT(siteDict);
  const tm = useT(metaDict);
  const localize = useLocalizeHref();
  const { user } = useSession();
  const lenis = useLenis();
  const home = useRoutePath() === '/';
  const root = useRef<HTMLElement>(null);

  // The tiles fall onto the floor when the footer comes into view.
  useGsap(({ gsap, reduced, scope }) => {
    if (reduced) return;
    const tiles = scope.querySelectorAll<HTMLElement>('[data-floor-tile]');
    gsap.from(tiles, {
      yPercent: -175,
      rotation: (i: number) => (i % 2 ? 24 : -24),
      duration: 1.15,
      ease: 'bounce.out',
      stagger: { each: 0.09, from: 'random' },
      scrollTrigger: { trigger: scope.querySelector('[data-floor]'), start: 'top 92%' },
    });
  }, root);

  const jump = (el: HTMLElement) => {
    if (prefersReducedMotion()) return;
    const gsap = ensureGsap();
    if (gsap.isTweening(el)) return;
    const tilt = Number(el.dataset.tilt ?? 0);
    gsap.timeline()
      .to(el, { yPercent: -55, rotation: tilt + (Math.random() > 0.5 ? 180 : -180), duration: 0.42, ease: 'power2.out' })
      .to(el, { yPercent: 0, rotation: tilt + (Math.random() > 0.5 ? 360 : -360), duration: 0.7, ease: 'bounce.out' })
      .set(el, { rotation: tilt });
  };

  return (
    <footer ref={root} data-tone="dark" className="relative overflow-hidden bg-[var(--night)] text-[#F2F2F4]" style={{ paddingBottom: 'var(--safe-bottom)' }}>
      <div className={`mx-auto max-w-[1600px] px-5 md:px-10 lg:px-[6.5vw] ${home ? 'pt-20 md:pt-24' : 'pt-[clamp(96px,12vw,180px)]'}`}>
        {!home && (
          <>
            <h2 className="font-display max-w-[12ch] text-[clamp(52px,9vw,150px)] font-extrabold leading-[1.04] tracking-[-0.06em]">
              {t('endTitle')}
            </h2>

            <div className="mt-12 flex flex-col gap-8 md:mt-16 md:flex-row md:items-end md:justify-between">
              <p className="max-w-[40ch] text-[17px] leading-[1.55] text-[var(--mute)] md:text-[19px]">{t('endText')}</p>
              <div className="flex flex-wrap gap-3">
                <Link href={localize(user ? '/home' : '/login')} className="key key-lg key-lilac">
                  {user ? t('openApp') : t('login')}
                  <span aria-hidden="true" className="key-arrow">→</span>
                </Link>
                <Link href={localize('/get')} className="key key-lg key-glass">
                  {t('navGet')}
                </Link>
              </div>
            </div>
          </>
        )}

        {/* On the homepage: what POKYH is, in plain words (read by people,
            search engines and AI answers alike). */}
        {home && (
          <section aria-labelledby="pokyh-short" className="mb-16 grid gap-8 border-b border-white/10 pb-16 md:mb-20 md:grid-cols-[1fr_1.4fr] md:gap-16 md:pb-20">
            <h2 id="pokyh-short" className="font-display text-[clamp(36px,4.6vw,72px)] leading-[0.95]">{tm('aboutHeading')}</h2>
            <div>
              <p className="max-w-[62ch] text-[17px] leading-[1.65] text-white/75 md:text-[18px]">{tm('aboutText')}</p>
              <ul className="mt-8 flex flex-wrap gap-2.5">
                {tm('aboutPoints').split('|').map((point) => (
                  <li key={point} className="rounded-full bg-white/8 px-4 py-2 text-[14px] font-semibold text-white/85">{point}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <div className={`grid gap-12 md:grid-cols-[1.5fr_repeat(3,1fr)] md:gap-10 ${home ? '' : 'mt-[clamp(80px,10vw,150px)] border-t border-white/10 pt-12'}`}>
          <div className="flex max-w-sm flex-col gap-5">
            <p className="text-[15px] leading-[1.55] text-[var(--mute)]">{t('disclaimer')}</p>
            <LanguageSegments className="self-start" />
            <ThemeSegments className="self-start" />
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={t(col.title)}>
              <h2 className="text-[14px] text-[var(--mute)]">{t(col.title)}</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.key}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        {t(l.key)} <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <Link href={localize(l.href)} className={linkClass}>
                        {t(l.key)}
                      </Link>
                    )}
                  </li>
                ))}
                {col.title === 'footerLegal' && (
                  <li>
                    <button type="button" onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))} className={`${linkClass} text-left`}>
                      {t('cookieSettings')}
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex items-center justify-between text-[14px] text-[var(--mute)]">
          <span>© {new Date().getFullYear()} POKYH</span>
          <button
            type="button"
            onClick={() => (lenis ? lenis.scrollTo(0, { duration: 2.2 }) : window.scrollTo({ top: 0, behavior: 'smooth' }))}
            className="transition-colors hover:text-white"
          >
            {t('toTop')} <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>

      {/* The floor: five tiles, one letter each. They drop in from just above
          it and stay inside it, so nothing falls across the text. */}
      <div data-floor className="relative mx-auto mt-6 max-w-[1600px] overflow-hidden px-3 pt-[clamp(56px,10vw,170px)] md:px-6 lg:px-[4vw]">
        <p className="absolute right-5 top-4 text-[13px] text-[var(--mute)] md:right-10" aria-hidden="true">{t('tilesHint')}</p>
        <div className="grid grid-cols-5 items-end gap-[1.4vw]" aria-hidden="true">
          {TILES.map((tile) => (
            <button
              key={tile.letter}
              type="button"
              tabIndex={-1}
              data-floor-tile
              data-tilt={tile.tilt}
              onClick={(e) => jump(e.currentTarget)}
              className={`squircle font-display grid aspect-[1/1.08] cursor-pointer select-none place-items-center rounded-[clamp(16px,2.6vw,44px)] text-[min(15vw,250px)] font-extrabold leading-none tracking-[-0.06em] transition-[filter] duration-300 hover:brightness-105 ${tile.tone}`}
              style={{ transform: `translateY(14%) rotate(${tile.tilt}deg)` }}
            >
              <span className="-mt-[0.08em]">{tile.letter}</span>
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
