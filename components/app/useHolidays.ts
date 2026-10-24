'use client';

import { useCallback, useEffect, useState } from 'react';
import { useT } from '@/providers/LocaleProvider';
import { fetchHolidays, getHolidaysStale, type SchoolHoliday } from '@/lib/api';
import { holidayKey } from '@/lib/holidays';
import { holidaysDict } from '@/lib/i18n/dictionaries/holidays';

/** The school's breaks: this device's copy at once, the live list after. Empty without WebUntis. */
export function useHolidays(enabled = true): SchoolHoliday[] {
  const [holidays, setHolidays] = useState<SchoolHoliday[]>(() => (enabled ? getHolidaysStale() ?? [] : []));
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetchHolidays().then((h) => { if (alive) setHolidays(h); }).catch(() => {});
    return () => { alive = false; };
  }, [enabled]);
  return holidays;
}

/**
 * A break's name in the reader's language. The name WebUntis has is used only
 * where POKYH cannot tell the break itself (it is often a placeholder, and
 * never translated).
 */
export function useHolidayName(): (h: SchoolHoliday) => string {
  const t = useT(holidaysDict);
  return useCallback((h: SchoolHoliday) => {
    const key = holidayKey(h);
    return (key === 'break' || key === 'dayOff') && h.names[0] ? h.names[0] : t(key);
  }, [t]);
}
