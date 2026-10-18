'use client';

import { useId, useState } from 'react';
import { useLocale, useT } from '@/providers/LocaleProvider';
import { toolsDict } from '@/lib/i18n/dictionaries/tools';
import { absenceStats, parseAmount } from '@/lib/school-math';
import { NumberField, Segmented, formatNumber } from './fields';

// Absences in percent and the hours left before the limit. Everything stays
// in this component's state: nothing is stored or sent.

/** The three-quarter rule: a quarter of the lessons may be missed. */
const DEFAULT_LIMIT = '25';

type Mode = 'total' | 'weekly';

export default function AbsenceCalculator() {
  const t = useT(toolsDict);
  const { locale } = useLocale();
  const uid = useId();
  const [absent, setAbsent] = useState('');
  const [mode, setMode] = useState<Mode>('weekly');
  const [total, setTotal] = useState('');
  const [weekly, setWeekly] = useState('');
  const [weeks, setWeeks] = useState('');
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const fmt = (n: number, digits = 1) => formatNumber(n, locale, digits);

  const absentHours = parseAmount(absent);
  const weeklyHours = parseAmount(weekly);
  const weekCount = parseAmount(weeks);
  const yearHours = mode === 'total'
    ? parseAmount(total)
    : weeklyHours !== null && weekCount !== null ? weeklyHours * weekCount : null;
  const limitPct = parseAmount(limit);
  const stats = absentHours !== null && yearHours !== null && limitPct !== null
    ? absenceStats(absentHours, yearHours, Math.min(limitPct, 100))
    : null;
  const tooMany = absentHours !== null && yearHours !== null && yearHours > 0 && absentHours > yearHours;

  // The bar runs to twice the limit, so the marker sits in the middle.
  const span = Math.max((limitPct ?? 25) * 2, stats?.absentPct ?? 0, 1);
  const tone = !stats || limitPct === null
    ? 'bg-ink-3'
    : stats.hoursLeft < 0 ? 'bg-[var(--danger)]' : stats.absentPct >= limitPct * 0.6 ? 'bg-[var(--warning)]' : 'bg-sage-ink';

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
      <div className="card flex flex-col gap-5 p-5 sm:p-7 md:p-8">
        <NumberField
          id={`${uid}-absent`}
          label={t('aAbsent')}
          value={absent}
          placeholder="120"
          invalid={(!!absent.trim() && absentHours === null) || tooMany}
          onChange={(e) => setAbsent(e.target.value)}
          maxLength={6}
        />

        <div className="flex flex-col gap-3">
          <p className="px-1 text-[13.5px] font-semibold text-ink-2">{t('aTotalMode')}</p>
          <Segmented
            label={t('aTotalMode')}
            value={mode}
            options={[{ value: 'weekly', label: t('aModeWeekly') }, { value: 'total', label: t('aModeTotal') }]}
            onChange={setMode}
          />
          {mode === 'total' ? (
            <NumberField
              id={`${uid}-total`}
              label={t('aTotal')}
              hideLabel
              value={total}
              placeholder="1056"
              invalid={!!total.trim() && parseAmount(total) === null}
              onChange={(e) => setTotal(e.target.value)}
              maxLength={6}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                id={`${uid}-weekly`}
                label={t('aWeekly')}
                value={weekly}
                placeholder="32"
                invalid={!!weekly.trim() && weeklyHours === null}
                onChange={(e) => setWeekly(e.target.value)}
                maxLength={4}
              />
              <NumberField
                id={`${uid}-weeks`}
                label={t('aWeeks')}
                value={weeks}
                placeholder="33"
                invalid={!!weeks.trim() && weekCount === null}
                onChange={(e) => setWeeks(e.target.value)}
                maxLength={3}
              />
            </div>
          )}
          {mode === 'weekly' && yearHours !== null && yearHours > 0 && (
            <p className="px-1 text-[14px] text-ink-3">{t('aYear', { n: fmt(yearHours, 1) })}</p>
          )}
        </div>

        <NumberField
          id={`${uid}-limit`}
          label={t('aLimit')}
          value={limit}
          suffix="%"
          invalid={limitPct === null || limitPct > 100}
          onChange={(e) => setLimit(e.target.value)}
          maxLength={5}
          className="sm:max-w-[50%]"
        />
      </div>

      <div className="flex flex-col gap-4">
        <section aria-live="polite" className="card flex flex-col gap-4 p-6 sm:p-7 md:p-8">
          {stats === null ? (
            <p className="py-4 text-[16px] leading-[1.55] text-ink-3">{tooMany ? t('aInvalid') : t('aEmpty')}</p>
          ) : (
            <>
              <p className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-display text-[clamp(64px,9vw,104px)] font-extrabold leading-none tracking-[-0.05em] tabular-nums">
                  {fmt(stats.absentPct)}&thinsp;%
                </span>
                <span className="text-[17px] font-semibold text-ink-2">{t('aResult')}</span>
              </p>
              <div aria-hidden="true" className="relative h-3 rounded-full bg-inset">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-[var(--ease-out)] ${tone}`}
                  style={{ width: `${Math.min(100, (stats.absentPct / span) * 100)}%` }}
                />
                {limitPct !== null && (
                  <span className="absolute -inset-y-1.5 w-0.5 rounded-full bg-ink" style={{ left: `${Math.min(100, (limitPct / span) * 100)}%` }} />
                )}
              </div>
              <p className="text-[15px] text-ink-2">{t('aPresent', { x: fmt(100 - stats.absentPct) })}</p>
              <p className="text-[17px] font-semibold leading-[1.45]">
                {stats.hoursLeft > 0
                  ? t('aLeft', { n: formatNumber(stats.hoursLeft, locale, 0) })
                  : stats.hoursLeft === 0
                    ? t('aAtLimit')
                    : t('aOver', { n: formatNumber(-stats.hoursLeft, locale, 0) })}
              </p>
            </>
          )}
        </section>
        <p className="px-2 text-[13.5px] leading-[1.55] text-ink-3">{t('privacy')} {t('disclaimer')}</p>
      </div>
    </div>
  );
}
