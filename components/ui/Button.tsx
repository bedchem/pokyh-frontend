import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

// One button recipe for the whole site, in the look of the public pages'
// `.key`: flat, solid, slightly squared; hover deepens the colour a touch,
// pressing deepens it a little more (nothing shrinks or bounces).
//   primary: the single main action on a screen (indigo fill)
//   tone:    a friendly secondary action (periwinkle block)
//   ink:     strong but not the accent (ink fill; indigo in the dark theme,
//            never a white face)
//   quiet:   secondary action on the canvas (inset fill)
//   danger:  destructive action (red tint)
//   text:    inline action, underline on hover
type Variant = 'primary' | 'tone' | 'ink' | 'quiet' | 'danger' | 'text';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold tracking-[-0.01em] whitespace-nowrap select-none ' +
  'transition-[background-color,color,filter] duration-200 active:brightness-[0.88] dark:active:brightness-125 ' +
  'disabled:opacity-45 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:brightness-[0.93] dark:hover:brightness-110',
  tone: 'bg-periwinkle text-periwinkle-ink hover:brightness-[0.96] dark:hover:brightness-125',
  ink: 'bg-ink text-canvas hover:brightness-[1.25] dark:bg-accent dark:text-on-accent dark:hover:brightness-110',
  quiet: 'bg-inset text-ink hover:bg-[color-mix(in_srgb,var(--inset)_86%,var(--ink))]',
  danger: 'bg-[color-mix(in_srgb,var(--danger)_13%,transparent)] text-danger-ink hover:bg-[color-mix(in_srgb,var(--danger)_20%,transparent)]',
  text: 'rounded-md text-ink underline-offset-[5px] decoration-2 hover:underline',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 rounded-[11px] px-3.5 text-[14px]',
  md: 'h-11 rounded-[14px] px-5 text-[15px]',
  lg: 'h-[52px] rounded-[16px] px-6 text-[16px]',
};

function classes(variant: Variant, size: Size, className?: string) {
  const sizing = variant === 'text' ? 'h-auto px-0 text-[15px]' : sizes[size];
  return `${base} ${variants[variant]} ${sizing} ${className ?? ''}`;
}

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: Common & Omit<ComponentProps<'button'>, 'className' | 'children'>) {
  return (
    <button type="button" className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  external,
  ...rest
}: Common & { external?: boolean } & Omit<ComponentProps<typeof Link>, 'className' | 'children'>) {
  if (external) {
    return (
      <a
        href={String(rest.href)}
        target="_blank"
        rel="noopener noreferrer"
        className={classes(variant, size, className)}
      >
        {children}
      </a>
    );
  }
  return (
    <Link className={classes(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
