'use client';

import { useEffect, useId, useState } from 'react';
import { CaretLeft, CaretRight, Check } from '@phosphor-icons/react';
import Sheet from './Sheet';
import { Button } from './Button';
import { useDateLocale, useLocale, useT } from '@/providers/LocaleProvider';
import { uiDict } from '@/lib/i18n/dictionaries/ui';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { dayAbbrMonSun, formatDate } from '@/lib/i18n/dateLocale';

// Date and time, picked on a month calendar or typed (the dots and the colon
// come by themselves). `DateTimeFields` is the picker itself, for a step
// inside another sheet; the default export puts it in its own sheet with a
// confirm button (to-dos, reminders).

interface FieldsProps {
  value: string; // "YYYY-MM-DDTHH:MM" or ""
  // Lower bound (e.g. the chosen start). Earlier days are disabled and, on the
  // same day, earlier times are rejected, so the end can only grow, never shrink
  // before the start. When `value` is empty the picker opens on this day.
  minDateTime?: string;
  /** The complete, valid choice ("YYYY-MM-DDTHH:MM"), or null while it isn't one. */
  onValid: (value: string | null) => void;
}


function toDs(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dsToGerman(ds: string): string {
  const [y, m, d] = ds.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Typed digits become "TT.MM.JJJJ" as they come: the dot is added after the
 * day and the month, a dot typed after one digit pads it ("1." → "01."), a
 * digit that can only be a single day or month is padded at once ("5" →
 * "05.", day 4–9; month 2–9), and while deleting no dot is put back, so
 * Backspace goes through it.
 */
export function maskDate(raw: string, previous: string): string {
  const deleting = raw.length < previous.length;
  const parts = ['', '', ''];
  let field = 0;
  for (const ch of raw) {
    if (/\d/.test(ch)) {
      if (field < 2 && parts[field].length === 2) field += 1;
      if (field < 2 && parts[field] === '' && ch > (field === 0 ? '3' : '1')) {
        parts[field] = `0${ch}`;
        continue;
      }
      if (parts[field].length < (field === 2 ? 4 : 2)) parts[field] += ch;
    } else if (/[.,/\- ]/.test(ch) && field < 2 && parts[field].length > 0) {
      parts[field] = parts[field].padStart(2, '0');
      field += 1;
    }
  }
  const [day, month, year] = parts;
  let out = day;
  if (field >= 1 || (day.length === 2 && !deleting)) out += '.';
  out += month;
  if (field >= 2 || (month.length === 2 && !deleting)) out += '.';
  return out + year;
}

function parseGermanDate(raw: string): string | null {
  const match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (!match) return null;
  const [, d, m, yy] = match;
  const y = yy.length === 2 ? `20${yy}` : yy;
  const day = parseInt(d), month = parseInt(m), year = parseInt(y);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2020 || year > 2099) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function DateTimeFields({ value, minDateTime, onValid }: FieldsProps) {
  const t = useT(uiDict);
  const id = useId();
  const { locale } = useLocale();
  const { tag } = useDateLocale();
  const DAY_ABBR = dayAbbrMonSun(locale);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDs = toDs(today);

  const minDs = minDateTime ? minDateTime.split('T')[0] : '';
  const minTimeStr = minDateTime ? (minDateTime.split('T')[1] ?? '').slice(0, 5) : '';

  const initDs = value ? value.split('T')[0] : minDs;
  const initTime = value ? (value.split('T')[1] ?? '').slice(0, 5) : '';
  const initD = initDs ? new Date(initDs + 'T00:00') : today;

  const [selDate, setSelDate] = useState(initDs);
  const [viewYear, setViewYear] = useState(initD.getFullYear());
  const [viewMonth, setViewMonth] = useState(initD.getMonth());
  const [dateText, setDateText] = useState(initDs ? dsToGerman(initDs) : '');
  const [dateErr, setDateErr] = useState(false);
  const [timeText, setTimeText] = useState(initTime);
  const [timeErr, setTimeErr] = useState(false);

  // Calendar grid
  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function selectDay(day: number) {
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (minDs && ds < minDs) return; // earlier than the lower bound: not selectable
    setSelDate(ds);
    setDateText(dsToGerman(ds));
    setDateErr(false);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function handleDateText(input: string) {
    const raw = maskDate(input, dateText);
    setDateText(raw);
    if (!raw) { setDateErr(false); return; }
    // Taken once the year is complete, so the calendar doesn't jump to 2020
    // on the way to 2026.
    const parsed = /\.\d{4}$/.test(raw) ? parseGermanDate(raw) : null;
    if (parsed) {
      setSelDate(parsed);
      const d = new Date(parsed + 'T00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setDateErr(false);
    } else {
      setDateErr(raw.length >= 10);
    }
  }

  // A two-digit year is completed when the field is left ("05.03.27" → 2027).
  function completeDate() {
    if (!/^\d{2}\.\d{2}\.\d{2}$/.test(dateText)) return;
    const parsed = parseGermanDate(dateText);
    if (!parsed) { setDateErr(true); return; }
    handleDateText(dsToGerman(parsed));
  }

  function handleTimeText(raw: string) {
    // Strip everything except digits, then auto-insert colon after position 2
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
    setTimeText(formatted);
    if (formatted.length === 5) {
      const m = formatted.match(/^(\d{2}):(\d{2})$/);
      setTimeErr(!m || parseInt(m[1]) > 23 || parseInt(m[2]) > 59);
    } else {
      setTimeErr(false);
    }
  }

  const timeValid = /^\d{2}:\d{2}$/.test(timeText) && !timeErr;
  // On the lower-bound day the time may not be earlier than the bound's time.
  const belowMin = !!minDateTime && !!selDate && timeValid &&
    (selDate < minDs || (selDate === minDs && timeText < minTimeStr));
  const valid = !!selDate && timeValid && !belowMin ? `${selDate}T${timeText}` : null;

  useEffect(() => { onValid(valid); }, [valid, onValid]);

  let preview = '';
  if (selDate && timeValid) {
    const d = new Date(`${selDate}T${timeText}`);
    preview = t('dtPreview', { date: formatDate(d, tag, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), time: timeText });
  }

  const control = 'h-12 w-full rounded-[14px] bg-inset px-4 text-[16px] font-semibold text-ink outline-none transition-[box-shadow,background-color] placeholder:font-normal placeholder:text-ink-3 focus:bg-surface focus:shadow-[0_0_0_2px_var(--accent)] aria-[invalid=true]:shadow-[0_0_0_2px_var(--danger)] tnum';
  const navButton = 'grid size-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-inset hover:text-ink';

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={prevMonth} className={navButton} aria-label={t('dtPrevMonth')}>
            <CaretLeft size={18} weight="bold" />
          </button>
          <span className="text-[16px] font-bold tracking-[-0.01em]" aria-live="polite">
            {formatDate(new Date(viewYear, viewMonth, 1), tag, { month: 'long', year: 'numeric' })}
          </span>
          <button type="button" onClick={nextMonth} className={navButton} aria-label={t('dtNextMonth')}>
            <CaretRight size={18} weight="bold" />
          </button>
        </div>

        <div className="grid grid-cols-7" aria-hidden="true">
          {DAY_ABBR.map(d => (
            <span key={d} className="py-1 text-center text-[12px] font-semibold text-ink-3">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <span key={`e${i}`} className="h-10" />;
            const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSel = ds === selDate;
            const isToday = ds === todayDs;
            const isDisabled = !!minDs && ds < minDs;
            return (
              <button
                key={ds}
                type="button"
                onClick={() => selectDay(day)}
                disabled={isDisabled}
                aria-pressed={isSel}
                aria-label={formatDate(new Date(viewYear, viewMonth, day), tag, { weekday: 'long', day: 'numeric', month: 'long' })}
                className="grid h-10 place-items-center disabled:cursor-not-allowed"
              >
                <span
                  className={`grid size-10 place-items-center rounded-full text-[14.5px] tnum transition-colors duration-150 ${
                    isSel
                      ? 'bg-accent font-bold text-on-accent'
                      : isDisabled
                        ? 'text-ink-3 opacity-40'
                        : isToday
                          ? 'font-bold text-accent-ink shadow-[inset_0_0_0_1.5px_var(--accent)] hover:bg-inset'
                          : 'text-ink hover:bg-inset'
                  }`}
                >
                  {day}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-date`} className="text-[14px] font-semibold text-ink">{t('dtDate')}</label>
          <input
            id={`${id}-date`}
            type="text"
            placeholder={t('dtDatePlaceholder')}
            value={dateText}
            onChange={e => handleDateText(e.target.value)}
            onBlur={completeDate}
            inputMode="numeric"
            autoComplete="off"
            maxLength={10}
            aria-invalid={dateErr || undefined}
            aria-describedby={dateErr ? `${id}-date-err` : undefined}
            className={control}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-time`} className="text-[14px] font-semibold text-ink">{t('dtTime')}</label>
          <input
            id={`${id}-time`}
            type="text"
            inputMode="numeric"
            placeholder="HH:MM"
            value={timeText}
            onChange={e => handleTimeText(e.target.value)}
            autoComplete="off"
            maxLength={5}
            aria-invalid={timeErr || belowMin || undefined}
            aria-describedby={timeErr || belowMin ? `${id}-time-err` : undefined}
            className={control}
          />
        </div>
      </div>
      {(dateErr || timeErr || belowMin) && (
        <div className="-mt-3 flex flex-col gap-1">
          {dateErr && <p id={`${id}-date-err`} className="text-[13px] font-medium text-danger-ink">{t('dtDateFormat')}</p>}
          {timeErr && <p id={`${id}-time-err`} className="text-[13px] font-medium text-danger-ink">{t('dtTimeFormat')}</p>}
          {!timeErr && belowMin && <p id={`${id}-time-err`} className="text-[13px] font-medium text-danger-ink">{t('dtEndAfterStart')}</p>}
        </div>
      )}

      {preview && (
        <p className="flex items-center gap-2.5 rounded-[14px] bg-periwinkle px-4 py-3 text-[14.5px] font-semibold text-periwinkle-ink" aria-live="polite">
          <Check size={17} weight="bold" aria-hidden="true" className="shrink-0" />
          <span className="first-letter:uppercase">{preview}</span>
        </p>
      )}
    </div>
  );
}

/** The picker in its own sheet, with a confirm button below it. */
export default function DateTimePicker({ value, onChange, onBack, minDateTime }: {
  value: string;
  onChange: (val: string) => void;
  onBack: () => void;
  minDateTime?: string;
}) {
  const t = useT(uiDict);
  const tc = useT(commonDict);
  const [choice, setChoice] = useState<string | null>(null);
  const confirm = () => {
    if (!choice) return;
    onChange(choice);
    onBack();
  };
  return (
    <Sheet
      open
      onClose={onBack}
      title={t('dtTitle')}
      closeLabel={tc('close')}
      footer={<Button onClick={confirm} disabled={!choice} className="w-full">{t('dtConfirm')}</Button>}
    >
      <div className="pb-1">
        <DateTimeFields value={value} minDateTime={minDateTime} onValid={setChoice} />
      </div>
    </Sheet>
  );
}
