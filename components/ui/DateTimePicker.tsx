'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  value: string; // "YYYY-MM-DDTHH:MM" or ""
  onChange: (val: string) => void;
  onBack: () => void;
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];
const DAY_ABBR = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function toDs(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dsToGerman(ds: string): string {
  const [y, m, d] = ds.split('-');
  return `${d}.${m}.${y}`;
}

function parseGermanDate(raw: string): string | null {
  const match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (!match) return null;
  let [, d, m, y] = match;
  if (y.length === 2) y = `20${y}`;
  const day = parseInt(d), month = parseInt(m), year = parseInt(y);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2020 || year > 2099) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function DateTimePicker({ value, onChange, onBack }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDs = toDs(today);

  const initDs = value ? value.split('T')[0] : '';
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

  function handleDateText(raw: string) {
    setDateText(raw);
    if (!raw) { setDateErr(false); return; }
    const parsed = parseGermanDate(raw);
    if (parsed) {
      setSelDate(parsed);
      const d = new Date(parsed + 'T00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setDateErr(false);
    } else {
      setDateErr(raw.length >= 8);
    }
  }

  function handleTimeText(raw: string) {
    const val = raw.replace(/[^0-9:]/g, '').slice(0, 5);
    setTimeText(val);
    if (val.length === 5) {
      const m = val.match(/^(\d{2}):(\d{2})$/);
      setTimeErr(!m || parseInt(m[1]) > 23 || parseInt(m[2]) > 59);
    } else {
      setTimeErr(false);
    }
  }

  const timeValid = /^\d{2}:\d{2}$/.test(timeText) && !timeErr;
  const canConfirm = !!selDate && timeValid;

  function confirm() {
    if (!canConfirm) return;
    onChange(`${selDate}T${timeText}`);
    onBack();
  }

  let preview = '';
  if (selDate && timeValid) {
    const d = new Date(`${selDate}T${timeText}`);
    preview = d.toLocaleDateString('de', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + timeText + ' Uhr';
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
      onClick={onBack}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-[28px] fade-in"
        style={{ background: 'var(--app-surface)', animationDuration: '0.2s' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-2">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full press-scale flex-shrink-0"
            style={{ background: 'var(--app-card)', color: 'var(--app-text-primary)' }}
            aria-label="Zurück"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-[17px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
            Datum & Uhrzeit
          </h3>
        </div>

        <div className="px-5 pb-8 flex flex-col gap-5 mt-2">

          {/* Date */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-3 px-0.5" style={{ color: 'var(--app-text-tertiary)' }}>
              Datum
            </p>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={prevMonth}
                className="w-9 h-9 rounded-full flex items-center justify-center press-scale"
                style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)' }}
              >
                <ChevronLeft size={17} />
              </button>
              <span className="text-[15px] font-semibold" style={{ color: 'var(--app-text-primary)' }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                onClick={nextMonth}
                className="w-9 h-9 rounded-full flex items-center justify-center press-scale"
                style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)' }}
              >
                <ChevronRight size={17} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_ABBR.map(d => (
                <span key={d} className="text-center text-[11px] font-medium py-1" style={{ color: 'var(--app-text-tertiary)' }}>
                  {d}
                </span>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (!day) return <div key={`e${i}`} className="h-9" />;
                const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSel = ds === selDate;
                const isToday = ds === todayDs;
                return (
                  <button
                    key={ds}
                    onClick={() => selectDay(day)}
                    className="h-9 flex items-center justify-center press-scale"
                  >
                    <span
                      style={{
                        width: 34, height: 34,
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: isSel ? 700 : 400,
                        background: isSel
                          ? 'var(--accent)'
                          : isToday
                          ? 'color-mix(in srgb, var(--accent) 12%, var(--app-bg))'
                          : 'transparent',
                        color: isSel ? '#fff' : isToday ? 'var(--accent)' : 'var(--app-text-primary)',
                        border: isToday && !isSel ? '1.5px solid color-mix(in srgb, var(--accent) 35%, transparent)' : 'none',
                      }}
                    >
                      {day}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Manual date input */}
            <div className="mt-3">
              <input
                type="text"
                placeholder="TT.MM.JJJJ"
                value={dateText}
                onChange={e => handleDateText(e.target.value)}
                maxLength={10}
                className="w-full rounded-xl px-4 py-2.5 text-[14px] outline-none text-center"
                style={{
                  background: 'var(--app-card)',
                  color: dateErr ? 'var(--danger)' : 'var(--app-text-primary)',
                  border: `1.5px solid ${dateErr ? 'var(--danger)' : selDate ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'transparent'}`,
                }}
              />
              {dateErr && (
                <p className="text-[11px] mt-1 px-1" style={{ color: 'var(--danger)' }}>Format: TT.MM.JJJJ</p>
              )}
            </div>
          </div>

          {/* Time */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-0.5" style={{ color: 'var(--app-text-tertiary)' }}>
              Uhrzeit
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="HH:MM"
              value={timeText}
              onChange={e => handleTimeText(e.target.value)}
              maxLength={5}
              className="w-full rounded-xl px-4 py-3 text-[24px] font-bold outline-none text-center"
              style={{
                letterSpacing: '0.15em',
                background: 'var(--app-card)',
                color: timeErr ? 'var(--danger)' : 'var(--app-text-primary)',
                border: `1.5px solid ${timeErr ? 'var(--danger)' : timeValid ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'transparent'}`,
              }}
            />
            {timeErr && (
              <p className="text-[11px] mt-1 px-1" style={{ color: 'var(--danger)' }}>Format: HH:MM (z.B. 08:30)</p>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: 'color-mix(in srgb, var(--accent) 10%, var(--app-card))',
                border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--accent)' }}>
                Ausgewählt
              </p>
              <p className="text-[14px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
                {preview}
              </p>
            </div>
          )}

          <button
            onClick={confirm}
            disabled={!canConfirm}
            className="h-12 rounded-xl font-semibold text-white press-scale disabled:opacity-40 text-[15px]"
            style={{ background: 'var(--accent)' }}
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}
