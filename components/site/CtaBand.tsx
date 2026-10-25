'use client';

import Link from 'next/link';
import { useLocalizeHref } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { TONE, type SiteTone } from './PageIntro';

// The last thing on a subpage before the footer: one card in the page's tone
// with a short statement and where to go next.
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
  tone?: SiteTone;
}) {
  const localize = useLocalizeHref();
  const { user } = useSession();
  const primaryHref = primary.href === '/login' && user ? '/home' : primary.href;

  return (
    <section className="wrap pb-24 md:pb-32">
      <div className={`squircle flex flex-col gap-8 rounded-[28px] px-7 py-10 md:flex-row md:items-end md:justify-between md:rounded-[40px] md:px-14 md:py-14 ${TONE[tone]}`}>
        <div>
          <h2 className="max-w-[16ch] text-[clamp(34px,4.6vw,64px)] font-extrabold leading-[1.04] tracking-[-0.05em]">{title}</h2>
          {lead && <p className="mt-4 max-w-[44ch] text-[17px] leading-[1.55] md:text-[19px]">{lead}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={localize(primaryHref)} className="key key-lg">
            {primary.label}
            <span aria-hidden="true" className="key-arrow">→</span>
          </Link>
          {secondary && (
            <Link href={localize(secondary.href)} className="key key-lg key-line">
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
