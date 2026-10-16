'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useT } from '@/providers/LocaleProvider';
import { untisActionsDict } from '@/lib/i18n/dictionaries/untisActions';
import { excuseAbsence, fetchAbsenceMeta } from '@/lib/api';
import type { AbsenceReason } from '@/lib/types';
import Sheet from '@/components/ui/Sheet';
import { TextArea, FormStatus } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

// Reason and note for existing absences, saved in WebUntis (students cannot set
// the excuse status; the school does). Reports success only when WebUntis did.
export default function ExcuseSheet({
  absenceIds,
  onClose,
  onSaved,
}: {
  absenceIds: number[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT(untisActionsDict);
  const [reasons, setReasons] = useState<AbsenceReason[] | null>(null);
  const [reasonId, setReasonId] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    fetchAbsenceMeta()
      .then((m) => {
        if (!alive) return;
        setReasons(m.reasons);
        if (m.defaultReasonId != null && m.reasons.some((r) => r.id === m.defaultReasonId)) setReasonId(m.defaultReasonId);
      })
      .catch(() => { if (alive) setReasons([]); });
    return () => { alive = false; };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (reasonId == null) {
      setStatus({ kind: 'error', text: t('exPick') });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await excuseAbsence(absenceIds, reasonId, text.trim());
      setStatus({ kind: 'success', text: t('exDone') });
      onSaved();
      setTimeout(onClose, 900);
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error && err.message && err.message !== 'session_expired' ? err.message : t('failed') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open onClose={onClose} title={t('exTitle')} description={t('exLead')} closeLabel={t('close')}>
      <form onSubmit={submit} className="flex flex-col gap-5 pb-2">
        <fieldset>
          <legend className="text-[14px] font-semibold text-ink">{t('exReason')}</legend>
          {reasons === null ? (
            <div className="mt-3 flex flex-col gap-2" aria-busy="true">
              {[0, 1, 2].map((i) => <span key={i} className="skeleton h-11 rounded-[14px]" />)}
            </div>
          ) : (
            <div className="mt-2 flex flex-col">
              {reasons.map((r) => (
                <label key={r.id} className="flex cursor-pointer items-center gap-3 border-t border-line py-3 first:border-t-0">
                  <input
                    type="radio"
                    name="reason"
                    value={r.id}
                    checked={reasonId === r.id}
                    onChange={() => setReasonId(r.id)}
                    className="size-5 accent-[var(--accent)]"
                  />
                  <span className="text-[16px] text-ink">{r.name}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <TextArea label={t('exNote')} value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} />
        {status && <FormStatus kind={status.kind}>{status.text}</FormStatus>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy || reasonId == null || status?.kind === 'success'}>
            {busy ? t('exSaving') : t('exSave')}
          </Button>
          <Button variant="quiet" onClick={onClose}>{t('cancel')}</Button>
        </div>
      </form>
    </Sheet>
  );
}
