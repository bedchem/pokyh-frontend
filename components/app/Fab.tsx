'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// The page's main action on phones: a round button above the bottom bar,
// thumb-high on the right. Wide screens keep the action in the page header.
// Rendered into <body>, so the page's arrival animation doesn't carry it.
export default function Fab({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!mounted) return null;
  return createPortal(
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fab fixed right-5 z-[45] grid size-[60px] place-items-center rounded-[22px] bg-accent text-on-accent shadow-[0_14px_30px_-12px_rgb(40_28_8/0.55)] transition-[filter] hover:brightness-[0.93] active:brightness-[0.88] lg:hidden dark:shadow-[0_14px_30px_-10px_rgb(0_0_0/0.8)]"
      style={{ bottom: 'calc(72px + var(--safe-bottom) + 16px)' }}
    >
      {children}
    </button>,
    document.body,
  );
}
