'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowClockwise, ArrowRight, Check, Copy } from '@phosphor-icons/react';
import AuthGuard from '@/components/AuthGuard';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Page } from '@/components/app/Page';
import Avatar from '@/components/app/Avatar';
import ActivityGrid, { ActivityGridSkeleton, GridLegend } from '@/components/app/ActivityGrid';
import PixelState from '@/components/app/PixelState';
import { Line } from '@/components/app/Skeleton';
import { useUntisPermissions } from '@/components/app/hooks';
import LogoutButton from '@/components/app/LogoutButton';
import { Group, Item, LinkItem } from '@/components/app/SettingsRows';
import { useSession } from '@/providers/SessionProvider';
import { useApp } from '@/providers/AppProvider';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { profileDict } from '@/lib/i18n/dictionaries/profile';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { shellDict } from '@/lib/i18n/dictionaries/shell';
import { settingsDict } from '@/lib/i18n/dictionaries/settings';
import { fetchAccountActivity, type ActivityResult } from '@/lib/account-activity';
import { USAGE_CONSENT_EVENT } from '@/lib/privacy-consent';

// The profile: who you are, when you used POKYH (a GitHub-style grid of days
// from the backend) and your account details. Statistics in more depth are
// one step further (profile/stats).

function Figure({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="squircle flex flex-col justify-between gap-3 rounded-[22px] bg-surface p-4 md:p-5">
      <span className="text-[13.5px] font-semibold text-ink-2">{label}</span>
      {loading
        ? <Line w={56} h={26} className="text-ink" />
        : <span className="rise text-[28px] font-extrabold leading-none tracking-[-0.05em] tnum md:text-[32px]">{value}</span>}
    </div>
  );
}

/** Copies a value; the icon turns into a check for a moment, nothing else moves. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useT(profileDict);
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch { /* clipboard blocked */ }
      }}
      aria-label={`${label} ${t('copy')}`}
      className={`grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-200 ${done ? 'text-success' : 'text-ink-3 hover:bg-inset hover:text-ink'}`}
    >
      {done ? <Check size={16} weight="bold" aria-hidden="true" /> : <Copy size={16} weight="bold" aria-hidden="true" />}
      <span className="visually-hidden" aria-live="polite">{done ? t('copied') : ''}</span>
    </button>
  );
}

