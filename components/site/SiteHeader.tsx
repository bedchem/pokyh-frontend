'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLocalizeHref, useRoutePath, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { siteDict, type SiteKey } from '@/lib/i18n/dictionaries/site';
import { useSiteDark } from '@/lib/site-theme';
import Image from 'next/image';
import logo from '@/components/brand/pokyh-logo.webp';
import dynamic from 'next/dynamic';
import { afterFirstInput } from '@/lib/first-input';
import { ThemeButton } from './ThemeToggle';
import LanguageButton from './LanguageButton';

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

// The bar has no background of its own. On wide screens the places sit in
// the middle of the bar; where the buttons need the room (narrower desktops)
// they move left just as far as needed, never under them. Its text takes the
// opposite colour of the section beneath it (dark on paper and pastels, light on the night
// sections and in the dark theme), and it gets out of the way while you read:
// scrolling down slides it up, scrolling up or reaching the top brings it back.
// The phone menu is a closed overlay until opened: it is added with the first
// input (lib/first-input.ts), in a chunk of its own, so the page comes alive
// without it.
const MobileMenu = dynamic(() => import('./MobileMenu'), { ssr: false });

/** Its place in the bar's arrival (globals.css, [data-bar-item]). */
const barItem = (i: number) => ({ '--bar-i': i }) as CSSProperties;

export default function SiteHeader() {
  const t = useT(siteDict);
  const localize = useLocalizeHref();
  const path = useRoutePath();
  const { user } = useSession();
  const darkTheme = useSiteDark();
  const [tone, setTone] = useState<Tone>('light');
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  useEffect(() => afterFirstInput(() => setMenuReady(true)), []);
  const menu = menuReady || menuOpen;
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    let raf = 0;
    let lastY = window.scrollY;
    const probe = () => {
      raf = 0;
      const el = root.current;
      if (!el) return;
      setTone(toneAt(window.innerWidth / 2, el.offsetHeight / 2, el));
      const y = window.scrollY;
      setScrolled(y > 40);
      if (y < 120) setHidden(false);
      else if (y > lastY + 6) setHidden(true);
      else if (y < lastY - 6) setHidden(false);
      if (Math.abs(y - lastY) > 6) lastY = y;
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

  const dark = darkTheme || tone === 'dark';
  const primary = user ? { href: '/home', label: t('openApp') } : { href: '/login', label: t('login') };
  const away = hidden && !menuOpen;

  return (
    <>
      <header
        ref={root}
        data-tone-bar={dark ? 'dark' : 'light'}
        className={`fixed inset-x-0 top-0 z-50 ${dark ? 'text-[#F2F2F4]' : 'text-[#1C1A17]'}`}
        style={{
          paddingTop: 'var(--safe-top)',
          transform: away ? 'translateY(-110%)' : 'none',
          transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), color 0.5s ease',
        }}
        onFocusCapture={() => setHidden(false)}
      >
        {/* Away from the top, what scrolls beneath the bar is blurred, so the
            bar stays readable over text and photos in any section colour. */}
        <span aria-hidden="true" className="header-blur" data-on={scrolled && !away ? '' : undefined} />
        <div className="mx-auto grid h-[72px] max-w-[1600px] grid-cols-[1fr_auto] items-center gap-x-6 px-5 md:h-[84px] md:px-10 lg:gap-x-8 lg:grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)] lg:px-[6.5vw]">
          {/* The bar's items arrive one after another with the first paint
              (globals.css, [data-bar-item]; --bar-i is the order), not after
              the scripts. */}
          <Link href={localize('/')} data-bar-item style={barItem(0)} className="justify-self-start rounded-lg" aria-label={`POKYH, ${t('home')}`}>
            {/* Loaded at once but not preloaded (fetchPriority low): a preload
                of a 44 px logo only ever produced console warnings. */}
            <Image src={logo} alt="" width={44} height={44} loading="eager" fetchPriority="low" className="size-10 md:size-11" />
          </Link>

          <nav aria-label="POKYH" className="hidden lg:flex items-center justify-self-center gap-8 xl:gap-11">
            {SITE_NAV.map((item, i) => {
              const route = item.href.split('#')[0] || '/';
              const active = route !== '/' && (path === route || path.startsWith(route + '/'));
              return (
                <Link
                  key={item.href}
                  data-bar-item
                  style={barItem(1 + i)}
                  href={localize(item.href)}
                  aria-current={active ? 'page' : undefined}
                  className="group relative py-2 text-[16px] font-semibold tracking-[-0.01em]"
                >
                  {t(item.key)}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0.5 h-[1.5px] origin-left bg-current transition-transform duration-500 ease-[var(--ease-out)] ${
                      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-self-end gap-2 md:gap-3">
            <span data-bar-item style={barItem(SITE_NAV.length + 1)} className="hidden sm:block">
              <LanguageButton />
            </span>
            <span data-bar-item style={barItem(SITE_NAV.length + 2)} className="hidden sm:block">
              <ThemeButton className="size-11 rounded-full opacity-80 transition-opacity hover:opacity-100" />
            </span>
            <Link data-bar-item style={barItem(SITE_NAV.length + 3)} href={localize(primary.href)} className="key key-sm key-lilac md:h-[48px]">
              {primary.label}
            </Link>
            <Link
              data-bar-item
              style={barItem(SITE_NAV.length + 4)}
              href={localize('/get')}
              className={`key key-sm hidden sm:inline-flex md:h-[48px] ${dark ? 'key-glass' : ''}`}
            >
              {t('navGet')}
            </Link>
            <button
              data-bar-item
              style={barItem(SITE_NAV.length + 5)}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t('menu')}
              aria-expanded={menuOpen}
              aria-controls={menu ? 'site-menu' : undefined}
              className={`key key-sm lg:hidden !px-0 w-11 ${dark ? 'key-glass' : ''}`}
            >
              <span aria-hidden="true" className="flex w-[18px] flex-col gap-[5px]">
                <span className="h-[1.5px] w-full rounded-full bg-current" />
                <span className="h-[1.5px] w-2/3 self-end rounded-full bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>
      {menu && <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} cta={primary} />}
    </>
  );
}
