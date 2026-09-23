'use client';

import { useEffect } from 'react';
import { useRoutePath, useT } from '@/providers/LocaleProvider';
import { navDict, type NavKey } from '@/lib/i18n/dictionaries/nav';
import { MobileMenuButton } from './Sidebar';
import TopActions from './TopActions';

const ROUTE_TITLES: Record<string, NavKey> = {
  '/home':           'dashboard',
  '/class':          'class',
  '/timetable':      'timetable',
  '/grades':         'grades',
  '/messages':       'messages',
  '/mensa':          'mensa',
  '/absences':       'absences',
  '/classregevents': 'classregevents',
  '/reminders':      'reminders',
  '/todos':          'todos',
  '/school':         'school',
  '/profile':        'profile',
};

function getTitleKey(pathname: string): NavKey | null {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  for (const [route, title] of Object.entries(ROUTE_TITLES)) {
    if (pathname.startsWith(route + '/')) return title;
  }
  return null;
}

export default function DashboardTopbar() {
  const pathname = useRoutePath();
  const t = useT(navDict);
  const titleKey = getTitleKey(pathname);
  const title = titleKey ? t(titleKey) : 'POKYH';

  // App pages are client components without their own metadata, so the tab
  // title follows the page title in the current language.
  useEffect(() => {
    if (titleKey) document.title = `${title} | POKYH`;
  }, [titleKey, title]);

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
