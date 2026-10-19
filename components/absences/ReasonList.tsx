'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, MagnifyingGlass } from '@phosphor-icons/react';
import type { AbsenceReason } from '@/lib/types';
import { useT } from '@/providers/LocaleProvider';
import { absencesDict } from '@/lib/i18n/dictionaries/absences';
import { Line } from '@/components/app/Skeleton';
import PixelState from '@/components/app/PixelState';

// The reasons for an absence as a step inside a sheet (excusing one, reporting
// one): a search field and the list WebUntis offers, one of them chosen.
export default function ReasonList({ reasons, value, onSelect, label }: {
  /** null while loading. */
  reasons: AbsenceReason[] | null;
  value: number | null;
  onSelect: (reason: AbsenceReason) => void;
  label: string;
}) {
  const t = useT(absencesDict);
  const [query, setQuery] = useState('');
  const search = useRef<HTMLInputElement>(null);

  // Into the search with a keyboard and mouse; on touch the keyboard would cover the list.
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) search.current?.focus();
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (reasons ?? []).filter((r) => !q || r.name.toLowerCase().includes(q));
  }, [reasons, query]);

  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="relative">
        <MagnifyingGlass size={18} weight="bold" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          ref={search}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchReason')}
          aria-label={t('searchReason')}
          className="h-12 w-full rounded-[14px] bg-inset pl-11 pr-4 text-[16px] text-ink outline-none transition-[box-shadow,background-color] placeholder:text-ink-3 focus:bg-surface focus:shadow-[0_0_0_2px_var(--accent)]"
        />
      </div>
      <div className="-mx-3">
        {reasons === null ? (
          <span aria-hidden="true" className="flex flex-col gap-0.5 text-ink">
            {['52%', '38%', '61%', '45%'].map((w) => (
              <span key={w} className="flex items-center justify-between gap-3 px-3 py-3.5"><Line w={w} h={14} /><Line w={24} h={24} /></span>
            ))}
          </span>
        ) : shown.length === 0 ? (
          <PixelState compact sprite="search" title={t('noReasons')} />
        ) : (
          <ul role="radiogroup" aria-label={label} className="flex flex-col gap-0.5">
            {shown.map((r) => {
              const sel = r.id === value;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={sel}
                    onClick={() => onSelect(r)}
                    className={`flex w-full items-center gap-3.5 rounded-[16px] px-3 py-3 text-left transition-colors duration-200 ${sel ? 'bg-[color-mix(in_srgb,var(--accent)_11%,transparent)]' : 'hover:bg-inset'}`}
                  >
                    <span className={`min-w-0 flex-1 text-[15.5px] text-ink ${sel ? 'font-bold' : 'font-medium'}`}>{r.name}</span>
                    <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-200 ${sel ? 'bg-accent text-on-accent' : 'shadow-[inset_0_0_0_2px_var(--line)]'}`}>
                      {sel && <Check size={14} weight="bold" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
