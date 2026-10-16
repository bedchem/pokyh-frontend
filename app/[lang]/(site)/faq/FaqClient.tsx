'use client';

import { useId, useMemo, useState } from 'react';
import { MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { useT } from '@/providers/LocaleProvider';
import { faqDict, FAQ_GROUPS, type FaqKey } from '@/lib/i18n/dictionaries/faq';
import PageIntro from '@/components/site/PageIntro';
import CtaBand from '@/components/site/CtaBand';

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <li className="border-t border-line">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-button`}
          onClick={onToggle}
          className="group flex w-full items-start justify-between gap-6 py-6 text-left"
        >
          <span className="text-[19px] md:text-[23px] font-bold leading-snug tracking-[-0.02em] text-ink">{q}</span>
          <span
            className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full transition-[background-color,transform] duration-300 ease-[var(--ease-out)] ${
              open ? 'rotate-45 bg-accent text-on-accent' : 'bg-inset text-ink group-hover:bg-[color-mix(in_srgb,var(--inset)_70%,var(--ink)_12%)]'
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
        className="grid transition-[grid-template-rows] duration-400 ease-[var(--ease-out)]"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden" inert={!open}>
          <p className="max-w-[68ch] pb-7 pr-14 text-[16px] md:text-[18px] leading-[1.65] text-ink-2">{a}</p>
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
        <label className="flex h-14 items-center gap-3 rounded-full bg-inset px-5 text-ink focus-within:outline-2 focus-within:outline-accent">
          <MagnifyingGlass size={20} weight="bold" className="text-ink-2" aria-hidden="true" />
          <span className="visually-hidden">{t('search')}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search')}
            className="h-full flex-1 bg-transparent text-[16px] text-ink placeholder:text-ink-3 outline-none"
          />
        </label>
      </PageIntro>

      <section className="bg-canvas">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10 pb-24 md:pb-36">
          {groups.length === 0 && <p className="border-t border-line pt-8 text-[18px] text-ink-2" role="status">{t('noResults')}</p>}
          {groups.map((g) => (
            <div key={g.key} className="grid gap-4 lg:grid-cols-12 lg:gap-10 mb-14 md:mb-20 last:mb-0">
              <h2 className="lg:col-span-3 text-[15px] font-bold text-ink-2 lg:pt-7">{t(g.key)}</h2>
              <ul className="lg:col-span-9 border-b border-line">
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

      <CtaBand title={t('ctaTitle')} lead={t('ctaLead')} primary={{ label: t('ctaLogin'), href: '/login' }} tone="butter" />
    </>
  );
}
