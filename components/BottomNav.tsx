'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Tab {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 9.5L12 3L21 9.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5Z"
        fill={active ? 'var(--accent)' : 'none'}
        stroke={active ? 'var(--accent)' : 'var(--app-text-tertiary)'}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 21V12h6v9"
        stroke={active ? 'white' : 'var(--app-text-tertiary)'}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TimetableIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--app-text-tertiary)';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke={c} strokeWidth="1.8" />
      <path d="M3 9h18" stroke={c} strokeWidth="1.8" />
      <path d="M8 2v4M16 2v4" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="7" y="12" width="3" height="3" rx="0.5" fill={active ? 'var(--accent)' : c} />
      <rect x="12" y="12" width="3" height="3" rx="0.5" fill={active ? 'var(--accent)' : c} />
    </svg>
  );
}

function SchoolIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--app-text-tertiary)';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 20h20M4 20V10M20 20V10M12 3L2 10h20L12 3Z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <rect x="9" y="14" width="6" height="6" rx="0.5" stroke={c} strokeWidth="1.8" />
    </svg>
  );
}

function MensaIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--app-text-tertiary)';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3C8 3 5 6.5 5 10h14c0-3.5-3-7-7-7Z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M4 10h16v2a8 8 0 0 1-16 0v-2Z" stroke={c} strokeWidth="1.8" />
      <path d="M12 20v2" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--app-text-tertiary)';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 7h6M9 11h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

const TABS: Tab[] = [
  { href: '/home', label: 'Home', icon: (a) => <HomeIcon active={a} /> },
  { href: '/timetable', label: 'Stundenplan', icon: (a) => <TimetableIcon active={a} /> },
  { href: '/school', label: 'Schule', icon: (a) => <SchoolIcon active={a} /> },
  { href: '/mensa', label: 'Mensa', icon: (a) => <MensaIcon active={a} /> },
  { href: '/classregevents', label: 'Klassenbuch', icon: (a) => <BookIcon active={a} /> },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'var(--app-surface)',
        borderTop: '1px solid var(--app-separator)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        height: 'var(--nav-h)',
      }}
    >
      <div className="flex items-stretch px-2 pb-safe h-full mx-auto sm:max-w-sm md:max-w-md sm:px-4">
        {TABS.map((tab) => {
          const active = path === tab.href || path.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center justify-center gap-1 press-scale"
            >
              {tab.icon(active)}
              <span
                className="text-[10px] font-medium tracking-tight"
                style={{ color: active ? 'var(--accent)' : 'var(--app-text-tertiary)' }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
