'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useLocalizeHref, useRoutePath, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { siteDict, type SiteKey } from '@/lib/i18n/dictionaries/site';
import { useGsap } from '@/lib/motion';
import Image from 'next/image';
import MobileMenu from './MobileMenu';

export const SITE_NAV: { href: string; key: SiteKey }[] = [
  { href: '/#funktionen', key: 'navFeatures' },
  { href: '/mensa', key: 'navMensa' },
  { href: '/about', key: 'navAbout' },
  { href: '/faq', key: 'navFaq' },
];

type Tone = 'light' | 'dark';

/** Tone of the section under the point (x, y), read from the nearest [data-tone]. */
function toneAt(x: number, y: number, skip: Element | null): Tone {
  for (const el of document.elementsFromPoint(x, y)) {
    if (skip?.contains(el)) continue;
    const section = el.closest('[data-tone]');
    if (section) return section.getAttribute('data-tone') === 'dark' ? 'dark' : 'light';
  }
  return 'light';
}

export default function SiteHeader() {
  const t = useT(siteDict);
  const localize = useLocalizeHref();
  const path = useRoutePath();
  const { user } = useSession();
  const [tone, setTone] = useState<Tone>('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const root = useRef<HTMLElement>(null);

  // The bar has no background of its own: it takes the colours of whatever
  // section is scrolling beneath it.
  useEffect(() => {
    let raf = 0;
    const probe = () => {
      raf = 0;
      const el = root.current;
      if (!el) return;
      setTone(toneAt(window.innerWidth / 2, el.offsetHeight / 2, el));
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(probe); };
    probe();
    const late = setTimeout(probe, 400);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      clearTimeout(late);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [path]);

  useGsap(({ gsap, reduced }) => {
    if (reduced) return;
    gsap.from('[data-bar-item]', { y: -18, opacity: 0, duration: 1, stagger: 0.06, delay: 0.5, ease: 'expo.out' });
  }, root);

  const dark = tone === 'dark';
  const primary = user ? { href: '/home', label: t('openApp') } : { href: '/login', label: t('login') };

  return (
    <>
      <header
        ref={root}
        data-tone-bar={tone}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${dark ? 'text-white' : 'text-ink'}`}
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <div className="mx-auto grid h-[76px] max-w-[1600px] grid-cols-[1fr_auto] items-center px-5 md:h-[96px] md:px-10 lg:grid-cols-[1fr_auto_1fr] lg:px-[6.5vw]">
          <Link href={localize('/')} data-bar-item className="justify-self-start rounded-lg" aria-label={`POKYH, ${t('home')}`}>
            <Image src="/POKYH_Logo.png" alt="" width={44} height={44} priority className="size-10 md:size-11" />
          </Link>

          <nav aria-label="POKYH" className="hidden lg:flex items-center gap-11">
            {SITE_NAV.map((item) => {
              const route = item.href.split('#')[0] || '/';
              const active = route !== '/' && (path === route || path.startsWith(route + '/'));
              return (
                <Link
                  key={item.href}
                  data-bar-item
                  href={localize(item.href)}
                  aria-current={active ? 'page' : undefined}
                  className="group relative py-2 text-[16px] font-medium tracking-[-0.01em]"
                >
                  {t(item.key)}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0.5 h-px origin-left bg-current transition-transform duration-500 ease-[var(--ease-out)] ${
                      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-self-end gap-2 md:gap-2.5">
            <Link
              data-bar-item
              href={localize(primary.href)}
              className="inline-flex h-11 md:h-[52px] items-center rounded-full bg-[var(--lilac)] px-5 md:px-8 text-[15px] md:text-[16px] font-medium text-[var(--lilac-ink)] transition-[filter] duration-300 hover:brightness-[0.96]"
            >
              {primary.label}
            </Link>
            <Link
              data-bar-item
              href={localize('/get')}
              className={`hidden sm:inline-flex h-11 md:h-[52px] items-center rounded-full px-5 md:px-8 text-[15px] md:text-[16px] font-medium transition-colors duration-500 ${
                dark ? 'bg-[#D9D9D9] text-ink hover:bg-white' : 'bg-[var(--night)] text-white hover:bg-black'
              }`}
            >
              {t('navGet')}
            </Link>
            <button
              data-bar-item
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t('menu')}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              className={`lg:hidden grid size-11 place-items-center rounded-full transition-colors duration-500 ${
                dark ? 'bg-[#D9D9D9] text-ink' : 'bg-[var(--night)] text-white'
              }`}
            >
              <span aria-hidden="true" className="flex w-[18px] flex-col gap-[5px]">
                <span className="h-[1.5px] w-full rounded-full bg-current" />
                <span className="h-[1.5px] w-2/3 self-end rounded-full bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} cta={primary} />
    </>
  );
}
