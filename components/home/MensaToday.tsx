'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDateLocale, useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { frontpageDict } from '@/lib/i18n/dictionaries/frontpage';
import { daysFromToday, localized, upcomingDays } from '@/lib/mensa';
import { formatDate } from '@/lib/i18n/dateLocale';
import { api } from '@/lib/api-client';
import { ensureGsap, fadeIn, lightUp, prefersReducedMotion, SplitText, useGsap } from '@/lib/motion';
import { useMensaDishes } from '@/components/landing/useMensaDishes';

// The next dish on the plan and nothing else: the day it is for (today,
// tomorrow, Monday …), its name, the stars it got from students and one
// photo. The photo opens from below as the section arrives and leans towards
// the pointer.

const STAR = 'M12 2.8l2.8 5.9 6.4.8-4.7 4.5 1.2 6.4L12 17.3l-5.7 3.1 1.2-6.4-4.7-4.5 6.4-.8z';

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-1.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        return (
          <span key={i} data-star className="relative inline-block size-[clamp(26px,2.4vw,38px)]">
            <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full text-ink opacity-15">
              <path d={STAR} fill="currentColor" />
            </svg>
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 24 24" className="h-full w-[clamp(26px,2.4vw,38px)] max-w-none">
                <path d={STAR} fill="#F5B301" />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}

