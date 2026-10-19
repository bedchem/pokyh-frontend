'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode, type RefObject, type SyntheticEvent } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { CaretLeft, EnvelopeSimple, GearSix, Globe, MagnifyingGlass, Moon, SignOut, Sun, UserCircle } from '@phosphor-icons/react';
import { useLocale, useLocalizeHref, useRoutePath, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { shellDict } from '@/lib/i18n/dictionaries/shell';
import { settingsDict } from '@/lib/i18n/dictionaries/settings';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import Spinner from '@/components/ui/Spinner';
import LanguageButton, { RoundFlag } from '@/components/site/LanguageButton';
import { ACTIVE_LOCALES, LOCALE_LABELS, LOCALE_NAMES } from '@/lib/i18n/locale';
import Avatar from './Avatar';
import SearchPalette from './SearchPalette';
import { AppActionsProvider } from './actions';
import { useMensaAvailable, useUnreadMessages, useUntisPermissions } from './hooks';
import { BOTTOM_TABS, DEST, SIDEBAR_GROUPS, isActive, tabFor, type AppDestination } from './nav';
import { useSidebarCollapsed } from './sidebar-state';
import s from './shell.module.css';

// The frame around every signed-in page: a sidebar on wide screens, the
// Android app's five-tab bottom bar on phones, and a top bar with the search
// on both. Pages fill <main> and scroll inside it, so the frame never moves.

const GLIDE = { type: 'spring', stiffness: 520, damping: 42, mass: 0.9 } as const;


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

  // "/" (the hint in the top bar) and Ctrl/⌘ K open the search from anywhere;
  // "/" only while nothing is being typed and no dialog is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      const slash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !typing
        && !document.querySelector('[role="dialog"][aria-modal="true"]');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || slash) {
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
  const mensa = useMensaAvailable();
  const untis = user?.isUntisUser !== false;
  // A school without a menu has no Mensa at all (switched off in the admin panel).
  return (d: AppDestination) => (untis || !d.untis) && (d !== DEST.mensa || mensa !== false);
}

