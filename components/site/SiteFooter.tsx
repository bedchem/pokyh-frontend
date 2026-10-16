'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { siteDict, type SiteKey } from '@/lib/i18n/dictionaries/site';
import { ACTIVE_LOCALES, LOCALE_LABELS, LOCALE_NAMES } from '@/lib/i18n/locale';
import { COOKIE_SETTINGS_EVENT } from '@/components/CookieSettingsButton';
import { fadeIn, lightUp, useGsap } from '@/lib/motion';
import { useLenis } from './SmoothScroll';

type FooterLink = { key: SiteKey; href: string; external?: boolean };

const COLUMNS: { title: SiteKey; links: FooterLink[] }[] = [
  {
    title: 'footerProduct',
    links: [
      { key: 'navFeatures', href: '/#funktionen' },
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
      { key: 'github', href: 'https://github.com/bedchem', external: true },
    ],
  },
  {
    title: 'footerLegal',
    links: [
      { key: 'imprint', href: '/legal?view=impressum' },
      { key: 'privacy', href: '/legal?view=datenschutz' },
      { key: 'cookies', href: '/legal?view=cookies' },
    ],
  },
];

const linkClass = 'text-[16px] text-white/75 transition-colors hover:text-white';

export default function SiteFooter() {
  const t = useT(siteDict);
  const localize = useLocalizeHref();
  const { locale, setLocale } = useLocale();
  const { user } = useSession();
  const lenis = useLenis();
  const root = useRef<HTMLElement>(null);

  useGsap(({ gsap, reduced, scope }) => {
    if (reduced) return;
    const tl = gsap.timeline({ scrollTrigger: { trigger: scope, start: 'top 75%' } });
    tl.add(lightUp(gsap, scope.querySelectorAll('[data-foot-letter]'), { stagger: 0.05 }), 0);
    tl.add(fadeIn(gsap, scope.querySelectorAll('[data-foot-rise]')), 0.4);
  }, root);

  return (
    <footer ref={root} data-tone="dark" className="relative overflow-hidden bg-[var(--night)] text-white" style={{ paddingBottom: 'var(--safe-bottom)' }}>
      <div className="mx-auto max-w-[1600px] px-5 pt-[clamp(110px,13vw,200px)] md:px-10 lg:px-[6.5vw]">
        <div>
          <p
            data-foot-title
            aria-label={t('footerTitle')}
            className="font-display text-[clamp(58px,12.6vw,260px)] font-extrabold leading-[0.84] tracking-[-0.07em]"
          >
            {t('footerTitle').split(' ').map((word, w) => (
              <span key={w} aria-hidden="true" className="inline-block whitespace-nowrap pr-[0.22em]">
                {word.split('').map((l, i) => (
                  <span key={i} data-foot-letter className="inline-block">
                    {l}
                  </span>
                ))}
              </span>
            ))}
          </p>
          <div className="mt-10 flex flex-col gap-8 md:mt-14 md:flex-row md:items-end md:justify-between">
            <p data-foot-rise className="max-w-[34ch] text-[17px] leading-[1.5] text-[var(--mute)] md:text-[19px]">{t('footerText')}</p>
            <div data-foot-rise className="flex flex-wrap gap-3">
              <Link
                href={localize(user ? '/home' : '/login')}
                className="inline-flex h-[60px] items-center rounded-full bg-[var(--lilac)] px-10 text-[17px] font-medium text-[var(--lilac-ink)] transition-colors hover:bg-white md:h-[68px] md:px-12 md:text-[18px]"
              >
                {user ? t('openApp') : t('login')}
              </Link>
              <Link
                href={localize('/get')}
                className="inline-flex h-[60px] items-center rounded-full border border-white/35 px-10 text-[17px] font-medium text-white transition-colors hover:border-white md:h-[68px] md:px-12 md:text-[18px]"
              >
                {t('navGet')}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-[clamp(96px,11vw,170px)] grid gap-12 md:grid-cols-[1.5fr_repeat(3,1fr)] md:gap-10">
          <div className="flex max-w-sm flex-col gap-4">
            <p className="text-[15px] leading-[1.55] text-[var(--mute)]">{t('disclaimer')}</p>
            <div role="group" aria-label={t('language')} className="-ml-2 flex items-center gap-1 text-[14px] font-semibold">
              {ACTIVE_LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  lang={l}
                  onClick={() => setLocale(l)}
                  aria-pressed={l === locale}
                  aria-label={LOCALE_NAMES[l]}
                  className={`h-9 rounded-md px-2 transition-opacity ${l === locale ? 'opacity-100' : 'opacity-45 hover:opacity-100'}`}
                >
                  {LOCALE_LABELS[l]}
                </button>
              ))}
            </div>
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

        <div className="mt-16 flex items-center justify-between pb-10 text-[14px] text-[var(--mute)] md:pb-12">
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

    </footer>
  );
}
