'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Send, ChevronRight, Check, Loader2, Pencil, Paperclip, FileText } from 'lucide-react';
import RecipientPicker from './RecipientPicker';
import { fetchRecipients, sendMessage, saveDraft, deleteDraft } from '@/lib/api';
import type { MessageRecipient } from '@/lib/types';

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
}

type View = 'form' | 'recipients';

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

// Compose a new message to teacher(s) (modelled on WebUntis "Mitteilung an Lehrkraft").
// When `initial` carries a draftId the sheet opens in edit mode: saving/sending
// creates a fresh message and removes the old draft (WebUntis mints a new draft
// id on every save, so this mirrors its own behaviour).
export default function ComposeMessageSheet({ onClose, onSent, initial }: Props) {
  const [view, setView] = useState<View>('form');
  const [recipients, setRecipients] = useState<MessageRecipient[]>([]);
  const [recipientsErr, setRecipientsErr] = useState('');
  const [selected, setSelected] = useState<MessageRecipient[]>(
    (initial?.recipients ?? []).map((r) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      initials: initialsOf(r.name),
      category: 'other' as const,
    })),
  );
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [files, setFiles] = useState<File[]>([]);
  // Attachments already stored on the draft (kept automatically when re-saving).
  const [existingAttachments] = useState(initial?.attachments ?? []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftId = initial?.draftId;

  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchRecipients()
      .then((r) => { if (alive) setRecipients(r.recipients ?? []); })
      .catch((e) => { if (alive) setRecipientsErr(e instanceof Error ? e.message : 'Fehler'); });
    return () => { alive = false; };
  }, []);

  function toggle(r: MessageRecipient) {
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

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function fmtSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function send() {
    if (sending) return;
    if (selected.length === 0) { setError('Bitte mindestens eine Lehrkraft wählen.'); return; }
    if (!subject.trim()) { setError('Bitte einen Betreff eingeben.'); return; }
    if (!content.trim()) { setError('Bitte einen Text eingeben.'); return; }

    setSending(true);
    setError('');
    try {
      await sendMessage({
        recipients: selected.map((r) => ({ id: r.id, type: r.type })),
        subject: subject.trim(),
        content: content.trim(),
        files,
      });
      // The message is sent — remove the source draft if we were editing one.
      if (draftId != null) { try { await deleteDraft(draftId); } catch { /* best-effort */ } }
      setSuccess(true);
      setTimeout(() => { onSent?.(); onClose(); }, 950);
    } catch (e) {
      setError(errMessage(e, 'Die Nachricht konnte nicht gesendet werden. Bitte versuche es später erneut.'));
      setSending(false);
    }
  }

  async function storeDraft() {
    if (savingDraft || sending) return;
    if (!subject.trim() && !content.trim() && selected.length === 0 && files.length === 0 && existingAttachments.length === 0) {
      setError('Bitte gib einen Betreff, Text, Empfänger oder Anhang an.');
      return;
    }
    setSavingDraft(true);
    setError('');
    try {
      await saveDraft({
        recipients: selected.map((r) => ({ id: r.id, type: r.type })),
        subject: subject.trim(),
        content: content.trim(),
        files,
        draftId, // update in place when editing → keeps existing attachments
      });
      setDraftSaved(true);
      setTimeout(() => { onSent?.(); onClose(); }, 950);
    } catch (e) {
      setError(errMessage(e, 'Der Entwurf konnte nicht gespeichert werden. Bitte versuche es später erneut.'));
      setSavingDraft(false);
    }
  }

  if (view === 'recipients') {
    return (
      <RecipientPicker
        recipients={recipients}
        selectedIds={selected.map((r) => r.id)}
        onToggle={toggle}
        onBack={() => setView('form')}
      />
    );
  }

  const recipientLabel =
    selected.length === 0
      ? (recipientsErr ? 'Nicht verfügbar' : 'Wählen')
      : selected.length === 1
        ? selected[0].name
        : `${selected.length} Empfänger`;

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
            {draftId != null ? 'Entwurf bearbeiten' : 'Mitteilung an Lehrkraft'}
          </h3>
          <button
            onClick={send}
            disabled={sending || success}
            className="w-9 h-9 flex items-center justify-center rounded-full press-scale disabled:opacity-50"
            style={{ background: success ? 'var(--tint)' : 'var(--accent)', color: '#fff' }}
            aria-label="Senden"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : success ? <Check size={18} /> : <Send size={17} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          {/* Recipients */}
          <button
            onClick={() => setView('recipients')}
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl press-scale mb-3 text-left"
            style={{ background: 'var(--app-card)' }}
          >
            <span className="text-[15px] font-medium flex-shrink-0" style={{ color: 'var(--app-text-primary)' }}>An</span>
            <span className="flex items-center gap-1 min-w-0">
              <span className="text-[14px] truncate" style={{ color: selected.length ? 'var(--app-text-secondary)' : 'var(--app-text-tertiary)' }}>
                {recipientLabel}
              </span>
              <ChevronRight size={16} color="var(--app-text-tertiary)" className="flex-shrink-0" />
            </span>
          </button>

          {/* Subject */}
          <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: 'var(--app-card)' }}>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Betreff"
              maxLength={255}
              className="w-full bg-transparent outline-none text-[15px] font-medium"
              style={{ color: 'var(--app-text-primary)' }}
            />
          </div>

          {/* Body */}
          <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: 'var(--app-card)' }}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Text hier eingeben"
              rows={8}
              maxLength={10000}
              className="w-full bg-transparent outline-none resize-none text-[15px]"
              style={{ color: 'var(--app-text-primary)' }}
            />
          </div>

          {/* Attachments */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          {existingAttachments.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {existingAttachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                  style={{ background: 'var(--app-card)' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--accent) 14%, var(--app-card))' }}
                  >
                    <FileText size={17} color="var(--accent)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] truncate" style={{ color: 'var(--app-text-primary)' }}>{a.name}</p>
                    <p className="text-[12px]" style={{ color: 'var(--app-text-tertiary)' }}>Im Entwurf gespeichert</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {files.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                  style={{ background: 'var(--app-card)' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--accent) 14%, var(--app-card))' }}
                  >
                    <FileText size={17} color="var(--accent)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] truncate" style={{ color: 'var(--app-text-primary)' }}>{f.name}</p>
                    <p className="text-[12px]" style={{ color: 'var(--app-text-tertiary)' }}>{fmtSize(f.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(i)}
                    disabled={sending || savingDraft || success || draftSaved}
                    className="w-7 h-7 flex items-center justify-center rounded-full press-scale flex-shrink-0 disabled:opacity-50"
                    style={{ background: 'var(--app-surface)', color: 'var(--app-text-secondary)' }}
                    aria-label={`${f.name} entfernen`}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Attach file */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || savingDraft || success || draftSaved}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl press-scale mb-3 text-[14px] font-medium disabled:opacity-50"
            style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)' }}
          >
            <Paperclip size={15} />
            Anhang hinzufügen
          </button>

          {/* Save as draft */}
          <button
            onClick={storeDraft}
            disabled={sending || savingDraft || success || draftSaved}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl press-scale mb-3 text-[14px] font-medium disabled:opacity-50"
            style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)' }}
          >
            {savingDraft ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={15} />}
            Als Entwurf speichern
          </button>

          {recipientsErr && (
            <p className="text-[12px] px-1 mb-2" style={{ color: 'var(--warning)' }}>
              Empfänger konnten gerade nicht geladen werden. Bitte versuche es später erneut.
            </p>
          )}
          {error && (
            <div className="rounded-xl px-4 py-3 text-[13px]" style={{ background: 'color-mix(in srgb, var(--danger) 12%, var(--app-card))', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl px-4 py-3 text-[13px] flex items-center gap-2" style={{ background: 'color-mix(in srgb, var(--tint) 14%, var(--app-card))', color: 'var(--tint)' }}>
              <Check size={16} /> Nachricht gesendet.
            </div>
          )}
          {draftSaved && (
            <div className="rounded-xl px-4 py-3 text-[13px] flex items-center gap-2" style={{ background: 'color-mix(in srgb, var(--tint) 14%, var(--app-card))', color: 'var(--tint)' }}>
              <Check size={16} /> Entwurf gespeichert.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