function TopBar({ onSearch }: { onSearch: () => void }) {
  const t = useT(shellDict);
  const localize = useLocalizeHref();
  const path = useRoutePath();
  const { user } = useSession();
  const perms = useUntisPermissions();
  const unread = useUnreadMessages();
  const untis = user?.isUntisUser !== false;
  const name = perms?.personName || user?.username || '';
  const detail = user?.klasseName || (user?.isParent ? t('guardian') : t('student'));

  return (
    <header className={s.top}>
      <div className={s.topInner}>
      <button type="button" onClick={onSearch} className={s.search} aria-haspopup="dialog" aria-keyshortcuts="/ Control+K Meta+K">
        <MagnifyingGlass size={19} weight="bold" aria-hidden="true" />
        <span className="truncate">{t('search')}</span>
        <span className={`${s.kbd} hidden lg:inline`} aria-hidden="true">/</span>
      </button>
      <span className="hidden flex-1 lg:block" />
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
      {/* Phones: the picture opens the same menu as the folded sidebar's. */}
      <AccountMenu
        variant="top"
        name={name}
        detail={detail}
        picture={untis}
        active={isActive(path, '/profile') || isActive(path, '/settings')}
      />
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
  const { resolved, toggleWithRipple } = useTheme();
  const visible = useVisibleDestinations();
  const untis = user?.isUntisUser !== false;
  const name = perms?.personName || user?.username || '';
  const detail = user?.klasseName || (user?.isParent ? t('guardian') : t('student'));
  const settingsActive = isActive(path, '/settings');
  const profileActive = isActive(path, '/profile');
  const [tip, setTip] = useState<{ text: string; top: number } | null>(null);
  const nav = useRef<HTMLElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const leave = useLogout(confirmRef, triggerRef);

  // Which way the list of places goes on beyond its edges (the fades in CSS).
  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    const update = () => {
      const more = [el.scrollTop > 2 && 'up', el.scrollTop + el.clientHeight < el.scrollHeight - 2 && 'down'].filter(Boolean).join(' ');
      if (more) el.dataset.more = more;
      else delete el.dataset.more;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener('scroll', update); };
  }, [collapsed]);

  // Folded, every place keeps its name in a label beside the icon. One label
  // for the whole sidebar, placed on the hovered or focused item; fixed, so
  // the scrolling list doesn't cut it off.
  const showTip = (e: SyntheticEvent) => {
    if (!collapsed) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
    if (!el) { setTip(null); return; }
    const r = el.getBoundingClientRect();
    setTip({ text: el.dataset.tip ?? '', top: r.top + r.height / 2 });
  };
  const hideTip = () => setTip(null);

  return (
    <aside
      className={s.side}
      onPointerOver={showTip}
      onPointerLeave={hideTip}
      onFocus={showTip}
      onBlur={hideTip}
      onScroll={hideTip}
    >
      {/* Folding: a round button on the sidebar's edge, level with the logo */}
      <button
        type="button"
        onClick={() => { setTip(null); setCollapsed(!collapsed); }}
        aria-label={collapsed ? t('expand') : t('collapse')}
        aria-expanded={!collapsed}
        title={collapsed ? t('expand') : t('collapse')}
        className={s.edge}
      >
        <CaretLeft size={14} weight="bold" className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      <div className={s.head}>
        <Link
          href={localize('/home')}
          className="flex h-11 min-w-0 grow items-center gap-3 overflow-hidden rounded-[14px] px-[9px]"
          aria-label="POKYH, Home"
        >
          <Image src="/POKYH_Logo.png" alt="" width={34} height={34} priority className="size-[34px] shrink-0 rounded-[10px]" />
          <span className={`${s.fold} text-[21px] font-extrabold tracking-[-0.045em]`}>POKYH</span>
        </Link>
      </div>

      <LayoutGroup id="sidebar">
        <nav ref={nav} className={s.nav} aria-label={t('mainNav')} onScroll={hideTip}>
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
                      badge={d === DEST.messages ? unread : 0}
                      badgeLabel={t('unread', { n: unread })}
                    />
                  </li>
                ))}
              </ul>
            );
          })}
        </nav>

        {/* The account at the bottom. Open: the profile with the settings
            beside it, and under it language, light or dark, the public start
            page and signing out as four equal buttons. Folded: only the
            picture, which opens all of these in a small menu, so the places
            keep the room. */}
        <div className={s.dock}>
          {collapsed ? (
            <AccountMenu name={name} detail={detail} picture={untis} active={profileActive || settingsActive} onOpen={hideTip} />
          ) : (
            <>
              <div className={s.me}>
                <Link
                  href={localize('/profile')}
                  aria-current={profileActive ? 'page' : undefined}
                  className={`${s.item} ${s.meLink}`}
                >
                  {profileActive && <motion.span layoutId="side-active" className={s.itemBg} transition={GLIDE} aria-hidden="true" />}
                  <Avatar name={name || '?'} size={38} picture={untis} />
                  <span className={`${s.fold} min-w-0 leading-tight`}>
                    <span className="block truncate text-[14.5px] font-bold text-ink">{name || '…'}</span>
                    <span className="mt-0.5 block truncate text-[12.5px] font-medium text-ink-2">{detail}</span>
                  </span>
                </Link>
                <Link
                  href={localize('/settings')}
                  aria-current={settingsActive ? 'page' : undefined}
                  aria-label={t('settings')}
                  title={t('settings')}
                  className={s.tool}
                >
                  {settingsActive && <motion.span layoutId="side-active" className={s.itemBg} transition={GLIDE} aria-hidden="true" />}
                  <GearSix size={21} weight={settingsActive ? 'fill' : 'regular'} aria-hidden="true" />
                </Link>
              </div>

              <div className={s.tools}>
                {leave.asking ? (
                  // Signing out asks once, in place of the row: "Abbrechen" or "Abmelden".
                  <div role="group" aria-label={leave.question} className={s.confirm} onKeyDown={(e) => { if (e.key === 'Escape') leave.cancel(); }}>
                    <button type="button" onClick={leave.cancel} disabled={leave.busy} className={`${s.tool} ${s.toolFill}`}>
                      {leave.cancelLabel}
                    </button>
                    <button ref={confirmRef} type="button" onClick={leave.press} disabled={leave.busy} title={leave.question} className={`${s.tool} ${s.toolFill} ${s.toolDanger}`}>
                      {leave.busy ? <Spinner size={16} /> : <SignOut size={18} weight="bold" aria-hidden="true" />}
                      {leave.label}
                    </button>
                  </div>
                ) : (
                <>
                <LanguageButton
                  placement="above"
                  align="left"
                  compact
                  className="flex min-w-0"
                  buttonClassName={`${s.tool} ${s.toolFill}`}
                />
                <button
                  type="button"
                  onClick={(e) => toggleWithRipple(e)}
                  aria-label={t('actionTheme')}
                  title={t('actionTheme')}
                  className={`${s.tool} ${s.toolFill}`}
                >
                  {resolved === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
                </button>
                <Link
                  href={localize('/')}
                  aria-label={t('website')}
                  title={t('website')}
                  className={`${s.tool} ${s.toolFill}`}
                >
                  <Globe size={20} aria-hidden="true" />
                </Link>
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={leave.press}
                  aria-label={leave.label}
                  title={leave.label}
                  className={`${s.tool} ${s.toolFill} ${s.toolOut}`}
                >
                  <SignOut size={20} aria-hidden="true" />
                </button>
                </>
                )}
              </div>
            </>
          )}
        </div>
      </LayoutGroup>

      {collapsed && tip && (
        <span role="tooltip" className={s.tip} style={{ top: tip.top }}>{tip.text}</span>
      )}
    </aside>
  );
}

