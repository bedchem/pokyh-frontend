'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('./Sidebar'));
const DashboardTopbar = dynamic(() => import('./DashboardTopbar'));

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/' || pathname === '/login' || pathname === '/legal') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <DashboardTopbar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
