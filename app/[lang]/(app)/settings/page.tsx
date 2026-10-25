'use client';

import { Suspense, useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Check, DownloadSimple, PencilSimple, ShieldCheck } from '@phosphor-icons/react';
import AuthGuard from '@/components/AuthGuard';
import Sheet from '@/components/ui/Sheet';
import Spinner from '@/components/ui/Spinner';
import { Button, ButtonLink } from '@/components/ui/Button';
import { FormStatus, TextField } from '@/components/ui/Field';
import ChangePasswordForm from '@/components/account/ChangePasswordForm';
import ForgotPasswordForm from '@/components/account/ForgotPasswordForm';
import TwoFactorSheet from '@/components/account/TwoFactorSheet';
import SecurityRow, { StatusPill } from '@/components/account/SecurityRow';
import { PixelIcon } from '@/components/app/PixelState';
import { COOKIE_SETTINGS_EVENT } from '@/components/CookieSettingsButton';
import { Page, PageHeader, Segmented, Switch } from '@/components/app/Page';
import { Group, Item, LinkItem } from '@/components/app/SettingsRows';
import SupportBanner from '@/components/app/SupportBanner';
import { Bone } from '@/components/app/Skeleton';
import { useSidebarCollapsed } from '@/components/app/sidebar-state';
import { useSession } from '@/providers/SessionProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useDateLocale, useLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { ACTIVE_LOCALES, LOCALE_NAMES, type Locale } from '@/lib/i18n/locale';
import { settingsDict } from '@/lib/i18n/dictionaries/settings';
import { untisActionsDict } from '@/lib/i18n/dictionaries/untisActions';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { securityDict } from '@/lib/i18n/dictionaries/security';
import { fetchUntisAccount, saveUntisAccount, type UntisAccount } from '@/lib/api';
import { api } from '@/lib/api-client';
import { USAGE_CONSENT_EVENT, fetchPrivacyStatus, setUsageStatsConsent, type PrivacyStatus } from '@/lib/privacy-consent';
import { requestPermissionAndSubscribe } from '@/lib/push';
import { pcClear } from '@/lib/persist-cache';
import { cacheClear } from '@/lib/cache';
import { REPO_URLS } from '@/lib/site-links';

// Settings, set out like the public FAQ: each group's name on the left (it
// stays in view on wide screens), its settings on the right as rows under
// thin rules — no boxes around them. In order: how POKYH looks, the account
// and its security (e-mail, password, two-factor sign-in, devices, its
// WebUntis settings), notifications, privacy (with the data download),
// storage, about.

type Theme = 'light' | 'dark' | 'system';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Saves the file the browser received under its own name. */
function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const noopSubscribe = () => () => {};
const readPush = (): NotificationPermission | 'unsupported' =>
  'Notification' in window && 'serviceWorker' in navigator ? Notification.permission : 'unsupported';