/**
 * Signing out from the sidebar takes two presses: the first asks, the second
 * signs out. The question goes away on its own after a while, or with
 * "Abbrechen" / Escape; asking puts the focus on the confirming button
 * (`confirm`), and coming back from it on the button it came from (`trigger`).
 */
function useLogout(confirm?: RefObject<HTMLButtonElement | null>, trigger?: RefObject<HTMLButtonElement | null>) {
  const ts = useT(settingsDict);
  const tc = useT(commonDict);
  const { logout } = useSession();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const wasAsking = useRef(false);

  // Back from the question, the focus returns to the button it came from
  // (unless it has moved on elsewhere meanwhile).
  useEffect(() => {
    if (wasAsking.current && !asking && document.activeElement === document.body) trigger?.current?.focus({ preventScroll: true });
    wasAsking.current = asking;
  }, [asking, trigger]);

  useEffect(() => {
    if (!asking || busy) return;
    confirm?.current?.focus({ preventScroll: true });
    const id = window.setTimeout(() => setAsking(false), 6000);
    return () => window.clearTimeout(id);
  }, [asking, busy, confirm]);

  const press = async () => {
    if (busy) return;
    if (!asking) { setAsking(true); return; }
    setBusy(true);
    await logout();
  };

  return {
    asking,
    busy,
    press,
    cancel: () => setAsking(false),
    label: ts('logout'),
    question: ts('logoutConfirm'),
    cancelLabel: tc('cancel'),
  };
}

/**
 * The account as a picture that opens a small menu with the profile, the
 * settings, light or dark, the public start page, signing out and the
 * language: beside the picture in the folded sidebar (`side`), dropping
 * down from it in the phone's top bar (`top`). Closes on a choice, a click
 * elsewhere or Escape.
 */
