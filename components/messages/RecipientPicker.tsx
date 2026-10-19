'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, MagnifyingGlass } from '@phosphor-icons/react';
import type { MessageRecipient } from '@/lib/types';
import { useT } from '@/providers/LocaleProvider';
import { messagesDict } from '@/lib/i18n/dictionaries/messages';
import { Bone, Line } from '@/components/app/Skeleton';

interface Props {
  /** null while the list is still loading. */
  recipients: MessageRecipient[] | null;
  failed?: boolean;
  selectedIds: number[];
  /** One recipient per message: rows act like radio buttons. */
  single?: boolean;
  onToggle: (r: MessageRecipient) => void;
}

// Recipient step of the compose sheet (modelled on the WebUntis "Mitteilung an
// Lehrkraft" picker): a search field and the teachers grouped into
// Klassenlehrkraft / Andere. Renders inside the compose Sheet, not as its own dialog.
export default function RecipientPicker({ recipients, failed = false, selectedIds, single = false, onToggle }: Props) {
  const [query, setQuery] = useState('');
  const t = useT(messagesDict);
  const sel = new Set(selectedIds);
  const search = useRef<HTMLInputElement>(null);

  // Jump into the search on a keyboard and mouse; on touch the keyboard would cover the list.
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) search.current?.focus();
  }, []);

  const { classTeachers, others } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = recipients ?? [];
    const match = (r: MessageRecipient) => !q || r.name.toLowerCase().includes(q) || (r.role ?? '').toLowerCase().includes(q);
    return {
      classTeachers: list.filter((r) => r.category === 'classTeacher' && match(r)),
      others: list.filter((r) => r.category !== 'classTeacher' && match(r)),
    };
  }, [recipients, query]);

  const group = (title: string, items: MessageRecipient[]) =>
    items.length > 0 && (
      <section>
        <h3 className="px-3 pb-1.5 pt-2 text-[13px] font-bold text-ink-3">{title}</h3>
        <ul className="flex flex-col gap-0.5">
          {items.map((r) => {
            const isSel = sel.has(r.id);
            return (
              <li key={`${r.type}-${r.id}`}>
                <button
                  type="button"
                  onClick={() => onToggle(r)}
                  aria-pressed={isSel}
                  className={`flex w-full items-center gap-3.5 rounded-[16px] px-3 py-2.5 text-left transition-colors duration-200 ${isSel ? 'bg-[color-mix(in_srgb,var(--accent)_11%,transparent)]' : 'hover:bg-inset'}`}
                >
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-periwinkle text-[13px] font-bold text-periwinkle-ink">
                    {r.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[15.5px] text-ink ${isSel ? 'font-bold' : 'font-medium'}`}>{r.name}</span>
                    {r.role && <span className="block truncate text-[13px] text-ink-2">{r.role}</span>}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`grid size-6 shrink-0 place-items-center transition-colors duration-200 ${single ? 'rounded-full' : 'rounded-[8px]'} ${isSel ? 'bg-accent text-on-accent' : 'shadow-[inset_0_0_0_2px_var(--line)]'}`}
                  >
                    {isSel && <Check size={14} weight="bold" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );

  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="relative">
        <MagnifyingGlass size={18} weight="bold" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          ref={search}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchTeacher')}
          aria-label={t('searchTeacher')}
          className="h-12 w-full rounded-[14px] bg-inset pl-11 pr-4 text-[16px] text-ink outline-none transition-[box-shadow,background-color] placeholder:text-ink-3 focus:bg-surface focus:shadow-[0_0_0_2px_var(--accent)]"
        />
      </div>

      <div className="-mx-3">
        {failed ? (
          <p role="alert" className="px-3 py-8 text-center text-[14.5px] text-ink-2">{t('recipientsLoadFailed')}</p>
        ) : recipients === null ? (
          <span aria-hidden="true" className="flex flex-col gap-0.5 text-ink">
            {['58%', '44%', '66%', '50%'].map((w) => (
              <span key={w} className="flex items-center gap-3.5 px-3 py-2.5">
                <Bone className="!rounded-full shrink-0" style={{ width: 40, height: 40 }} />
                <span className="flex flex-1 flex-col gap-2"><Line w={w} h={14} /><Line w="30%" h={11} /></span>
              </span>
            ))}
          </span>
        ) : recipients.length === 0 ? (
          <p className="px-3 py-8 text-center text-[14.5px] text-ink-2">{t('recipientsLoading')}</p>
        ) : classTeachers.length + others.length === 0 ? (
          <p className="px-3 py-8 text-center text-[14.5px] text-ink-2">{t('noMatches')}</p>
        ) : (
          <>
            {group(t('classTeacher'), classTeachers)}
            {group(t('others'), others)}
          </>
        )}
      </div>
    </div>
  );
}
