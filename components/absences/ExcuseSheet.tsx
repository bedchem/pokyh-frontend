'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CaretRight, Check, FloppyDisk, ListBullets, UserMinus } from '@phosphor-icons/react';
import { useT } from '@/providers/LocaleProvider';
import { untisActionsDict } from '@/lib/i18n/dictionaries/untisActions';
import { absencesDict } from '@/lib/i18n/dictionaries/absences';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { excuseAbsence, fetchAbsenceMeta } from '@/lib/api';
import type { AbsenceReason } from '@/lib/types';
import Sheet from '@/components/ui/Sheet';
import { TextArea, FormStatus } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import ReasonList from './ReasonList';

// Reason and note for existing absences, saved in WebUntis (students cannot set
// the excuse status; the school does). Built like "Mitteilung an Lehrkraft":
// the absence on top, the reason as a field whose list is a second step in the
// same sheet, the note, the save button pinned below, a confirmation at the
// end. Reports success only when WebUntis did.
export default function ExcuseSheet({
  absenceIds,
  summary,
  onClose,
  onSaved,
}: {
  absenceIds: number[];
  /** The absence in words ("Mittwoch, 17. Dezember · 07:50 – 13:05"). */
  summary?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT(untisActionsDict);
  const ta = useT(absencesDict);
  const tc = useT(commonDict);
  const formId = useId();
  const [view, setView] = useState<'form' | 'reasons'>('form');
  const [reasons, setReasons] = useState<AbsenceReason[] | null>(null);
  const [reasonId, setReasonId] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reasonError, setReasonError] = useState(false);
  const [done, setDone] = useState(false);
  const reasonButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let alive = true;
    fetchAbsenceMeta()
      .then((m) => {
        if (!alive) return;
        const list = m.reasons ?? [];
        setReasons(list);
        if (m.defaultReasonId != null && list.some((r) => r.id === m.defaultReasonId)) setReasonId(m.defaultReasonId);
      })
      .catch(() => { if (alive) setReasons([]); });
    return () => { alive = false; };
  }, []);

  const chosen = reasons?.find((r) => r.id === reasonId) ?? null;

  const backToForm = () => {
    setView('form');
    requestAnimationFrame(() => reasonButton.current?.focus());
  };

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (busy || done) return;
    if (reasonId == null) {
      setReasonError(true);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await excuseAbsence(absenceIds, reasonId, text.trim());
      setDone(true);
      onSaved();
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error && err.message && err.message !== 'session_expired' && !/^HTTP \d/.test(err.message) ? err.message : t('failed'));
    } finally {
      setBusy(false);
    }
  }

  const footer = done || view === 'reasons' ? undefined : (
    <Button type="submit" form={formId} disabled={busy} className="w-full">
      {busy
        ? <span aria-hidden="true" className="size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent" />
        : <FloppyDisk size={18} weight="bold" aria-hidden="true" />}
      {busy ? t('exSaving') : t('exSave')}
    </Button>
  );

  return (
    <Sheet
      open
      onClose={view === 'reasons' ? backToForm : onClose}
      onBack={view === 'reasons' ? backToForm : undefined}
      backLabel={tc('back')}
      title={view === 'reasons' ? ta('reasonTitle') : t('exTitle')}
      closeLabel={t('close')}
      footer={footer}
    >
      {done ? (
        <div role="status" className="rise flex flex-col items-center px-2 pb-6 pt-6 text-center">
          <span className="grid size-16 place-items-center rounded-[20px] bg-sage text-sage-ink">
            <Check size={30} weight="bold" aria-hidden="true" />
          </span>
          <p className="mt-5 text-[19px] font-extrabold tracking-[-0.02em]">{t('exDone')}</p>
          {chosen && <p className="mt-1 max-w-[36ch] text-[15px] text-ink-2">{chosen.name}</p>}
        </div>
      ) : view === 'reasons' ? (
        <ReasonList
          reasons={reasons}
          value={reasonId}
          label={t('exReason')}
          onSelect={(r) => { setReasonId(r.id); setReasonError(false); backToForm(); }}
        />
      ) : (
        <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-5 pb-1">
          {summary && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[14px] font-semibold text-ink">{t('exAbsence')}</span>
              <div className="flex min-h-14 items-center gap-3 rounded-[14px] bg-inset px-3 py-2">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-blush text-blush-ink">
                  <UserMinus size={18} weight="bold" />
                </span>
                <span className="min-w-0 text-[15.5px] font-medium text-ink first-letter:uppercase">{summary}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span id={`${formId}-reason`} className="text-[14px] font-semibold text-ink">{t('exReason')}</span>
            <button
              ref={reasonButton}
              type="button"
              onClick={() => setView('reasons')}
              disabled={busy}
              aria-labelledby={`${formId}-reason ${formId}-reason-value`}
              aria-describedby={reasonError ? `${formId}-reason-err` : undefined}
              data-invalid={reasonError ? true : undefined}
              className="flex min-h-14 w-full items-center gap-3 rounded-[14px] bg-inset px-3 py-2 text-left outline-none transition-[box-shadow,background-color] hover:bg-[color-mix(in_srgb,var(--inset)_86%,var(--ink))] focus-visible:shadow-[0_0_0_2px_var(--accent)] data-[invalid=true]:shadow-[0_0_0_2px_var(--danger)] disabled:opacity-60"
            >
              <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-full ${chosen ? 'bg-periwinkle text-periwinkle-ink' : 'bg-surface text-ink-2'}`}>
                <ListBullets size={18} weight="bold" />
              </span>
              <span id={`${formId}-reason-value`} className={`min-w-0 flex-1 truncate text-[16px] ${chosen ? 'font-medium text-ink' : 'text-ink-3'}`}>
                {chosen ? chosen.name : reasons === null ? '…' : t('exChoose')}
              </span>
              <CaretRight size={18} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3" />
            </button>
            {reasonError && <p id={`${formId}-reason-err`} className="text-[13px] font-medium text-danger-ink">{t('exPick')}</p>}
          </div>

          <TextArea label={t('exNote')} value={text} maxLength={1000} rows={4} disabled={busy} onChange={(e) => setText(e.target.value)} />

          <p className="text-[13px] leading-[1.55] text-ink-2">{t('exLead')}</p>

          {error && <FormStatus kind="error">{error}</FormStatus>}
        </form>
      )}
    </Sheet>
  );
}
