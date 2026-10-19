'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { ArrowLeft, CaretRight } from '@phosphor-icons/react';
import { useLocalizeHref } from '@/providers/LocaleProvider';

// Building blocks every signed-in page is set in, so all of them share one
// rhythm: a large title, sections with plain headings, cards told apart from
// the canvas by their fill (no borders, no glow), rows with generous targets.

/** The scrolling column of a page: 1440px at most, 20/32/48px from the edges. */
export function Page({
  children,
  width = 'default',
  className = '',
}: {
  children: ReactNode;
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
}) {
  // One column width for every page, so all of them keep the same distance
  // from the edges (the top bar and the timetable use the same values).
  void width;
  const max = 'max-w-[1440px]';
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable]">
      <div className={`mx-auto w-full ${max} px-5 pb-20 sm:px-8 lg:px-12 lg:pb-24 ${className}`}>{children}</div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
  mobileAside,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** A compact control beside the title on phones (wide screens show `actions`). */
  mobileAside?: ReactNode;
  /** A parent page to return to (shown above the title). */
  back?: { href: string; label: string };
  children?: ReactNode;
}) {
  const localize = useLocalizeHref();
  return (
    <header className="rise pt-4 pb-7 md:pt-8 md:pb-9">
      {back && (
        <Link
          href={localize(back.href)}
          className="-ml-1 mb-4 inline-flex h-9 items-center gap-1.5 rounded-full pl-1 pr-3 text-[15px] font-semibold text-ink-2 transition-colors hover:bg-inset hover:text-ink"
        >
          <ArrowLeft size={17} weight="bold" aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[34px] font-extrabold leading-[1.04] tracking-[-0.05em] md:text-[46px]">{title}</h1>
            {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-ink-2 md:text-[17px]">{subtitle}</p>}
          </div>
          {mobileAside && <div className="shrink-0 md:hidden">{mobileAside}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

export function Section({
  title,
  action,
  children,
  className = '',
  id,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={className} aria-label={typeof title === 'string' ? title : undefined}>
      {(title || action) && (
        <div className="mb-3.5 flex items-end justify-between gap-3">
          {title && <h2 className="text-[20px] font-extrabold tracking-[-0.035em] md:text-[22px]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** "All →" next to a section title. */
export function SectionLink({ href, children }: { href: string; children: ReactNode }) {
  const localize = useLocalizeHref();
  return (
    <Link
      href={localize(href)}
      className="group -mr-2 inline-flex h-9 items-center gap-1 rounded-full px-2 text-[14px] font-semibold text-ink-2 transition-colors hover:text-ink"
    >
      {children}
      <CaretRight size={14} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

export function Card({ children, className = '', as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' }) {
  return <Tag className={`squircle rounded-[24px] bg-surface ${className}`}>{children}</Tag>;
}

/**
 * Rows grouped into one block, each row its own rounded segment with a small
 * gap between them (the Android list style): rows read as separate targets
 * without divider lines.
 */
export function RowGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-[3px] overflow-hidden rounded-[22px] ${className}`}>{children}</div>;
}

type RowProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  danger?: boolean;
  className?: string;
};

function RowInner({ icon, title, description, trailing, chevron, danger }: RowProps) {
  return (
    <>
      {icon}
      <span className="min-w-0 flex-1">
        <span className={`block text-[15.5px] font-semibold leading-snug ${danger ? 'text-danger-ink' : 'text-ink'}`}>{title}</span>
        {description && <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-2">{description}</span>}
      </span>
      {trailing}
      {chevron && <CaretRight size={16} weight="bold" className="shrink-0 text-ink-3" aria-hidden="true" />}
    </>
  );
}

const rowBase = 'flex w-full items-center gap-3.5 rounded-[6px] bg-surface px-4 py-3.5 text-left first:rounded-t-[22px] last:rounded-b-[22px] min-h-[64px]';
const rowAction = 'transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_92%,var(--ink))] active:bg-[color-mix(in_srgb,var(--surface)_88%,var(--ink))]';

export function Row(props: RowProps) {
  return <div className={`${rowBase} ${props.className ?? ''}`}><RowInner {...props} /></div>;
}

export function RowButton({ onClick, disabled, ...props }: RowProps & { onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${rowBase} ${rowAction} disabled:opacity-50 ${props.className ?? ''}`}>
      <RowInner {...props} />
    </button>
  );
}

export function RowLink({ href, external, ...props }: RowProps & { href: string; external?: boolean } & Pick<ComponentProps<'a'>, 'target'>) {
  const localize = useLocalizeHref();
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${rowBase} ${rowAction} ${props.className ?? ''}`}>
        <RowInner {...props} />
      </a>
    );
  }
  return (
    <Link href={localize(href)} className={`${rowBase} ${rowAction} ${props.className ?? ''}`}>
      <RowInner chevron {...props} />
    </Link>
  );
}

/** A small square in a category tone holding a glyph. */
export function IconTile({ children, tone = 'periwinkle', size = 40 }: { children: ReactNode; tone?: 'periwinkle' | 'butter' | 'sage' | 'blush' | 'danger' | 'neutral'; size?: number }) {
  const cls = {
    periwinkle: 'bg-periwinkle text-periwinkle-ink',
    butter: 'bg-butter text-butter-ink',
    sage: 'bg-sage text-sage-ink',
    blush: 'bg-blush text-blush-ink',
    danger: 'bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-danger-ink',
    neutral: 'bg-inset text-ink-2',
  }[tone];
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-[12px] ${cls}`} style={{ width: size, height: size }}>
      {children}
    </span>
  );
}


/** An on/off switch (the Android one: indigo track when on). */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${checked ? 'bg-accent' : 'bg-[color-mix(in_srgb,var(--ink)_18%,transparent)]'}`}
    >
      <span
        className="absolute top-[3px] left-[3px] size-6 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)] transition-transform duration-200 ease-[var(--ease-out)]"
        style={{ transform: checked ? 'translateX(20px)' : 'none' }}
      />
    </button>
  );
}

/** One of a few choices, as a row of segments. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className = '',
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex gap-1 rounded-[14px] bg-inset p-1 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`inline-flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] px-3.5 text-[14px] font-semibold transition-colors duration-200 ${
              active ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)]' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
