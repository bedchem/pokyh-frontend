'use client';

import { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';

interface Props {
  value: string; // "YYYY-MM-DDTHH:MM" or ""
  onChange: (val: string) => void;
  onClose: () => void;
  title?: string;
}

const SCHOOL_TIMES = ['07:55', '08:45', '09:45', '10:35', '11:25', '12:15', '13:05', '13:55'];
const OTHER_TIMES  = ['07:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
const DAYS_DE      = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS_DE    = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function toDs(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDs(ds: string): string {
  const d = new Date(ds + 'T00:00');
  return `${DAYS_DE[d.getDay()]}, ${d.getDate()}. ${MONTHS_DE[d.getMonth()]}`;
}

function TimeBtn({ time, active, onClick }: { time: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="py-2.5 rounded-xl text-center press-scale"
      style={{
        background: active ? 'var(--accent)' : 'var(--app-card)',
        color: active ? '#fff' : 'var(--app-text-primary)',
      }}
    >
      <span className="text-[13px] font-semibold">{time}</span>
    </button>
  );
}

export default function DateTimePicker({ value, onChange, onClose, title = 'Datum & Uhrzeit' }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedDate = value ? value.split('T')[0] : '';
  const parsedTime = value ? (value.split('T')[1] ?? '').slice(0, 5) : '';

  const [selDate, setSelDate] = useState(parsedDate || toDs(today));
  const [selTime, setSelTime] = useState(parsedTime);
  const [customTime, setCustomTime] = useState('');

  const quickDates = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const activeTime = selTime || customTime;

  function confirm() {
    if (!selDate || !activeTime) return;
    onChange(`${selDate}T${activeTime}`);
    onClose();
  }

  function selectTime(t: string) {
    setSelTime(t);
    setCustomTime('');
  }

  function handleCustomTime(t: string) {
    setCustomTime(t);
    setSelTime('');
  }

  const selectedLabel = activeTime
    ? `${fmtDs(selDate)} · ${activeTime} Uhr`
    : fmtDs(selDate);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)' }}
      onClick={onClose}
    >
      <div
        className="w-full lg:max-w-lg lg:mx-auto rounded-t-3xl slide-up"
        style={{ background: 'var(--app-surface)', maxHeight: '90dvh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-0 flex-shrink-0" style={{ background: 'var(--app-border)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <h3 className="text-[17px] font-bold" style={{ color: 'var(--app-text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full press-scale" style={{ background: 'var(--app-card)' }}>
            <X size={16} color="var(--app-text-secondary)" />
          </button>
        </div>

        <div className="px-4 pb-10 flex flex-col gap-4">
          {/* Date */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <Calendar size={12} color="var(--app-text-tertiary)" />
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-tertiary)' }}>
                Datum
              </p>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {quickDates.map((d, i) => {
                const ds = toDs(d);
                const active = ds === selDate;
                const line1 = i === 0 ? 'Heute' : i === 1 ? 'Morgen' : i === 2 ? 'Überm.' : `${DAYS_DE[d.getDay()]} ${d.getDate()}.`;
                const line2 = i > 2 ? MONTHS_DE[d.getMonth()] : null;
                return (
                  <button
                    key={ds}
                    onClick={() => setSelDate(ds)}
                    className="py-2 px-1 rounded-xl text-center press-scale"
                    style={{ background: active ? 'var(--accent)' : 'var(--app-card)', color: active ? '#fff' : 'var(--app-text-primary)' }}
                  >
                    <span className="text-[13px] font-semibold leading-tight block">{line1}</span>
                    {line2 && <span className="text-[10px] block" style={{ opacity: 0.7 }}>{line2}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* School times */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <Clock size={12} color="var(--app-text-tertiary)" />
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-tertiary)' }}>
                Schulzeiten
              </p>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {SCHOOL_TIMES.map(t => (
                <TimeBtn key={t} time={t} active={selTime === t} onClick={() => selectTime(t)} />
              ))}
            </div>
          </div>

          {/* Other times */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-0.5" style={{ color: 'var(--app-text-tertiary)' }}>
              Weitere Zeiten
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {OTHER_TIMES.map(t => (
                <TimeBtn key={t} time={t} active={selTime === t} onClick={() => selectTime(t)} />
              ))}
            </div>
          </div>

          {/* Custom time */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-0.5" style={{ color: 'var(--app-text-tertiary)' }}>
              Freie Eingabe
            </p>
            <input
              type="time"
              value={customTime}
              onChange={e => handleCustomTime(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-[15px] outline-none"
              style={{
                background: 'var(--app-card)',
                color: customTime ? 'var(--app-text-primary)' : 'var(--app-text-tertiary)',
                border: `1.5px solid ${customTime ? 'var(--accent)' : 'transparent'}`,
              }}
            />
          </div>

          {/* Preview */}
          {activeTime && (
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: 'color-mix(in srgb, var(--accent) 10%, var(--app-card))', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--accent)' }}>Ausgewählt</p>
              <p className="text-[15px] font-bold" style={{ color: 'var(--app-text-primary)' }}>{selectedLabel}</p>
            </div>
          )}

          <button
            onClick={confirm}
            disabled={!activeTime}
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
