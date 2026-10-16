'use client';

import Link from 'next/link';
import { useMemo, useRef } from 'react';
import { useDateLocale, useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { landingDict } from '@/lib/i18n/dictionaries/landing';
import { homepageDict } from '@/lib/i18n/dictionaries/homepage';
import { localized, upcomingDays } from '@/lib/mensa';
import { formatDate } from '@/lib/i18n/dateLocale';
import { useGsap } from '@/lib/motion';
import { useMensaDishes } from './useMensaDishes';

// The Mensa plan as a gallery: the section stays on screen and the coming
// dishes, with their photos, run past sideways at different sizes and
// heights. Meanwhile the night turns into paper for the sections after it.

// Size (vw) and height in the stage (% from the top) of the items, repeating.
const LAYOUT = [
  { w: 24, top: 18 },
  { w: 16, top: 52 },
  { w: 20, top: 10 },
  { w: 28, top: 40 },
  { w: 15, top: 16 },
  { w: 21, top: 54 },
];
const PHONE = [
  { w: 70, top: 14 },
  { w: 56, top: 44 },
  { w: 64, top: 20 },
];

export default function MensaToday() {
  const t = useT(landingDict);
  const th = useT(homepageDict);
  const { locale } = useLocale();
  const { tag } = useDateLocale();
  const localize = useLocalizeHref();
  const dishes = useMensaDishes();
  const root = useRef<HTMLElement>(null);

  const items = useMemo(() => {
    const days = upcomingDays(dishes ?? []);
    return days
      .flatMap((d) => d.dishes.map((dish) => ({ dish, day: formatDate(d.date, tag, { weekday: 'long', day: 'numeric', month: 'long' }) })))
      .filter((x) => x.dish.imageUrl)
      .slice(0, 12);
  }, [dishes, tag]);

  useGsap(({ gsap, reduced, scope }) => {
    if (reduced || !items.length) return;
    const track = scope.querySelector<HTMLElement>('[data-track]')!;
    const stage = scope.querySelector<HTMLElement>('[data-mensa-stage]')!;
    const photos = Array.from(scope.querySelectorAll<HTMLElement>('[data-photo]'));
    const distance = () => track.scrollWidth - window.innerWidth;

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: scope,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          scope.dataset.tone = self.progress > 0.62 ? 'light' : 'dark';
          // A dish is in full colour as it passes the middle, washed out at the edges.
          const mid = window.innerWidth / 2;
          for (const p of photos) {
            const r = p.getBoundingClientRect();
            const d = Math.min(1, Math.abs(r.left + r.width / 2 - mid) / (window.innerWidth * 0.6));
            p.style.filter = `grayscale(${(d * 0.9).toFixed(2)}) contrast(${(1 - d * 0.08).toFixed(2)})`;
            p.style.transform = `scale(${(1.12 - d * 0.12).toFixed(3)})`;
          }
        },
      },
    });
    tl.to(track, { x: () => -distance(), duration: 1 }, 0);
    tl.fromTo(stage, { backgroundColor: '#1E1E1E', color: '#FFFFFF' }, { backgroundColor: '#FAF8F5', color: '#161513', duration: 0.35 }, 0.5);
    // Each item drifts a little against the track, by its size.
    scope.querySelectorAll<HTMLElement>('[data-item]').forEach((el, i) => {
      tl.fromTo(el, { yPercent: i % 2 ? 14 : -10 }, { yPercent: i % 2 ? -14 : 10, duration: 1 }, 0);
    });
  }, root, [items.length]);

  const empty = dishes !== null && items.length === 0;

  return (
    <section
      ref={root}
      data-tone="dark"
      aria-labelledby="mensa-title"
      className="relative"
      style={{ height: items.length ? `${100 + items.length * 34}svh` : undefined }}
    >
      <div data-mensa-stage className="sticky top-0 flex h-[100svh] items-center overflow-hidden bg-[var(--night)] text-white">
        <div data-track className="relative flex h-full items-stretch will-change-transform">
          <div className="flex w-[100vw] shrink-0 flex-col justify-center px-5 md:w-[46vw] md:px-[6.5vw]">
            <h2 id="mensa-title" className="font-display text-[clamp(56px,15vw,84px)] leading-[0.92] md:text-[clamp(84px,8.4vw,164px)]">
              {th('mensaTitle')}
            </h2>
            <p className="mt-6 max-w-[34ch] text-[17px] leading-[1.5] opacity-60 md:text-[19px]">{t('mensaLead')}</p>
            {empty && <p className="mt-8 text-[19px] opacity-70">{t('mensaEmpty')}</p>}
            {dishes === null && <span className="mt-8 block h-2 w-40 animate-pulse rounded-full bg-current opacity-10" />}
          </div>

          {items.map(({ dish, day }, i) => {
            const l = LAYOUT[i % LAYOUT.length];
            const m = PHONE[i % PHONE.length];
            const name = localized(dish.name, locale);
            return (
              <figure
                key={dish.id + i}
                data-item
                className="relative ml-[8vw] shrink-0 self-start md:ml-[5vw]"
              >
                <style>{`[data-mensa-i="${i}"]{--iw:${m.w}vw;--it:${m.top}svh}@media(min-width:768px){[data-mensa-i="${i}"]{--iw:${l.w}vw;--it:${l.top}svh}}`}</style>
                <div data-mensa-i={i} className="w-[var(--iw)] pt-[var(--it)]">
                  <p className="mb-3 text-[13px] font-semibold opacity-60">{day}</p>
                  <div className="tile aspect-[4/5] w-full bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      data-photo
                      src={dish.imageUrl!}
                      alt={name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover will-change-transform"
                      style={{ filter: 'grayscale(0.9)' }}
                      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                    />
                  </div>
                  <figcaption className="mt-4 text-[clamp(18px,1.6vw,26px)] font-semibold leading-[1.15] tracking-[-0.03em]">{name}</figcaption>
                </div>
              </figure>
            );
          })}

          <div className="flex w-[80vw] shrink-0 items-center justify-center md:w-[40vw]">
            <Link
              href={localize('/mensa')}
              className="inline-flex h-[58px] items-center rounded-full bg-[var(--night)] px-10 text-[17px] font-medium text-white press"
            >
              {t('mensaAll')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
