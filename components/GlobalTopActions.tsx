'use client';

import { usePathname } from 'next/navigation';
import TopActions from './TopActions';

export default function GlobalTopActions() {
  const pathname = usePathname();
  if (pathname === '/login') return null;

  return (
    <div
      className="fixed top-0 right-0 z-50 pt-14 pr-5 pb-3 pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center">
        <TopActions />
      </div>
    </div>
  );
}
