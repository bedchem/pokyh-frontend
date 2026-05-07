'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { format, isToday, isTomorrow, parseISO, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Star, Utensils, X } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import EmptyView from '@/components/ui/EmptyView';
import CommentSection from '@/components/ui/CommentSection';
import { fetchMensa } from '@/lib/api';
import type { Dish } from '@/lib/types';
import { useApp } from '@/providers/AppProvider';
import { api, type DishRatingsData, type ApiComment } from '@/lib/api-client';

// -- helpers --

function resolveName(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  const obj = raw as Record<string, string>;
  return obj.de ?? obj.it ?? obj.en ?? String(raw);
}

function prioritizedDishTags(tags?: string[]): string[] {
  if (!tags?.length) return [];
  const vegan: string[] = [];
  const vegetarian: string[] = [];
  const other: string[] = [];

  for (const tag of tags) {
    const normalized = tag.toLowerCase();
    if (normalized.includes('vegan')) {
      vegan.push(tag);
      continue;
    }
    if (normalized.includes('vegetar')) {
      vegetarian.push(tag);
      continue;
    }
    other.push(tag);
  }

  return [...vegan, ...vegetarian, ...other];
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  suppe:   'linear-gradient(135deg, #FF9F43 0%, #EE5A24 100%)',
  pasta:   'linear-gradient(135deg, #F8C291 0%, #E55039 100%)',
  fleisch: 'linear-gradient(135deg, #B8860B 0%, #8B4513 100%)',
  fisch:   'linear-gradient(135deg, #0066CC 0%, #003366 100%)',
  salat:   'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
  dessert: 'linear-gradient(135deg, #e84393 0%, #c0392b 100%)',
  vegan:   'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
  default: 'linear-gradient(135deg, #636e72 0%, #2d3436 100%)',
};

function dishPlaceholderBg(dish: Dish): string {
  const cat = (dish.category ?? '').toLowerCase();
  for (const key of Object.keys(CATEGORY_GRADIENTS)) {
    if (cat.includes(key)) return CATEGORY_GRADIENTS[key];
  }
  if (dish.tags?.some((t) => t.toLowerCase().includes('vegan'))) return CATEGORY_GRADIENTS.vegan;
  return CATEGORY_GRADIENTS.default;
}

function avgRating(ratings: Record<string, number>): number {
  const vals = Object.values(ratings);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

interface GroupedDishes {
  date: Date;
  label: string;
  isToday: boolean;
  dishes: Dish[];
}

function groupDishes(dishes: Dish[]): GroupedDishes[] {
  const map = new Map<string, Dish[]>();
  dishes.forEach((d) => {
    const key = d.date.split('T')[0];
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(d);
  });

  const today = startOfDay(new Date());
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday of current week
  const result: GroupedDishes[] = [];

  map.forEach((dayDishes, key) => {
    const date = parseISO(key);
    if (date < weekStart) return;
    const todayFlag = isToday(date);
    const tomorrowFlag = isTomorrow(date);
    const label = todayFlag
      ? 'Heute'
      : tomorrowFlag
      ? 'Morgen'
      : format(date, 'EEEE, d. MMMM', { locale: de });
    result.push({ date, label, isToday: todayFlag, dishes: dayDishes });
  });

  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

const TAG_COLORS: Record<string, { bg: string; fg: string }> = {
  vegan:       { bg: 'color-mix(in srgb, #30D158 18%, transparent)', fg: '#30D158' },
  vegetarisch: { bg: 'color-mix(in srgb, #4ED87A 18%, transparent)', fg: '#4ED87A' },
  vegetarian:  { bg: 'color-mix(in srgb, #4ED87A 18%, transparent)', fg: '#4ED87A' },
  glutenfrei:  { bg: 'color-mix(in srgb, #FFD60A 18%, transparent)', fg: '#B8950A' },
  halal:       { bg: 'color-mix(in srgb, #0A84FF 18%, transparent)', fg: '#0A84FF' },
};

function TagBadge({ tag }: { tag: string }) {
  const colors = TAG_COLORS[tag.toLowerCase()] ?? {
    bg: 'color-mix(in srgb, var(--app-text-secondary) 15%, transparent)',
    fg: 'var(--app-text-secondary)',
  };
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: colors.bg, color: colors.fg }}
    >
      {tag}
    </span>
  );
}

