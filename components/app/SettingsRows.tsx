'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight, CaretRight } from '@phosphor-icons/react';
import { useLocalizeHref } from '@/providers/LocaleProvider';

// Rows as the settings set them out (and the profile at its end): each
// group's name on the left (it stays in view on wide screens), its rows on
// the right under thin rules, no boxes around them.

export function Group({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="rise grid scroll-mt-6 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.3fr)] lg:gap-12">
      <h2 id={`${id}-title`} className="text-[22px] font-extrabold tracking-[-0.035em] lg:sticky lg:top-6 lg:self-start lg:pt-5 md:text-[26px]">
        {title}
      </h2>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

export function Item({ title, hint, children, danger, inline = false, className = '' }: {
  title: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
  danger?: boolean;
  /** Title and value side by side on phones too (short values such as an ID). */
  inline?: boolean;
  className?: string;
}) {
  const layout = inline
    ? 'flex-row items-center justify-between gap-4 sm:gap-8'
    : 'flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8';
  return (
    <div className={`flex border-t border-line py-5 ${layout} ${className}`}>
      <div className="min-w-0">
        <p className={`text-[16.5px] font-bold tracking-[-0.015em] ${danger ? 'text-danger-ink' : ''}`}>{title}</p>
        {hint && <p className="mt-1 max-w-[52ch] text-[14.5px] leading-[1.55] text-ink-2">{hint}</p>}
      </div>
      {children && <div className={inline ? 'min-w-0' : 'shrink-0'}>{children}</div>}
    </div>
  );
}

export function LinkItem({ href, title, hint, external }: { href: string; title: string; hint?: string; external?: boolean }) {
  const localize = useLocalizeHref();
  const inner = (
    <>
      <span className="min-w-0">
        <span className="block text-[16.5px] font-bold tracking-[-0.015em]">{title}</span>
        {hint && <span className="mt-1 block text-[14.5px] text-ink-2">{hint}</span>}
      </span>
      {external
        ? <ArrowUpRight size={18} weight="bold" className="shrink-0 text-ink-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        : <CaretRight size={18} weight="bold" className="shrink-0 text-ink-3 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />}
    </>
  );
  // The rule sits on a straight wrapper; only the hover fill inside is rounded.
  const cls = 'group -mx-3 flex items-center justify-between gap-6 rounded-[14px] px-3 py-3.5 transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]';
  return (
    <div className="border-t border-line py-1.5">
      {external
        ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
        : <Link href={localize(href)} className={cls}>{inner}</Link>}
    </div>
  );
}
