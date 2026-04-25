'use client';

import { useCallback, useEffect, useState } from 'react';
import { format, isToday, isTomorrow, parseISO, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Star, Utensils, X } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import EmptyView from '@/components/ui/EmptyView';
import { fetchMensa } from '@/lib/api';
import type { Dish } from '@/lib/types';

interface GroupedDishes {
  date: Date;
  label: string;
  isToday: boolean;
  dishes: Dish[];
}

function resolveName(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  const obj = raw as Record<string, string>;
  return obj.de ?? obj.it ?? obj.en ?? String(raw);
}

function groupDishes(dishes: Dish[]): GroupedDishes[] {
  const map = new Map<string, Dish[]>();
  dishes.forEach((d) => {
    const key = d.date.split('T')[0];
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(d);
  });

  const today = startOfDay(new Date());
  const result: GroupedDishes[] = [];

  map.forEach((dayDishes, key) => {
    const date = parseISO(key);
    if (date < today) return;
    let label = format(date, 'EEEE, d. MMMM', { locale: de });
    const todayFlag = isToday(date);
    if (todayFlag) label = 'Heute';
    else if (isTomorrow(date)) label = 'Morgen';
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

function DishCard({ dish, onOpen }: { dish: Dish; onOpen: (d: Dish) => void }) {
  return (
    <button
      onClick={() => onOpen(dish)}
      className="w-full rounded-2xl overflow-hidden text-left press-scale"
      style={{ background: 'var(--app-surface)' }}
    >
      {dish.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dish.imageUrl}
          alt={resolveName(dish.name)}
          className="w-full object-cover"
          style={{ height: 150 }}
          loading="lazy"
        />
      )}
      <div className="p-4">
        <p
          className="text-[15px] font-semibold leading-snug mb-1"
          style={{ color: 'var(--app-text-primary)' }}
        >
          {resolveName(dish.name)}
        </p>
        {dish.description && (
          <p
            className="text-xs mb-2 line-clamp-2"
            style={{ color: 'var(--app-text-secondary)' }}
          >
            {resolveName(dish.description)}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {dish.tags?.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
          {dish.price != null && (
            <p
              className="text-sm font-semibold flex-shrink-0"
              style={{ color: 'var(--accent)' }}
            >
              €{dish.price.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function NutriCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p
        className="text-base font-bold"
        style={{ color: 'var(--app-text-primary)' }}
      >
        {value}
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
        {label}
      </p>
    </div>
  );
}

function DishDetail({ dish, onClose }: { dish: Dish; onClose: () => void }) {
  const [rating, setRating] = useState(0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88dvh] overflow-y-auto rounded-t-2xl fade-in"
        style={{ background: 'var(--app-surface)', animationDuration: '0.25s' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + close */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div
            className="w-10 h-1 rounded-full mx-auto"
            style={{ background: 'var(--app-border)' }}
          />
        </div>

        {dish.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dish.imageUrl}
            alt={resolveName(dish.name)}
            className="w-full object-cover"
            style={{ height: 200 }}
          />
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2
              className="text-xl font-bold flex-1"
              style={{ color: 'var(--app-text-primary)' }}
            >
              {resolveName(dish.name)}
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-full press-scale flex-shrink-0" style={{ background: 'var(--app-card)' }}>
              <X size={16} color="var(--app-text-secondary)" />
            </button>
          </div>

          {dish.description && (
            <p
              className="text-sm mb-4"
              style={{ color: 'var(--app-text-secondary)' }}
            >
              {resolveName(dish.description)}
            </p>
          )}

          {/* Tags */}
          {dish.tags && dish.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {dish.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}

          {/* Price */}
          {dish.price != null && (
            <p
              className="text-2xl font-bold mb-4"
              style={{ color: 'var(--accent)' }}
            >
              €{dish.price.toFixed(2)}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-3 mb-5">
            <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
              Bewertung
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="p-0.5 press-scale">
                  <Star
                    size={22}
                    fill={s <= rating ? '#FFD60A' : 'none'}
                    color={s <= rating ? '#FFD60A' : 'var(--app-text-tertiary)'}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Nutrition */}
          {(dish.calories != null ||
            dish.protein != null ||
            dish.carbs != null ||
            dish.fat != null) && (
            <div
              className="rounded-xl p-4 mb-4 grid grid-cols-4 gap-3"
              style={{ background: 'var(--app-card)' }}
            >
              {dish.calories != null && (
                <NutriCell label="kcal" value={dish.calories} />
              )}
              {dish.protein != null && (
                <NutriCell label="Protein" value={`${dish.protein}g`} />
              )}
              {dish.carbs != null && (
                <NutriCell label="Kohlenh." value={`${dish.carbs}g`} />
              )}
              {dish.fat != null && (
                <NutriCell label="Fett" value={`${dish.fat}g`} />
              )}
            </div>
          )}

          {/* Allergens */}
          {dish.allergens && dish.allergens.length > 0 && (
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--app-text-secondary)' }}
              >
                Allergene
              </p>
              <p className="text-sm" style={{ color: 'var(--app-text-primary)' }}>
                {dish.allergens.join(', ')}
              </p>
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

export default function MensaPage() {
  const [groups, setGroups] = useState<GroupedDishes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Dish | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
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
      setError(
        e instanceof Error ? e.message : 'Fehler beim Laden der Speisekarte'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AuthGuard>
      <div
        className="h-dvh flex flex-col overflow-hidden"
        style={{ background: 'var(--app-bg)', paddingBottom: 'var(--nav-h)' }}
      >
        <div className="px-5 pt-14 pb-4 fade-in flex-shrink-0">
          <h1
            className="text-[28px] font-bold tracking-tight"
            style={{ color: 'var(--app-text-primary)' }}
          >
            Mensa
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
            LBS Brixen
          </p>
        </div>

        <div className="flex-1 overflow-auto px-4 pb-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size={28} />
            </div>
          ) : error ? (
            <ErrorView message={error} onRetry={load} />
          ) : groups.length === 0 ? (
            <EmptyView
              icon={<Utensils size={56} color="var(--app-text-primary)" />}
              title="Kein Speiseplan"
              subtitle="Für diese Woche sind keine Gerichte verfügbar."
            />
          ) : (
            <div className="flex flex-col gap-6">
              {groups.map((group, gi) => (
                <section
                  key={group.label}
                  className="fade-in"
                  style={{ animationDelay: `${gi * 80}ms` }}
                >
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
                          background:
                            'color-mix(in srgb, var(--accent) 15%, transparent)',
                          color: 'var(--accent)',
                        }}
                      >
                        Heute
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    {group.dishes.map((dish) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
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
          <DishDetail dish={selected} onClose={() => setSelected(null)} />
        )}
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
