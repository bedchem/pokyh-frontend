'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { Page, PageHeader } from '@/components/app/Page';
import { Bone, Line } from '@/components/app/Skeleton';
import { useDateLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { profileDict } from '@/lib/i18n/dictionaries/profile';
import { shellDict } from '@/lib/i18n/dictionaries/shell';
import { fetchAccountActivity, type ActivityResult } from '@/lib/account-activity';
import PixelState from '@/components/app/PixelState';
import StatsOffNotice from '@/components/app/StatsOffNotice';
import { Button } from '@/components/ui/Button';
import { ArrowClockwise } from '@phosphor-icons/react';
import { commonDict } from '@/lib/i18n/dictionaries/common';

// Statistics behind the profile's activity grid, all from GET /users/me/activity:
// figures, when in the day and week you are online, on which devices, the
// pages you open most and what you created in POKYH. Charts are plain bars
// that grow in once; anything that needs the personal usage statistics says so.

function useGrow(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return on;
}

function Figure({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="squircle rise flex min-h-[124px] flex-col justify-between gap-3 rounded-[24px] bg-surface p-5">
      <span className="text-[14px] font-semibold text-ink-2">{label}</span>
      <span>
        <span className="block text-[32px] font-extrabold leading-none tracking-[-0.05em] tnum md:text-[36px]">{value}</span>
        {sub && <span className="mt-1.5 block text-[13px] text-ink-2">{sub}</span>}
      </span>
    </div>
  );
}

function Panel({ title, hint, children, className = '' }: { title: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={`squircle rise flex flex-col rounded-[26px] bg-surface p-5 md:p-6 ${className}`}>
      <h2 className="text-[18px] font-bold tracking-[-0.02em]">{title}</h2>
      {hint && <p className="mt-1 text-[13.5px] text-ink-2">{hint}</p>}
      <div className="mt-5 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

/** Vertical bars with a label under each; the largest bar is the full height. */
function Columns({ values, labels, format, highlight }: { values: number[]; labels: string[]; format: (v: number) => string; highlight?: number }) {
  const grow = useGrow();
  const max = Math.max(1, ...values);
  return (
    <div className="flex flex-1 items-end gap-1.5" role="list">
      {values.map((v, i) => (
        <div key={i} role="listitem" aria-label={`${labels[i]}: ${format(v)}`} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="relative flex h-[140px] w-full items-end">
            <div
              className={`w-full rounded-[7px] transition-[height] duration-700 ease-[var(--ease-out)] ${i === highlight ? 'bg-accent' : 'bg-[color-mix(in_srgb,var(--accent)_38%,transparent)] group-hover:bg-[color-mix(in_srgb,var(--accent)_60%,transparent)]'}`}
              style={{ height: grow ? `${Math.max(v > 0 ? 6 : 3, (v / max) * 100)}%` : '3%', transitionDelay: `${i * 18}ms` }}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-ink px-2 py-1 text-[11.5px] font-semibold text-canvas opacity-0 transition-opacity group-hover:opacity-100 dark:bg-[#2E2E34] dark:text-ink">
              {format(v)}
            </span>
          </div>
          <span className="truncate text-[11.5px] font-semibold text-ink-3">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

/** Horizontal bars for a few named values. */
function Bars({ rows }: { rows: Array<{ label: string; value: number; text: string }> }) {
  const grow = useGrow();
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[14.5px]">
            <span className="truncate font-semibold">{r.label}</span>
            <span className="shrink-0 text-ink-2 tnum">{r.text}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]">
            <div className="h-full rounded-full bg-accent transition-[width] duration-700 ease-[var(--ease-out)]" style={{ width: grow ? `${(r.value / max) * 100}%` : '0%', transitionDelay: `${i * 60}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsContent() {
  const t = useT(profileDict);
  const ts = useT(shellDict);
  const { tag } = useDateLocale();
  const localize = useLocalizeHref();
  const tc = useT(commonDict);
  const [result, setResult] = useState<ActivityResult | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    fetchAccountActivity().then((v) => { if (alive) setResult(v); });
    return () => { alive = false; };
  }, []);

  const retry = () => {
    setResult(undefined);
    fetchAccountActivity(true).then(setResult);
  };
  const a = result === undefined ? undefined : result.data;

  const time = (seconds: number) => {
    const m = Math.round(seconds / 60);
    return m < 60 ? t('minutes', { n: m }) : t('hoursMinutes', { h: Math.floor(m / 60), m: m % 60 });
  };

  const header = <PageHeader title={t('statsTitle')} subtitle={t('statsLead')} back={{ href: '/profile', label: t('back') }} />;

  if (a === undefined) {
    return (
      <Page>
        {header}
        <div aria-hidden="true" className="grid gap-3 text-ink md:grid-cols-4 md:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="squircle flex min-h-[124px] flex-col justify-between rounded-[24px] bg-surface p-5"><Line w="50%" h={12} /><Line w={70} h={30} /></span>
          ))}
          <span className="squircle col-span-full flex h-[260px] items-end gap-2 rounded-[26px] bg-surface p-6 md:col-span-2">
            {[30, 55, 80, 45, 65, 90, 40].map((h, i) => <Bone key={i} className="flex-1 !rounded-[7px]" style={{ height: `${h}%` }} />)}
          </span>
          <span className="squircle col-span-full flex h-[260px] items-end gap-2 rounded-[26px] bg-surface p-6 md:col-span-2">
            {[60, 35, 75, 50, 85, 25, 45].map((h, i) => <Bone key={i} className="flex-1 !rounded-[7px]" style={{ height: `${h}%` }} />)}
          </span>
        </div>
      </Page>
    );
  }

  if (!a) {
    return (
      <Page>
        {header}
        <div className="squircle rounded-[26px] bg-surface">
          <PixelState
            title={t('activityUnavailable')}
            detail={result?.error}
            action={<Button variant="quiet" onClick={retry}><ArrowClockwise size={17} weight="bold" aria-hidden="true" />{tc('retry')}</Button>}
          />
        </div>
      </Page>
    );
  }

  const consent = a.usageConsent;
  const activeDaysWithTime = a.days.filter((d) => d.activeSeconds > 0).length;
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(tag, { weekday: 'short' }).replace('.', ''));
  const topWeekday = a.weekdays.indexOf(Math.max(...a.weekdays));
  const topHour = a.hours.indexOf(Math.max(...a.hours));
  const pageName = (p: string) => {
    const key = p.replace(/^\//, '') as keyof typeof shellKeys;
    return shellKeys[key] ? ts(shellKeys[key]) : p;
  };
  const noConsent = (
    <p className="flex flex-1 items-center text-[14.5px] text-ink-2">
      {t('onlyWithConsent')}{' '}
      <Link href={localize('/settings#privacy')} className="ml-1 font-semibold text-accent-ink underline-offset-4 hover:underline">{t('consentLink')}</Link>
    </p>
  );

  return (
    <Page>
      {header}
      {!consent && <StatsOffNotice className="mb-3 md:mb-4" />}
      <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
        <Figure label={t('daysOnline')} value={String(a.totals.activeDays)} sub={`${t('currentStreak')}: ${a.totals.currentStreak === 1 ? t('dayOne') : t('days', { n: a.totals.currentStreak })}`} />
        <Figure label={t('logins')} value={String(a.totals.logins)} sub={`${t('longestStreak')}: ${a.totals.longestStreak === 1 ? t('dayOne') : t('days', { n: a.totals.longestStreak })}`} />
        <Figure label={t('usageTime')} value={consent ? time(a.totals.activeSeconds) : '–'} sub={consent ? `${t('visits')}: ${a.totals.visits}` : t('onlyWithConsent')} />
        <Figure label={t('perDay')} value={consent && activeDaysWithTime ? time(a.totals.activeSeconds / activeDaysWithTime) : '–'} sub={consent ? `${t('screens')}: ${a.totals.screens}` : undefined} />

        <Panel className="md:col-span-2" title={t('whenOnline')} hint={t('whenOnlineHint')}>
          {consent ? (
            <Columns
              values={a.hours.slice(6, 23)}
              labels={Array.from({ length: 17 }, (_, i) => String(i + 6))}
              format={time}
              highlight={topHour >= 6 && topHour < 23 && a.hours[topHour] > 0 ? topHour - 6 : undefined}
            />
          ) : noConsent}
        </Panel>

        <Panel className="md:col-span-2" title={t('weekdays')} hint={t('weekdaysHint')}>
          <Columns
            values={a.weekdays}
            labels={weekdayLabels}
            format={(v) => (v === 1 ? t('dayOne') : t('days', { n: v }))}
            highlight={a.weekdays[topWeekday] > 0 ? topWeekday : undefined}
          />
        </Panel>

        <Panel className="md:col-span-2 xl:col-span-1" title={t('devices')} hint={t('devicesHint')}>
          <Bars
            rows={[
              { label: t('phone'), value: a.platforms.phone, text: a.platforms.phone === 1 ? t('dayOne') : t('days', { n: a.platforms.phone }) },
              { label: t('computer'), value: a.platforms.desktop, text: a.platforms.desktop === 1 ? t('dayOne') : t('days', { n: a.platforms.desktop }) },
              { label: t('apps'), value: a.platforms.app, text: a.platforms.app === 1 ? t('dayOne') : t('days', { n: a.platforms.app }) },
              { label: t('browser'), value: a.platforms.web, text: a.platforms.web === 1 ? t('dayOne') : t('days', { n: a.platforms.web }) },
            ]}
          />
        </Panel>

        <Panel className="md:col-span-2 xl:col-span-1" title={t('topPages')} hint={t('topPagesHint')}>
          {consent ? (
            a.pages.length ? (
              <Bars rows={a.pages.map((p) => ({ label: pageName(p.page), value: p.views, text: t('views', { n: p.views }) }))} />
            ) : <p className="text-[14.5px] text-ink-2">–</p>
          ) : noConsent}
        </Panel>

        <Panel className="md:col-span-2" title={t('created')}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            {[
              { label: t('todosDone'), value: a.created.todosDone },
              { label: t('todosOpen'), value: a.created.todosOpen },
              { label: t('reminders'), value: a.created.reminders },
              { label: t('comments'), value: a.created.comments },
              { label: t('ratings'), value: a.created.ratings },
            ].map((c) => (
              <div key={c.label} className="border-t border-line pt-3">
                <p className="text-[13.5px] font-semibold text-ink-2">{c.label}</p>
                <p className="mt-1 text-[26px] font-extrabold tracking-[-0.04em] tnum">{c.value}</p>
              </div>
            ))}
            {a.memberSince && (
              <div className="border-t border-line pt-3">
                <p className="text-[13.5px] font-semibold text-ink-2">{t('memberSince')}</p>
                <p className="mt-1 text-[18px] font-extrabold tracking-[-0.02em]">
                  {new Date(a.memberSince).toLocaleDateString(tag, { month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </Panel>
      </div>
      <p className="rise mt-8 max-w-[70ch] text-[13px] leading-relaxed text-ink-3">{t('source')}</p>
    </Page>
  );
}

const shellKeys = {
  home: 'home',
  timetable: 'timetable',
  grades: 'grades',
  messages: 'messages',
  absences: 'absences',
  classregevents: 'classregevents',
  todos: 'todos',
  reminders: 'reminders',
  class: 'class',
  canteen: 'mensa',
  mensa: 'mensa',
  school: 'school',
  profile: 'profile',
  settings: 'settings',
} as const;

export default function StatsPage() {
  return (
    <AuthGuard>
      <StatsContent />
    </AuthGuard>
  );
}
