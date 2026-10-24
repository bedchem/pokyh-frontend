'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowClockwise, Check, SignOut } from '@phosphor-icons/react';
import AuthGuard from '@/components/AuthGuard';
import { Page, PageHeader, RowGroup } from '@/components/app/Page';
import { Bone } from '@/components/app/Skeleton';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { DeviceRow, LoginRow } from '@/components/account/devices';
import { useT } from '@/providers/LocaleProvider';
import { securityDict } from '@/lib/i18n/dictionaries/security';
import { api, type DeviceSession, type LoginEntry } from '@/lib/api-client';

// Where the account is signed in — this device first, then the others, each
// with an ✕ to sign it out — and the sign-ins of the last weeks below.

const HISTORY_STEP = 10;

function Heading({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex min-h-9 items-center justify-between gap-3 px-1">
      <h2 className="text-[19px] font-bold tracking-[-0.02em]">{children}</h2>
      {action}
    </div>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <RowGroup>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex min-h-[72px] items-center gap-3.5 bg-surface px-4">
          <Bone className="size-11 !rounded-[12px]" />
          <span className="flex flex-1 flex-col gap-2"><Bone className="h-3.5 w-2/5" /><Bone className="h-3 w-3/5" /></span>
        </div>
      ))}
    </RowGroup>
  );
}

function DevicesContent() {
  const t = useT(securityDict);
  const [devices, setDevices] = useState<DeviceSession[] | null>(null);
  const [logins, setLogins] = useState<{ logins: LoginEntry[]; keptDays: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [confirmOthers, setConfirmOthers] = useState(false);
  const [othersDone, setOthersDone] = useState(false);
  const [shown, setShown] = useState(HISTORY_STEP);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [d, l] = await Promise.all([api.account.devices(), api.account.loginHistory()]);
      setDevices(d);
      setLogins(l);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function signOut(device: DeviceSession) {
    setBusy(device.id);
    setActionError('');
    try {
      await api.account.signOutDevice(device.id);
      setDevices((list) => list?.filter((d) => d.id !== device.id) ?? list);
    } catch {
      setActionError(t('failed'));
    } finally {
      setBusy(null);
    }
  }

  async function signOutOthers() {
    if (!confirmOthers) {
      setConfirmOthers(true);
      return;
    }
    setBusy('others');
    setActionError('');
    try {
      await api.account.signOutOthers();
      setDevices((list) => list?.filter((d) => d.current) ?? list);
      setOthersDone(true);
    } catch {
      setActionError(t('failed'));
    } finally {
      setBusy(null);
      setConfirmOthers(false);
    }
  }

  const current = devices?.filter((d) => d.current) ?? [];
  const others = devices?.filter((d) => !d.current) ?? [];

  return (
    <Page>
      <PageHeader title={t('devicesTitle')} subtitle={t('devicesLead')} back={{ href: '/settings', label: t('backToSettings') }} />

      <div className="flex max-w-[760px] flex-col gap-10">
        {failed ? (
          <div className="flex flex-col items-start gap-3 rounded-[22px] bg-surface p-5">
            <p className="text-[15px] text-ink-2">{t('loadError')}</p>
            <Button variant="quiet" onClick={() => void load()}>
              <ArrowClockwise size={17} weight="bold" aria-hidden="true" />
              {t('retry')}
            </Button>
          </div>
        ) : (
          <>
            {actionError && <p role="alert" className="rounded-[14px] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-[14px] font-medium text-danger-ink">{actionError}</p>}

            <section aria-label={t('thisDevice')}>
              <Heading>{t('thisDevice')}</Heading>
              {devices === null ? <Skeleton rows={1} /> : current.length > 0 ? (
                <RowGroup>{current.map((d) => <DeviceRow key={d.id} device={d} />)}</RowGroup>
              ) : null}
            </section>

            <section aria-label={t('otherDevices')}>
              <Heading
                action={others.length > 1 || (others.length === 1 && confirmOthers) ? (
                  <div className="flex items-center gap-2">
                    {confirmOthers && busy !== 'others' && <Button size="sm" variant="quiet" onClick={() => setConfirmOthers(false)}>{t('cancel')}</Button>}
                    <Button size="sm" variant="danger" disabled={busy === 'others'} onClick={() => void signOutOthers()}>
                      {busy === 'others' ? <Spinner size={15} /> : <SignOut size={16} weight="bold" aria-hidden="true" />}
                      {confirmOthers ? t('signOutOthersConfirm') : t('signOutOthers')}
                    </Button>
                  </div>
                ) : undefined}
              >
                {t('otherDevices')}
              </Heading>
              {devices === null ? <Skeleton rows={2} /> : others.length > 0 ? (
                <RowGroup>
                  {others.map((d) => (
                    <DeviceRow key={d.id} device={d} busy={busy === d.id} onSignOut={() => void signOut(d)} />
                  ))}
                </RowGroup>
              ) : (
                <p className="flex items-center gap-2 rounded-[22px] bg-surface px-5 py-4 text-[14.5px] text-ink-2">
                  {othersDone && <Check size={17} weight="bold" className="text-success-ink" aria-hidden="true" />}
                  {othersDone ? t('signedOutOthers') : t('noOthers')}
                </p>
              )}
            </section>

            <section aria-label={t('history')}>
              <Heading>{t('history')}</Heading>
              {logins === null ? <Skeleton rows={3} /> : logins.logins.length === 0 ? (
                <p className="rounded-[22px] bg-surface px-5 py-4 text-[14.5px] text-ink-2">{t('historyEmpty')}</p>
              ) : (
                <>
                  <p className="-mt-1 mb-3 px-1 text-[13.5px] text-ink-3">{t('historyHint', { days: logins.keptDays })}</p>
                  <RowGroup>
                    {logins.logins.slice(0, shown).map((l) => <LoginRow key={l.id} login={l} />)}
                  </RowGroup>
                  {logins.logins.length > shown && (
                    <Button variant="quiet" className="mt-3" onClick={() => setShown((n) => n + HISTORY_STEP * 2)}>{t('showMore')}</Button>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </Page>
  );
}

export default function DevicesPage() {
  return (
    <AuthGuard>
      <DevicesContent />
    </AuthGuard>
  );
}
