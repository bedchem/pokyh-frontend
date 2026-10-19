'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, Star } from '@phosphor-icons/react';
import CommentSection from '@/components/ui/CommentSection';
import GuestCommentsLock from '@/components/ui/GuestCommentsLock';
import PixelState from '@/components/app/PixelState';
import ExternalMediaNotice from '@/components/ExternalMediaNotice';
import { api, type ApiComment, type DishRatingsData } from '@/lib/api-client';
import { CHOICE_PARAM, daysFromToday, dishesFrom, localized, upcomingDays, type MenuDay, type MenuDish } from '@/lib/mensa';
import { useExternalMedia } from '@/lib/external-media';
import { formatDate } from '@/lib/i18n/dateLocale';
import { mensaDict } from '@/lib/i18n/dictionaries/mensa';
import { useApp } from '@/providers/AppProvider';
import { useSession } from '@/providers/SessionProvider';
import { useDateLocale, useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import PixelPlate from './PixelPlate';
import { useMenu } from './useMenu';
import { Food, LoginRequired, STAR, Stars, Tag, average, comma, foodStyleOf, loginHref, prioritizedTags } from './parts';

// One dish on its own page (the Mensa plan links here instead of opening a
// sheet): the photo large, what it is, how the school rated it and the own
// rating, nutrition, allergens and the comments. Guests read everything but
// the comments; rating and commenting need an account of the canteen's
// school (useMenu: another school's canteen is seen as a guest sees it).

function find(raw: unknown, id: string): { dish: MenuDish; day: MenuDay } | null {
  for (const day of upcomingDays(dishesFrom(raw))) {
    const dish = day.dishes.find((d) => d.id === id);
    if (dish) return { dish, day };
  }
  // A dish of an earlier day, still in the stored menu.
  const dish = dishesFrom(raw).find((d) => d.id === id);
  if (!dish) return null;
  const key = String(dish.date ?? '').slice(0, 10);
  const [y, m, d] = key.split('-').map(Number);
  return { dish, day: { key, date: y ? new Date(y, m - 1, d) : new Date(), dishes: [dish] } };
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line-soft py-7 md:py-8">
      <h2 className="text-[19px] font-extrabold tracking-[-0.02em] text-ink md:text-[21px]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function DishView({ id, inApp = false }: { id: string; inApp?: boolean }) {
  const t = useT(mensaDict);
  const { locale } = useLocale();
  const { tag } = useDateLocale();
  const localize = useLocalizeHref();
  const external = useExternalMedia();
  const { stableUid } = useApp();
  const { user, isLoading: sessionLoading } = useSession();
  const isGuest = !sessionLoading && !user;
  // Reached without a canteen named (an old link), the default one.
  const menu = useMenu({ inApp, ask: false });
  // Signed in, but this is another school's canteen: read as a guest.
  const visitor = !!user && menu.settled && !menu.own;
  const school = menu.readSchool;
  const choice = !inApp && menu.chosen ? `?${CHOICE_PARAM}=${encodeURIComponent(menu.chosen)}` : '';
  const planHref = inApp ? '/canteen' : '/mensa';
  const selfHref = `${planHref}/dish/${encodeURIComponent(id)}${choice}`;
  const [ratingsData, setRatingsData] = useState<DishRatingsData>({ ratings: {}, myRating: null });
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hover, setHover] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const requireLogin = useCallback(() => setLoginRequired(true), []);

  // The dish in its canteen's menu (useMenu shows the stored menu at once).
  const found = useMemo(() => (menu.raw === undefined ? undefined : find(menu.raw, id)), [menu.raw, id]);
  const error = menu.error;

  useEffect(() => {
    if (!stableUid) return;
    api.auth.me().then((u) => setIsAdmin(u.isAdmin)).catch(() => {});
  }, [stableUid]);

  // Ratings (guests get them anonymised) and comments once it is known whose
  // canteen this is, then live updates of the account's own.
  const settled = menu.settled;
  const own = menu.own;
  useEffect(() => {
    if (!settled) return;
    let alive = true;
    api.dishRatings.get(id, school).then((r) => { if (alive) setRatingsData(r); }).catch(() => {});
    api.dishComments.list(id, school).then((c) => { if (alive) setComments(c); }).catch(() => {}).finally(() => { if (alive) setCommentsLoading(false); });
    if (!own) return () => { alive = false; };
    const offRatings = api.dishRatings.subscribe(id, setRatingsData);
    const offComments = api.dishComments.subscribe(id, (c) => { setComments(c); setCommentsLoading(false); });
    return () => { alive = false; offRatings(); offComments(); };
  }, [id, settled, own, school]);

  const name = found ? localized(found.dish.name, locale) : '';
  useEffect(() => {
    // Inside the app the tab keeps its plain name (app layout).
    if (name && !inApp) document.title = `${name} | ${t('title')} | POKYH`;
  }, [name, t, inApp]);

  const refreshComments = () => api.dishComments.list(id, school).then(setComments).catch(() => {});
  const myRating = ratingsData.myRating ?? 0;
  const labels = t('rateLabels').split('|');
  const values = Object.values(ratingsData.ratings);
  const count = values.length;
  const avg = average(ratingsData.ratings);
  const bins = [5, 4, 3, 2, 1].map((s) => values.filter((v) => Math.round(v) === s).length);
  const maxBin = Math.max(1, ...bins);
  const shown = hover || myRating;

  async function rate(stars: number) {
    if (isGuest) { requireLogin(); return; }
    if (!stableUid || saving || visitor) return;
    setSaving(true);
    try {
      setRatingsData(await api.dishRatings.rate(id, stars));
    } catch (e) {
      console.warn('[mensa] rating could not be saved:', e);
    } finally {
      setSaving(false);
    }
  }

  const dayLabel = useMemo(() => {
    if (!found) return '';
    const n = daysFromToday(found.day.date);
    if (n === 0) return t('today');
    if (n === 1) return t('tomorrow');
    return formatDate(found.day.date, tag, { weekday: 'long', day: 'numeric', month: 'long' });
  }, [found, t, tag]);

  const dish = found?.dish;
  const macros = dish ? [
    { label: t('protein'), value: dish.protein, bar: 'bg-blush-ink' },
    { label: t('carbsLong'), value: dish.carbs, bar: 'bg-butter-ink' },
    { label: t('fat'), value: dish.fat, bar: 'bg-periwinkle-ink' },
  ].filter((m): m is { label: string; value: number; bar: string } => typeof m.value === 'number' && m.value > 0) : [];
  const macroTotal = macros.reduce((a, m) => a + m.value, 0);

  // The way back stays beside the dish: on wide screens it travels down with
  // the picture (the column is sticky), above it while loading or on errors.
  const back = (
    <Link
      href={localize(planHref + choice)}
      className="-ml-1 mb-6 inline-flex h-9 items-center gap-1.5 rounded-full pl-1 pr-3 text-[15px] font-semibold text-ink-2 transition-colors hover:bg-inset hover:text-ink"
    >
      <ArrowLeft size={17} weight="bold" aria-hidden="true" />
      {t('backToPlan')}
    </Link>
  );

  return (
    <section className={`wrap pb-24 md:pb-32 ${inApp ? 'pt-4 md:pt-8' : 'pt-28 md:pt-36'}`}>
      {(found === undefined || error || !found || !dish) && back}

      {found === undefined && !error ? (
        <div aria-hidden="true" className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-14">
          <div className="skeleton aspect-[4/3] w-full rounded-[32px]" />
          <div className="flex flex-col gap-4 pt-2">
            <div className="skeleton h-5 w-40 rounded-full" />
            <div className="skeleton h-12 w-4/5 rounded-2xl" />
            <div className="skeleton h-5 w-56 rounded-full" />
            <div className="skeleton mt-6 h-28 w-full rounded-3xl" />
          </div>
        </div>
      ) : error || !found || !dish ? (
        <div className="card">
          <PixelState
            sprite={error ? 'unplugged' : 'search'}
            title={error ? t('loadError') : t('dishGone')}
            action={<Link href={localize(planHref + choice)} className="key">{t('backToPlan')}</Link>}
          />
        </div>
      ) : (
        <article className="rise grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-14">
          <div className={`md:sticky md:self-start ${inApp ? 'md:top-4' : 'md:top-24'}`}>
            {back}
            {dish.imageUrl && external ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-inset md:rounded-[36px]">
                <Food dish={dish} alt={name} eager />
              </div>
            ) : (
              <PixelPlate style={foodStyleOf(dish)} seed={dish.id} />
            )}
            {dish.imageUrl && <ExternalMediaNotice className="mt-4" />}
          </div>

          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink-3 first-letter:uppercase">{dayLabel}</p>
            <h1 className="mt-2 text-[clamp(32px,4.4vw,56px)] font-extrabold leading-[1.04] tracking-[-0.045em] text-ink [overflow-wrap:anywhere]">{name}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-ink-2">
              <span className="flex items-center gap-1">
                <Star size={15} weight="fill" color={STAR} aria-hidden="true" />
                <span className="font-semibold tabular-nums text-ink">{count ? comma(avg) : '–'}</span>
                <span className="tabular-nums">({count})</span>
              </span>
              {dish.calories != null && (<><span aria-hidden="true">·</span><span className="tabular-nums">{dish.calories} kcal</span></>)}
            </p>
            {dish.description && <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.65] text-ink-2">{localized(dish.description, locale)}</p>}
            {!!dish.tags?.length && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {prioritizedTags(dish.tags).map((tg) => <Tag key={tg} tag={tg} />)}
              </div>
            )}

            <div className="mt-8">
              <Block title={t('rating')}>
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-6">
                  <div className="min-w-[88px] text-center">
                    <p className="text-[46px] font-extrabold leading-none tracking-[-0.05em] tabular-nums text-ink">{count ? comma(avg) : '–'}</p>
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

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-inset px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-ink">{t('yourRating')}</p>
                    <p className="min-h-5 text-[13px] text-ink-2" aria-live="polite">{visitor ? t('otherSchoolRating') : shown ? labels[shown - 1] : ' '}</p>
                  </div>
                  <div className={`flex ${visitor ? 'hidden' : ''}`} onMouseLeave={() => setHover(0)}>
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
              </Block>

              {(dish.calories != null || macros.length > 0) && (
                <Block title={t('nutrition')}>
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
                </Block>
              )}

              {!!dish.allergens?.length && (
                <Block title={t('allergens')}>
                  <div className="flex flex-wrap gap-1.5">
                    {dish.allergens.map((a) => <span key={a} className="rounded-full border border-line px-3 py-1 text-[13px] font-semibold text-ink">{a}</span>)}
                  </div>
                </Block>
              )}

              <Block title={t('comments')}>
                {isGuest || visitor ? (
                  <GuestCommentsLock loginHref={visitor ? undefined : loginHref(selfHref)} message={visitor ? t('otherSchoolComments') : undefined}>
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
                    // Signed in, the votes come keyed by account: each comment shows its author's stars.
                    ratings={ratingsData.ratings}
                    onAdd={(body) => api.dishComments.create(id, body).then(refreshComments)}
                    onEdit={(commentId, body) => api.dishComments.update(id, commentId, body).then(refreshComments)}
                    onDelete={(commentId) => api.dishComments.delete(id, commentId).then(refreshComments)}
                  />
                )}
              </Block>
            </div>
          </div>
        </article>
      )}

      {loginRequired && <LoginRequired onCancel={() => setLoginRequired(false)} back={selfHref} />}
    </section>
  );
}
