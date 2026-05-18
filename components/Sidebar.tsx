'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isPWA } from '@/lib/pwa';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Calendar, BarChart2, MessageCircle, Utensils,
  UserX, Bell, CheckSquare, User, ChevronLeft,
  ChevronRight, Menu, X, Scale, Moon, Sun, BookOpen, Users,
} from 'lucide-react';
import { useSidebar } from '@/providers/SidebarProvider';
import { useTheme } from '@/providers/ThemeProvider';

const NAV_GROUPS = [
  {
    label: 'Übersicht',
    items: [
      { href: '/home',  label: 'Dashboard', Icon: Home },
      { href: '/class', label: 'Klasse',    Icon: Users },
    ],
  },
  {
    label: 'Unterricht',
    items: [
      { href: '/timetable',      label: 'Stundenplan',      Icon: Calendar },
      { href: '/grades',         label: 'Noten',            Icon: BarChart2 },
      { href: '/absences',       label: 'Abwesenheiten',    Icon: UserX },
      { href: '/classregevents', label: 'Klassenbuch',      Icon: BookOpen },
    ],
  },
  {
    label: 'Mehr',
    items: [
      { href: '/mensa',     label: 'Mensa',        Icon: Utensils },
      { href: '/messages',  label: 'Nachrichten',  Icon: MessageCircle },
      { href: '/reminders', label: 'Erinnerungen', Icon: Bell },
      { href: '/todos',     label: 'Todos',        Icon: CheckSquare },
    ],
  },
];

function NavItem({
  href,
  label,
  Icon,
  active,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 transition-all duration-150"
      style={{
        background: active
          ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
          : 'transparent',
        color: active ? 'var(--accent)' : 'var(--app-text-secondary)',
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--accent) 6%, transparent)';
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {active && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
          style={{ background: 'var(--accent)' }}
        />
      )}
      <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
      {!collapsed && (
        <span className="text-sm font-medium truncate leading-none">{label}</span>
      )}
      {collapsed && (
        <div
          className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'var(--app-card)', color: 'var(--app-text-primary)', border: '1px solid var(--app-border)' }}
        >
          {label}
        </div>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const { collapsed, mobileOpen, toggle, closeMobile } = useSidebar();
  const { resolved, setTheme } = useTheme();
  const pathname = usePathname();
  const [logoHref, setLogoHref] = useState('/');
  useEffect(() => { if (isPWA()) setLogoHref('/home'); }, []);

  const renderSidebarContent = (isCollapsed: boolean) => (
    <div className="flex flex-col h-full py-4">
      {/* Logo — clickable, goes to root or /home on PWA */}
      <Link
        href={logoHref}
        onClick={closeMobile}
        className={`flex items-center px-4 mb-6 flex-shrink-0 press-scale ${isCollapsed ? 'justify-center' : ''}`}
      >
        {isCollapsed ? (
          <img src="/pokyh_ion.png" alt="POKYH" className="h-8 w-8 object-contain" />
        ) : (
          <>
            <img src="/pokyh_ion.png" alt="POKYH" className="h-8 w-8 object-contain" />
            <span className="ml-3 font-bold text-xl tracking-wide" style={{ color: 'var(--app-text-primary)' }}>POKYH</span>
          </>
        )}
      </Link>

      {/* Main nav */}
      <nav className="flex flex-col px-3 flex-1 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-3' : ''}>
            {!isCollapsed && (
              <p className="px-3 mb-0.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--app-text-tertiary)' }}>
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ href, label, Icon }) => (
                <NavItem
                  key={href}
                  href={href}
                  label={label}
                  Icon={Icon}
                  active={pathname === href || pathname.startsWith(href + '/')}
                  collapsed={isCollapsed}
                  onClick={closeMobile}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 mt-2 flex flex-col gap-0.5 flex-shrink-0">
        <NavItem
          href="/profile"
          label="Profil"
          Icon={User}
          active={pathname === '/profile'}
          collapsed={isCollapsed}
          onClick={closeMobile}
        />
        <button
          onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
          className="group relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 w-full transition-all duration-150"
          style={{
            background: 'color-mix(in srgb, var(--app-text-primary) 8%, transparent)',
            color: 'var(--app-text-primary)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--app-text-primary) 14%, transparent)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--app-text-primary) 8%, transparent)'; }}
        >
          {resolved === 'dark'
            ? <Moon size={20} strokeWidth={1.8} />
            : <Sun size={20} strokeWidth={1.8} />
          }
          {!isCollapsed && (
            <span className="text-sm font-medium truncate leading-none">
              {resolved === 'dark' ? 'Dark Mode' : 'White Mode'}
            </span>
          )}
          {isCollapsed && (
            <div
              className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'var(--app-card)', color: 'var(--app-text-primary)', border: '1px solid var(--app-border)' }}
            >
              {resolved === 'dark' ? 'Dark Mode' : 'White Mode'}
            </div>
          )}
        </button>
        <NavItem
          href="/legal"
          label="Rechtliches"
          Icon={Scale}
          active={pathname === '/legal'}
          collapsed={isCollapsed}
          onClick={closeMobile}
        />

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggle}
          className="hidden lg:flex items-center gap-3 rounded-xl px-3 py-2.5 w-full transition-colors duration-150"
          style={{ color: 'var(--app-text-tertiary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--app-text-secondary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--app-text-tertiary)')}
        >
          {isCollapsed
            ? <ChevronRight size={16} strokeWidth={2} />
            : <ChevronLeft size={16} strokeWidth={2} />
          }
          {!isCollapsed && <span className="text-xs font-medium">Einklappen</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col flex-shrink-0 overflow-hidden relative"
        style={{
          background: 'var(--app-surface)',
          borderRight: '1px solid var(--app-border)',
        }}
      >
        {renderSidebarContent(collapsed)}
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={closeMobile}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[280px] flex flex-col overflow-hidden"
              style={{
                background: 'var(--app-surface)',
                borderRight: '1px solid var(--app-border)',
              }}
            >
              <button
                onClick={closeMobile}
                className="absolute top-4 right-4 p-1.5 rounded-lg"
                style={{ color: 'var(--app-text-tertiary)' }}
              >
                <X size={18} />
              </button>
              {renderSidebarContent(false)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function MobileMenuButton() {
  const { toggleMobile } = useSidebar();
  return (
    <button
      onClick={toggleMobile}
      className="lg:hidden p-2 rounded-xl"
      style={{ color: 'var(--app-text-secondary)' }}
    >
      <Menu size={20} />
    </button>
  );
}
