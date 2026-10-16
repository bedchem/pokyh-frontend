'use client';

import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import { useLocalizeHref } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';

// Closing band of a subpage: a short statement and up to two actions.
export default function CtaBand({
  title,
  lead,
  primary,
  secondary,
  tone = 'periwinkle',
}: {
  title: string;
  lead?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  tone?: 'periwinkle' | 'butter' | 'sage' | 'blush';
}) {
  const localize = useLocalizeHref();
  const { user } = useSession();
  const bg = { periwinkle: 'bg-periwinkle', butter: 'bg-butter', sage: 'bg-sage', blush: 'bg-blush' }[tone];
  const primaryHref = primary.href === '/login' && user ? '/home' : primary.href;

  return (
    <section className={`${bg} text-ink`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 py-20 md:py-28 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-extrabold leading-[0.92] tracking-[-0.055em] text-[clamp(52px,14vw,88px)] md:text-[clamp(72px,9vw,160px)]">{title}</h2>
          {lead && <p className="mt-5 max-w-[40ch] text-[17px] md:text-[19px] text-ink-2">{lead}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:pb-4">
          <Link
            href={localize(primaryHref)}
            className="group inline-flex h-14 items-center gap-2.5 rounded-full bg-accent px-7 text-[16px] font-semibold text-on-accent press transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_88%,#000)]"
          >
            {primary.label}
            <ArrowRight size={18} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          {secondary && (
            <Link href={localize(secondary.href)} className="text-[16px] font-semibold underline-offset-[6px] decoration-2 hover:underline">
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