export default function MensaToday() {
  const t = useT(frontpageDict);
  const { locale } = useLocale();
  const { tag } = useDateLocale();
  const localize = useLocalizeHref();
  const dishes = useMensaDishes();
  const root = useRef<HTMLElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);

  const pick = useMemo(() => {
    if (dishes === null) return undefined;
    const day = upcomingDays(dishes)[0];
    if (!day) return null;
    const dish = day.dishes.find((d) => d.imageUrl) ?? day.dishes[0];
    return { dish, date: day.date, days: daysFromToday(day.date) };
  }, [dishes]);

  useEffect(() => {
    if (!pick) return;
    let alive = true;
    api.dishRatings
      .get(pick.dish.id)
      .then((data) => {
        if (!alive) return;
        const values = Object.values(data.ratings ?? {});
        setRating({ avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0, count: values.length });
      })
      .catch(() => { if (alive) setRating({ avg: 0, count: 0 }); });
    return () => { alive = false; };
  }, [pick]);

  // The photo leans a little towards the pointer.
  useEffect(() => {
    const el = photo.current;
    if (!el || prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;
    const gsap = ensureGsap();
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3' });
    gsap.set(el, { transformPerspective: 900 });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - (r.left + r.width / 2)) / r.width) * 10);
      rx(-((e.clientY - (r.top + r.height / 2)) / r.height) * 10);
    };
    const leave = () => { rx(0); ry(0); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [pick]);

  // Rises over the carousel with an arched top that flattens; the carousel
  // sinks back underneath.
  useGsap(({ gsap, reduced, scope }) => {
    if (reduced) return;
    gsap.fromTo(
      scope,
      { borderTopLeftRadius: '50% 16vw', borderTopRightRadius: '50% 16vw' },
      {
        borderTopLeftRadius: '50% 0vw',
        borderTopRightRadius: '50% 0vw',
        ease: 'none',
        scrollTrigger: { trigger: scope, start: 'top bottom', end: 'top 10%', scrub: true },
      },
    );
    const under = document.querySelector('[data-carousel-stage]');
    if (under) {
      gsap.fromTo(
        under,
        { scale: 1, filter: 'brightness(1)' },
        {
          scale: 0.88,
          filter: 'brightness(0.55)',
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: scope, start: 'top bottom', end: 'top top', scrub: true },
        },
      );
    }
  }, root);

  const name = pick ? localized(pick.dish.name, locale) : '';

  // The day it is for, as people say it.
  const title = pick === undefined
    ? ''
    : pick === null
      ? t('mensaEmptyTitle')
      : pick.days <= 0
        ? t('mensaTitle')
        : pick.days === 1
          ? t('mensaTitleTomorrow')
          : pick.days < 7
            ? t('mensaTitleDay', { day: capitalize(formatDate(pick.date, tag, { weekday: 'long' })) })
            : t('mensaTitleDate', { date: formatDate(pick.date, tag, { day: 'numeric', month: 'long' }) });

  useGsap(({ gsap, reduced, scope }) => {
    if (reduced || pick === undefined) return;
    const heading = SplitText.create(scope.querySelector('[data-title]'), { type: 'words' });
    const dish = scope.querySelector('[data-dish]');
    const name = dish ? SplitText.create(dish, { type: 'words' }) : null;
    const tl = gsap.timeline({ scrollTrigger: { trigger: scope, start: 'top 62%' } });
    tl.add(lightUp(gsap, heading.words), 0);
    if (name) tl.add(lightUp(gsap, name.words), 0.35);
    tl.add(fadeIn(gsap, scope.querySelectorAll('[data-rise], [data-star]'), { stagger: 0.06 }), 0.6);
    const frame = scope.querySelector('[data-frame]');
    if (frame) {
      gsap.fromTo(frame.querySelector('img'), { scale: 1.4, yPercent: -6 }, {
        scale: 1,
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: scope, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      });
    }
  }, root, [title, name]);

  const date = pick ? formatDate(pick.date, tag, { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  const votes = rating === null
    ? ' '
    : rating.count
      ? `${rating.avg.toFixed(1).replace('.', ',')} · ${t('mensaVotes', { n: rating.count })}`
      : t('mensaNoVotes');

  return (
    <section ref={root} data-tone="light" aria-labelledby="mensa-title" className="relative z-10 -mt-[100svh] min-h-[100svh] overflow-clip bg-[var(--paper)] text-ink">
      <div className="mx-auto grid max-w-[1700px] grid-cols-1 items-center gap-12 px-5 py-[clamp(110px,14vw,220px)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-[6vw] md:px-10 lg:px-[6.5vw]">
        <div className="min-w-0">
          {pick === undefined ? (
            <>
              <span className="block h-[clamp(48px,7.4vw,150px)] w-[min(80%,560px)] animate-pulse rounded-[24px] bg-ink/8" />
              <span className="mt-10 block h-3 w-56 animate-pulse rounded-full bg-ink/10" />
            </>
          ) : (
            <h2 key={title} id="mensa-title" data-title className="font-display max-w-[11ch] text-[clamp(48px,7.4vw,150px)] font-extrabold leading-[0.88] tracking-[-0.065em]">
              {title}
            </h2>
          )}

          {pick === null && (
            <>
              <p data-rise className="mt-8 max-w-[34ch] text-[clamp(18px,1.6vw,24px)] leading-[1.45] text-ink-2">{t('mensaEmpty')}</p>
              <Link data-rise href={localize('/mensa')} className="group mt-10 inline-flex items-center gap-3 text-[16px] font-semibold md:text-[17px]">
                <span className="border-b-2 border-current pb-0.5">{t('mensaLink')}</span>
                <span aria-hidden="true" className="transition-transform duration-500 group-hover:translate-x-1.5">→</span>
              </Link>
            </>
          )}

          {pick && (
            <>
              <p data-rise className="mt-[clamp(36px,5vw,80px)] text-[15px] font-semibold text-ink-2 md:text-[16px]">{date}</p>
              <p key={name} data-dish className="mt-2 max-w-[16ch] text-[clamp(32px,3.6vw,68px)] font-bold leading-[1.02] tracking-[-0.045em]">{name}</p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Stars value={rating?.avg ?? 0} />
                <span data-rise className="text-[15px] font-medium tabular-nums text-ink-2 md:text-[16px]">{votes}</span>
              </div>
              <Link data-rise href={localize('/mensa')} className="group mt-10 inline-flex items-center gap-3 text-[16px] font-semibold md:text-[17px]">
                <span className="border-b-2 border-current pb-0.5">{t('mensaLink')}</span>
                <span aria-hidden="true" className="transition-transform duration-500 group-hover:translate-x-1.5">→</span>
              </Link>
            </>
          )}
        </div>

        {pick?.dish.imageUrl && (
          <div ref={photo} className="justify-self-center will-change-transform md:justify-self-end">
            <div data-frame className="aspect-[4/5] w-[min(78vw,420px)] overflow-hidden rounded-[clamp(22px,2.4vw,36px)] md:w-[clamp(280px,32vw,560px)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pick.dish.imageUrl}
                alt={name}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
                onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