/** A small drawing of the app in a theme, for the colour scheme choice. */
function ThemePreview({ mode }: { mode: Theme }) {
  const light = { bg: '#F2EEE7', nav: '#E9E4DB', card: '#FBF9F5', tone: '#DEDDFB', ink: '#1C1A17' };
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
  const ts = useT(securityDict);
  const localize = useLocalizeHref();
  // The WebUntis account's own settings; null while loading, false when it could not be read.
  const [account, setAccount] = useState<UntisAccount | null | false>(null);
  const [accountSaving, setAccountSaving] = useState<string | null>(null);
  const [accountError, setAccountError] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailStatus, setEmailStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [twoFactor, setTwoFactor] = useState<'setup' | 'disable' | null>(null);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [exporting, setExporting] = useState<'idle' | 'busy' | 'done'>('idle');
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    let alive = true;
    api.account.devices().then((d) => { if (alive) setDeviceCount(d.length); }).catch(() => {});
    if (untis) fetchUntisAccount().then((a) => { if (alive) setAccount(a); }).catch(() => { if (alive) setAccount(false); });
    return () => { alive = false; };
  }, [untis]);

  // Loading the WebUntis account again after it failed (the e-mail row's button).
  function retryAccount() {
    setAccount(null);
    fetchUntisAccount().then(setAccount).catch(() => setAccount(false));
  }

  async function saveAccount(key: string, change: Parameters<typeof saveUntisAccount>[0]) {
    if (!account) return false;
    setAccountSaving(key);
    setAccountError('');
    try {
      await saveUntisAccount(change);
      setAccount({ ...account, profile: { ...account.profile, ...change } });
      return true;
    } catch (err) {
      setAccountError(err instanceof Error && err.message && err.message !== 'session_expired' ? err.message : t('saveError'));
      return false;
    } finally {
      setAccountSaving(null);
    }
  }

  async function saveEmail(e: FormEvent) {
    e.preventDefault();
    const email = emailDraft.trim();
    if (email && !EMAIL.test(email)) {
      setEmailStatus({ kind: 'error', text: ts('emailInvalid') });
      return;
    }
    setEmailStatus(null);
    if (await saveAccount('email', { email })) setEmailStatus({ kind: 'success', text: ts('emailSaved') });
  }

  async function downloadData() {
    setExporting('busy');
    setExportError('');
    try {
      const blob = await api.account.exportData();
      saveFile(blob, `pokyh-daten-${new Date().toISOString().slice(0, 10)}.json`);
      setExporting('done');
    } catch (err) {
      setExportError(err instanceof Error && err.message ? err.message : ts('failed'));
      setExporting('idle');
    }
  }

  useEffect(() => {
    let alive = true;
    fetchPrivacyStatus().then((s) => { if (alive) setPrivacy(s); });
    // "Alle akzeptieren" in the cookie banner (or its settings) reaches the
    // account while this page is open: the switch follows at once.
    const onConsent = (e: Event) => {
      const usageStats = (e as CustomEvent<{ usageStats: boolean }>).detail?.usageStats;
      if (typeof usageStats === 'boolean') setPrivacy((p) => (p ? { ...p, usageStats, usageStatsAt: new Date().toISOString() } : p));
    };
    window.addEventListener(USAGE_CONSENT_EVENT, onConsent);
    return () => { alive = false; window.removeEventListener(USAGE_CONSENT_EVENT, onConsent); };
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

        {/* What keeps the account safe: e-mail, password, two-factor sign-in
            and the signed-in devices, each a row with its pixel icon and its
            action; one that wants doing keeps an outline. */}
        <Group id="account" title={ts('accountSecurity')}>
          {untis && (account === null ? (
            <div aria-hidden="true" className="flex gap-4 border-t border-line py-5 text-ink sm:gap-5">
              <Bone className="size-12 !rounded-[12px]" />
              <span className="flex flex-1 flex-col gap-2.5 pt-1"><Bone className="h-4 w-32" /><Bone className="h-3.5 w-3/5" /></span>
            </div>
          ) : account === false ? (
            <SecurityRow
              icon={<PixelIcon name="mail" />}
              title={ts('email')}
              hint={ts('accountError')}
              actions={<Button variant="quiet" onClick={retryAccount}>{ts('retry')}</Button>}
            />
          ) : (
            <SecurityRow
              icon={<PixelIcon name="mail" />}
              title={ts('email')}
              value={account.profile.email || undefined}
              status={account.profile.email ? undefined : <StatusPill tone="blush">{ts('missing')}</StatusPill>}
              hint={account.profile.email ? ts('emailCardHint') : ts('emailNone')}
              highlight={!account.profile.email}
              actions={(
                <Button
                  variant={account.profile.email ? 'tone' : 'primary'}
                  onClick={() => { setEmailDraft(account.profile.email); setEmailStatus(null); setEmailOpen(true); }}
                >
                  <PencilSimple size={17} weight="bold" aria-hidden="true" />
                  {account.profile.email ? ts('emailChange') : ts('emailAdd')}
                </Button>
              )}
            />
          ))}

          {untis && (
            <SecurityRow
              icon={<PixelIcon name="key" />}
              title={ts('passwordTitle')}
              value="••••••••"
              hint={ts('passwordCardHint')}
              actions={(
                <>
                  {(account === null || account === false || account.profile.passwordChangeAllowed) && (
                    <Button variant="tone" onClick={() => setSheet('password')}>
                      <PencilSimple size={17} weight="bold" aria-hidden="true" />
                      {ts('passwordChange')}
                    </Button>
                  )}
                  <Button variant="quiet" onClick={() => setSheet('forgot')}>{ts('passwordForgot')}</Button>
                </>
              )}
            />
          )}

          {untis && account && account.twoFactor.available && (
            <SecurityRow
              icon={<PixelIcon name={account.twoFactor.enabled ? 'shield-on' : 'shield-off'} />}
              title={ts('twoFactor')}
              value={account.twoFactor.enabled ? undefined : ts('stateOff')}
              status={account.twoFactor.enabled
                ? <StatusPill tone="sage"><Check size={14} weight="bold" aria-hidden="true" />{ts('stateOn')}</StatusPill>
                : <StatusPill tone="butter">{ts('recommended')}</StatusPill>}
              hint={!account.twoFactor.enabled ? ts('twoFactorCardOff') : account.twoFactor.required ? ts('twoFactorRequired') : ts('twoFactorCardOn')}
              highlight={!account.twoFactor.enabled}
              actions={!account.twoFactor.enabled ? (
                <Button onClick={() => setTwoFactor('setup')}>
                  <ShieldCheck size={17} weight="bold" aria-hidden="true" />
                  {ts('twoFactorSetup')}
                </Button>
              ) : !account.twoFactor.required ? (
                <Button variant="quiet" onClick={() => setTwoFactor('disable')}>{ts('twoFactorDisable')}</Button>
              ) : undefined}
            />
          )}

          <SecurityRow
            icon={<PixelIcon name="devices" />}
            title={ts('devices')}
            value={deviceCount === null ? undefined : deviceCount <= 1 ? ts('devicesOne') : ts('devicesCount', { n: deviceCount })}
            hint={ts('devicesHint')}
            actions={(
              <ButtonLink variant="tone" href={localize('/settings/devices')}>
                {ts('devicesView')}
                <ArrowRight size={17} weight="bold" aria-hidden="true" />
              </ButtonLink>
            )}
          />

          {accountError && <p role="alert" className="py-3 text-[14px] font-semibold text-danger-ink">{accountError}</p>}
          {untis && account && (
            <>
              <Item title={ts('forward')} hint={account.profile.email ? ts('forwardHint') : ts('forwardNeedsEmail')}>
                <Switch
                  label={ts('forward')}
                  checked={account.profile.forwardMessageToEmail}
                  disabled={!account.profile.email || accountSaving !== null}
                  onChange={(v) => void saveAccount('forward', { forwardMessageToEmail: v })}
                />
              </Item>
              {account.languages.length > 0 && (
                <Item title={ts('untisLanguage')} hint={ts('untisLanguageHint')}>
                  <select
                    aria-label={ts('untisLanguage')}
                    value={account.profile.languageCode}
                    disabled={accountSaving !== null}
                    onChange={(e) => void saveAccount('language', { languageCode: e.target.value })}
                    className="h-11 max-w-[220px] rounded-[14px] bg-inset px-3.5 text-[15px] font-semibold text-ink outline-none transition-shadow focus:shadow-[0_0_0_2px_var(--accent)] disabled:opacity-50"
                  >
                    {account.languages.map((l) => <option key={l.key} value={l.key}>{l.name}</option>)}
                  </select>
                </Item>
              )}
            </>
          )}
          {untis && <LinkItem href="/profile" title={t('profile')} hint={t('profileHint')} />}
        </Group>

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
          <Item
            title={ts('exportTitle')}
            hint={<>{ts('exportHint')}{exportError && <span role="alert" className="mt-1 block font-semibold text-danger-ink">{exportError}</span>}</>}
          >
            {exporting === 'done' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-[14px] font-bold text-sage-ink">
                <Check size={15} weight="bold" aria-hidden="true" />
                {ts('exportDone')}
              </span>
            ) : (
              <Button variant="quiet" disabled={exporting === 'busy'} onClick={() => void downloadData()}>
                {exporting === 'busy' ? <Spinner size={16} /> : <DownloadSimple size={17} weight="bold" aria-hidden="true" />}
                {exporting === 'busy' ? ts('exporting') : ts('exportButton')}
              </Button>
            )}
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

        <SupportBanner />

        <Group id="about" title={t('about')}>
          <Item title={t('version')}><span className="mono text-[15px] text-ink-2">1.0.0</span></Item>
          <LinkItem href="/legal" title={t('legal')} />
          <LinkItem href="/faq" title={t('faq')} />
          <LinkItem href={REPO_URLS.web} title={t('source')} external />
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
      <Sheet open={emailOpen} onClose={() => setEmailOpen(false)} title={ts('email')} description={ts('emailLead')} closeLabel={tc('close')}>
        <form onSubmit={saveEmail} className="flex flex-col gap-4 pb-4" noValidate>
          <TextField
            label={ts('email')}
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={200}
            value={emailDraft}
            onChange={(e) => { setEmailDraft(e.target.value); setEmailStatus(null); }}
          />
          {emailStatus && <FormStatus kind={emailStatus.kind}>{emailStatus.text}</FormStatus>}
          <Button type="submit" disabled={accountSaving !== null} className="self-start">
            {accountSaving === 'email' ? ts('emailSaving') : ts('emailSave')}
          </Button>
        </form>
      </Sheet>
      <TwoFactorSheet
        mode={twoFactor}
        onClose={() => setTwoFactor(null)}
        onChanged={(enabled) => setAccount((a) => (a ? { ...a, twoFactor: { ...a.twoFactor, enabled } } : a))}
      />
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
