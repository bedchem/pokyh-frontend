'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { useLocalizeHref, useRoutePath, useT } from '@/providers/LocaleProvider';
import { siteDict, type SiteKey } from '@/lib/i18n/dictionaries/site';
import { loadGsap, prefersReducedMotion } from '@/lib/motion';
import Image from 'next/image';
import logo from '@/components/brand/pokyh-logo.webp';
import { useLenis } from './SmoothScroll';
import { SITE_NAV } from './SiteHeader';
import { ThemeSegments } from './ThemeToggle';
import { LanguageSegments } from './LanguageButton';

// The menu of the public site on phones and tablets: the night drops over the
// page with the main places in large type, each with its tile in the colours
// of the name's tiles (footer) and the page you are on marked; under them the
// pages the bar has no room for, and at the bottom, always in reach of the
// thumb, language, light or dark and the way in. On a short screen the
// middle scrolls; nothing overlaps.

// The light pastels in both themes: the menu is always night.
const TONES = ['bg-[#DEDDFB]', 'bg-[#F7E7AC]', 'bg-[#D5E4D0]', 'bg-[#F7D9D3]', 'bg-[#CFEBDD]'];

const MORE: { href: string; key: SiteKey }[] = [
  { href: '/webuntis', key: 'navWebuntis' },
  { href: '/tools', key: 'navTools' },
  { href: '/comparison', key: 'navCompare' },
  { href: '/legal', key: 'footerLegal' },
];

/** The route of a link without its anchor, and whether it is the page shown. */
function isHere(href: string, path: string): boolean {
  const route = href.split('#')[0] || '/';
  return route !== '/' && (path === route || path.startsWith(route + '/'));
}