function StarDisplay({
  avgVal,
  myRating,
  onRate,
}: {
  avgVal: number;
  myRating: number;
  onRate: (s: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => {
        const active = s <= (hover || myRating);
        return (
          <button
            key={s}
            onClick={() => onRate(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 press-scale"
          >
            <Star
              size={24}
              fill={active ? '#FFD60A' : 'none'}
              color={active ? '#FFD60A' : 'var(--app-text-tertiary)'}
            />
          </button>
        );
      })}
      {avgVal > 0 && (
        <span className="text-sm font-semibold ml-1" style={{ color: 'var(--app-text-secondary)' }}>
          {avgVal.toFixed(1)}
        </span>
      )}
    </div>
  );
}

function NutriCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-base font-bold" style={{ color: 'var(--app-text-primary)' }}>{value}</p>
      <p className="text-[10px] mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>{label}</p>
    </div>
  );
}

function MiniStars({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => {
          const fill = Math.min(1, Math.max(0, value - (s - 1)));
          return (
            <div key={s} className="relative" style={{ width: 11, height: 11 }}>
              <Star size={11} fill="none" color="var(--app-text-tertiary)" />
              {fill > 0 && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star size={11} fill="#FFD60A" color="#FFD60A" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className="text-[11px] font-semibold" style={{ color: 'var(--app-text-secondary)' }}>
        {value.toFixed(1)}
      </span>
      <span className="text-[10px]" style={{ color: 'var(--app-text-tertiary)' }}>
        ({count})
      </span>
    </div>
  );
}

function DishCard({
  dish,
  rating,
  ratingCount,
  onOpen,
}: {
  dish: Dish;
  rating: number;
  ratingCount: number;
  onOpen: (d: Dish) => void;
}) {
  const name = resolveName(dish.name);
  const desc = dish.description ? resolveName(dish.description) : null;

  return (
    <button
      onClick={() => onOpen(dish)}
      className="w-full rounded-2xl overflow-hidden text-left press-scale flex gap-0"
      style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0" style={{ width: 100, height: 110 }}>
        {dish.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dish.imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full" style={{ background: dishPlaceholderBg(dish) }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-between" style={{ minHeight: 110 }}>
        <div>
          <p
            className="text-[14px] font-semibold leading-snug line-clamp-2"
            style={{ color: 'var(--app-text-primary)' }}
          >
            {name}
          </p>
          {desc && (
            <p
              className="text-xs mt-0.5 line-clamp-1"
              style={{ color: 'var(--app-text-secondary)' }}
            >
              {desc}
            </p>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
          {rating > 0 ? (
            <MiniStars value={rating} count={ratingCount} />
          ) : (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={11} fill="none" color="var(--app-text-tertiary)" />
              ))}
              <span className="text-[10px] ml-1" style={{ color: 'var(--app-text-tertiary)' }}>
                Noch keine Bewertung
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {prioritizedDishTags(dish.tags).slice(0, 2).map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function DishDetail({
  dish,
  stableUid,
  isAdmin,
  onClose,
  onRated,
}: {
  dish: Dish;
  stableUid: string | null;
  isAdmin: boolean;
  onClose: () => void;
  onRated: (dishId: string, ratings: Record<string, number>) => void;
}) {
  const [ratingsData, setRatingsData] = useState<DishRatingsData>({ ratings: {}, myRating: null });
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  useEffect(() => {
    // Fetch initial ratings
    api.dishRatings.get(dish.id)
      .then((data) => {
        setRatingsData(data);
        onRated(dish.id, data.ratings);
      })
      .catch(() => {});

    // Subscribe to SSE for live rating updates
    const unsubRatings = api.dishRatings.subscribe(dish.id, (data) => {
      setRatingsData(data);
      onRated(dish.id, data.ratings);
    });

    // Fetch initial comments
    api.dishComments.list(dish.id)
      .then((c) => { setComments(c); setCommentsLoading(false); })
      .catch(() => setCommentsLoading(false));

    // Subscribe to SSE for live comment updates
    const unsubComments = api.dishComments.subscribe(dish.id, (c) => {
      setComments(c);
      setCommentsLoading(false);
    });

    return () => { unsubRatings(); unsubComments(); };
  }, [dish.id, onRated]);

  const avg = avgRating(ratingsData.ratings);
  const myRating = ratingsData.myRating ?? 0;
  const ratingCount = Object.keys(ratingsData.ratings).length;

  async function rate(stars: number) {
    if (!stableUid || saving) return;
    setSaving(true);
    try {
      await api.dishRatings.rate(dish.id, stars);
    } catch (e) {
      console.error('[mensa] rate error:', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-[28px] fade-in"
        style={{ background: 'var(--app-surface)', animationDuration: '0.25s' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header image / gradient */}
        <div className="relative" style={{ height: 200 }}>
          {dish.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dish.imageUrl}
              alt={resolveName(dish.name)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full" style={{ background: dishPlaceholderBg(dish) }} />
          )}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45) 100%)' }}
          />
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="absolute top-5 right-5 flex items-center justify-center rounded-full press-scale transition-colors duration-200 text-white hover:text-[#D97777]"
            style={{
              width: 32,
              height: 32,
              background: 'rgba(0, 0, 0, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 1px 10px rgba(0, 0, 0, 0.18)',
            }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-2">
            <h2 className="text-xl font-bold" style={{ color: 'var(--app-text-primary)' }}>
              {resolveName(dish.name)}
            </h2>
          </div>

          {dish.description && (
            <p className="text-sm mb-3" style={{ color: 'var(--app-text-secondary)' }}>
              {resolveName(dish.description)}
            </p>
          )}

          {dish.tags && dish.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {prioritizedDishTags(dish.tags).map((tag) => <TagBadge key={tag} tag={tag} />)}
            </div>
          )}

          {/* Rating */}
          <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--app-card)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--app-text-secondary)' }}>
              Bewertung
            </p>
            <StarDisplay avgVal={avg} myRating={myRating} onRate={rate} />
            {ratingCount > 0 && (
              <p className="text-xs mt-2" style={{ color: 'var(--app-text-tertiary)' }}>
                {ratingCount} Bewertung{ratingCount !== 1 ? 'en' : ''}
              </p>
            )}
            {!stableUid && (
              <p className="text-xs mt-2" style={{ color: 'var(--app-text-tertiary)' }}>
                Anmelden um zu bewerten
              </p>
            )}
          </div>

          {/* Nutrition */}
          {(dish.calories != null || dish.protein != null || dish.carbs != null || dish.fat != null) && (
            <div className="rounded-xl p-4 mb-4 grid grid-cols-4 gap-3" style={{ background: 'var(--app-card)' }}>
              {dish.calories != null && <NutriCell label="kcal" value={dish.calories} />}
              {dish.protein != null && <NutriCell label="Protein" value={`${dish.protein}g`} />}
              {dish.carbs != null && <NutriCell label="Kohlenh." value={`${dish.carbs}g`} />}
              {dish.fat != null && <NutriCell label="Fett" value={`${dish.fat}g`} />}
            </div>
          )}

          {/* Allergens */}
          {dish.allergens && dish.allergens.length > 0 && (
            <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--app-card)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--app-text-secondary)' }}>
                Allergene
              </p>
              <p className="text-sm" style={{ color: 'var(--app-text-primary)' }}>
                {dish.allergens.join(', ')}
              </p>
            </div>
          )}

          {/* Comments */}
          <div className="rounded-xl p-4" style={{ background: 'var(--app-card)' }}>
            <CommentSection
              comments={comments}
              stableUid={stableUid}
              isAdmin={isAdmin}
              loading={commentsLoading}
              onAdd={(body) => api.dishComments.create(dish.id, body)}
              onEdit={(commentId, body) => api.dishComments.update(dish.id, commentId, body)}
              onDelete={(commentId) => api.dishComments.delete(dish.id, commentId)}
            />
          </div>

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

export default function MensaPage() {
  const { stableUid } = useApp();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!stableUid) return;
    api.auth.me().then((u) => setIsAdmin(u.isAdmin)).catch(() => {});
  }, [stableUid]);
  const [groups, setGroups] = useState<GroupedDishes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Dish | null>(null);
  const [allRatings, setAllRatings] = useState<Record<string, Record<string, number>>>({});
  // prevents double-fetch when both stableUid and groups become available together
  const ratingsFetched = useRef(false);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError('');
    ratingsFetched.current = false;
    try {
      const raw = await fetchMensa();
      const r = raw as Record<string, unknown>;
      const dishes: Dish[] = Array.isArray(raw)
        ? (raw as Dish[])
        : ((r?.menu as Record<string, unknown>)?.dishes as Dish[]) ??
          (r?.dishes as Dish[]) ??
          (r?.data as Dish[]) ??
          [];
      setGroups(groupDishes(dishes));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Speisekarte');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  // Fetch ratings in batch once BOTH the menu is loaded AND stableUid is available.
  useEffect(() => {
    if (!stableUid || groups.length === 0 || ratingsFetched.current) return;
    ratingsFetched.current = true;
    const allDishes = groups.flatMap((g) => g.dishes);
    const dishIds = allDishes.map((d) => d.id);

    api.dishRatings.getBatch(dishIds)
      .then((batchResult) => {
        const ratings: Record<string, Record<string, number>> = {};
        for (const [dishId, data] of Object.entries(batchResult)) {
          if (Object.keys(data.ratings).length > 0) {
            ratings[dishId] = data.ratings;
          }
        }
        setAllRatings(ratings);
      })
      .catch((e) => console.error('[mensa] ratings batch fetch error:', e));
  }, [stableUid, groups]);

  const handleRated = useCallback((dishId: string, ratings: Record<string, number>) => {
    setAllRatings((prev) => ({ ...prev, [dishId]: ratings }));
  }, []);

  return (
    <AuthGuard>
      <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--app-bg)' }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-4 fade-in flex-shrink-0">
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
            Mensa
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>LBS Brixen</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto px-4 pb-8">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
          ) : error ? (
            <ErrorView message={error} onRetry={loadMenu} />
          ) : groups.length === 0 ? (
            <EmptyView
              icon={<Utensils size={56} color="var(--app-text-primary)" />}
              title="Kein Speiseplan"
              subtitle="Für diese Woche sind keine Gerichte verfügbar."
            />
          ) : (
            <div className="flex flex-col gap-6 fade-in">
              {groups.map((group, gi) => (
                <section
                  key={group.label}
                  className="fade-in"
                  style={{ animationDelay: `${gi * 60}ms` }}
                >
                  {/* Day header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <h2
                      className="text-[17px] font-semibold"
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      {group.label}
                    </h2>
                    {group.isToday && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                          color: 'var(--accent)',
                        }}
                      >
                        Heute
                      </span>
                    )}
                  </div>

                  {/* Dish list */}
                  <div className="flex flex-col gap-2.5">
                    {group.dishes.map((dish) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        rating={avgRating(allRatings[dish.id] ?? {})}
                        ratingCount={Object.keys(allRatings[dish.id] ?? {}).length}
                        onOpen={setSelected}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <DishDetail
            dish={selected}
            stableUid={stableUid}
            isAdmin={isAdmin}
            onClose={() => setSelected(null)}
            onRated={handleRated}
          />
        )}
      </div>
    </AuthGuard>
  );
}
