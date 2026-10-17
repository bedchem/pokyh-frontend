'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { frontpageDict } from '@/lib/i18n/dictionaries/frontpage';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import { fadeIn, lightUp, SplitText, useGsap } from '@/lib/motion';

// The opened app: indigo from edge to edge and the name, huge. Below, the
// ways in as large keys.

export default function GetIn() {
  const t = useT(frontpageDict);
  const ts = useT(siteDict);
  const localize = useLocalizeHref();
  const { user } = useSession();
  const root = useRef<HTMLElement>(null);

  useGsap(({ gsap, reduced, scope }) => {
    if (reduced) return;
    const split = SplitText.create(scope.querySelector('[data-line]'), { type: 'words' });
    const tl = gsap.timeline({ scrollTrigger: { trigger: scope, start: 'top 55%' } });
    tl.add(lightUp(gsap, [...split.words, ...scope.querySelectorAll('[data-letter]')]), 0);
    tl.add(fadeIn(gsap, scope.querySelectorAll('[data-way]')), 0.5);
    return () => split.revert();
  }, root);

  const name = t('getTitleB').replace(/\.$/, '');
  const ways = [
    { label: user ? ts('openApp') : t('getWeb'), href: user ? '/home' : '/login', tone: 'key-lilac', arrow: true },
    { label: t('getAndroid'), href: '/get/android', tone: 'key-paper' },
    { label: t('getIos'), href: '/get/ios', tone: 'key-paper' },
    { label: t('getPwa'), href: '/get', tone: 'key-line text-white' },
  ];

  return (
    <section ref={root} data-tone="dark" aria-labelledby="get-title" className="relative bg-[var(--indigo)] text-white">
      <div className="flex min-h-[100svh] flex-col items-center justify-center px-5 pb-[clamp(80px,12svh,140px)] pt-28 md:px-10">
        <h2 id="get-title" aria-label={`${t('getTitleA')} ${t('getTitleB')}`} className="font-display flex flex-col items-center text-center font-extrabold tracking-[-0.06em]">
          <span data-line aria-hidden="true" className="block text-[clamp(44px,8.4vw,168px)] leading-[0.9]">{t('getTitleA')}</span>
          <span aria-hidden="true" className="flex pb-[0.04em] text-[min(25vw,40svh)] leading-[0.8]">
            {[...name.split(''), '.'].map((l, i) => (
              <span key={i} data-letter className={`inline-block ${l === '.' ? 'text-[var(--lilac)]' : ''}`}>
                {l}
              </span>
            ))}
          </span>
        </h2>

        <ul className="mt-[clamp(36px,7svh,80px)] flex flex-wrap items-center justify-center gap-3 md:gap-4">
          {ways.map((w) => (
            <li key={w.href} data-way>
              <Link href={localize(w.href)} className={`key key-lg md:h-[68px] md:px-10 md:text-[19px] ${w.tone}`}>
                {w.label}
                {w.arrow && <span aria-hidden="true" className="key-arrow">→</span>}
              </Link>
            </li>
          ))}
        </ul>
        <p data-way className="mt-6 max-w-[44ch] text-center text-[15px] leading-[1.5] text-white/65 md:text-[16px]">
          {t('getNote')}
        </p>
      </div>
    </section>
  );
}
