'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ForkKnife, Lock, Star, X } from '@phosphor-icons/react';
import CommentSection from '@/components/ui/CommentSection';
import GuestCommentsLock from '@/components/ui/GuestCommentsLock';
import PageIntro, { TONE, type SiteTone } from '@/components/site/PageIntro';
import { fetchMensa } from '@/lib/api';
import type { Dish } from '@/lib/types';
import { useApp } from '@/providers/AppProvider';
import { useSession } from '@/providers/SessionProvider';
import { api, type DishRatingsData, type ApiComment } from '@/lib/api-client';
import { useDateLocale, useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { mensaDict } from '@/lib/i18n/dictionaries/mensa';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { daysFromToday, dishesFrom, localized, upcomingDays, type MenuDay } from '@/lib/mensa';
import { formatDate } from '@/lib/i18n/dateLocale';
import { onSiteThemeChange } from '@/lib/site-theme';
import type { PlateScene } from './plateScene';
import ExternalMediaNotice from '@/components/ExternalMediaNotice';
import { useExternalMedia } from '@/lib/external-media';

// The Mensa plan on the public site, told with the plate of the logo: the
// next dish is served large on a plate between fork and knife, the whole plan
// follows by week. A dish opens in a sheet like in a food app: the photo,
// what it is, how the school rated it and the own rating, nutrition,
// allergens, the comments. Guests can read everything but
// the comments, which stay behind GuestCommentsLock; rating and commenting
// need an account.

const LOGIN_HREF = `/login?next=${encodeURIComponent('/mensa')}`;
const STAR = '#F5B301';

// ── helpers ────────────────────────────────────────────────────────────────

function prioritizedTags(tags?: string[]): string[] {
  if (!tags?.length) return [];
  const rank = (t: string) => (t.toLowerCase().includes('vegan') ? 0 : t.toLowerCase().includes('vegetar') ? 1 : 2);
  return [...tags].sort((a, b) => rank(a) - rank(b));
}

function tagTone(tag: string): SiteTone | null {
  const t = tag.toLowerCase();
  if (t.includes('vegan') || t.includes('vegetar')) return 'sage';
  if (t.includes('glutenfrei')) return 'butter';
  if (t.includes('halal')) return 'periwinkle';
  return null;
}

/** A calm tone per dish, by category, for dishes without a photo. */
function dishTone(dish: Dish): SiteTone {
  const c = `${dish.category ?? ''} ${(dish.tags ?? []).join(' ')}`.toLowerCase();
  if (c.includes('salat') || c.includes('vegan') || c.includes('vegetar')) return 'sage';
  if (c.includes('suppe') || c.includes('pasta') || c.includes('nudel')) return 'butter';
  if (c.includes('fisch')) return 'periwinkle';
  return 'blush';
}

function average(ratings: Record<string, number> | undefined): number {
  const v = Object.values(ratings ?? {});
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

const comma = (n: number) => n.toFixed(1).replace('.', ',');

/** Monday of the week `d` is in, as a week count, to group days by week. */
function weekIndex(d: Date): number {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return Math.round(monday.getTime() / (7 * 86_400_000));
}

const leadDish = (day: MenuDay) => day.dishes.find((d) => d.imageUrl) ?? day.dishes[0];

// ── the plate, fork and knife ─────────────────────────────────────────────
// Drawn with light and material: a glazed ceramic plate (dark stoneware in
// the dark theme; colours in globals.css, .plate) and polished steel.

function Food({ dish, alt }: { dish: Dish; alt: string }) {
  // Photos from recipe sites unless the visitor hid them (lib/external-media.ts).
  const external = useExternalMedia();
  return dish.imageUrl && external ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={dish.imageUrl} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" />
  ) : (
    <span className={`absolute inset-0 grid place-items-center ${TONE[dishTone(dish)]}`}>
      <ForkKnife size="34%" weight="duotone" aria-hidden="true" />
    </span>
  );
}

/** A dish photo served on a round plate: rim, well, glaze. */
function Plate({ dish, alt, className = '' }: { dish: Dish; alt: string; className?: string }) {
  return (
    <span className={`plate relative block aspect-square rounded-full ${className}`}>
      <span aria-hidden="true" className="plate-well absolute inset-[7%] rounded-full" />
      <span className="absolute inset-[11%] overflow-hidden rounded-full">
        <Food dish={dish} alt={alt} />
        <span aria-hidden="true" className="absolute inset-0 rounded-full shadow-[inset_0_6px_18px_rgb(0_0_0/0.28)]" />
      </span>
      <span aria-hidden="true" className="plate-glaze pointer-events-none absolute inset-0 rounded-full" />
    </span>
  );
}

/** Polished steel: a sheen across the piece and a light from above. */
function Steel({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-steel`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" style={{ stopColor: 'var(--steel-1)' }} />
        <stop offset="0.3" style={{ stopColor: 'var(--steel-2)' }} />
        <stop offset="0.5" style={{ stopColor: 'var(--steel-3)' }} />
        <stop offset="0.68" style={{ stopColor: 'var(--steel-4)' }} />
        <stop offset="1" style={{ stopColor: 'var(--steel-5)' }} />
      </linearGradient>
      <linearGradient id={`${id}-shine`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.6" />
        <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

const FORK = 'M6 7a2.25 2.25 0 0 1 4.5 0V56h3.7V7a2.25 2.25 0 0 1 4.5 0V56h2.6V7a2.25 2.25 0 0 1 4.5 0V56h3.7V7a2.25 2.25 0 0 1 4.5 0V62C34 74 26 82 23 92C22 100 22 108 22.6 116C24.5 146 26.5 176 26 202C25.7 211 23 216 20 216C17 216 14.3 211 14 202C13.5 176 15.5 146 17.4 116C18 108 18 100 17 92C14 82 6 74 6 62Z';
// A table knife seen from above: a broad blade with a straight back and a
// curved edge, a short bolster, a rounded handle.
const BLADE = 'M27 4C31.5 12 32 46 31 104H9.5C9 76 10.5 46 15 26C18 13 21.5 6.5 27 4Z';
const HANDLE = 'M12 111H28.6C29.7 148 29.3 184 28.2 204C27.8 211 24.8 216 20.3 216C15.8 216 12.8 211 12.4 204C11.3 184 10.9 148 12 111Z';

function Fork({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 220" className={`cutlery ${className}`} aria-hidden="true">
      <Steel id={id} />
      <path d={FORK} fill={`url(#${id}-steel)`} />
      <path d={FORK} fill={`url(#${id}-shine)`} opacity="0.5" />
      <path d="M19.2 120C18 150 17.2 178 17.6 200" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function Knife({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 220" className={`cutlery ${className}`} aria-hidden="true">
      <Steel id={id} />
      <path d={BLADE} fill={`url(#${id}-steel)`} />
      <path d={BLADE} fill={`url(#${id}-shine)`} opacity="0.45" />
      <path d="M29.6 16C30.6 36 30.8 66 30.3 100" stroke="#fff" strokeOpacity="0.6" strokeWidth="1" strokeLinecap="round" fill="none" />
      <rect x="10.5" y="103" width="20" height="9" rx="3" fill={`url(#${id}-steel)`} />
      <path d={HANDLE} fill={`url(#${id}-steel)`} />
      <path d={HANDLE} fill={`url(#${id}-shine)`} opacity="0.4" />
      <path d="M18.4 122C17.8 150 17.8 178 18.2 200" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ── the served dish, rendered ─────────────────────────────────────────────

// plateScene VIEW / FOOD_SHARE, duplicated so three.js loads lazily
const VIEW = { w: 8.6, h: 4.9 };
const FOOD_SHARE = 2.5 / VIEW.w;

/**
 * The next dish on a real plate between fork and knife (three.js, see
 * plateScene.ts); the photo lies in the plate's well as an HTML layer.
 * Without WebGL the flat drawing stands in.
 */
function ServedPlate({ dish, alt }: { dish: Dish; alt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flat, setFlat] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: PlateScene | null = null;
    let disposed = false;
    let offTheme = () => {};
    const ro = new ResizeObserver(() => scene?.resize());
    import('./plateScene').then(({ createPlateScene }) => {
      if (disposed) return;
      scene = createPlateScene(canvas, document.documentElement.classList.contains('dark'));
      if (!scene) {
        setFlat(true);
        return;
      }
      ro.observe(canvas);
      offTheme = onSiteThemeChange((dark) => scene?.setTheme(dark));
    }).catch(() => setFlat(true));
    return () => {
      disposed = true;
      ro.disconnect();
      offTheme();
      scene?.dispose();
    };
  }, []);

  if (flat) {
    return (
      <span className="flex items-center justify-center gap-[clamp(12px,2.6vw,32px)]">
        <Fork className="h-[clamp(170px,26vw,320px)] w-auto" />
        <Plate dish={dish} alt={alt} className="w-[min(60vw,440px)]" />
        <Knife className="h-[clamp(170px,26vw,320px)] w-auto" />
      </span>
    );
  }
  return (
    <span className="relative block w-full" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
      {/* The food lies in the well: a soft shadow where it rests, its edge
          fading into the glaze instead of a cut-out circle. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: `${FOOD_SHARE * 88}%`,
          aspectRatio: '1',
          transform: 'translate(-48%, -47%)',
          background: 'radial-gradient(circle closest-side, rgb(0 0 0 / 0.22), rgb(0 0 0 / 0.1) 70%, transparent)',
        }}
      />
      <span
        className="absolute left-1/2 top-1/2 overflow-hidden rounded-full"
        style={{
          width: `${FOOD_SHARE * 100}%`,
          aspectRatio: '1',
          transform: 'translate(-50%, -50%)',
          WebkitMaskImage: 'radial-gradient(circle closest-side, #000 78%, rgb(0 0 0 / 0.75) 88%, transparent 99%)',
          maskImage: 'radial-gradient(circle closest-side, #000 78%, rgb(0 0 0 / 0.75) 88%, transparent 99%)',
        }}
      >
        <Food dish={dish} alt={alt} />
      </span>
    </span>
  );
}

// ── small pieces ───────────────────────────────────────────────────────────

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} weight="fill" className="absolute inset-0 text-ink opacity-15" />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} weight="fill" color={STAR} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function Tag({ tag }: { tag: string }) {
  const tone = tagTone(tag);
  return <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${tone ? TONE[tone] : 'bg-inset text-ink-2'}`}>{tag}</span>;
}

function RatingLine({ ratings }: { ratings: Record<string, number> | undefined }) {
  const t = useT(mensaDict);
  const count = Object.keys(ratings ?? {}).length;
  const avg = average(ratings);
  return (
    <span className="flex items-center gap-2 text-[14px] text-ink-2">
      <Stars value={avg} size={15} />
      {count ? (
        <span className="tabular-nums">
          {comma(avg)} · {count === 1 ? t('ratingOne') : t('ratingMany', { n: count })}
        </span>
      ) : (
        <span>{t('noRatingYet')}</span>
      )}
    </span>
  );
}

// ── the dish sheet ─────────────────────────────────────────────────────────

function LoginRequired({ onCancel }: { onCancel: () => void }) {
  const t = useT(mensaDict);
  const tc = useT(commonDict);
  const localize = useLocalizeHref();
  return (
    <div
      className="fixed inset-0 z-[130] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      // Stop here so closing this dialog doesn't also close the dish sheet behind it
      onClick={(e) => { e.stopPropagation(); onCancel(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="mensa-login-title" className="sheet-in w-full max-w-sm rounded-[28px] bg-[var(--paper)] p-7" onClick={(e) => e.stopPropagation()}>
        <span className="grid size-11 place-items-center rounded-full bg-periwinkle text-periwinkle-ink">
          <Lock size={20} weight="bold" aria-hidden="true" />
        </span>
        <p id="mensa-login-title" className="mt-4 text-[20px] font-extrabold tracking-[-0.02em] text-ink">{t('loginRequired')}</p>
        <p className="mt-1.5 text-[15px] leading-[1.55] text-ink-2">{t('loginRequiredText')}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="key key-lilac flex-1">{tc('cancel')}</button>
          <Link href={localize(LOGIN_HREF)} className="key flex-1">{tc('login')}</Link>
        </div>
      </div>
    </div>
  );
}

/** A titled part of the sheet, set off by a hairline. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line-soft px-6 py-6 md:px-8">
      <h3 className="text-[17px] font-bold tracking-[-0.01em] text-ink">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DishSheet({
  dish,
  dayLabel,
  stableUid,
  isAdmin,
  isGuest,
  onClose,
  onRated,
}: {
  dish: Dish;
  dayLabel: string;
  stableUid: string | null;
  isAdmin: boolean;
  isGuest: boolean;
  onClose: () => void;
  onRated: (dishId: string, ratings: Record<string, number>) => void;
}) {
  const t = useT(mensaDict);
  const tc = useT(commonDict);
  const { locale } = useLocale();
  const [ratingsData, setRatingsData] = useState<DishRatingsData>({ ratings: {}, myRating: null });
  const [saving, setSaving] = useState(false);
  const [hover, setHover] = useState(0);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [loginRequired, setLoginRequired] = useState(false);
  const requireLogin = useCallback(() => setLoginRequired(true), []);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const name = localized(dish.name, locale);
  const labels = t('rateLabels').split('|');

  useEffect(() => {
    // Initial ratings (guests get anonymised read-only data), then live updates.
    api.dishRatings.get(dish.id)
      .then((data) => { setRatingsData(data); onRated(dish.id, data.ratings); })
      .catch(() => {});
    const unsubRatings = api.dishRatings.subscribe(dish.id, (data) => {
      setRatingsData(data);
      onRated(dish.id, data.ratings);
    });
    api.dishComments.list(dish.id)
      .then((c) => { setComments(c); setCommentsLoading(false); })
      .catch(() => setCommentsLoading(false));
    const unsubComments = api.dishComments.subscribe(dish.id, (c) => {
      setComments(c);
      setCommentsLoading(false);
    });
    return () => { unsubRatings(); unsubComments(); };
  }, [dish.id, onRated]);

  // The page stays put behind the sheet; Escape closes it.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loginRequired) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      html.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, loginRequired]);

  // Own changes show immediately even if the live stream is reconnecting;
  // everyone else gets them through the subscription above.
  const refreshComments = () => api.dishComments.list(dish.id).then(setComments).catch(() => {});
  const myRating = ratingsData.myRating ?? 0;

  async function rate(stars: number) {
    if (isGuest) {
      requireLogin();
      return;
    }
    if (!stableUid || saving) return;
    setSaving(true);
    try {
      const data = await api.dishRatings.rate(dish.id, stars);
      setRatingsData(data);
      onRated(dish.id, data.ratings);
    } catch (e) {
      console.warn('[mensa] rating could not be saved:', e);
    } finally {
      setSaving(false);
    }
  }

  const values = Object.values(ratingsData.ratings);
  const count = values.length;
  const avg = average(ratingsData.ratings);
  const bins = [5, 4, 3, 2, 1].map((s) => values.filter((v) => Math.round(v) === s).length);
  const maxBin = Math.max(1, ...bins);
  const shown = hover || myRating;

  const macros = [
    { label: t('protein'), value: dish.protein, bar: 'bg-blush-ink' },
    { label: t('carbsLong'), value: dish.carbs, bar: 'bg-butter-ink' },
    { label: t('fat'), value: dish.fat, bar: 'bg-periwinkle-ink' },
  ].filter((m): m is { label: string; value: number; bar: string } => typeof m.value === 'number' && m.value > 0);
  const macroTotal = macros.reduce((a, m) => a + m.value, 0);

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 backdrop-blur-[2px] md:items-center md:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={name}
        className="sheet-in relative flex max-h-[94dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[28px] bg-[var(--paper)] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.5)] md:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Photo, edge to edge */}
          <div className="relative w-full shrink-0 overflow-hidden" style={{ height: 'clamp(170px, 26vh, 220px)' }}>
            <Food dish={dish} alt={name} />
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
            <span aria-hidden="true" className="absolute left-1/2 top-2.5 h-1.5 w-11 -translate-x-1/2 rounded-full bg-white/70 md:hidden" />
            <button
              ref={closeBtn}
              type="button"
              onClick={onClose}
              aria-label={tc('close')}
              className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-[var(--paper)] text-ink shadow-[0_4px_14px_rgb(0_0_0/0.25)] transition-transform active:scale-95"
            >
              <X size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>

          {/* What it is */}
          <div className="px-6 pb-6 pt-6 md:px-8">
            <h2 className="text-[clamp(25px,3.2vw,32px)] font-extrabold leading-[1.12] tracking-[-0.035em] text-ink">{name}</h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-2">
              <span className="font-semibold text-ink">{dayLabel}</span>
              {dish.calories != null && (<><span aria-hidden="true">·</span><span className="tabular-nums">{dish.calories} kcal</span></>)}
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Star size={14} weight="fill" color={STAR} aria-hidden="true" />
                <span className="font-semibold tabular-nums text-ink">{count ? comma(avg) : '-'}</span>
                <span className="tabular-nums">({count})</span>
              </span>
            </p>
            {dish.description && <p className="mt-3 text-[16px] leading-[1.6] text-ink-2">{localized(dish.description, locale)}</p>}
            {!!dish.tags?.length && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {prioritizedTags(dish.tags).map((tag) => <Tag key={tag} tag={tag} />)}
              </div>
            )}
          </div>

          <Section title={t('rating')}>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-6">
              <div className="min-w-[88px] text-center">
                <p className="text-[44px] font-extrabold leading-none tracking-[-0.05em] tabular-nums text-ink">{count ? comma(avg) : '-'}</p>
                <div className="mt-2 flex justify-center"><Stars value={avg} size={13} /></div>
                <p className="mt-1.5 text-[12px] text-ink-3">{count ? (count === 1 ? t('ratingOne') : t('ratingMany', { n: count })) : t('noRatingYet')}</p>
              </div>
              <ul className="flex flex-col gap-1.5" aria-hidden="true">
                {bins.map((n, i) => (
                  <li key={i} className="grid grid-cols-[12px_minmax(0,1fr)_22px] items-center gap-2 text-[12px] tabular-nums text-ink-3">
                    <span>{5 - i}</span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-inset">
                      <span className="block h-full rounded-full bg-[#F5B301] transition-[width] duration-700 ease-[var(--ease-out)]" style={{ width: `${(n / maxBin) * 100}%` }} />
                    </span>
                    <span className="text-right">{n}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The own rating */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-inset px-4 py-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-ink">{t('yourRating')}</p>
                <p className="h-5 text-[13px] text-ink-2" aria-live="polite">{shown ? labels[shown - 1] : ' '}</p>
              </div>
              <div className="flex" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((s) => {
                  const active = s <= shown;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => rate(s)}
                      onMouseEnter={() => setHover(s)}
                      onFocus={() => setHover(s)}
                      onBlur={() => setHover(0)}
                      aria-label={`${s}/5 · ${labels[s - 1] ?? ''}`}
                      aria-pressed={myRating === s}
                      className="grid size-11 place-items-center rounded-full transition-[background-color,scale] duration-200 hover:bg-[var(--paper)] active:scale-90"
                    >
                      <Star size={28} weight={active ? 'fill' : 'regular'} color={active ? STAR : 'var(--ink-3)'} />
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          {(dish.calories != null || macros.length > 0) && (
            <Section title={t('nutrition')}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {dish.calories != null && (
                  <div className="rounded-2xl bg-inset px-4 py-3">
                    <p className="text-[18px] font-extrabold tabular-nums tracking-[-0.02em] text-ink">{dish.calories}</p>
                    <p className="text-[12px] text-ink-2">kcal</p>
                  </div>
                )}
                {macros.map((m) => (
                  <div key={m.label} className="rounded-2xl bg-inset px-4 py-3">
                    <p className="text-[18px] font-extrabold tabular-nums tracking-[-0.02em] text-ink">{m.value} g</p>
                    <p className="flex items-center gap-1.5 text-[12px] text-ink-2">
                      <span aria-hidden="true" className={`size-2 rounded-full ${m.bar}`} />
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
              {macroTotal > 0 && (
                <div className="mt-3 flex h-2 gap-1 overflow-hidden rounded-full" aria-hidden="true">
                  {macros.map((m) => <span key={m.label} className={`block h-full rounded-full ${m.bar}`} style={{ width: `${(m.value / macroTotal) * 100}%` }} />)}
                </div>
              )}
            </Section>
          )}

          {!!dish.allergens?.length && (
            <Section title={t('allergens')}>
              <div className="flex flex-wrap gap-1.5">
                {dish.allergens.map((a) => <span key={a} className="rounded-full border border-line px-3 py-1 text-[13px] font-semibold text-ink">{a}</span>)}
              </div>
            </Section>
          )}

          <Section title={t('comments')}>
            {isGuest ? (
              <GuestCommentsLock loginHref={LOGIN_HREF}>
                <CommentSection
                  comments={comments}
                  stableUid={null}
                  isAdmin={false}
                  loading={commentsLoading}
                  onAdd={() => Promise.resolve()}
                  onEdit={() => Promise.resolve()}
                  onDelete={() => Promise.resolve()}
                  onRequireLogin={requireLogin}
                />
              </GuestCommentsLock>
            ) : (
              <CommentSection
                comments={comments}
                stableUid={stableUid}
                isAdmin={isAdmin}
                loading={commentsLoading}
                onAdd={(body) => api.dishComments.create(dish.id, body).then(refreshComments)}
                onEdit={(commentId, body) => api.dishComments.update(dish.id, commentId, body).then(refreshComments)}
                onDelete={(commentId) => api.dishComments.delete(dish.id, commentId).then(refreshComments)}
              />
            )}
          </Section>
        </div>
      </div>

      {loginRequired && <LoginRequired onCancel={() => setLoginRequired(false)} />}
    </div>
  );
}

// ── the page ───────────────────────────────────────────────────────────────

export default function MensaClient() {
  const t = useT(mensaDict);
  const { locale } = useLocale();
  const { tag } = useDateLocale();
  const { stableUid } = useApp();
  const { user, isLoading: sessionLoading } = useSession();
  const isGuest = !sessionLoading && !user;

  const [days, setDays] = useState<MenuDay[] | null>(null);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(0);
  const [selected, setSelected] = useState<{ dish: Dish; day: MenuDay } | null>(null);
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  // Prevents a double fetch when both stableUid and the menu arrive together.
  const ratingsFetched = useRef(false);

  useEffect(() => {
    if (!stableUid) return;
    api.auth.me().then((u) => setIsAdmin(u.isAdmin)).catch(() => {});
  }, [stableUid]);

  // Guests see the public menu; a signed-in account (the app's /canteen) its own school's.
  const scope = user ? 'account' : 'public';
  useEffect(() => {
    if (sessionLoading) return;
    let cancelled = false;
    fetchMensa(scope)
      .then((raw) => { if (!cancelled) setDays(upcomingDays(dishesFrom(raw))); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : t('loadError')); });
    return () => { cancelled = true; };
  }, [request, t, scope, sessionLoading]);

  const retry = () => {
    setDays(null);
    setError('');
    ratingsFetched.current = false;
    setRequest((n) => n + 1);
  };

  // Ratings for every dish at once once the menu is there (guests get the
  // anonymised ones without waiting for a stableUid).
  useEffect(() => {
    if ((!stableUid && !isGuest) || !days?.length || ratingsFetched.current) return;
    ratingsFetched.current = true;
    api.dishRatings.getBatch(days.flatMap((d) => d.dishes.map((dish) => dish.id)))
      .then((batch) => {
        const next: Record<string, Record<string, number>> = {};
        for (const [id, data] of Object.entries(batch)) if (Object.keys(data.ratings).length) next[id] = data.ratings;
        setRatings(next);
      })
      // Ratings are extra: without them the plan still shows (e.g. locally,
      // where the backend refuses the dev origin), so only a warning.
      .catch((e) => console.warn('[mensa] ratings could not be loaded:', e));
  }, [stableUid, isGuest, days]);

  const handleRated = useCallback((dishId: string, r: Record<string, number>) => {
    setRatings((prev) => ({ ...prev, [dishId]: r }));
  }, []);

  // Votes from anyone, also from the Android app, show up live.
  useEffect(() => {
    if (!stableUid) return;
    return api.dishRatings.subscribeAll((dishId, data) => handleRated(dishId, data.ratings));
  }, [stableUid, handleRated]);

  const dayLabel = useCallback((day: MenuDay) => {
    const n = daysFromToday(day.date);
    if (n <= 0) return t('today');
    if (n === 1) return t('tomorrow');
    return formatDate(day.date, tag, { weekday: 'long', day: 'numeric', month: 'long' });
  }, [t, tag]);

  const weeks = useMemo(() => {
    if (!days) return [];
    const now = weekIndex(new Date());
    const groups = new Map<number, MenuDay[]>();
    for (const d of days) {
      const w = weekIndex(d.date);
      if (!groups.has(w)) groups.set(w, []);
      groups.get(w)!.push(d);
    }
    return [...groups.entries()].map(([w, list]) => ({
      key: w,
      title: w === now ? t('thisWeek') : w === now + 1 ? t('nextWeek') : t('fromDate', { date: formatDate(list[0].date, tag, { day: 'numeric', month: 'long' }) }),
      days: list,
    }));
  }, [days, t, tag]);

  // Client page without its own metadata on navigation: keep the tab title in the current language.
  useEffect(() => { document.title = `${t('title')} | POKYH`; }, [t]);

  const next = days?.[0] ?? null;
  const served = next ? leadDish(next) : null;
  const open = (dish: Dish, day: MenuDay) => setSelected({ dish, day });

  return (
    <>
      <PageIntro title={t('pageTitle')} lead={t('pageLead')} />

      <section className="wrap pb-24 md:pb-32">
        {error ? (
          <div className="card flex flex-col items-start gap-5 p-8">
            <p className="text-[18px] text-ink-2">{t('loadError')}</p>
            <button type="button" onClick={retry} className="key">{t('retry')}</button>
          </div>
        ) : days === null ? (
          <div className="grid items-center gap-10 md:grid-cols-[1fr_1fr]">
            <div className="skeleton mx-auto aspect-square w-[min(70vw,420px)] rounded-full" />
            <div className="flex flex-col gap-4">
              <div className="skeleton h-5 w-40 rounded-full" />
              <div className="skeleton h-12 w-4/5 rounded-2xl" />
              <div className="skeleton h-5 w-56 rounded-full" />
            </div>
          </div>
        ) : !next || !served ? (
          <div className="card p-8 md:p-12">
            <p className="text-[clamp(26px,3vw,36px)] font-extrabold tracking-[-0.035em] text-ink">{t('emptyTitle')}</p>
            <p className="mt-2 text-[17px] text-ink-2">{t('emptySubtitle')}</p>
          </div>
        ) : (
          <>
            {/* The next dish, served */}
            <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-14">
              <button
                type="button"
                onClick={() => open(served, next)}
                aria-label={localized(served.name, locale)}
                className="rise mx-auto block w-full max-w-[640px]"
              >
                <ServedPlate key={served.id} dish={served} alt={localized(served.name, locale)} />
              </button>

              <div className="rise flex flex-col items-start gap-4">
                <p className="text-[15px] font-semibold text-ink-3">{dayLabel(next)}</p>
                <h2 className="text-[clamp(32px,4.2vw,58px)] font-extrabold leading-[1.04] tracking-[-0.045em] text-ink">{localized(served.name, locale)}</h2>
                {served.description && <p className="max-w-[46ch] text-[17px] leading-[1.65] text-ink-2 md:text-[18px]">{localized(served.description, locale)}</p>}
                <RatingLine ratings={ratings[served.id]} />
                {!!served.tags?.length && (
                  <div className="flex flex-wrap gap-1.5">
                    {prioritizedTags(served.tags).slice(0, 4).map((tg) => <Tag key={tg} tag={tg} />)}
                  </div>
                )}
                <button type="button" onClick={() => open(served, next)} className="key key-lg mt-2">
                  {t('rateAndComment')}
                  <span aria-hidden="true" className="key-arrow">→</span>
                </button>
                {next.dishes.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {next.dishes.filter((d) => d !== served).map((d) => (
                      <button key={d.id} type="button" onClick={() => open(d, next)} className="flex items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-4 text-[14px] font-semibold text-ink hover:bg-inset">
                        <Plate dish={d} alt="" className="w-9" />
                        {localized(d.name, locale)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {days.some((d) => d.dishes.some((dish) => dish.imageUrl)) && (
              <ExternalMediaNotice className="mt-12 max-w-[640px]" />
            )}

            {/* The whole plan, by week */}
            <h2 className="mt-24 text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[1.04] tracking-[-0.045em] text-ink md:mt-32">{t('allDays')}</h2>
            {weeks.map((w) => (
              <div key={w.key} className="mt-10">
                <h3 className="text-[15px] font-semibold text-ink-3">{w.title}</h3>
                <ul className="mt-4 grid gap-3 md:grid-cols-2">
                  {w.days.flatMap((day) => day.dishes.map((dish) => (
                    <li key={dish.id}>
                      <button type="button" onClick={() => open(dish, day)} className="card flex w-full items-center gap-4 p-3 pr-5 text-left transition-colors hover:bg-inset">
                        <Plate dish={dish} alt="" className="w-[76px] shrink-0 md:w-[88px]" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold text-ink-3">{dayLabel(day)}</span>
                          <span className="mt-0.5 block truncate text-[17px] font-bold tracking-[-0.015em] text-ink">{localized(dish.name, locale)}</span>
                          <span className="mt-1 block"><RatingLine ratings={ratings[dish.id]} /></span>
                        </span>
                      </button>
                    </li>
                  )))}
                </ul>
              </div>
            ))}
          </>
        )}
      </section>

      {selected && (
        <DishSheet
          dish={selected.dish}
          dayLabel={dayLabel(selected.day)}
          stableUid={stableUid}
          isAdmin={isAdmin}
          isGuest={isGuest}
          onClose={() => setSelected(null)}
          onRated={handleRated}
        />
      )}
    </>
  );
}
