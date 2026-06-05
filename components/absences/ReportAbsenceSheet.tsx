'use client';

import { useEffect, useState } from 'react';
import { X, Check, ChevronRight, CalendarClock, Loader2 } from 'lucide-react';
import DateTimePicker from '@/components/ui/DateTimePicker';
import ReasonPicker from './ReasonPicker';
import TimetableLessonPicker, { type PickedRange } from './TimetableLessonPicker';
import { fetchAbsenceReasons, createAbsence } from '@/lib/api';
import type { AbsenceReason } from '@/lib/types';

interface Props {
  personName?: string | null;
  onClose: () => void;
  onCreated: () => void;
}

type View = 'form' | 'start' | 'end' | 'reason' | 'timetable';

// "YYYY-MM-DDTHH:MM" → { ymd: "YYYYMMDD", hhmm: "HHMM" }
function dtToParts(dt: string): { ymd: string; hhmm: string } | null {
  const m = dt.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  return { ymd: `${m[1]}${m[2]}${m[3]}`, hhmm: `${m[4]}${m[5]}` };
}
function partsToDt(ymd: string, hhmm: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
}
function displayDt(dt: string): string {
  const p = dtToParts(dt);
  if (!p) return 'Wählen';
  return `${p.ymd.slice(6, 8)}.${p.ymd.slice(4, 6)}.${p.ymd.slice(0, 4)} ${p.hhmm.slice(0, 2)}:${p.hhmm.slice(2, 4)}`;
}
function defaultDt(hhmm: string): string {
  const n = new Date();
  const ymd = `${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, '0')}${String(n.getDate()).padStart(2, '0')}`;
  return partsToDt(ymd, hhmm);
}

