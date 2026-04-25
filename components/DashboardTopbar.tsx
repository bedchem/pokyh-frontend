'use client';

import { usePathname } from 'next/navigation';
import { MobileMenuButton } from './Sidebar';
import TopActions from './TopActions';

const ROUTE_TITLES: Record<string, string> = {
  '/home':      'Dashboard',
  '/timetable': 'Stundenplan',
  '/grades':    'Noten',
  '/messages':  'Nachrichten',
  '/mensa':     'Mensa',
  '/absences':  'Abwesenheiten',
  '/reminders': 'Erinnerungen',
  '/todos':     'Todos',
  '/school':    'Schule',
  '/profile':   'Profil',
};

function getTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  for (const [route, title] of Object.entries(ROUTE_TITLES)) {
    if (pathname.startsWith(route + '/')) return title;
  }
  return 'POKYH';
}

export default function DashboardTopbar() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-4 md:px-6"
      style={{
        height: 'var(--topbar-h)',
        background: 'var(--app-surface)',
        borderBottom: '1px solid var(--app-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <MobileMenuButton />
        <h1
          className="text-base font-semibold tracking-tight"
          style={{ color: 'var(--app-text-primary)' }}
        >
          {title}
        </h1>
      </div>
      <TopActions />
    </header>
  );
}
