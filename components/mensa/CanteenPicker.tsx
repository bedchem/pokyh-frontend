'use client';

import { useId, useMemo, useState } from 'react';
import { ArrowRight, ArrowsLeftRight, ForkKnife, MagnifyingGlass, X } from '@phosphor-icons/react';
import PixelState from '@/components/app/PixelState';
import { useT } from '@/providers/LocaleProvider';
import { mensaDict } from '@/lib/i18n/dictionaries/mensa';
import { canteenMatches, schoolLabel, type Canteen, type CanteenSchool } from '@/lib/mensa';

// The choice of canteen on the public Mensa page when POKYH knows several:
// a search over the canteens and the schools they serve, and the canteens
// as cards (the account's own first). Above a plan, `CanteenLine` says whose
// menu it is, with a way back to the choice when there is one.

function Badge({ size = 48 }: { size?: number }) {
  return (
    <span aria-hidden="true" className="grid shrink-0 place-items-center rounded-full bg-periwinkle text-periwinkle-ink" style={{ width: size, height: size }}>
      <ForkKnife size={Math.round(size * 0.46)} weight="bold" />
    </span>
  );
}

export function CanteenPicker({ canteens, ownCanteen, onChoose }: {
  canteens: Canteen[];
  /** The signed-in account's canteen, marked and listed first. */
  ownCanteen: string | null;
  /** Called with the slug of the school to ask for. */
  onChoose: (slug: string) => void;
}) {
  const t = useT(mensaDict);
  const id = useId();
  const [query, setQuery] = useState('');
  const shown = useMemo(
    () => canteens.filter((c) => canteenMatches(c, query)).sort((a, b) => Number(b.id === ownCanteen) - Number(a.id === ownCanteen)),
    [canteens, query, ownCanteen],
  );
  const count = query.trim() ? shown.length : canteens.length;
  // The school the search found, when it is one of several the canteen serves.
  const schoolFor = (c: Canteen): CanteenSchool => c.schools.find((s) => query.trim() && canteenMatches({ ...c, name: '', schools: [s] }, query)) ?? c.schools[0];

  return (
    <div className="rise">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <label htmlFor={`${id}-search`} className="visually-hidden">{t('searchLabel')}</label>
        <div className="flex h-[58px] w-full max-w-[560px] items-center gap-3 rounded-[18px] bg-[var(--surface)] px-4 shadow-[0_0_0_1px_var(--line)] transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent-ink)]">
          <MagnifyingGlass size={20} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3" />
          <input
            id={`${id}-search`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-controls={`${id}-list`}
            aria-describedby={`${id}-status`}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            maxLength={80}
            className="h-full min-w-0 flex-1 bg-transparent text-[17px] font-medium text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t('searchClear')} className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-inset hover:text-ink">
              <X size={15} weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>
        <p id={`${id}-status`} aria-live="polite" className="shrink-0 px-1 text-[15px] font-semibold text-ink-3">
          {count === 1 ? t('canteenOne') : t('canteenCount', { n: count })}
        </p>
      </div>

      {shown.length ? (
        <ul id={`${id}-list`} className="mt-6 grid gap-3 md:grid-cols-2">
          {shown.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChoose(schoolFor(c).slug)}
                className="card group flex w-full items-center gap-4 p-4 pr-5 text-left transition-colors hover:bg-inset md:p-5"
              >
                <Badge />
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[18px] font-bold tracking-[-0.02em] text-ink">{c.name}</span>
                    {c.id === ownCanteen && (
                      <span className="shrink-0 rounded-full bg-sage px-2.5 py-0.5 text-[12px] font-bold text-sage-ink">{t('yourSchool')}</span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[14.5px] text-ink-2">{c.schools.map((s) => s.name).join(' · ')}</span>
                </span>
                <ArrowRight size={18} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div id={`${id}-list`} className="card mt-6">
          <PixelState sprite="search" title={t('noMatch', { q: query.trim() })} />
        </div>
      )}
    </div>
  );
}

/** Whose menu the plan below is: the canteen and its schools, and (with several canteens) the way back to the choice. */
export function CanteenLine({ name, schools, onChange }: {
  name: string | null;
  schools: CanteenSchool[];
  onChange?: () => void;
}) {
  const t = useT(mensaDict);
  const names = schools.map(schoolLabel).join(' · ');
  const title = name ?? names;
  if (!title) return null;
  return (
    <div className="rise mb-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 md:mb-14">
      <div className="flex min-w-0 items-center gap-3">
        <Badge size={44} />
        <div className="min-w-0">
          <p className="truncate text-[17px] font-bold tracking-[-0.015em] text-ink">{title}</p>
          {name && names && <p className="truncate text-[14.5px] text-ink-2">{schools.map((s) => s.name).join(' · ')}</p>}
        </div>
      </div>
      {onChange && (
        <button type="button" onClick={onChange} className="key key-sm key-lilac">
          <ArrowsLeftRight size={17} weight="bold" aria-hidden="true" />
          {t('changeCanteen')}
        </button>
      )}
    </div>
  );
}
