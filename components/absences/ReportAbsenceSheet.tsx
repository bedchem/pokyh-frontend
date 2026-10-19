'use client';

import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { CalendarBlank, CalendarCheck, CaretRight, Check, ListBullets, PaperPlaneTilt, Table } from '@phosphor-icons/react';
import { DateTimeFields } from '@/components/ui/DateTimePicker';
import ReasonList from './ReasonList';
import TimetableLessonPicker, { dateToStr, lessonsForDate, type PickedRange } from './TimetableLessonPicker';
import Sheet from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { TextArea, FormStatus } from '@/components/ui/Field';
import { initialsOf } from '@/components/app/hooks';
import { fetchAbsenceMeta, fetchAbsenceReasons, createAbsence, fetchTimetable } from '@/lib/api';
import type { AbsenceReason } from '@/lib/types';
import { useDateLocale, useT } from '@/providers/LocaleProvider';
import { absencesDict } from '@/lib/i18n/dictionaries/absences';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { formatDate } from '@/lib/i18n/dateLocale';

// "Abwesenheit melden", built like "Mitteilung an Lehrkraft": who, from when
// to when, the reason and a text as labelled fields; the start, the end, the
// lessons of a day and the reasons are steps inside the same sheet (back arrow,
// their own button below); the send button stays pinned under the form, and a
// confirmation ends it. Reasons, the default reason and the default range come
// from WebUntis' own report dialog (absences/meta), so no school's hours are
// built in; without them the range starts on today's first and last lesson
// from the timetable, or empty.

interface Props {
  personName?: string | null;
  onClose: () => void;
  onCreated: () => void;
}

type View = 'form' | 'start' | 'end' | 'reason' | 'lessons';

// "YYYY-MM-DDTHH:MM" → { ymd: "YYYYMMDD", hhmm: "HHMM" }
function dtToParts(dt: string): { ymd: string; hhmm: string } | null {
  const m = dt.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  return { ymd: `${m[1]}${m[2]}${m[3]}`, hhmm: `${m[4]}${m[5]}` };
}
function partsToDt(ymd: string, hhmm: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
}

