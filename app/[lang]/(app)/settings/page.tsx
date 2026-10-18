'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowUpRight, CaretRight, Check } from '@phosphor-icons/react';
import AuthGuard from '@/components/AuthGuard';
import Sheet from '@/components/ui/Sheet';
import Spinner from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import ChangePasswordForm from '@/components/account/ChangePasswordForm';
import ForgotPasswordForm from '@/components/account/ForgotPasswordForm';
import { COOKIE_SETTINGS_EVENT } from '@/components/CookieSettingsButton';
import { Page, PageHeader, Segmented, Switch } from '@/components/app/Page';
import { Bone } from '@/components/app/Skeleton';
import { useSidebarCollapsed } from '@/components/app/sidebar-state';
import { useSession } from '@/providers/SessionProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useDateLocale, useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { ACTIVE_LOCALES, LOCALE_NAMES, type Locale } from '@/lib/i18n/locale';
import { settingsDict } from '@/lib/i18n/dictionaries/settings';
import { untisActionsDict } from '@/lib/i18n/dictionaries/untisActions';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { fetchPrivacyStatus, setUsageStatsConsent, type PrivacyStatus } from '@/lib/privacy-consent';
import { requestPermissionAndSubscribe } from '@/lib/push';
import { pcClear } from '@/lib/persist-cache';
import { cacheClear } from '@/lib/cache';

// Settings, set out like the public FAQ: each group's name on the left (it
// stays in view on wide screens), its settings on the right as rows under
// thin rules — no boxes around them.

type Theme = 'light' | 'dark' | 'system';

const noopSubscribe = () => () => {};
const readPush = (): NotificationPermission | 'unsupported' =>
  'Notification' in window && 'serviceWorker' in navigator ? Notification.permission : 'unsupported';

