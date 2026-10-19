'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import PageIntro from '@/components/site/PageIntro';
import ExternalMediaNotice from '@/components/ExternalMediaNotice';
import PixelPlate from '@/components/mensa/PixelPlate';
import PixelState from '@/components/app/PixelState';
import { mensaAvailableIn } from '@/components/app/hooks';
import { Plate, RatingLine, Tag, dishHref, foodStyleOf, prioritizedTags } from '@/components/mensa/parts';
import { fetchMensa, getMensaStale } from '@/lib/api';
import { api } from '@/lib/api-client';
import { useApp } from '@/providers/AppProvider';
import { useSession } from '@/providers/SessionProvider';
import { useDateLocale, useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { mensaDict } from '@/lib/i18n/dictionaries/mensa';
import { daysFromToday, dishesFrom, localized, upcomingDays, type MenuDay, type MenuDish } from '@/lib/mensa';
import { formatDate } from '@/lib/i18n/dateLocale';
import { useExternalMedia } from '@/lib/external-media';

// The Mensa plan, on the public site for guests and inside the app (/canteen)
// for accounts: the next dish served as pixel art between fork and knife, the
// whole plan below by week, each dish on a small pixel plate. Every dish opens its own page (components/mensa/
// DishView.tsx) with the ratings, nutrition, allergens and comments.

/** Monday of the week `d` is in, as a week count, to group days by week. */
function weekIndex(d: Date): number {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return Math.round(monday.getTime() / (7 * 86_400_000));
}

const leadDish = (day: MenuDay) => day.dishes.find((d) => d.imageUrl) ?? day.dishes[0];

const noop = () => () => {};

/** A day of the prerendered menu: the date is rebuilt from its key, the same on the server and in the browser. */
function dayFromKey({ key, dishes }: { key: string; dishes: MenuDish[] }): MenuDay {
  const [y, m, d] = key.split('-').map(Number);
  return { key, date: new Date(y, m - 1, d), dishes };
}

export default function MensaClient({ inApp = false, initialDays }: {
  inApp?: boolean;
  /** The public menu the server prerendered the page with (the public /mensa only). */
  initialDays?: Array<{ key: string; dishes: MenuDish[] }>;
}) {
  const t = useT(mensaDict);
  const { locale } = useLocale();
  const { tag } = useDateLocale();
  const localize = useLocalizeHref();
  const external = useExternalMedia();
  const { stableUid } = useApp();
  const { user, isLoading: sessionLoading } = useSession();
  const isGuest = !sessionLoading && !user;

  const [days, setDays] = useState<MenuDay[] | null>(() => initialDays?.map(dayFromKey) ?? null);
  // "Heute", "Morgen", "Diese Woche" depend on the visitor's clock: shown once
  // the page runs in the browser; the prerendered page names the dates.
  const live = useSyncExternalStore(noop, () => true, () => false);
  // False: the account's school has no menu (pokyh-backend `available: false`).
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(0);
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({});
  // Prevents a double fetch when both stableUid and the menu arrive together.
  const ratingsFetched = useRef(false);

  // Guests see the public menu; a signed-in account (the app's /canteen) its own school's.
  const scope = user ? 'account' : 'public';
  useEffect(() => {
    if (sessionLoading) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      // The menu this device stored shows at once; the fresh one replaces it.
      const stale = getMensaStale(scope);
      const show = (raw: unknown) => {
        setAvailable(mensaAvailableIn(raw));
        setDays(upcomingDays(dishesFrom(raw)));
      };
      if (stale) show(stale);
      fetchMensa(scope)
        .then((raw) => { if (!cancelled) show(raw); })
        .catch((e: unknown) => { if (!cancelled && !stale) setError(e instanceof Error ? e.message : t('loadError')); });
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
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
    const n = live ? daysFromToday(day.date) : NaN;
    if (n <= 0) return t('today');
    if (n === 1) return t('tomorrow');
    return formatDate(day.date, tag, { weekday: 'long', day: 'numeric', month: 'long' });
  }, [t, tag, live]);

  const weeks = useMemo(() => {
    if (!days) return [];
    const now = live ? weekIndex(new Date()) : NaN;
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
  }, [days, t, tag, live]);

  // Client page without its own metadata on navigation: keep the tab title in
  // the current language. Inside the app the tab keeps its plain name.
  useEffect(() => { if (!inApp) document.title = `${t('title')} | POKYH`; }, [t, inApp]);

  const next = days?.[0] ?? null;
  const served = next ? leadDish(next) : null;
  const signedIn = !!user;
  const href = (id: string) => localize(dishHref(id, signedIn));

  return (
    <>
      <PageIntro title={t('pageTitle')} lead={available ? t('pageLead') : undefined} />

      <section className="wrap pb-24 md:pb-32">
        {error ? (
          <div className="card">
            <PixelState
              sprite="unplugged"
              title={t('loadError')}
              action={<button type="button" onClick={retry} className="key">{t('retry')}</button>}
            />
          </div>
        ) : days === null ? (
          <MensaLoading label={t('loading')} />
        ) : !available ? (
          <div className="card">
            <PixelState
              sprite="empty"
              title={t('noMensaTitle')}
              note={t('noMensaText')}
              action={<Link href={localize('/home')} className="key">{t('toHome')}</Link>}
            />
          </div>
        ) : !next || !served ? (
          <div className="card p-8 md:p-12">
            <p className="text-[clamp(26px,3vw,36px)] font-extrabold tracking-[-0.035em] text-ink">{t('emptyTitle')}</p>
            <p className="mt-2 text-[17px] text-ink-2">{t('emptySubtitle')}</p>
          </div>
        ) : (
          <>
            {/* The next dish, served */}
            <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-14">
              <Link href={href(served.id)} aria-label={localized(served.name, locale)} className="rise mx-auto block w-full max-w-[640px]">
                <PixelPlate
                  key={served.id}
                  photo={external ? served.imageUrl : null}
                  style={foodStyleOf(served)}
                  seed={served.id}
                />
              </Link>

              <div className="rise flex min-w-0 flex-col items-start gap-4">
                <p className="text-[15px] font-semibold text-ink-3">{dayLabel(next)}</p>
                <h2 className="max-w-full text-[clamp(32px,4.2vw,58px)] font-extrabold leading-[1.04] tracking-[-0.045em] text-ink [overflow-wrap:anywhere]">{localized(served.name, locale)}</h2>
                {served.description && <p className="max-w-[46ch] text-[17px] leading-[1.65] text-ink-2 md:text-[18px]">{localized(served.description, locale)}</p>}
                <RatingLine ratings={ratings[served.id]} />
                {!!served.tags?.length && (
                  <div className="flex flex-wrap gap-1.5">
                    {prioritizedTags(served.tags).slice(0, 4).map((tg) => <Tag key={tg} tag={tg} />)}
                  </div>
                )}
                <Link href={href(served.id)} className="key key-lg mt-2">
                  {t('rateAndComment')}
                  <span aria-hidden="true" className="key-arrow">→</span>
                </Link>
                {next.dishes.length > 1 && (
                  <div className="mt-2 flex max-w-full flex-wrap gap-2">
                    {next.dishes.filter((d) => d !== served).map((d) => (
                      <Link key={d.id} href={href(d.id)} className="flex min-w-0 max-w-full items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-4 text-[14px] font-semibold text-ink hover:bg-inset">
                        <Plate dish={d} className="w-9 shrink-0" />
                        <span className="truncate">{localized(d.name, locale)}</span>
                      </Link>
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
                      <Link href={href(dish.id)} className="card flex w-full items-center gap-4 p-3 pr-5 text-left transition-colors hover:bg-inset">
                        <Plate dish={dish} className="w-[72px] shrink-0 md:w-[90px]" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold text-ink-3 first-letter:uppercase">{dayLabel(day)}</span>
                          <span className="mt-0.5 block truncate text-[17px] font-bold tracking-[-0.015em] text-ink">{localized(dish.name, locale)}</span>
                          <span className="mt-1 block"><RatingLine ratings={ratings[dish.id]} /></span>
                        </span>
                      </Link>
                    </li>
                  )))}
                </ul>
              </div>
            ))}
          </>
        )}
      </section>
    </>
  );
}