export default function ReportAbsenceSheet({ personName, onClose, onCreated }: Props) {
  const [view, setView] = useState<View>('form');
  const [start, setStart] = useState(() => defaultDt('0750'));
  const [end, setEnd] = useState(() => defaultDt('1645'));
  const [reason, setReason] = useState<AbsenceReason | null>(null);
  const [text, setText] = useState('');

  const [reasons, setReasons] = useState<AbsenceReason[]>([]);
  const [reasonsErr, setReasonsErr] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchAbsenceReasons()
      .then((r) => { if (alive) setReasons(r.reasons ?? []); })
      .catch((e) => { if (alive) setReasonsErr(e instanceof Error ? e.message : 'Fehler'); });
    return () => { alive = false; };
  }, []);

  // Changing the start keeps the end on the SAME day (absences default to one
  // day) and never before the start — you can only extend the end later.
  function changeStart(newStart: string) {
    setStart(newStart);
    const sp = dtToParts(newStart);
    const ep = dtToParts(end);
    if (sp && ep) {
      setEnd(`${sp.ymd}${ep.hhmm}` >= `${sp.ymd}${sp.hhmm}` ? partsToDt(sp.ymd, ep.hhmm) : newStart);
    }
  }

  function applyRange(r: PickedRange) {
    setStart(partsToDt(r.startDate, r.startTime));
    setEnd(partsToDt(r.endDate, r.endTime));
    setView('form');
  }

  async function submit() {
    if (submitting) return;
    const sp = dtToParts(start);
    const ep = dtToParts(end);
    if (!sp || !ep) { setError('Bitte Start und Ende wählen.'); return; }
    if (`${ep.ymd}${ep.hhmm}` < `${sp.ymd}${sp.hhmm}`) { setError('Ende muss nach dem Start liegen.'); return; }
    if (!reason) { setError('Bitte einen Abwesenheitsgrund wählen.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await createAbsence({
        startDate: sp.ymd,
        endDate: ep.ymd,
        startTime: sp.hhmm,
        endTime: ep.hhmm,
        reasonId: reason.id,
        text: text.trim(),
      });
      setSuccess(true);
      setTimeout(() => { onCreated(); onClose(); }, 950);
    } catch {
      setError('Die Abwesenheit konnte nicht gespeichert werden. Bitte versuche es später erneut.');
      setSubmitting(false);
    }
  }

  // ── Sub-views ────────────────────────────────────────────────────────────────
  if (view === 'start') {
    return <DateTimePicker value={start} onChange={changeStart} onBack={() => setView('form')} />;
  }
  if (view === 'end') {
    return <DateTimePicker value={end} onChange={setEnd} onBack={() => setView('form')} minDateTime={start} />;
  }
  if (view === 'reason') {
    return (
      <ReasonPicker
        reasons={reasons}
        value={reason?.id ?? null}
        onSelect={(r) => { setReason(r); setView('form'); }}
        onBack={() => setView('form')}
      />
    );
  }
  if (view === 'timetable') {
    const sp = dtToParts(start);
    const initial = sp ? new Date(`${partsToDt(sp.ymd, sp.hhmm)}`) : new Date();
    return <TimetableLessonPicker initialDate={initial} onConfirm={applyRange} onBack={() => setView('form')} />;
  }

  // ── Main form ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center sm:px-4 sm:py-8"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[94dvh] sm:max-h-[90dvh] overflow-hidden flex flex-col rounded-t-[28px] sm:rounded-[28px] slide-up"
        style={{ background: 'var(--app-surface)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full press-scale"
            style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)' }}
            aria-label="Schließen"
          >
            <X size={18} />
          </button>
          <h3 className="text-[16px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
            Abwesenheit melden
          </h3>
          <button
            onClick={submit}
            disabled={submitting || success}
            className="w-9 h-9 flex items-center justify-center rounded-full press-scale disabled:opacity-50"
            style={{ background: success ? 'var(--tint)' : 'var(--accent)', color: '#fff' }}
            aria-label="Bestätigen"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          {/* Person */}
          <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: 'var(--app-card)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--app-text-tertiary)' }}>
              Schüler/in
            </p>
            <p className="text-[15px] font-medium" style={{ color: 'var(--app-text-primary)' }}>
              {personName || 'Ich'}
            </p>
          </div>

          {/* Start / End */}
          <div className="rounded-2xl overflow-hidden mb-3" style={{ background: 'var(--app-card)' }}>
            <Row label="Start" value={displayDt(start)} onClick={() => setView('start')} />
            <Separator />
            <Row label="Ende" value={displayDt(end)} onClick={() => setView('end')} />
          </div>

          {/* From timetable */}
          <button
            onClick={() => setView('timetable')}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl press-scale mb-3 text-[14px] font-medium"
            style={{ background: 'color-mix(in srgb, var(--accent) 12%, var(--app-card))', color: 'var(--accent)' }}
          >
            <CalendarClock size={16} />
            Aus Stundenplan wählen
          </button>

          {/* Reason */}
          <div className="rounded-2xl overflow-hidden mb-3" style={{ background: 'var(--app-card)' }}>
            <Row
              label="Abwesenheitsgrund"
              value={reason?.name ?? (reasonsErr ? 'Nicht verfügbar' : 'Wählen')}
              valueColor={reason ? undefined : 'var(--app-text-tertiary)'}
              onClick={() => { if (reasons.length) setView('reason'); }}
              disabled={!reasons.length}
            />
          </div>

          {/* Text */}
          <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: 'var(--app-card)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--app-text-tertiary)' }}>
              Text (optional)
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Text hier eingeben"
              rows={3}
              maxLength={1000}
              className="w-full bg-transparent outline-none resize-none text-[15px]"
              style={{ color: 'var(--app-text-primary)' }}
            />
          </div>

          {reasonsErr && (
            <p className="text-[12px] px-1 mb-2" style={{ color: 'var(--warning)' }}>
              Abwesenheitsgründe konnten gerade nicht geladen werden. Bitte versuche es später erneut.
            </p>
          )}
          {error && (
            <div className="rounded-xl px-4 py-3 text-[13px]" style={{ background: 'color-mix(in srgb, var(--danger) 12%, var(--app-card))', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl px-4 py-3 text-[13px] flex items-center gap-2" style={{ background: 'color-mix(in srgb, var(--tint) 14%, var(--app-card))', color: 'var(--tint)' }}>
              <Check size={16} /> Abwesenheit gemeldet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label, value, onClick, valueColor, disabled,
}: { label: string; value: string; onClick: () => void; valueColor?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 press-scale disabled:opacity-60 text-left"
    >
      <span className="text-[15px] font-medium flex-shrink-0" style={{ color: 'var(--app-text-primary)' }}>
        {label}
      </span>
      <span className="flex items-center gap-1 min-w-0">
        <span className="text-[14px] truncate" style={{ color: valueColor ?? 'var(--app-text-secondary)' }}>
          {value}
        </span>
        <ChevronRight size={16} color="var(--app-text-tertiary)" className="flex-shrink-0" />
      </span>
    </button>
  );
}

function Separator() {
  return <div style={{ height: 1, background: 'var(--app-separator)', marginLeft: 16 }} />;
}
