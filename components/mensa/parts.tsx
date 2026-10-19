'use client';

import Link from 'next/link';
import { ForkKnife, Lock, Star } from '@phosphor-icons/react';
import { TONE, type SiteTone } from '@/components/site/PageIntro';
import type { Dish } from '@/lib/types';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { mensaDict } from '@/lib/i18n/dictionaries/mensa';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { useExternalMedia } from '@/lib/external-media';
import PixelPlate, { type FoodStyle } from './PixelPlate';

// Pieces the Mensa plan and the dish pages share: the dish on a small plate,
// stars, diet tags and the sign-in question for guests.

export const STAR = '#F5B301';

/** Where a guest signs in to rate and comment, and comes back to. */
export const loginHref = (back: string) => `/login?next=${encodeURIComponent(back)}`;

/** A dish's own page: in the app for accounts, on the public site for guests. */
export const dishHref = (id: string, signedIn: boolean) => `${signedIn ? '/canteen' : '/mensa'}/dish/${encodeURIComponent(id)}`;

export function prioritizedTags(tags?: string[]): string[] {
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
export function dishTone(dish: Dish): SiteTone {
  const c = `${dish.category ?? ''} ${(dish.tags ?? []).join(' ')}`.toLowerCase();
  if (c.includes('salat') || c.includes('vegan') || c.includes('vegetar')) return 'sage';
  if (c.includes('suppe') || c.includes('pasta') || c.includes('nudel')) return 'butter';
  if (c.includes('fisch')) return 'periwinkle';
  return 'blush';
}

/** Which pixel meal stands in for a dish without a photo. */
export function foodStyleOf(dish: Dish): FoodStyle {
  return ({ sage: 'salad', butter: 'pasta', periwinkle: 'fish', blush: 'meat', mint: 'salad' } as const)[dishTone(dish)];
}

export function average(ratings: Record<string, number> | undefined): number {
  const v = Object.values(ratings ?? {});
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

export const comma = (n: number) => n.toFixed(1).replace('.', ',');

/** The dish photo, unless the visitor hid outside pictures (lib/external-media.ts). */
export function Food({ dish, alt, eager = false }: { dish: Dish; alt: string; eager?: boolean }) {
  const external = useExternalMedia();
  return dish.imageUrl && external ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dish.imageUrl}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      className="absolute inset-0 h-full w-full object-cover"
    />
  ) : (
    <span className={`absolute inset-0 grid place-items-center ${TONE[dishTone(dish)]}`}>
      <ForkKnife size="34%" weight="duotone" aria-hidden="true" />
    </span>
  );
}

/** A dish on the small pixel plate (without cutlery), for rows and chips. */
export function Plate({ dish, className = '' }: { dish: Dish; className?: string }) {
  const external = useExternalMedia();
  return (
    <PixelPlate
      size="plate"
      photo={external ? dish.imageUrl : null}
      style={foodStyleOf(dish)}
      seed={dish.id}
      className={className}
    />
  );
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
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

export function Tag({ tag }: { tag: string }) {
  const tone = tagTone(tag);
  return <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${tone ? TONE[tone] : 'bg-inset text-ink-2'}`}>{tag}</span>;
}

export function RatingLine({ ratings }: { ratings: Record<string, number> | undefined }) {
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

/** Asks a guest to sign in before rating or commenting. */
export function LoginRequired({ onCancel, back }: { onCancel: () => void; back: string }) {
  const t = useT(mensaDict);
  const tc = useT(commonDict);
  const localize = useLocalizeHref();
  return (
    <div className="fixed inset-0 z-[130] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-labelledby="mensa-login-title" className="sheet-in w-full max-w-sm rounded-[28px] bg-[var(--paper)] p-7" onClick={(e) => e.stopPropagation()}>
        <span className="grid size-11 place-items-center rounded-full bg-periwinkle text-periwinkle-ink">
          <Lock size={20} weight="bold" aria-hidden="true" />
        </span>
        <p id="mensa-login-title" className="mt-4 text-[20px] font-extrabold tracking-[-0.02em] text-ink">{t('loginRequired')}</p>
        <p className="mt-1.5 text-[15px] leading-[1.55] text-ink-2">{t('loginRequiredText')}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="key key-lilac flex-1">{tc('cancel')}</button>
          <Link href={localize(loginHref(back))} className="key flex-1">{tc('login')}</Link>
        </div>
      </div>
    </div>
  );
}