/**
 * While the menu loads: the table is laid (the empty plate building itself,
 * steam rising) where the next dish will be served, and the rows of the plan
 * hold their place, so nothing jumps when the menu arrives.
 */
function MensaLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      <div aria-hidden="true" className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-14">
        <div className="mensa-wait mx-auto w-full max-w-[640px]">
          <PixelPlate style="pasta" seed="loading" empty />
        </div>
        <div className="flex min-w-0 flex-col items-start gap-4">
          <span className="skeleton h-4 w-24 rounded-full" />
          <span className="skeleton h-[clamp(34px,4.2vw,58px)] w-11/12 rounded-2xl" />
          <span className="skeleton h-[clamp(34px,4.2vw,58px)] w-3/5 rounded-2xl" />
          <span className="skeleton mt-1 h-5 w-44 rounded-full" />
          <span className="skeleton mt-2 h-14 w-60 rounded-full" />
        </div>
      </div>
      <div aria-hidden="true" className="mt-24 md:mt-32">
        <span className="skeleton block h-[clamp(30px,3.6vw,48px)] w-72 max-w-full rounded-2xl" />
        <span className="skeleton mt-10 block h-4 w-28 rounded-full" />
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="card flex items-center gap-4 p-3 pr-5">
              <span className="block w-[72px] shrink-0 md:w-[90px]">
                <PixelPlate size="plate" style="pasta" seed={`loading-${i}`} empty />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="skeleton h-3 w-24 rounded-full" />
                <span className="skeleton h-5 w-3/4 rounded-full" />
                <span className="skeleton h-3 w-20 rounded-full" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
