'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowClockwise, CaretRight, MagnifyingGlass, UserCircle } from '@phosphor-icons/react';
import Sheet from '@/components/ui/Sheet';
import Spinner from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/app/Page';
import { fetchTimetableFilters, type OtherTimetableType, type TimetableResource } from '@/lib/api';
import { leaveForLogin } from '@/providers/SessionProvider';
import { useT } from '@/providers/LocaleProvider';
import { timetableDict, type TimetableKey } from '@/lib/i18n/dictionaries/timetable';
import { commonDict } from '@/lib/i18n/dictionaries/common';

/** Another timetable shown instead of the own one ("Weitere Stundenpläne"). */
export interface TimetableSource {
  type: OtherTimetableType;
  id: number;
  name: string;
}

const KINDS: { type: OtherTimetableType; label: TimetableKey }[] = [
  { type: 'CLASS', label: 'kindClass' },
  { type: 'TEACHER', label: 'kindTeacher' },
  { type: 'ROOM', label: 'kindRoom' },
];

const rowCls = 'flex w-full items-center gap-3.5 rounded-[16px] px-3 py-3 text-left transition-colors hover:bg-inset';

/**
 * The classes, teachers and rooms whose timetable the school shows this
 * account, as WebUntis lists them (often only some kinds, or only the own
 * class), and the way back to the own timetable.
 */
export default function OtherTimetableSheet({ open, source, onPick, onClose }: {
  open: boolean;
  source: TimetableSource | null;
  onPick: (next: TimetableSource | null) => void;
  onClose: () => void;
}) {
  const t = useT(timetableDict);
  const tc = useT(commonDict);
  const [kind, setKind] = useState<OtherTimetableType>(source?.type ?? 'CLASS');
  const [query, setQuery] = useState('');
  // Per kind: the list, 'failed', or nothing yet (loading).
  const [lists, setLists] = useState<Partial<Record<OtherTimetableType, TimetableResource[] | 'failed'>>>({});
  const list = lists[kind];

  useEffect(() => {
    if (!open || list !== undefined) return;
    let alive = true;
    fetchTimetableFilters(kind)
      .then((items) => { if (alive) setLists((prev) => ({ ...prev, [kind]: items })); })
      .catch((e) => {
        if (e instanceof Error && e.message === 'session_expired') leaveForLogin();
        else if (alive) setLists((prev) => ({ ...prev, [kind]: 'failed' }));
      });
    return () => { alive = false; };
  }, [open, kind, list]);

  const shown = useMemo(() => {
    if (!Array.isArray(list)) return [];
    const needle = query.trim().toLocaleLowerCase();
    return needle ? list.filter((r) => `${r.name} ${r.longName}`.toLocaleLowerCase().includes(needle)) : list;
  }, [list, query]);

  const retry = () => setLists((prev) => {
    const next = { ...prev };
    delete next[kind];
    return next;
  });

  return (
    <Sheet open={open} onClose={onClose} title={t('otherTimetables')} closeLabel={tc('close')}>
      <div className="flex flex-col gap-4 pb-2">
        <button
          type="button"
          onClick={() => onPick(null)}
          aria-current={source === null}
          className={`${rowCls} ${source === null ? 'bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]' : 'bg-inset'}`}
        >
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-periwinkle text-periwinkle-ink">
            <UserCircle size={21} weight="bold" />
          </span>
          <span className="min-w-0 flex-1 text-[15.5px] font-bold">{t('myTimetable')}</span>
          <CaretRight size={16} weight="bold" className="shrink-0 text-ink-3" aria-hidden="true" />
        </button>

        <Segmented<OtherTimetableType>
          label={t('otherTimetables')}
          value={kind}
          onChange={(v) => { setKind(v); setQuery(''); }}
          options={KINDS.map((k) => ({ value: k.type, label: t(k.label) }))}
          className="w-full"
        />

        {Array.isArray(list) && list.length > 8 && (
          <div className="relative">
            <MagnifyingGlass size={18} weight="bold" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('otherSearch')}
              aria-label={t('otherSearch')}
              className="h-12 w-full rounded-[14px] bg-inset pl-11 pr-4 text-[16px] text-ink outline-none transition-[box-shadow,background-color] placeholder:text-ink-3 focus:bg-surface focus:shadow-[0_0_0_2px_var(--accent)]"
            />
          </div>
        )}

        {list === undefined ? (
          <div className="grid place-items-center py-10"><Spinner size={22} /></div>
        ) : list === 'failed' ? (
          <div className="flex flex-col items-start gap-3 py-2">
            <p role="alert" className="text-[14.5px] font-semibold text-danger-ink">{t('otherFailed')}</p>
            <Button variant="quiet" size="sm" onClick={retry}>
              <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
              {tc('retry')}
            </Button>
          </div>
        ) : shown.length === 0 ? (
          <p className="py-8 text-center text-[14.5px] text-ink-2">{t('otherNone')}</p>
        ) : (
          <ul className="-mx-1 flex flex-col">
            {shown.map((r) => {
              const active = source?.type === kind && source.id === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onPick({ type: kind, id: r.id, name: r.name })}
                    aria-current={active}
                    className={`${rowCls} ${active ? 'bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]' : ''}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15.5px] font-bold">{r.name}</span>
                      {r.longName && r.longName !== r.name && <span className="block truncate text-[13px] text-ink-2">{r.longName}</span>}
                    </span>
                    <CaretRight size={16} weight="bold" className="shrink-0 text-ink-3" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
