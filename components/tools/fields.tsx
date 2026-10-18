'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';

// Inputs of the public calculators, styled like the sign-in fields.

const FIELD =
  'flex h-[52px] items-center gap-2 rounded-[16px] bg-[var(--surface)] px-4 shadow-[0_0_0_1.5px_var(--line)] transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent-ink)]';
const FIELD_INVALID = 'shadow-[0_0_0_2px_var(--danger)] focus-within:shadow-[0_0_0_2px_var(--danger)]';

export function NumberField({
  id,
  label,
  suffix,
  invalid = false,
  hideLabel = false,
  className = '',
  ...input
}: {
  id: string;
  label: string;
  suffix?: ReactNode;
  invalid?: boolean;
  hideLabel?: boolean;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className' | 'type'>) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-1.5 block px-1 text-[13.5px] font-semibold text-ink-2'}>
        {label}
      </label>
      <div className={`${FIELD} ${invalid ? FIELD_INVALID : ''}`}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={invalid || undefined}
          suppressHydrationWarning
          className="h-full min-w-0 flex-1 bg-transparent text-[17px] font-semibold tabular-nums outline-none placeholder:font-medium placeholder:text-ink-3"
          {...input}
        />
        {suffix && <span className="shrink-0 text-[14px] font-semibold text-ink-3">{suffix}</span>}
      </div>
    </div>
  );
}

export function SelectField<V extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className = '',
}: {
  id: string;
  label: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (value: V) => void;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-1.5 block px-1 text-[13.5px] font-semibold text-ink-2">{label}</label>
      <div className={`${FIELD} relative pr-10`}>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as V)}
          className="h-full min-w-0 flex-1 cursor-pointer appearance-none truncate bg-transparent text-[16px] font-semibold outline-none"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <svg aria-hidden="true" viewBox="0 0 12 12" className="pointer-events-none absolute right-4 size-3 text-ink-3">
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export function Segmented<V extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (value: V) => void;
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div role="radiogroup" aria-label={label} className="relative grid grid-flow-col auto-cols-fr rounded-full bg-inset p-1">
      <span
        aria-hidden="true"
        className="absolute bottom-1 left-1 top-1 rounded-full bg-[var(--surface)] shadow-[0_1px_3px_rgb(0_0_0/0.12)] transition-transform duration-500 ease-[var(--ease-out)]"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`relative h-10 truncate rounded-full px-3 text-[14px] font-semibold transition-colors ${o.value === value ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Numbers in the page's language: 5,67 in German and Italian, 5.67 in English. */
export function formatNumber(value: number, locale: string, digits = 2): string {
  return new Intl.NumberFormat(locale === 'lld' ? 'de' : locale, { maximumFractionDigits: digits }).format(value);
}
