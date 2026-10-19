'use client';

import { useId, useMemo, useState } from 'react';
import { MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { useT } from '@/providers/LocaleProvider';
import { faqDict, FAQ_GROUPS, type FaqKey } from '@/lib/i18n/dictionaries/faq';
import PageIntro from '@/components/site/PageIntro';
import CtaBand from '@/components/site/CtaBand';
import PixelState from '@/components/app/PixelState';

// Questions as cards, grouped, with a search on top. Answers open in place
// and are set for reading: one column, comfortable size and line height.

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <li className="card overflow-hidden">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-button`}
          onClick={onToggle}
          className="group flex w-full items-center justify-between gap-6 px-5 py-5 text-left md:px-7 md:py-6"
        >
          <span className="text-[18px] font-bold leading-[1.35] tracking-[-0.015em] text-ink md:text-[20px]">{q}</span>
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-full transition-[background-color,color,rotate] duration-300 ease-[var(--ease-out)] ${
              open ? 'rotate-45 bg-ink text-[var(--paper)]' : 'bg-inset text-ink group-hover:bg-line'
            }`}
            aria-hidden="true"
          >
            <Plus size={16} weight="bold" />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        className="grid transition-[grid-template-rows] duration-300 ease-[var(--ease-out)]"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden" inert={!open}>
          <p className="max-w-[64ch] px-5 pb-6 text-[17px] leading-[1.7] text-ink-2 md:px-7 md:pb-7 md:text-[18px]">{a}</p>
        </div>
      </div>
    </li>
  );
}

export default function FaqClient() {
  const t = useT(faqDict);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Set<number>>(() => new Set([1]));

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_GROUPS.map((g) => ({
      key: g.key,
      items: g.questions.filter((n) => {
        if (!q) return true;
        return `${t(`q${n}` as FaqKey)} ${t(`a${n}` as FaqKey)}`.toLowerCase().includes(q);
      }),
    })).filter((g) => g.items.length > 0);
  }, [query, t]);

  const toggle = (n: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  return (
    <>
      <PageIntro title={t('title')} lead={t('lead')}>
        <label className="card flex h-14 max-w-[560px] items-center gap-3 px-5 text-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent md:h-16">
          <MagnifyingGlass size={20} weight="bold" className="text-ink-3" aria-hidden="true" />
          <span className="visually-hidden">{t('search')}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search')}
            className="h-full flex-1 bg-transparent text-[17px] text-ink placeholder:text-ink-3 outline-none"
          />
        </label>
      </PageIntro>

      <section className="wrap pb-20 md:pb-28">
        {groups.length === 0 && <PixelState sprite="search" title={t('noResults')} />}
        <div className="flex flex-col gap-14 md:gap-20">
          {groups.map((g) => (
            <div key={g.key} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:gap-12">
              <h2 className="text-[24px] font-extrabold tracking-[-0.03em] text-ink lg:sticky lg:top-28 lg:self-start lg:pt-5 md:text-[28px]">{t(g.key)}</h2>
              <ul className="flex flex-col gap-3">
                {g.items.map((n) => (
                  <Item
                    key={n}
                    q={t(`q${n}` as FaqKey)}
                    a={t(`a${n}` as FaqKey)}
                    open={open.has(n) || query.trim().length > 1}
                    onToggle={() => toggle(n)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <CtaBand title={t('ctaTitle')} lead={t('ctaLead')} primary={{ label: t('ctaLogin'), href: '/login' }} tone="sage" />
    </>
  );
}
