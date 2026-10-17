'use client';

import Link from 'next/link';
import { useMemo, useRef } from 'react';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { frontpageDict } from '@/lib/i18n/dictionaries/frontpage';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import { useGsap } from '@/lib/motion';

// The night behind the dark screen of the hero: one sentence. It is already
// on that screen while the camera flies towards it (the hero shows a copy of
// this layout there), so when the screen fills the view the page simply
// continues here. Scrolling on brings the way in; when the school day rises
// over it, it sinks back into the dark.

type Word = { text: string; hl: boolean };

function words(text: string): Word[] {
  const out: Word[] = [];
  text.split('*').forEach((part, n) => {
    part.split(/\s+/).filter(Boolean).forEach((w) => out.push({ text: w, hl: n % 2 === 1 }));
  });
  return out;
}

const LIT = '#F2F2F4';
const HIGHLIGHT = '#BAB8F4';

/**
 * The sentence and the way in, laid out for one full screen. Used by the
 * section itself and, as a silent copy (`copy`), inside the hero's dark screen,
 * so both match to the pixel.
 */
export function ManifestScreen({ copy = false }: { copy?: boolean }) {
  const t = useT(frontpageDict);
  const ts = useT(siteDict);
  const localize = useLocalizeHref();
  const { user } = useSession();
  const list = useMemo(() => words(t('manifestText')), [t]);
  const cta = user ? { href: '/home', label: ts('openApp') } : { href: '/login', label: t('manifestCta') };
  const Title = copy ? 'div' : 'h2';

  return (
    <div
      data-manifest-inner={copy ? undefined : ''}
      aria-hidden={copy || undefined}
      inert={copy || undefined}
      className={`${copy ? 'absolute inset-0' : 'sticky top-0'} flex h-[100svh] flex-col justify-center px-5 text-[#F2F2F4] md:px-10 lg:px-[6.5vw]`}
    >
      <Title
        className="max-w-[13em] text-[clamp(40px,7vw,132px)] font-extrabold leading-[0.95] tracking-[-0.06em] [text-wrap:balance]"
      >
        {list.map((w, i) => (
          <span key={i}>
            <span style={{ color: w.hl ? HIGHLIGHT : LIT }}>{w.text}</span>{' '}
          </span>
        ))}
      </Title>

      {/* The way in shows once the page has arrived here; the copy keeps its space only. */}
      <div className="mt-10 flex flex-col items-start gap-6 md:mt-14 md:flex-row md:items-center md:gap-10" style={copy ? { visibility: 'hidden' } : undefined}>
        <div data-after>
          <Link href={localize(cta.href)} className="key key-lg key-lilac" tabIndex={copy ? -1 : undefined}>
            {cta.label}
            <span aria-hidden="true" className="key-arrow">→</span>
          </Link>
        </div>
        <p data-after className="max-w-[30ch] text-[16px] leading-[1.5] text-[var(--mute)] md:text-[17px]">
          {t('manifestNote')}
        </p>
      </div>
    </div>
  );
}

export default function Manifest() {
  const root = useRef<HTMLElement>(null);

  useGsap(({ gsap, reduced, scope }) => {
    if (reduced) return;
    // The way in comes right after the hand-over while the sentence drifts up
    // a little, so the page keeps moving until the functions rise over it.
    gsap.fromTo(
      scope.querySelector('[data-manifest-inner]'),
      { y: 0 },
      { y: () => -window.innerHeight * 0.08, ease: 'none', scrollTrigger: { trigger: scope, start: 'top top', end: '+=150%', scrub: 0.6, invalidateOnRefresh: true } },
    );
    gsap.fromTo(
      scope.querySelectorAll('[data-after]'),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: { trigger: scope, start: 'top top', end: '+=35%', scrub: 0.5 },
      },
    );
  }, root);

  // Starts under the end of the hero (see Hero ARRIVE), so the sentence is in
  // place, stuck to the top, at the moment the hero's dark screen fills the view.
  return (
    <section ref={root} data-tone="dark" className="home-manifest relative z-0 -mt-[108svh] h-[250svh] bg-[var(--night)] text-[#F2F2F4]">
      <ManifestScreen />
    </section>
  );
}
