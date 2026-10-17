import type { ReactNode } from 'react';

export type SiteTone = 'periwinkle' | 'butter' | 'sage' | 'blush' | 'mint';

/** Fill and ink of a category tone, as utility classes. */
export const TONE: Record<SiteTone, string> = {
  periwinkle: 'bg-periwinkle text-periwinkle-ink',
  butter: 'bg-butter text-butter-ink',
  sage: 'bg-sage text-sage-ink',
  blush: 'bg-blush text-blush-ink',
  mint: 'bg-[var(--mint)] text-[var(--mint-ink)]',
};

// The opening of every public subpage: one large title, a lead paragraph and
// optional actions, set in one column so it reads top to bottom. It only
// rises in gently (CSS), nothing else moves.
export default function PageIntro({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="text-ink">
      <div className="wrap pb-14 pt-36 md:pb-20 md:pt-48">
        <h1 className="rise max-w-[16ch] text-[clamp(42px,7.2vw,96px)] font-extrabold leading-[1.04] tracking-[-0.05em] [animation-delay:60ms]">
          {title}
        </h1>
        {lead && (
          <p className="rise mt-7 max-w-[54ch] text-[18px] leading-[1.6] text-ink-2 md:text-[21px] [animation-delay:120ms]">
            {lead}
          </p>
        )}
        {children && <div className="rise mt-9 [animation-delay:180ms]">{children}</div>}
      </div>
    </header>
  );
}