/** A field that opens a step: icon tile, value (or what to do), caret. */
function StepField({ id, label, value, placeholder, icon, invalid, onOpen, disabled, describedBy, buttonRef }: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  icon: ReactNode;
  invalid?: boolean;
  onOpen: () => void;
  disabled?: boolean;
  describedBy?: string;
  /** Where focus returns after the step. */
  buttonRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={`${id}-label`} className="text-[14px] font-semibold text-ink">{label}</span>
      <button
        ref={buttonRef}
        type="button"
        onClick={onOpen}
        disabled={disabled}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={describedBy}
        data-invalid={invalid ? true : undefined}
        className="flex min-h-14 w-full items-center gap-3 rounded-[14px] bg-inset px-3 py-2 text-left outline-none transition-[box-shadow,background-color] hover:bg-[color-mix(in_srgb,var(--inset)_86%,var(--ink))] focus-visible:shadow-[0_0_0_2px_var(--accent)] data-[invalid=true]:shadow-[0_0_0_2px_var(--danger)] disabled:opacity-60"
      >
        <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-full ${value ? 'bg-periwinkle text-periwinkle-ink' : 'bg-surface text-ink-2'}`}>
          {icon}
        </span>
        <span id={`${id}-value`} className={`min-w-0 flex-1 truncate text-[15.5px] ${value ? 'font-medium text-ink' : 'text-ink-3'}`}>
          {value || placeholder}
        </span>
        <CaretRight size={18} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3" />
      </button>
    </div>
  );
}

export default function ReportAbsenceSheet({ personName, onClose, onCreated }: Props) {
  const t = useT(absencesDict);
  const tc = useT(commonDict);
  const { tag } = useDateLocale();
  const formId = useId();
  const [view, setView] = useState<View>('form');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState<AbsenceReason | null>(null);
  const [text, setText] = useState('');

  const [reasons, setReasons] = useState<AbsenceReason[] | null>(null);
  const [reasonsFailed, setReasonsFailed] = useState(false);

  // What a step has chosen so far, taken over with its button.
  const [stepValue, setStepValue] = useState<string | null>(null);
  const [lessonRange, setLessonRange] = useState<{ range: PickedRange | null; count: number }>({ range: null, count: 0 });

  const [errors, setErrors] = useState<{ range?: string; reason?: string }>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const opener = useRef<Partial<Record<View, HTMLButtonElement | null>>>({});

  useEffect(() => {
    let alive = true;
    // WebUntis sends times as HHMM (750) or as minutes since midnight (470);
    // a value whose last two digits exceed 59 can only be minutes.
    const hhmm = (n: number) => {
      const mins = n > 2359 || n % 100 > 59 ? n : Math.floor(n / 100) * 60 + (n % 100);
      return `${String(Math.floor(mins / 60)).padStart(2, '0')}${String(mins % 60).padStart(2, '0')}`;
    };
    // Today's lessons: their first start and last end, when WebUntis gives no default range.
    const fromTimetable = () => {
      const today = dateToStr(new Date());
      fetchTimetable(today)
        .then((res) => {
          if (!alive) return;
          const lessons = lessonsForDate(res, today, '').filter((l) => !l.cancelled);
          if (!lessons.length) return;
          const ymd = today.replace(/-/g, '');
          setStart((s) => s || partsToDt(ymd, lessons[0].startHHMM.replace(':', '')));
          setEnd((e) => e || partsToDt(ymd, lessons[lessons.length - 1].endHHMM.replace(':', '')));
        })
        .catch(() => { /* no range to begin with: the fields ask for one */ });
    };
    fetchAbsenceMeta()
      .then((m) => {
        if (!alive) return;
        const list = m.reasons ?? [];
        setReasons(list);
        const preset = list.find((r) => r.id === m.defaultReasonId);
        if (preset) setReason((r) => r ?? preset);
        if (m.defaultDate && m.defaultStartTime != null && m.defaultEndTime != null && /^\d{8}$/.test(String(m.defaultDate))) {
          const ymd = String(m.defaultDate);
          setStart((s) => s || partsToDt(ymd, hhmm(m.defaultStartTime!)));
          setEnd((e) => e || partsToDt(ymd, hhmm(m.defaultEndTime!)));
        } else fromTimetable();
      })
      .catch(() => {
        fromTimetable();
        fetchAbsenceReasons()
          .then((r) => { if (alive) setReasons(r.reasons ?? []); })
          .catch(() => { if (alive) { setReasons([]); setReasonsFailed(true); } });
      });
    return () => { alive = false; };
  }, []);

  const onLessons = useCallback((range: PickedRange | null, count: number) => setLessonRange({ range, count }), []);

  const open = (next: View) => {
    setStepValue(null);
    setView(next);
  };
  const backToForm = useCallback(() => {
    const from = view;
    setView('form');
    requestAnimationFrame(() => opener.current[from]?.focus());
  }, [view]);

  // Changing the start keeps the end on the SAME day (absences default to one
  // day) and never before the start; the end can only be extended later.
  function changeStart(newStart: string) {
    setStart(newStart);
    const sp = dtToParts(newStart);
    const ep = dtToParts(end);
    if (sp && ep) setEnd(`${sp.ymd}${ep.hhmm}` >= `${sp.ymd}${sp.hhmm}` ? partsToDt(sp.ymd, ep.hhmm) : newStart);
    else if (sp) setEnd(newStart);
  }

  function applyStep() {
    if (view === 'start' && stepValue) changeStart(stepValue);
    if (view === 'end' && stepValue) setEnd(stepValue);
    if (view === 'lessons' && lessonRange.range) {
      const r = lessonRange.range;
      setStart(partsToDt(r.startDate, r.startTime));
      setEnd(partsToDt(r.endDate, r.endTime));
    }
    setErrors((e) => ({ ...e, range: undefined }));
    backToForm();
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (submitting || done) return;
    const sp = dtToParts(start);
    const ep = dtToParts(end);
    const next = {
      range: !sp || !ep ? t('errChooseRange') : `${ep.ymd}${ep.hhmm}` < `${sp.ymd}${sp.hhmm}` ? t('errEndAfterStart') : undefined,
      reason: !reason ? t('errChooseReason') : undefined,
    };
    setErrors(next);
    setError('');
    if (next.range || next.reason || !sp || !ep || !reason) return;

    setSubmitting(true);
    try {
      await createAbsence({ startDate: sp.ymd, endDate: ep.ymd, startTime: sp.hhmm, endTime: ep.hhmm, reasonId: reason.id, text: text.trim() });
      setDone(true);
      setTimeout(() => { onCreated(); onClose(); }, 1200);
    } catch (err) {
      // WebUntis' own reason (e.g. an overlapping absence) when it gives one.
      const msg = err instanceof Error ? err.message : '';
      setError(msg && msg !== 'session_expired' && !/^HTTP \d+$/.test(msg) ? msg : t('errSave'));
    } finally {
      setSubmitting(false);
    }
  }

  const show = (dt: string) => {
    const p = dtToParts(dt);
    if (!p) return '';
    const d = new Date(+p.ymd.slice(0, 4), +p.ymd.slice(4, 6) - 1, +p.ymd.slice(6, 8));
    return `${formatDate(d, tag, { weekday: 'short', day: 'numeric', month: 'short' })} · ${p.hhmm.slice(0, 2)}:${p.hhmm.slice(2)}`;
  };
  const sameDay = dtToParts(start)?.ymd === dtToParts(end)?.ymd;

  const title = view === 'start' ? t('start') : view === 'end' ? t('end') : view === 'reason' ? t('reasonTitle') : view === 'lessons' ? t('fromTimetable') : t('report');
  // Every step has its own button (key): React must not turn the button just
  // clicked into the form's submit button while the click is still running,
  // or "Übernehmen" would also send the report.
  const footer = done ? undefined
    : view === 'form' ? (
      <Button key="send" type="submit" form={formId} disabled={submitting} className="w-full">
        {submitting
          ? <span aria-hidden="true" className="size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent" />
          : <PaperPlaneTilt size={18} weight="bold" aria-hidden="true" />}
        {t('report')}
      </Button>
    ) : view === 'start' || view === 'end' ? (
      <Button key={`apply-${view}`} onClick={applyStep} disabled={!stepValue} className="w-full">{t('apply')}</Button>
    ) : view === 'lessons' ? (
      <Button key="apply-lessons" onClick={applyStep} disabled={!lessonRange.range} className="w-full">
        {lessonRange.count > 1 ? t('takeLessons', { n: lessonRange.count }) : lessonRange.count === 1 ? t('takeLesson') : t('chooseLessons')}
      </Button>
    ) : undefined;

  return (
    <Sheet
      open
      onClose={view === 'form' ? onClose : backToForm}
      onBack={view === 'form' ? undefined : backToForm}
      backLabel={tc('back')}
      title={title}
      closeLabel={tc('close')}
      footer={footer}
    >
      {done ? (
        <div role="status" className="rise flex flex-col items-center px-2 pb-6 pt-6 text-center">
          <span className="grid size-16 place-items-center rounded-[20px] bg-sage text-sage-ink">
            <Check size={30} weight="bold" aria-hidden="true" />
          </span>
          <p className="mt-5 text-[19px] font-extrabold tracking-[-0.02em]">{t('reported')}</p>
          <p className="mt-1 max-w-[36ch] text-[15px] text-ink-2 first-letter:uppercase">
            {sameDay ? `${show(start)} – ${end.slice(11)}` : `${show(start)} – ${show(end)}`}
          </p>
        </div>
      ) : view === 'start' ? (
        <DateTimeFields key="start" value={start} onValid={setStepValue} />
      ) : view === 'end' ? (
        <DateTimeFields key="end" value={end} minDateTime={start || undefined} onValid={setStepValue} />
      ) : view === 'lessons' ? (
        <TimetableLessonPicker
          initialDate={dtToParts(start) ? new Date(start) : undefined}
          onChange={onLessons}
        />
      ) : view === 'reason' ? (
        <ReasonList
          reasons={reasons}
          value={reason?.id ?? null}
          label={t('reasonTitle')}
          onSelect={(r) => { setReason(r); setErrors((e) => ({ ...e, reason: undefined })); backToForm(); }}
        />
      ) : (
        <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-5 pb-1">
          <div className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold text-ink">{t('forLabel')}</span>
            <div className="flex min-h-14 items-center gap-3 rounded-[14px] bg-inset px-3 py-2">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-periwinkle text-[12.5px] font-bold text-periwinkle-ink">
                {initialsOf(personName || t('me'))}
              </span>
              <span className="min-w-0 truncate text-[16px] font-medium text-ink">{personName || t('me')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <StepField
                  id={`${formId}-start`}
                  label={t('start')}
                  value={show(start)}
                  placeholder={t('chooseStart')}
                  icon={<CalendarBlank size={18} weight="bold" />}
                  invalid={!!errors.range}
                  describedBy={errors.range ? `${formId}-range-err` : undefined}
                  onOpen={() => open('start')}
                  buttonRef={(el) => { opener.current.start = el; }}
                  disabled={submitting}
                />
              </div>
              <div>
                <StepField
                  id={`${formId}-end`}
                  label={t('end')}
                  value={show(end)}
                  placeholder={t('chooseEnd')}
                  icon={<CalendarCheck size={18} weight="bold" />}
                  invalid={!!errors.range}
                  describedBy={errors.range ? `${formId}-range-err` : undefined}
                  onOpen={() => open('end')}
                  buttonRef={(el) => { opener.current.end = el; }}
                  disabled={submitting}
                />
              </div>
            </div>
            {errors.range && <p id={`${formId}-range-err`} className="text-[13px] font-medium text-danger-ink">{errors.range}</p>}
            <Button
              variant="quiet"
              size="sm"
              ref={(el: HTMLButtonElement | null) => { opener.current.lessons = el; }}
              onClick={() => open('lessons')}
              disabled={submitting}
              className="self-start"
            >
              <Table size={16} weight="bold" aria-hidden="true" />
              {t('fromTimetable')}
            </Button>
          </div>

          <div>
            <StepField
              id={`${formId}-reason`}
              label={t('reasonTitle')}
              value={reason?.name ?? ''}
              placeholder={reasonsFailed ? t('unavailable') : reasons === null ? '…' : t('chooseReason')}
              icon={<ListBullets size={18} weight="bold" />}
              invalid={!!errors.reason}
              describedBy={errors.reason ? `${formId}-reason-err` : undefined}
              onOpen={() => open('reason')}
              buttonRef={(el) => { opener.current.reason = el; }}
              disabled={submitting || reasonsFailed}
            />
            {errors.reason && <p id={`${formId}-reason-err`} className="mt-1.5 text-[13px] font-medium text-danger-ink">{errors.reason}</p>}
            {reasonsFailed && <p className="mt-1.5 text-[13px] text-ink-2">{t('reasonsLoadFailed')}</p>}
          </div>

          <TextArea
            label={t('textOptional')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('textPlaceholder')}
            rows={3}
            maxLength={1000}
            disabled={submitting}
          />

          {error && <FormStatus kind="error">{error}</FormStatus>}
        </form>
      )}
    </Sheet>
  );
}
