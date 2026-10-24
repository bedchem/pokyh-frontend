'use client';

import type { ReactNode } from 'react';
import { IconTile } from '@/components/app/Page';

// One of the cards at the top of the settings (Konto & Sicherheit): what the
// account has (its e-mail address, two-factor sign-in on or off, its devices)
// in a line you can read at a glance, with the action right under it.

type Tone = 'periwinkle' | 'butter' | 'sage' | 'blush' | 'neutral';

const PILL: Record<Exclude<Tone, 'neutral'>, string> = {
  periwinkle: 'bg-periwinkle text-periwinkle-ink',
  butter: 'bg-butter text-butter-ink',
  sage: 'bg-sage text-sage-ink',
  blush: 'bg-blush text-blush-ink',
};

export function StatusPill({ tone, children }: { tone: Exclude<Tone, 'neutral'>; children: ReactNode }) {
  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold ${PILL[tone]}`}>
      {children}
    </span>
  );
}

export default function SecurityCard({ icon, tone, title, value, hint, status, actions, highlight = false }: {
  icon: ReactNode;
  tone: Tone;
  title: string;
  /** The state in one line: the e-mail address, "An", "3 Geräte". */
  value?: ReactNode;
  hint?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  /** Something wants doing here (no e-mail address, two-factor sign-in off): the card stands out. */
  highlight?: boolean;
}) {
  return (
    <section
      aria-label={title}
      className={`squircle flex min-w-0 flex-col gap-4 rounded-[24px] p-5 transition-shadow ${
        highlight ? 'bg-surface shadow-[0_0_0_2px_var(--accent)]' : 'bg-surface'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <IconTile tone={tone} size={44}>{icon}</IconTile>
        <div className="min-w-0 flex-1">
          <h3 className="text-[16.5px] font-bold leading-snug tracking-[-0.015em]">{title}</h3>
          {value && <p className="mt-0.5 truncate text-[15px] font-semibold text-ink-2">{value}</p>}
        </div>
        {status}
      </div>
      {hint && <p className="text-[14px] leading-[1.5] text-ink-2">{hint}</p>}
      {actions && <div className="mt-auto flex flex-wrap gap-2">{actions}</div>}
    </section>
  );
}