export default function MobileMenu({
  open,
  onClose,
  cta,
}: {
  open: boolean;
  onClose: () => void;
  cta: { href: string; label: string };
}) {
  const t = useT(siteDict);
  const localize = useLocalizeHref();
  const path = useRoutePath();
  const lenis = useLenis();
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  const wasOpen = useRef(false);

  // Smooth scrolling holds still while the menu is open (it may only start
  // with this very tap, lib/first-input.ts).
  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  // The panel shows and hides at once; its curtain and items move once GSAP
  // is there (loaded on demand, lib/motion.ts).
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    let live = true;
    const reduced = prefersReducedMotion();
    if (open) {
      wasOpen.current = true;
      opener.current = document.activeElement;
      document.documentElement.style.overflow = 'hidden';
      el.querySelector('[data-menu-scroll]')?.scrollTo(0, 0);
      el.style.visibility = 'visible';
      if (reduced) {
        el.style.clipPath = 'inset(0 0 0% 0)';
      } else {
        void loadGsap().then(({ gsap }) => {
          if (!live) return;
          gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.out' });
          gsap.fromTo(
            el.querySelectorAll('[data-menu-item]'),
            { yPercent: 60, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.045, delay: 0.1, ease: 'expo.out' },
          );
        });
      }
      closeBtn.current?.focus();
    } else if (wasOpen.current) {
      document.documentElement.style.overflow = '';
      if (reduced) {
        el.style.visibility = 'hidden';
      } else {
        void loadGsap().then(({ gsap }) => {
          if (!live) return;
          gsap.to(el, {
            clipPath: 'inset(0 0 100% 0)',
            duration: 0.5,
            ease: 'expo.inOut',
            onComplete: () => { el.style.visibility = 'hidden'; },
          });
        });
      }
      if (opener.current instanceof HTMLElement) opener.current.focus();
    }
    return () => { live = false; };
  }, [open]);

  // Grown past the phone layout (a turned tablet), the bar shows the places itself.
  useEffect(() => {
    if (!open) return;
    const wide = window.matchMedia('(min-width: 1024px)');
    const onChange = () => { if (wide.matches) onClose(); };
    wide.addEventListener('change', onChange);
    return () => wide.removeEventListener('change', onChange);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panel.current) {
        const focusables = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const links = [...SITE_NAV, { href: '/get', key: 'navGet' as const }];

  return (
    <div
      ref={panel}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label={t('menu')}
      aria-hidden={!open}
      inert={!open}
      className="fixed inset-0 z-[60] flex flex-col bg-[var(--night)] text-[#F2F2F4] lg:hidden"
      style={{ visibility: 'hidden', clipPath: 'inset(0 0 100% 0)', paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="flex h-[72px] shrink-0 items-center justify-between px-5 md:h-[84px] md:px-10">
        <Link href={localize('/')} onClick={onClose} aria-label={`POKYH, ${t('home')}`} className="flex items-center gap-3 rounded-lg">
          <Image src={logo} alt="" width={44} height={44} loading="lazy" className="size-10 md:size-11" />
          <span className="font-display text-[22px] tracking-[-0.04em]">POKYH</span>
        </Link>
        <button ref={closeBtn} type="button" onClick={onClose} aria-label={t('close')} className="key key-sm key-glass !px-0 w-11">
          <span aria-hidden="true" className="relative block size-[16px]">
            <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 rotate-45 rounded-full bg-current" />
            <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 -rotate-45 rounded-full bg-current" />
          </span>
        </button>
      </div>

      {/* The edges fade, so on a short screen it shows that there is more. */}
      <div
        data-menu-scroll
        data-lenis-prevent
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 [mask-image:linear-gradient(to_bottom,transparent,#000_14px,#000_calc(100%-36px),transparent)] md:px-10"
      >
        <div className="my-auto py-4">
          <nav aria-label="POKYH">
            <ul className="border-t border-white/10">
              {links.map((item, i) => {
                const here = isHere(item.href, path);
                return (
                  <li key={item.href} className="overflow-hidden border-b border-white/10">
                    <Link
                      data-menu-item
                      href={localize(item.href)}
                      onClick={onClose}
                      aria-current={here ? 'page' : undefined}
                      className="group flex min-h-[64px] items-center gap-4 py-2.5 transition-colors active:bg-white/[0.04] md:min-h-[84px]"
                    >
                      <span aria-hidden="true" className={`size-3.5 shrink-0 rounded-[5px] md:size-4 ${TONES[i % TONES.length]} ${here ? '' : 'opacity-80'}`} />
                      <span className={`font-display min-w-0 flex-1 text-[clamp(30px,9vw,54px)] leading-[1.05] tracking-[-0.04em] ${here ? 'text-[#C9C7F7]' : ''}`}>
                        {t(item.key)}
                      </span>
                      {here ? (
                        <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12.5px] font-semibold text-white/80">{t('here')}</span>
                      ) : (
                        <ArrowRight size={22} weight="bold" aria-hidden="true" className="shrink-0 text-white/35 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white/70" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav aria-label={t('more')} data-menu-item className="mt-7">
            <p className="text-[13px] font-semibold text-white/45">{t('more')}</p>
            <ul className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              {MORE.map((item) => {
                const here = isHere(item.href, path);
                return (
                  <li key={item.href} className="flex">
                    <Link
                      href={localize(item.href)}
                      onClick={onClose}
                      aria-current={here ? 'page' : undefined}
                      className={`flex min-h-[52px] w-full items-center rounded-[16px] px-4 py-2.5 text-[14.5px] font-semibold leading-snug transition-colors ${here ? 'bg-white/15 text-white' : 'bg-white/[0.06] text-white/80 hover:bg-white/10 active:bg-white/15'}`}
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-4 border-t border-white/10 px-5 pb-6 pt-4 md:px-10">
        <div data-menu-item className="flex flex-wrap items-center justify-between gap-3">
          <LanguageSegments />
          <ThemeSegments />
        </div>
        <Link data-menu-item href={localize(cta.href)} onClick={onClose} className="key key-lg key-lilac w-full">
          {cta.label}
          <span aria-hidden="true" className="key-arrow">→</span>
        </Link>
      </div>
    </div>
  );
}