function Group({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="rise grid scroll-mt-6 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.3fr)] lg:gap-12">
      <h2 id={`${id}-title`} className="text-[22px] font-extrabold tracking-[-0.035em] lg:sticky lg:top-6 lg:self-start lg:pt-5 md:text-[26px]">
        {title}
      </h2>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function Item({ title, hint, children, danger, className = '' }: { title: ReactNode; hint?: ReactNode; children?: ReactNode; danger?: boolean; className?: string }) {
  return (
    <div className={`flex flex-col gap-4 border-t border-line py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 ${className}`}>
      <div className="min-w-0">
        <p className={`text-[16.5px] font-bold tracking-[-0.015em] ${danger ? 'text-danger-ink' : ''}`}>{title}</p>
        {hint && <p className="mt-1 max-w-[52ch] text-[14.5px] leading-[1.55] text-ink-2">{hint}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

function LinkItem({ href, title, hint, external }: { href: string; title: string; hint?: string; external?: boolean }) {
  const localize = useLocalizeHref();
  const inner = (
    <>
      <span className="min-w-0">
        <span className="block text-[16.5px] font-bold tracking-[-0.015em]">{title}</span>
        {hint && <span className="mt-1 block text-[14.5px] text-ink-2">{hint}</span>}
      </span>
      {external
        ? <ArrowUpRight size={18} weight="bold" className="shrink-0 text-ink-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        : <CaretRight size={18} weight="bold" className="shrink-0 text-ink-3 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />}
    </>
  );
  // The rule sits on a straight wrapper; only the hover fill inside is rounded.
  const cls = 'group -mx-3 flex items-center justify-between gap-6 rounded-[14px] px-3 py-3.5 transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]';
  return (
    <div className="border-t border-line py-1.5">
      {external
        ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
        : <Link href={localize(href)} className={cls}>{inner}</Link>}
    </div>
  );
}

/** A small drawing of the app in a theme, for the colour scheme choice. */
function ThemePreview({ mode }: { mode: Theme }) {
  const light = { bg: '#F5F2ED', nav: '#EBE7E0', card: '#FFFFFF', tone: '#DEDDFB', ink: '#1C1A17' };
  const dark = { bg: '#111114', nav: '#1E1E23', card: '#1B1B1F', tone: '#24244C', ink: '#F2F2F4' };
  const draw = (c: typeof light) => (
    <span className="absolute inset-0 flex" style={{ background: c.bg }}>
      <span className="h-full w-[26%]" style={{ background: c.nav }}>
        <span className="mx-[18%] mt-[22%] block h-[7%] rounded-full" style={{ background: c.tone }} />
        <span className="mx-[18%] mt-[12%] block h-[5%] rounded-full opacity-25" style={{ background: c.ink }} />
        <span className="mx-[18%] mt-[10%] block h-[5%] rounded-full opacity-25" style={{ background: c.ink }} />
      </span>
      <span className="flex flex-1 flex-col gap-[7%] p-[8%]">
        <span className="block h-[9%] w-[55%] rounded-full opacity-80" style={{ background: c.ink }} />
        <span className="block flex-1 rounded-[10%]" style={{ background: c.tone }} />
        <span className="flex h-[22%] gap-[7%]">
          <span className="block flex-1 rounded-[18%]" style={{ background: c.card }} />
          <span className="block flex-1 rounded-[18%]" style={{ background: c.card }} />
        </span>
      </span>
    </span>
  );
  return (
    <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-[14px]">
      {mode === 'dark' ? draw(dark) : draw(light)}
      {mode === 'system' && <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]">{draw(dark)}</span>}
    </span>
  );
}

function SettingsContent() {
  const t = useT(settingsDict);
  const ta = useT(untisActionsDict);
  const tc = useT(commonDict);
  const params = useSearchParams();
  const { user, logout } = useSession();
  const { theme, toggleWithRipple } = useTheme();
  const { locale, setLocale } = useLocale();
  const { tag } = useDateLocale();
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [sheet, setSheet] = useState<'password' | 'forgot' | null>(params.get('open') === 'password' ? 'password' : null);
  const [privacy, setPrivacy] = useState<PrivacyStatus | null | undefined>(undefined);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);
  // The browser's notification permission; after asking, the answer given.
  const pushNow = useSyncExternalStore(noopSubscribe, readPush, () => null);
  const [pushAnswer, setPushAnswer] = useState<NotificationPermission | null>(null);
  const push = pushAnswer ?? pushNow;
  const [cleared, setCleared] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const untis = user?.isUntisUser !== false;

  useEffect(() => {
    let alive = true;
    fetchPrivacyStatus().then((s) => { if (alive) setPrivacy(s); });
    return () => { alive = false; };
  }, []);

  async function toggleUsage(next: boolean) {
    if (!privacy || privacySaving) return;
    setPrivacySaving(true);
    setPrivacyError(false);
    const ok = await setUsageStatsConsent(next);
    setPrivacySaving(false);
    if (ok) setPrivacy({ ...privacy, usageStats: next, usageStatsAt: new Date().toISOString() });
    else setPrivacyError(true);
  }

  async function enablePush() {
    await requestPermissionAndSubscribe();
    setPushAnswer(Notification.permission);
  }

  const themes: { value: Theme; label: string }[] = [
    { value: 'system', label: t('system') },
    { value: 'light', label: t('light') },
    { value: 'dark', label: t('dark') },
  ];

  return (
    <Page>
      <PageHeader title={t('title')} subtitle={t('lead')} />

      <div className="flex flex-col gap-14 md:gap-20">
        <Group id="appearance" title={t('appearance')}>
          <div className="border-t border-line py-5">
            <p className="text-[16.5px] font-bold tracking-[-0.015em]">{t('theme')}</p>
            <p className="mt-1 text-[14.5px] text-ink-2">{t('themeHint')}</p>
            <div role="radiogroup" aria-label={t('theme')} className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
              {themes.map((o) => {
                const active = theme === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={(e) => { if (!active) toggleWithRipple(e, o.value); }}
                    className="group flex flex-col gap-2.5 text-left"
                  >
                    <span className={`block rounded-[18px] p-1 transition-[box-shadow] duration-300 ${active ? 'shadow-[0_0_0_2.5px_var(--accent)]' : 'group-hover:shadow-[0_0_0_2px_var(--line)]'}`}>
                      <ThemePreview mode={o.value} />
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-1 text-[14.5px] font-semibold transition-colors ${active ? 'text-ink' : 'text-ink-2 group-hover:text-ink'}`}>
                      {active && <Check size={15} weight="bold" className="text-accent" aria-hidden="true" />}
                      {o.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <Item title={t('language')} hint={t('languageHint')}>
            <Segmented<Locale>
              label={t('language')}
              value={locale}
              onChange={(l) => setLocale(l)}
              options={ACTIVE_LOCALES.map((l) => ({ value: l, label: LOCALE_NAMES[l] }))}
            />
          </Item>
          <Item title={t('sidebar')} hint={t('sidebarHint')} className="max-lg:hidden">
            <Switch label={t('sidebar')} checked={collapsed} onChange={setCollapsed} />
          </Item>
        </Group>

        {untis && (
          <Group id="account" title={t('account')}>
            <Item title={t('password')} hint={t('passwordHint')}>
              <Button variant="quiet" onClick={() => setSheet('password')}>{ta('pwSave')}</Button>
            </Item>
            <Item title={t('forgot')} hint={t('forgotHint')}>
              <Button variant="quiet" onClick={() => setSheet('forgot')}>{ta('resetSend')}</Button>
            </Item>
            <LinkItem href="/profile" title={t('profile')} hint={t('profileHint')} />
          </Group>
        )}

        <Group id="notifications" title={t('notifications')}>
          <Item
            title={t('push')}
            hint={push === 'granted' ? t('pushOff') : push === 'denied' ? t('pushBlocked') : push === 'unsupported' ? t('pushUnsupported') : t('pushOff')}
          >
            {push === 'granted' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-[14px] font-bold text-sage-ink">
                <Check size={15} weight="bold" aria-hidden="true" />
                {t('pushOn')}
              </span>
            ) : push === 'default' ? (
              <Button variant="tone" onClick={() => void enablePush()}>{t('pushEnable')}</Button>
            ) : null}
          </Item>
        </Group>

        <Group id="privacy" title={t('privacy')}>
          <Item
            title={t('usage')}
            hint={<>{t('usageHint')}{privacyError && <span role="alert" className="mt-1 block font-semibold text-danger-ink">{t('saveError')}</span>}</>}
          >
            {privacy === undefined ? (
              <Bone className="h-[30px] w-[50px] !rounded-full text-ink" />
            ) : (
              <Switch label={t('usage')} checked={!!privacy?.usageStats} disabled={!privacy || privacySaving} onChange={(v) => void toggleUsage(v)} />
            )}
          </Item>
          <Item
            title={t('acknowledged')}
            hint={privacy?.acknowledgedAt ? new Date(privacy.acknowledgedAt).toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric' }) : t('never')}
          />
          <Item title={t('cookies')} hint={t('cookiesHint')}>
            <Button variant="quiet" onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}>{tc('cookieOpenSettings')}</Button>
          </Item>
          <LinkItem href="/legal/datenschutz" title={t('policy')} />
        </Group>

        <Group id="storage" title={t('storage')}>
          <Item title={t('clearCache')} hint={t('clearCacheHint')}>
            {cleared ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-[14px] font-bold text-sage-ink">
                <Check size={15} weight="bold" aria-hidden="true" />
                {t('cleared')}
              </span>
            ) : (
              <Button variant="quiet" onClick={() => { pcClear(); cacheClear(); setCleared(true); }}>{t('clearCache')}</Button>
            )}
          </Item>
        </Group>

        <Group id="about" title={t('about')}>
          <Item title={t('version')}><span className="mono text-[15px] text-ink-2">1.0.0</span></Item>
          <LinkItem href="/legal" title={t('legal')} />
          <LinkItem href="/faq" title={t('faq')} />
          <LinkItem href="https://github.com/bedchem/pokyh-frontend" title={t('source')} external />
          <Item title={t('logout')} hint={confirmLogout ? t('logoutConfirm') : t('logoutHint')} danger>
            <div className="flex gap-2">
              {confirmLogout && !loggingOut && <Button variant="quiet" onClick={() => setConfirmLogout(false)}>{tc('cancel')}</Button>}
              <Button
                variant="danger"
                disabled={loggingOut}
                onClick={async () => {
                  if (!confirmLogout) { setConfirmLogout(true); return; }
                  setLoggingOut(true);
                  await logout();
                }}
              >
                {loggingOut ? <Spinner size={16} /> : t('logout')}
              </Button>
            </div>
          </Item>
        </Group>
      </div>

      <Sheet open={sheet === 'password'} onClose={() => setSheet(null)} title={ta('pwTitle')} description={ta('pwLead')} closeLabel={tc('close')}>
        <div className="pb-4"><ChangePasswordForm /></div>
      </Sheet>
      <Sheet open={sheet === 'forgot'} onClose={() => setSheet(null)} title={ta('resetTitle')} description={ta('resetLead')} closeLabel={tc('close')}>
        <div className="pb-4"><ForgotPasswordForm initialUsername={user?.username ?? ''} /></div>
      </Sheet>
    </Page>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <Suspense>
        <SettingsContent />
      </Suspense>
    </AuthGuard>
  );
}
