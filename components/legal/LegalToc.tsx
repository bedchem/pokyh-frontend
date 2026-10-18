'use client';

import { useEffect, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';

// The table of contents of a legal text: sticky beside the text on wide
// screens (the section being read is marked), a folding list above it on
// phones.
export default function LegalToc({ sections, label }: { sections: { id: string; title: string }[]; label: string }) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  const list = (
    <ol className="flex flex-col gap-0.5">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            aria-current={active === s.id ? 'location' : undefined}
            className={`flex gap-3 rounded-[12px] px-3 py-2 text-[14px] leading-[1.35] transition-colors ${
              active === s.id ? 'bg-inset font-semibold text-ink' : 'text-ink-2 hover:text-ink'
            }`}
          >
            <span className="w-5 shrink-0 tabular-nums text-ink-3">{i + 1}</span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <details className="group rounded-[20px] bg-[var(--surface)] shadow-[0_0_0_1px_var(--line)] lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[15px] font-bold [&::-webkit-details-marker]:hidden">
          {label}
          <CaretDown size={16} weight="bold" aria-hidden="true" className="transition-transform group-open:rotate-180" />
        </summary>
        <nav aria-label={label} className="px-2 pb-3">{list}</nav>
      </details>
      <nav aria-label={label} className="sticky top-28 hidden max-h-[calc(100vh-140px)] overflow-y-auto lg:block" data-lenis-prevent>
        <p className="mb-3 px-3 text-[13px] font-semibold text-ink-3">{label}</p>
        {list}
      </nav>
    </>
  );
}