function AccountMenu({
  variant = 'side',
  name,
  detail,
  picture,
  active,
  onOpen,
}: {
  variant?: 'side' | 'top';
  name: string;
  detail: string;
  picture: boolean;
  /** The profile or the settings is the page shown. */
  active: boolean;
  onOpen?: () => void;
}) {
  const t = useT(shellDict);
  const localize = useLocalizeHref();
  const path = useRoutePath();
  const { locale, setLocale } = useLocale();
  const { resolved, toggleWithRipple } = useTheme();
  const [open, setOpen] = useState(false);
  const leave = useLogout();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  // A new page closes it.
  const [shownFor, setShownFor] = useState(path);
  if (shownFor !== path) {
    setShownFor(path);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true });
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Up and down move between the entries, as in a native menu.
  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"]') ?? []);
    const at = items.indexOf(document.activeElement as HTMLElement);
    items[(at + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  };

  const top = variant === 'top';
  const row = 'flex h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14.5px] font-semibold text-ink outline-none transition-colors hover:bg-inset focus-visible:bg-inset';

  return (
    <div ref={root} className={top ? 'relative shrink-0 lg:hidden' : 'relative'}>
      <button
        ref={button}
        type="button"
        onClick={() => { onOpen?.(); setOpen((o) => !o); }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={name ? `${name}, ${t('accountMenu')}` : t('accountMenu')}
        data-tip={top || open ? undefined : name || t('openProfile')}
        className={top ? s.meTop : `${s.item} ${s.meFolded}`}
        aria-current={active ? 'page' : undefined}
      >
        {active && !top && <motion.span layoutId="side-active" className={s.itemBg} transition={GLIDE} aria-hidden="true" />}
        <Avatar name={name || '?'} size={top ? 46 : 36} picture={picture} />
      </button>

      {open && (
        <div ref={menu} role="menu" aria-label={t('accountMenu')} onKeyDown={onMenuKey} className={`${top ? s.accountMenuTop : s.accountMenu} lang-menu`}>
          <div className="flex items-center gap-3 px-3 pb-2.5 pt-2">
            <Avatar name={name || '?'} size={40} picture={picture} />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15px] font-bold text-ink">{name || '…'}</span>
              <span className="mt-0.5 block truncate text-[12.5px] font-medium text-ink-2">{detail}</span>
            </span>
          </div>
          <div className={s.menuRule} />
          <Link role="menuitem" href={localize('/profile')} className={row}>
            <UserCircle size={19} aria-hidden="true" className="text-ink-2" />
            {t('profile')}
          </Link>
          <Link role="menuitem" href={localize('/settings')} className={row}>
            <GearSix size={19} aria-hidden="true" className="text-ink-2" />
            {t('settings')}
          </Link>
          <button role="menuitem" type="button" onClick={(e) => toggleWithRipple(e)} className={row}>
            {resolved === 'dark' ? <Sun size={19} aria-hidden="true" className="text-ink-2" /> : <Moon size={19} aria-hidden="true" className="text-ink-2" />}
            {t('actionTheme')}
          </button>
          <Link role="menuitem" href={localize('/')} className={row}>
            <Globe size={19} aria-hidden="true" className="text-ink-2" />
            {t('website')}
          </Link>
          {/* The first choice asks, the second signs out. */}
          <button
            role="menuitem"
            type="button"
            onClick={leave.press}
            disabled={leave.busy}
            className={`${row} ${leave.asking ? 'bg-[color-mix(in_srgb,var(--danger)_13%,transparent)] text-danger-ink hover:bg-[color-mix(in_srgb,var(--danger)_20%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--danger)_20%,transparent)]' : 'hover:text-danger-ink'}`}
          >
            {leave.busy ? <Spinner size={17} /> : <SignOut size={19} aria-hidden="true" className={leave.asking ? '' : 'text-ink-2'} />}
            {leave.asking ? leave.question : leave.label}
          </button>
          <div className={s.menuRule} />
          <div role="group" aria-label={t('language')} className="grid grid-cols-3 gap-1 p-1">
            {ACTIVE_LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                role="menuitemradio"
                aria-checked={l === locale}
                aria-label={LOCALE_NAMES[l]}
                lang={l}
                onClick={() => { if (l !== locale) setLocale(l); }}
                className={`flex h-10 items-center justify-center gap-2 rounded-[11px] text-[13px] font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent-ink)] ${
                  l === locale ? 'bg-periwinkle text-periwinkle-ink' : 'text-ink-2 hover:bg-inset hover:text-ink'
                }`}
              >
                <RoundFlag locale={l} size={18} />
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SideItem({
  dest,
  label,
  active,
  badge,
  badgeLabel,
}: {
  dest: AppDestination;
  label: string;
  active: boolean;
  badge: number;
  badgeLabel: string;
}) {
  const localize = useLocalizeHref();
  const { Icon } = dest;
  return (
    <Link
      href={localize(dest.href)}
      aria-current={active ? 'page' : undefined}
      data-tip={label}
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
