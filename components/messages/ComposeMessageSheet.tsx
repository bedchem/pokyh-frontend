'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CaretRight, Check, FileText, FloppyDisk, Paperclip, PaperPlaneTilt, UserPlus, X } from '@phosphor-icons/react';
import RecipientPicker from './RecipientPicker';
import Sheet from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { TextArea, TextField, FormStatus } from '@/components/ui/Field';
import { fetchRecipients, sendMessage, saveDraft, deleteDraft, sendReply } from '@/lib/api';
import { untisActionsDict } from '@/lib/i18n/dictionaries/untisActions';
import type { MessageRecipient } from '@/lib/types';
import { useT } from '@/providers/LocaleProvider';
import { messagesDict } from '@/lib/i18n/dictionaries/messages';
import { commonDict } from '@/lib/i18n/dictionaries/common';

export interface ComposeInitial {
  draftId?: number;
  subject?: string;
  content?: string;
  recipients?: { id: number; type: string; name: string }[];
  attachments?: { id: string; name: string }[];
}

interface Props {
  onClose: () => void;
  onSent?: () => void;
  initial?: ComposeInitial;
  /** Reply to a received message (POST /v2/messages/{id}/reply); the recipient is fixed. */
  reply?: { messageId: number; subject: string; recipientName: string };
}

type View = 'form' | 'recipients';
type FieldErrors = { to?: string; subject?: string; text?: string };

// Prefer WebUntis' own German error text; fall back to a friendly default for
// technical/opaque errors (network, HTTP codes, session handling).
function errMessage(e: unknown, fallback: string): string {
  const m = e instanceof Error ? e.message : '';
  if (!m || m === 'session_expired' || /^HTTP \d/.test(m) || /^Failed to fetch/i.test(m)) return fallback;
  return m;
}

