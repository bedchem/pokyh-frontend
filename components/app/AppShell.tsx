'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { EnvelopeSimple, GearSix, MagnifyingGlass, Moon, SidebarSimple, Sun } from '@phosphor-icons/react';
import { useLocalizeHref, useRoutePath, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { shellDict } from '@/lib/i18n/dictionaries/shell';
import Avatar from './Avatar';
import SearchPalette from './SearchPalette';
import { AppActionsProvider } from './actions';
import { useUnreadMessages, useUntisPermissions } from './hooks';
import { BOTTOM_TABS, DEST, SIDEBAR_GROUPS, isActive, tabFor, type AppDestination } from './nav';
import { useSidebarCollapsed } from './sidebar-state';
import s from './shell.module.css';

// The frame around every signed-in page: a sidebar on wide screens, the
// Android app's five-tab bottom bar on phones, and a top bar with the search
// on both. Pages fill <main> and scroll inside it, so the frame never moves.

const GLIDE = { type: 'spring', stiffness: 520, damping: 42, mass: 0.9 } as const;

const noopSubscribe = () => () => {};
const isApplePlatform = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export default function AppShell({ children }: { children: ReactNode }) {
  const t = useT(shellDict);
  const path = useRoutePath();
  const [collapsed] = useSidebarCollapsed();
  const [ready, setReady] = useState(false);
  const [searching, setSearching] = useState(false);

  // Transitions only after the stored sidebar state is applied, so a folded
  // sidebar doesn't animate shut on every page load.
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Ctrl/⌘ K and "/" open the search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setSearching(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <AppActionsProvider>
      <div className={s.shell} data-collapsed={collapsed} data-ready={ready}>
        <a href="#app-main" className="skip-link">{t('skip')}</a>
        <Sidebar collapsed={collapsed} />
        <div className={s.column}>
          <TopBar onSearch={() => setSearching(true)} />
          <main id="app-main" tabIndex={-1} className={s.main}>
            <div key={path} className={s.page}>{children}</div>
          </main>
        </div>
        <BottomBar />
        <SearchPalette open={searching} onClose={() => setSearching(false)} />
      </div>
    </AppActionsProvider>
  );
}

function useVisibleDestinations() {
  const { user } = useSession();
  const untis = user?.isUntisUser !== false;
  return (d: AppDestination) => untis || !d.untis;
}

function TopBar({ onSearch }: { onSearch: () => void }) {
  const t = useT(shellDict);
  const localize = useLocalizeHref();
  const { user } = useSession();
  const perms = useUntisPermissions();
  const unread = useUnreadMessages();
  const { resolved, toggleWithRipple } = useTheme();
  const mac = useSyncExternalStore(noopSubscribe, isApplePlatform, () => false);
  const untis = user?.isUntisUser !== false;

  return (
    <header className={s.top}>
      <div className={s.topInner}>
      <button type="button" onClick={onSearch} className={s.search} aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K">
        <MagnifyingGlass size={19} weight="bold" aria-hidden="true" />
        <span className="truncate">{t('search')}</span>
        <span className={`${s.kbd} hidden lg:inline`} aria-hidden="true">{mac ? '⌘ K' : 'Strg K'}</span>
      </button>
      <span className="flex-1" />
      <button
        type="button"
        onClick={(e) => toggleWithRipple(e)}
        className={`${s.iconBtn} ${s.wideOnly}`}
        aria-label={t('actionTheme')}
        title={t('actionTheme')}
      >
        {resolved === 'dark' ? <Sun size={20} weight="bold" aria-hidden="true" /> : <Moon size={20} weight="bold" aria-hidden="true" />}
      </button>
      {untis && (
        <Link
          href={localize('/messages')}
          className={s.iconBtn}
          aria-label={unread > 0 ? `${t('messages')}, ${t('unread', { n: unread })}` : t('messages')}
        >
          <EnvelopeSimple size={20} weight="bold" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-on-accent shadow-[0_0_0_2px_var(--canvas)]">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
      )}
      <Link href={localize('/profile')} aria-label={t('openProfile')} className="shrink-0 rounded-full lg:hidden">
        <Avatar name={perms?.personName || user?.username || '?'} size={46} picture={untis} />
      </Link>
      </div>
    </header>
  );
}

function Sidebar({ collapsed }: { collapsed: boolean }) {
  const t = useT(shellDict);
  const localize = useLocalizeHref();
  const path = useRoutePath();
  const { user } = useSession();
  const perms = useUntisPermissions();
  const unread = useUnreadMessages();
  const [, setCollapsed] = useSidebarCollapsed();
  const visible = useVisibleDestinations();
  const untis = user?.isUntisUser !== false;
  const name = perms?.personName || user?.username || '';
  const settingsActive = isActive(path, '/settings');
  const profileActive = isActive(path, '/profile');

  return (
    <aside className={s.side}>
      <Link
        href={localize('/home')}
        className="mb-7 flex h-11 items-center gap-3 rounded-[14px] px-[9px]"
        aria-label="POKYH, Home"
      >
        <Image src="/POKYH_Logo.png" alt="" width={34} height={34} priority className="size-[34px] shrink-0 rounded-[10px]" />
        <span className={`${s.fold} text-[21px] font-extrabold tracking-[-0.045em]`}>POKYH</span>
      </Link>

      <LayoutGroup id="sidebar">
        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden" aria-label={t('mainNav')}>
          {SIDEBAR_GROUPS.map((group, i) => {
            const items = group.filter(visible);
            if (items.length === 0) return null;
            return (
              <ul key={i} className="flex flex-col gap-1">
                {items.map((d) => (
                  <li key={d.href}>
                    <SideItem
                      dest={d}
                      label={t(d.key)}
                      active={isActive(path, d.href)}
                      collapsed={collapsed}
                      badge={d === DEST.messages ? unread : 0}
                      badgeLabel={t('unread', { n: unread })}
                    />
                  </li>
                ))}
              </ul>
            );
          })}
        </nav>

        <div className="mt-4 flex flex-col gap-1">
          <Link
            href={localize('/settings')}
            aria-current={settingsActive ? 'page' : undefined}
            title={collapsed ? t('settings') : undefined}
            className={s.item}
          >
            {settingsActive && <motion.span layoutId="side-active" className={s.itemBg} transition={GLIDE} aria-hidden="true" />}
            <GearSix size={21} weight={settingsActive ? 'fill' : 'regular'} className="shrink-0" aria-hidden="true" />
            <span className={s.fold}>{t('settings')}</span>
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? t('expand') : t('collapse')}
            aria-expanded={!collapsed}
            title={collapsed ? t('expand') : undefined}
            className={`${s.item} w-full text-left`}
          >
            <SidebarSimple size={21} className={`shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} aria-hidden="true" />
            <span className={s.fold}>{t('collapse')}</span>
          </button>

          <Link
            href={localize('/profile')}
            aria-current={profileActive ? 'page' : undefined}
            title={collapsed ? t('openProfile') : undefined}
            className={`${s.item} mt-2 !h-[60px] !px-2`}
          >
            {profileActive && <motion.span layoutId="side-active" className={s.itemBg} transition={GLIDE} aria-hidden="true" />}
            <Avatar name={name || '?'} size={40} picture={untis} />
            <span className={`${s.fold} min-w-0 leading-tight`}>
              <span className="block truncate text-[15px] font-bold text-ink">{name || '…'}</span>
              <span className="mt-0.5 block truncate text-[13px] font-medium text-ink-2">
                {user?.klasseName || (user?.isParent ? t('guardian') : t('student'))}
              </span>
            </span>
          </Link>
        </div>
      </LayoutGroup>
    </aside>
  );
}

function SideItem({
  dest,
  label,
  active,
  collapsed,
  badge,
  badgeLabel,
}: {
  dest: AppDestination;
  label: string;
  active: boolean;
  collapsed: boolean;
  badge: number;
  badgeLabel: string;
}) {
  const localize = useLocalizeHref();
  const { Icon } = dest;
  return (
    <Link
      href={localize(dest.href)}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      className={s.item}
    >
      {active && <motion.span layoutId="side-active" className={s.itemBg} transition={GLIDE} aria-hidden="true" />}
      <Icon size={21} weight={active ? 'fill' : 'regular'} className="shrink-0" aria-hidden="true" />
      <span className={`${s.fold} truncate`}>{label}</span>
      {badge > 0 && (
        <>
          <span className={`${s.count} ${s.fold}`} aria-hidden="true">{badge > 99 ? '99+' : badge}</span>
          <span className={s.dot} aria-hidden="true" />
          <span className="visually-hidden">, {badgeLabel}</span>
        </>
      )}
    </Link>
  );
}

function BottomBar() {
  const t = useT(shellDict);
  const localize = useLocalizeHref();
  const path = useRoutePath();
  const unread = useUnreadMessages();
  const visible = useVisibleDestinations();
  const current = tabFor(path);

  return (
    <nav className={s.bar} aria-label={t('mainNav')}>
      <LayoutGroup id="tabs">
        <ul className="flex h-full items-start">
          {BOTTOM_TABS.filter(visible).map((d) => {
            const active = current === d.href;
            const { Icon } = d;
            const badge = d === DEST.school ? unread : 0;
            return (
              <li key={d.href} className="flex min-w-0 flex-1">
                <Link href={localize(d.href)} aria-current={active ? 'page' : undefined} className={s.tab}>
                  <span className={s.pill}>
                    {active && <motion.span layoutId="tab-active" className={s.pillBg} transition={GLIDE} aria-hidden="true" />}
                    <Icon size={22} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                  </span>
                  <span className={s.tabLabel}>{t(d.key)}</span>
                  {badge > 0 && (
                    <>
                      <span className={s.badge} aria-hidden="true">{badge > 9 ? '9+' : badge}</span>
                      <span className="visually-hidden">, {t('unread', { n: badge })}</span>
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>
    </nav>
  );
}
