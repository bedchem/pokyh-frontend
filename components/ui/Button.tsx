import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

// One button recipe for the whole site.
//   primary: the single main action on a screen (indigo fill)
//   ink:     strong but not the accent (ink fill), e.g. on coloured blocks
//   quiet:   secondary action on the canvas (inset fill)
//   text:    inline action, underline on hover
type Variant = 'primary' | 'ink' | 'quiet' | 'text';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none press ' +
  'transition-[background-color,color,box-shadow,opacity] duration-200 disabled:opacity-45 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'rounded-full bg-accent text-on-accent hover:bg-[color-mix(in_srgb,var(--accent)_88%,#000)]',
  ink: 'rounded-full bg-ink text-canvas hover:bg-[color-mix(in_srgb,var(--ink)_86%,var(--canvas))]',
  quiet: 'rounded-full bg-inset text-ink hover:bg-[color-mix(in_srgb,var(--inset)_80%,var(--ink)_8%)]',
  text: 'rounded-md text-ink underline-offset-[5px] decoration-2 hover:underline',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[14px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-14 px-7 text-[16px]',
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