function initialsOf(name: string): string {
  const parts = name.replace(/[(),]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Compose a new message to teacher(s) (modelled on WebUntis "Mitteilung an Lehrkraft").
// The recipient choice is a second step inside the same sheet. When `initial`
// carries a draftId the sheet opens in edit mode: saving updates the draft in
// place, sending creates the message and removes the old draft.
export default function ComposeMessageSheet({ onClose, onSent, initial, reply }: Props) {
  const t = useT(messagesDict);
  const ta = useT(untisActionsDict);
  const tc = useT(commonDict);
  const formId = useId();
  // WebUntis takes exactly one teacher per message for the TEACHER option.
  const [single, setSingle] = useState(true);
  const [view, setView] = useState<View>('form');
  const [recipients, setRecipients] = useState<MessageRecipient[] | null>(null);
  const [recipientsFailed, setRecipientsFailed] = useState(false);
  const [selected, setSelected] = useState<MessageRecipient[]>(
    (initial?.recipients ?? []).map((r) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      initials: initialsOf(r.name),
      category: 'other' as const,
    })),
  );
  const [subject, setSubject] = useState(reply?.subject ?? initial?.subject ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [files, setFiles] = useState<File[]>([]);
  // Attachments already stored on the draft (kept automatically when re-saving).
  const [existingAttachments] = useState(initial?.attachments ?? []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toButton = useRef<HTMLButtonElement>(null);
  const draftId = initial?.draftId;

  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [done, setDone] = useState<'sent' | 'draft' | null>(null);
  const busy = sending || savingDraft || done !== null;

  useEffect(() => {
    if (reply) return;
    let alive = true;
    fetchRecipients()
      .then((r) => {
        if (!alive) return;
        setRecipients(r.recipients ?? []);
        const one = r.single !== false;
        setSingle(one);
        if (one) setSelected((prev) => prev.slice(0, 1));
      })
      .catch(() => { if (alive) setRecipientsFailed(true); });
    return () => { alive = false; };
  }, [reply]);

  // Back on the form, focus returns to the recipient field that opened the list.
  const backToForm = () => {
    setView('form');
    requestAnimationFrame(() => toButton.current?.focus());
  };

  function toggle(r: MessageRecipient) {
    setErrors((e) => ({ ...e, to: undefined }));
    if (single) {
      setSelected((prev) => (prev.some((x) => x.id === r.id) ? [] : [r]));
      backToForm();
      return;
    }
    setSelected((prev) =>
      prev.some((x) => x.id === r.id && x.type === r.type)
        ? prev.filter((x) => !(x.id === r.id && x.type === r.type))
        : [...prev, r],
    );
  }

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      return [...prev, ...incoming.filter((f) => !seen.has(`${f.name}:${f.size}`))];
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function finish(kind: 'sent' | 'draft') {
    setDone(kind);
    setTimeout(() => { onSent?.(); onClose(); }, 1200);
  }

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (busy) return;
    const next: FieldErrors = {
      to: !reply && selected.length === 0 ? t('errPickTeacher') : undefined,
      subject: !subject.trim() ? t('errSubject') : undefined,
      text: !content.trim() ? t('errText') : undefined,
    };
    setErrors(next);
    setError('');
    if (next.to || next.subject || next.text) return;

    setSending(true);
    try {
      if (reply) {
        await sendReply(reply.messageId, { subject: subject.trim(), content: content.trim(), files });
      } else {
        await sendMessage({
          recipients: selected.map((r) => ({ id: r.id, type: r.type })),
          subject: subject.trim(),
          content: content.trim(),
          files,
        });
      }
      // The message is sent: remove the source draft if we were editing one.
      if (draftId != null) { try { await deleteDraft(draftId); } catch { /* best-effort */ } }
      finish('sent');
    } catch (err) {
      setError(errMessage(err, t('errSend')));
    } finally {
      setSending(false);
    }
  }

  async function storeDraft() {
    if (busy) return;
    if (!subject.trim() && !content.trim() && selected.length === 0 && files.length === 0 && existingAttachments.length === 0) {
      setError(t('errDraftEmpty'));
      return;
    }
    setSavingDraft(true);
    setErrors({});
    setError('');
    try {
      await saveDraft({
        recipients: selected.map((r) => ({ id: r.id, type: r.type })),
        subject: subject.trim(),
        content: content.trim(),
        files,
        draftId, // update in place when editing → keeps existing attachments
      });
      finish('draft');
    } catch (err) {
      setError(errMessage(err, t('errDraftSave')));
    } finally {
      setSavingDraft(false);
    }
  }

  const recipientNames = reply ? reply.recipientName : selected.map((r) => r.name).join(', ');
  const title = view === 'recipients' ? t('recipients') : reply ? ta('reply') : draftId != null ? t('editDraft') : t('composeTitle');

  const footer =
    done ? undefined : view === 'recipients' ? (
      !single && (
        <Button onClick={backToForm} className="w-full">
          {t('done')}{selected.length ? ` (${selected.length})` : ''}
        </Button>
      )
    ) : (
      <div className="flex gap-2.5">
        {!reply && (
          <Button variant="quiet" onClick={storeDraft} disabled={busy} aria-label={t('saveDraft')} className="shrink-0">
            {savingDraft
              ? <span aria-hidden="true" className="size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent" />
              : <FloppyDisk size={18} weight="bold" aria-hidden="true" />}
            <span className="hidden sm:inline">{t('saveDraft')}</span>
          </Button>
        )}
        <Button type="submit" form={formId} disabled={busy} className="flex-1">
          {sending
            ? <span aria-hidden="true" className="size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent" />
            : <PaperPlaneTilt size={18} weight="bold" aria-hidden="true" />}
          {t('send')}
        </Button>
      </div>
    );

  return (
    <Sheet
      open
      // On the recipient step, Escape and the backdrop lead back to the form.
      onClose={view === 'recipients' ? backToForm : onClose}
      onBack={view === 'recipients' ? backToForm : undefined}
      backLabel={tc('back')}
      title={title}
      closeLabel={tc('close')}
      footer={footer || undefined}
    >
      {done ? (
        <div role="status" className="rise flex flex-col items-center px-2 pb-6 pt-6 text-center">
          <span className="grid size-16 place-items-center rounded-[20px] bg-sage text-sage-ink">
            <Check size={30} weight="bold" aria-hidden="true" />
          </span>
          <p className="mt-5 text-[19px] font-extrabold tracking-[-0.02em]">{done === 'sent' ? t('messageSent') : t('draftSaved')}</p>
          {recipientNames && <p className="mt-1 max-w-[36ch] text-[15px] text-ink-2">{t('to', { names: recipientNames })}</p>}
        </div>
      ) : view === 'recipients' ? (
        <RecipientPicker
          recipients={recipients}
          failed={recipientsFailed}
          selectedIds={selected.map((r) => r.id)}
          single={single}
          onToggle={toggle}
        />
      ) : (
        <form id={formId} onSubmit={send} noValidate className="flex flex-col gap-5 pb-1">
          {/* Recipient */}
          <div className="flex flex-col gap-1.5">
            <span id={`${formId}-to`} className="text-[14px] font-semibold text-ink">{t('toLabel')}</span>
            {reply ? (
              <div className="flex min-h-14 items-center gap-3 rounded-[14px] bg-inset px-3 py-2">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-periwinkle text-[12.5px] font-bold text-periwinkle-ink">
                  {initialsOf(reply.recipientName)}
                </span>
                <span className="min-w-0 truncate text-[16px] font-medium text-ink">{reply.recipientName}</span>
              </div>
            ) : (
              <button
                ref={toButton}
                type="button"
                onClick={() => setView('recipients')}
                disabled={busy}
                aria-labelledby={`${formId}-to ${formId}-to-value`}
                data-invalid={errors.to ? true : undefined}
                aria-describedby={errors.to ? `${formId}-to-err` : undefined}
                className="flex min-h-14 w-full items-center gap-3 rounded-[14px] bg-inset px-3 py-2 text-left outline-none transition-[box-shadow,background-color] hover:bg-[color-mix(in_srgb,var(--inset)_86%,var(--ink))] focus-visible:shadow-[0_0_0_2px_var(--accent)] data-[invalid=true]:shadow-[0_0_0_2px_var(--danger)] disabled:opacity-60"
              >
                {selected.length > 0 ? (
                  <span aria-hidden="true" className="flex shrink-0 -space-x-2">
                    {selected.slice(0, 3).map((r) => (
                      <span key={`${r.type}-${r.id}`} className="grid size-9 place-items-center rounded-full bg-periwinkle text-[12.5px] font-bold text-periwinkle-ink shadow-[0_0_0_2px_var(--inset)]">
                        {r.initials}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink-2">
                    <UserPlus size={18} weight="bold" />
                  </span>
                )}
                <span id={`${formId}-to-value`} className={`min-w-0 flex-1 truncate text-[16px] ${selected.length ? 'font-medium text-ink' : 'text-ink-3'}`}>
                  {selected.length === 0
                    ? recipientsFailed ? t('unavailable') : t('chooseTeacher')
                    : selected.length === 1 ? selected[0].name : t('nRecipients', { n: selected.length })}
                </span>
                <CaretRight size={18} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3" />
              </button>
            )}
            {errors.to ? (
              <p id={`${formId}-to-err`} className="text-[13px] font-medium text-danger-ink">{errors.to}</p>
            ) : recipientsFailed ? (
              <p className="text-[13px] text-ink-2">{t('recipientsLoadFailed')}</p>
            ) : !reply && single ? (
              <p className="text-[13px] text-ink-2">{ta('oneTeacher')}</p>
            ) : null}
          </div>

          <TextField
            label={t('subject')}
            value={subject}
            onChange={(e) => { setSubject(e.target.value); if (errors.subject) setErrors((x) => ({ ...x, subject: undefined })); }}
            maxLength={255}
            disabled={busy}
            error={errors.subject}
          />

          <TextArea
            label={t('message')}
            value={content}
            onChange={(e) => { setContent(e.target.value); if (errors.text) setErrors((x) => ({ ...x, text: undefined })); }}
            placeholder={t('textPlaceholder')}
            rows={7}
            maxLength={10000}
            disabled={busy}
            error={errors.text}
          />

          {/* Attachments */}
          <div className="flex flex-col gap-2">
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
            {(existingAttachments.length > 0 || files.length > 0) && (
              <ul className="flex flex-col gap-2">
                {existingAttachments.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 rounded-[14px] bg-inset px-3 py-2.5">
                    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-periwinkle text-periwinkle-ink">
                      <FileText size={18} weight="bold" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-medium text-ink">{a.name}</span>
                      <span className="block text-[12.5px] text-ink-3">{t('savedInDraft')}</span>
                    </span>
                  </li>
                ))}
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-[14px] bg-inset px-3 py-2.5">
                    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-periwinkle text-periwinkle-ink">
                      <FileText size={18} weight="bold" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-medium text-ink">{f.name}</span>
                      <span className="block text-[12.5px] text-ink-3 tnum">{fmtSize(f.size)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      disabled={busy}
                      aria-label={t('removeFile', { name: f.name })}
                      className="grid size-9 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface hover:text-ink disabled:opacity-50"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="quiet" size="sm" onClick={() => fileInputRef.current?.click()} disabled={busy} className="self-start">
              <Paperclip size={16} weight="bold" aria-hidden="true" />
              {t('addAttachment')}
            </Button>
          </div>

          {error && <FormStatus kind="error">{error}</FormStatus>}
        </form>
      )}
    </Sheet>
  );
}
