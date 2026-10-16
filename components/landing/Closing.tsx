'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { homepageDict } from '@/lib/i18n/dictionaries/homepage';
import { useGsap } from '@/lib/motion';
import Statement from './Statement';

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Three ways in, set as large words.
export function GetIn() {
  const t = useT(homepageDict);
  const localize = useLocalizeHref();
  const { user } = useSession();
  const root = useRef<HTMLElement>(null);
  const ways = [
    { word: t('getWebWord'), text: t('getWebText'), href: user ? '/home' : '/login' },
    { word: t('getAndroidWord'), text: t('getAndroidText'), href: '/get/android' },
    { word: t('getIosWord'), text: t('getIosText'), href: '/get/ios' },
  ];

  useGsap(({ gsap, reduced, scope }) => {
    if (reduced) return;
    gsap.from(scope.querySelectorAll('[data-way]'), {
      yPercent: 40,
      opacity: 0,
      duration: 1.3,
      stagger: 0.12,
      ease: 'expo.out',
      scrollTrigger: { trigger: scope.querySelector('[data-ways]'), start: 'top 78%' },
    });
  }, root);

  return (
    <section ref={root} data-tone="light" aria-labelledby="get-title" className="bg-[var(--paper)] text-ink">
      <div className="mx-auto max-w-[1600px] px-5 pb-[clamp(60px,6vw,100px)] pt-[clamp(110px,13vw,200px)] md:px-10">
        <h2 id="get-title" className="font-display text-center text-[clamp(46px,12vw,64px)] leading-[1.02] md:text-[clamp(56px,5.2vw,96px)]">
          {t('getTitle')}
        </h2>
        <ul data-ways className="mt-14 flex flex-col items-center gap-4 md:mt-20 md:gap-6">
          {ways.map((w) => (
            <li key={w.word} data-way>
              <Link href={localize(w.href)} className="group flex flex-col items-center px-4 py-3 text-center">
                <span className="relative inline-flex items-center">
                  <span className="font-display text-[clamp(60px,17vw,96px)] leading-[0.95] transition-[letter-spacing] duration-700 ease-[var(--ease-out)] group-hover:tracking-[0.015em] md:text-[clamp(92px,10.4vw,196px)]">
                    {w.word}
                  </span>
                  <span className="absolute left-full top-1/2 ml-5 hidden size-14 -translate-y-1/2 scale-50 place-items-center rounded-full bg-[var(--night)] text-white opacity-0 transition-[opacity,transform] duration-500 ease-[var(--ease-out)] group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 md:grid">
                    <Arrow />
                  </span>
                </span>
                <span className="mt-2 max-w-[40ch] text-[16px] leading-[1.5] text-ink-2 md:text-[17px]">{w.text}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-12 text-center text-[16px] text-ink-2 md:mt-16">
          <Link href={localize('/get')} className="font-medium text-ink underline decoration-1 underline-offset-[6px] hover:decoration-2">
            {t('getPwa')}
          </Link>
        </p>
      </div>
    </section>
  );
}

const MAKERS = [
  { name: 'Nexor', handle: 'plattnericus' },
  { name: 'Ryhox', handle: 'Ryhox' },
];

// Who builds it: a statement that lights up, then the two names.
export function Makers() {
  const t = useT(homepageDict);
  return (
    <Statement id="makers" tone="light" title={t('makersTitle')} text={t('makersText')}>
      <ul className="flex flex-col items-center gap-2 sm:flex-row sm:gap-14">
        {MAKERS.map((m) => (
          <li key={m.handle}>
            <a href={`https://github.com/${m.handle}`} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center">
              <span className="font-display text-[clamp(56px,14vw,80px)] leading-none md:text-[clamp(72px,6.4vw,120px)]">{m.name}</span>
              <span className="mt-1 text-[15px] text-ink-2 transition-colors group-hover:text-ink">
                @{m.handle} <span aria-hidden="true">↗</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Statement>
  );
}
