'use client';

import Link from 'next/link';
import { useMemo, useRef } from 'react';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { frontpageDict } from '@/lib/i18n/dictionaries/frontpage';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import { useGsap } from '@/lib/motion';
import { Magnetic, Roll } from './shared';

// The night after the fly-through: one sentence that stays on screen and
// lights up word by word as you scroll. When the school day rises over it,
// it sinks back into the dark.

type Word = { text: string; hl: boolean };

function words(text: string): Word[] {
  const out: Word[] = [];
  text.split('*').forEach((part, n) => {
    part.split(/\s+/).filter(Boolean).forEach((w) => out.push({ text: w, hl: n % 2 === 1 }));
  });
  return out;
}

const DIM = 'rgba(242, 242, 244, 0.12)';
const LIT = '#F2F2F4';
const HIGHLIGHT = '#BAB8F4';

export default function Manifest() {
  const t = useT(frontpageDict);
  const ts = useT(siteDict);
  const localize = useLocalizeHref();
  const { user } = useSession();
  const root = useRef<HTMLElement>(null);
  const list = useMemo(() => words(t('manifestText')), [t]);

  useGsap(({ gsap, reduced, scope }) => {
    if (reduced) return;
    const all = scope.querySelectorAll<HTMLElement>('[data-w]');
    gsap.set(all, { color: DIM });
    gsap.set(scope.querySelectorAll('[data-after]'), { opacity: 0, y: 30 });
    const features = document.querySelector('[data-features]');
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: scope,
        start: 'top top',
        endTrigger: features ?? scope,
        end: features ? 'top 105%' : 'bottom bottom',
        scrub: 0.5,
      },
    });
    tl.to(all, { color: (_i: number, el: HTMLElement) => (el.dataset.hl ? HIGHLIGHT : LIT), duration: 0.4, stagger: 0.14 });
    tl.to(scope.querySelectorAll('[data-after]'), { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out' });
    tl.to({}, { duration: 0.5 });
  }, root);

  const cta = user ? { href: '/home', label: ts('openApp') } : { href: '/login', label: t('manifestCta') };

  return (
    <section ref={root} data-tone="dark" className="home-manifest relative h-[260svh] bg-[var(--night)] text-white">
      <div data-manifest-inner className="sticky top-0 flex h-[100svh] flex-col justify-center px-5 md:px-10 lg:px-[6.5vw]">
        <h2 className="max-w-[13em] text-[clamp(40px,7vw,132px)] font-extrabold leading-[0.95] tracking-[-0.06em]">
          {list.map((w, i) => (
            <span key={i}>
              <span data-w data-hl={w.hl ? '1' : undefined} style={{ color: w.hl ? HIGHLIGHT : LIT }}>
                {w.text}
              </span>{' '}
            </span>
          ))}
        </h2>

        <div className="mt-10 flex flex-col items-start gap-6 md:mt-14 md:flex-row md:items-center md:gap-10">
          <div data-after>
            <Magnetic strength={0.3}>
              <Link
                href={localize(cta.href)}
                className="inline-flex h-[58px] items-center rounded-full bg-white px-9 text-[17px] font-medium text-ink transition-colors hover:bg-[var(--lilac)]"
              >
                <Roll>{cta.label}</Roll>
              </Link>
            </Magnetic>
          </div>
          <p data-after className="max-w-[30ch] text-[16px] leading-[1.5] text-[var(--mute)] md:text-[17px]">
            {t('manifestNote')}
          </p>
        </div>
      </div>
    </section>
  );
}
