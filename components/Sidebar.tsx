'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Calendar, BarChart2, MessageCircle, Utensils,
  UserX, Bell, CheckSquare, User, ChevronLeft,
  ChevronRight, Menu, X, Scale,
} from 'lucide-react';
import { useSidebar } from '@/providers/SidebarProvider';

const MAIN_NAV = [
  { href: '/home',      label: 'Dashboard',    Icon: Home },
  { href: '/timetable', label: 'Stundenplan',  Icon: Calendar },
  { href: '/grades',    label: 'Noten',        Icon: BarChart2 },
  { href: '/messages',  label: 'Nachrichten',  Icon: MessageCircle },
  { href: '/mensa',     label: 'Mensa',        Icon: Utensils },
];

const SUB_NAV = [
  { href: '/absences',  label: 'Abwesenheiten', Icon: UserX },
  { href: '/reminders', label: 'Erinnerungen',  Icon: Bell },
  { href: '/todos',     label: 'Todos',         Icon: CheckSquare },
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
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full py-4">
      {/* Logo — clickable, goes to dashboard */}
      <Link
        href="/home"
        onClick={closeMobile}
        className={`flex items-center px-4 mb-6 flex-shrink-0 press-scale ${collapsed ? 'justify-center' : ''}`}
      >
        {collapsed ? (
          <img src="/pokyh_ion.png" alt="POKYH" className="h-8 w-8 object-contain" />
        ) : (
          <img src="/POKYH_Logo.png" alt="POKYH" className="h-8 w-auto object-contain" />
        )}
      </Link>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto">
        {MAIN_NAV.map(({ href, label, Icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={pathname === href || pathname.startsWith(href + '/')}
            collapsed={collapsed}
            onClick={closeMobile}
          />
        ))}

        <div className="my-2 mx-1 h-px" style={{ background: 'var(--app-border)' }} />

        {!collapsed && (
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--app-text-tertiary)' }}>
            Schule
          </p>
        )}

        {SUB_NAV.map(({ href, label, Icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={pathname === href}
            collapsed={collapsed}
            onClick={closeMobile}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 mt-2 flex flex-col gap-0.5 flex-shrink-0">
        <NavItem
          href="/profile"
          label="Profil"
          Icon={User}
          active={pathname === '/profile'}
          collapsed={collapsed}
          onClick={closeMobile}
        />
        <NavItem
          href="/legal"
          label="Rechtliches"
          Icon={Scale}
          active={pathname === '/legal'}
          collapsed={collapsed}
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
          {collapsed
            ? <ChevronRight size={16} strokeWidth={2} />
            : <ChevronLeft size={16} strokeWidth={2} />
          }
          {!collapsed && <span className="text-xs font-medium">Einklappen</span>}
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
        {sidebarContent}
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
              {sidebarContent}
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