function Block({ title, lead, action, children }: { title: string; lead?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="rise grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.3fr)] lg:gap-12">
      <div className="lg:sticky lg:top-6 lg:self-start lg:pt-1">
        <h2 className="text-[22px] font-extrabold tracking-[-0.035em] md:text-[26px]">{title}</h2>
        {lead && <p className="mt-1.5 max-w-[34ch] text-[15px] leading-relaxed text-ink-2">{lead}</p>}
        {action && <div className="mt-4 hidden lg:block">{action}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function ProfileContent() {
  const t = useT(profileDict);
  const tc = useT(commonDict);
  const ts = useT(shellDict);
  const tset = useT(settingsDict);
  const localize = useLocalizeHref();
  const { user } = useSession();
  const { stableUid, classId } = useApp();
  const perms = useUntisPermissions();
  const [result, setResult] = useState<ActivityResult | undefined>(undefined);
  const untis = user?.isUntisUser !== false;
  const name = perms?.personName || user?.username || '';

  const load = useCallback((fresh = false) => {
    let alive = true;
    if (fresh) setResult(undefined);
    fetchAccountActivity(fresh).then((r) => { if (alive) setResult(r); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let stop = () => {};
    const timer = window.setTimeout(() => { stop = load(); }, 0);
    // The statistics consent changed (cookie banner, settings): read again, so
    // the hint and what is kept follow it.
    const onConsent = () => { stop(); stop = load(true); };
    window.addEventListener(USAGE_CONSENT_EVENT, onConsent);
    return () => { window.clearTimeout(timer); stop(); window.removeEventListener(USAGE_CONSENT_EVENT, onConsent); };
  }, [load]);

  const loading = result === undefined;
  const activity = result?.data ?? null;
  const days = (n: number) => (n === 1 ? t('dayOne') : t('days', { n }));
  const statsLink = (
    <ButtonLink href={localize('/profile/stats')} variant="tone">
      {t('moreStats')}
      <ArrowRight size={17} weight="bold" aria-hidden="true" />
    </ButtonLink>
  );

  // Only what is actually known; IDs can be copied.
  const details = [
    { label: t('username'), value: user?.username, copy: true },
    { label: t('studentId'), value: untis && user?.studentId ? String(user.studentId) : '', copy: true },
    { label: t('class'), value: user?.klasseName },
    { label: t('schoolLabel'), value: t('school') },
    { label: t('userId'), value: stableUid ?? '', copy: true, mono: true },
    { label: t('classId'), value: classId ?? '', copy: true, mono: true },
  ].filter((d) => d.value);

  return (
    <Page>
      <header className="rise flex flex-col gap-6 pt-4 pb-10 sm:flex-row sm:items-center md:pt-8 md:pb-14">
        <div className="flex min-w-0 items-center gap-5">
          <Avatar name={name || '?'} size={88} picture={untis} expandable />
          <div className="min-w-0">
            <h1 className="truncate text-[32px] font-extrabold leading-[1.05] tracking-[-0.05em] md:text-[44px]">{name || '…'}</h1>
            <p className="mt-1.5 text-[15px] text-ink-2 md:text-[16px]">
              {[user?.klasseName, t('school'), user?.isParent ? t('guardian') : t('student')].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-14 md:gap-20">
        <Block title={t('activity')} lead={t('activityLead')} action={activity ? statsLink : undefined}>
          {result && !activity ? (
            <div className="squircle rounded-[26px] bg-surface">
              <PixelState
                title={t('activityUnavailable')}
                detail={result.error}
                action={
                  <Button variant="quiet" onClick={() => load(true)}>
                    <ArrowClockwise size={17} weight="bold" aria-hidden="true" />
                    {tc('retry')}
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Figure label={t('daysOnline')} value={activity ? String(activity.totals.activeDays) : '–'} loading={loading} />
                <Figure label={t('logins')} value={activity ? String(activity.totals.logins) : '–'} loading={loading} />
                <Figure label={t('currentStreak')} value={activity ? days(activity.totals.currentStreak) : '–'} loading={loading} />
                <Figure label={t('longestStreak')} value={activity ? days(activity.totals.longestStreak) : '–'} loading={loading} />
              </div>

              <div className="squircle mt-3 rounded-[26px] bg-surface p-5 md:p-6">
                {activity ? <ActivityGrid days={activity.days} /> : <ActivityGridSkeleton />}
                <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="max-w-[56ch] text-[13px] leading-relaxed text-ink-3">
                    {activity?.retention.schoolYear ? t('activityKeptYear') : t('activityKept', { n: activity?.retention.activeDays ?? 30 })}
                    {activity?.usageConsent && <> {activity.retention.schoolYear ? t('activityKeptYearConsent') : t('activityKeptConsent', { n: activity.retention.usage })}</>}
                  </p>
                  <GridLegend />
                </div>
              </div>

              {activity && !activity.usageConsent && (
                <p className="mt-4 text-[14.5px] text-ink-2">
                  {t('consentHint')}{' '}
                  <Link href={localize('/settings#privacy')} className="font-semibold text-accent-ink underline-offset-4 hover:underline">{t('consentLink')}</Link>
                </p>
              )}

              {activity && <div className="mt-6 lg:hidden">{statsLink}</div>}
            </>
          )}
        </Block>

        {/* Like the end of the settings: the account as rows under thin
            rules, then the way to the settings, to the start page and out. */}
        <Group id="account" title={t('account')}>
          {details.map((d) => (
            <Item key={d.label} title={d.label} inline>
              <span className="flex min-w-0 items-center gap-1.5">
                <span className={`min-w-0 truncate text-[15.5px] font-semibold text-ink-2 ${d.mono ? 'mono text-[14px]' : ''}`}>{d.value}</span>
                {d.copy && d.value && <CopyButton value={d.value} label={d.label} />}
              </span>
            </Item>
          ))}
          <LinkItem href="/settings" title={t('settings')} hint={t('settingsHint')} />
          <LinkItem href="/" title={ts('website')} hint={t('websiteHint')} />
          <Item title={tset('logout')} hint={tset('logoutHint')} danger>
            <LogoutButton />
          </Item>
        </Group>
      </div>
    </Page>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
