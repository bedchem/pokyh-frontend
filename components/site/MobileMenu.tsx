'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import { ACTIVE_LOCALES, LOCALE_LABELS, LOCALE_NAMES } from '@/lib/i18n/locale';
import { ensureGsap, prefersReducedMotion } from '@/lib/motion';
import Image from 'next/image';
import { useLenis } from './SmoothScroll';
import { SITE_NAV } from './SiteHeader';
import { ThemeSegments } from './ThemeToggle';

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
  const { locale, setLocale } = useLocale();
  const lenis = useLenis();
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (open) {
      wasOpen.current = true;
      opener.current = document.activeElement;
      lenis?.stop();
      document.documentElement.style.overflow = 'hidden';
      gsap.set(el, { visibility: 'visible' });
      if (prefersReducedMotion()) {
        gsap.set(el, { clipPath: 'inset(0 0 0% 0)' });
      } else {
        gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.out' });
        gsap.fromTo(
          el.querySelectorAll('[data-menu-item]'),
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.05, delay: 0.1, ease: 'expo.out' },
        );
      }
      closeBtn.current?.focus();
    } else if (wasOpen.current) {
      lenis?.start();
      document.documentElement.style.overflow = '';
      if (prefersReducedMotion()) gsap.set(el, { visibility: 'hidden' });
      else
        gsap.to(el, {
          clipPath: 'inset(0 0 100% 0)',
          duration: 0.5,
          ease: 'expo.inOut',
          onComplete: () => { gsap.set(el, { visibility: 'hidden' }); },
        });
      if (opener.current instanceof HTMLElement) opener.current.focus();
    }
  }, [open, lenis]);

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
      <div className="flex h-[76px] items-center justify-between px-5">
        <Image src="/POKYH_Logo.png" alt="POKYH" width={44} height={44} className="size-10" />
        <button ref={closeBtn} type="button" onClick={onClose} aria-label={t('close')} className="key key-sm key-glass !px-0 w-11">
          <span aria-hidden="true" className="relative block size-[16px]">
            <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 rotate-45 rounded-full bg-current" />
            <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 -rotate-45 rounded-full bg-current" />
          </span>
        </button>
      </div>

      <nav aria-label="POKYH" className="flex flex-1 flex-col justify-center overflow-y-auto px-5">
        <ul className="flex flex-col gap-1">
          {links.map((item) => (
            <li key={item.href} className="overflow-hidden">
              <Link
                data-menu-item
                href={localize(item.href)}
                onClick={onClose}
                className="font-display block py-1 text-[clamp(44px,13vw,76px)] leading-[1.05] lowercase"
              >
                {t(item.key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-6 px-5 pb-8 pt-4">
        <div data-menu-item className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label={t('language')} className="flex items-center gap-2 text-[16px] font-semibold">
            {ACTIVE_LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                onClick={() => setLocale(l)}
                aria-pressed={l === locale}
                aria-label={LOCALE_NAMES[l]}
                className={`h-10 rounded-md px-2 transition-opacity ${l === locale ? 'opacity-100' : 'opacity-45'}`}
              >
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
          <ThemeSegments />
        </div>
        <Link data-menu-item href={localize(cta.href)} onClick={onClose} className="key key-lg key-lilac w-full">
          {cta.label}
        </Link>
      </div>
    </div>
  );
}
