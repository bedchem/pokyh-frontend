'use client';

import type { ReactNode } from 'react';

// One of the rows at the top of Konto & Sicherheit: what the account has (its
// e-mail address, password, two-factor sign-in, its devices), a pixel icon on
// the left, the action on the right. Rows under thin rules like the other
// settings; only one where something wants doing keeps an outline.

type Tone = 'periwinkle' | 'butter' | 'sage' | 'blush';

const PILL: Record<Tone, string> = {
  periwinkle: 'bg-periwinkle text-periwinkle-ink',
  butter: 'bg-butter text-butter-ink',
  sage: 'bg-sage text-sage-ink',
  blush: 'bg-blush text-blush-ink',
};

export function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold ${PILL[tone]}`}>
      {children}
    </span>
  );
}

export default function SecurityRow({ icon, title, value, hint, status, actions, highlight = false }: {
  /** The row's pixel icon (PixelIcon). */
  icon: ReactNode;
  title: string;
  /** The state in one line: the e-mail address, "An", "3 Geräte". */
  value?: ReactNode;
  hint?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  /** Something wants doing here (no e-mail address, two-factor sign-in off): the row keeps an outline. */
  highlight?: boolean;
}) {
  return (
    <section aria-label={title} className={`border-t border-line ${highlight ? 'py-3' : 'py-5'}`}>
      <div className={`flex gap-4 ${highlight ? 'squircle -mx-3 rounded-[22px] px-3 py-4 shadow-[0_0_0_2px_var(--accent)] sm:gap-5' : 'sm:gap-5'}`}>
        {icon}
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <h3 className="text-[16.5px] font-bold tracking-[-0.015em]">{title}</h3>
              {status}
            </div>
            {value && <p className="mt-0.5 truncate text-[15px] font-semibold text-ink-2">{value}</p>}
            {hint && <p className="mt-1 max-w-[52ch] text-[14.5px] leading-[1.55] text-ink-2">{hint}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
