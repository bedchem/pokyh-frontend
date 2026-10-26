'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';

// A quiet button that opens a short list of choices under it (school year,
// sort order). Closes on a choice, a click elsewhere or Escape.
export default function PickMenu<T extends string | number>({
  value,
  options,
  onChange,
  label,
  align = 'right',
  icon,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  /** Names the list for screen readers. */
  label: string;
  align?: 'left' | 'right';
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState(align);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Opens toward `align`, but flips to the other edge of the button when the
  // list would run off the screen there (e.g. the button wrapped to the left
  // on a phone). Runs before paint, so the list never shows up cut off.
  useLayoutEffect(() => {
    if (!open || !ref.current || !listRef.current) return;
    const btn = ref.current.getBoundingClientRect();
    const w = listRef.current.offsetWidth;
    const gutter = 8;
    setSide(
      align === 'right'
        ? (btn.right - w < gutter ? 'left' : 'right')
        : (btn.left + w > window.innerWidth - gutter ? 'right' : 'left'),
    );
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <Button variant="quiet" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} title={label}>
        {icon}
        {current?.label}
        <CaretDown size={15} weight="bold" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </Button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={label}
          className={`sheet-in absolute top-[calc(100%+6px)] z-50 min-w-[190px] rounded-[16px] bg-surface p-1.5 shadow-[var(--shadow-float)] ${side === 'right' ? 'right-0' : 'left-0'}`}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={String(o.value)}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14.5px] font-semibold transition-colors ${active ? 'bg-periwinkle text-periwinkle-ink' : 'hover:bg-inset'}`}
                >
                  {o.label}
                  {active && <Check size={15} weight="bold" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
