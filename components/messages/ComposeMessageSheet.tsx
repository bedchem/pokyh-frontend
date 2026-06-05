'use client';

import { useEffect, useState } from 'react';
import { X, Send, ChevronRight, Check, Loader2, Pencil } from 'lucide-react';
import RecipientPicker from './RecipientPicker';
import { fetchRecipients, sendMessage, saveDraft } from '@/lib/api';
import type { MessageRecipient } from '@/lib/types';

interface Props {
  onClose: () => void;
  onSent?: () => void;
}

type View = 'form' | 'recipients';

// Compose a new message to teacher(s) (modelled on WebUntis "Mitteilung an Lehrkraft").
export default function ComposeMessageSheet({ onClose, onSent }: Props) {
  const [view, setView] = useState<View>('form');
  const [recipients, setRecipients] = useState<MessageRecipient[]>([]);
  const [recipientsErr, setRecipientsErr] = useState('');
  const [selected, setSelected] = useState<MessageRecipient[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

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
      });
      setSuccess(true);
      setTimeout(() => { onSent?.(); onClose(); }, 950);
    } catch {
      setError('Die Nachricht konnte nicht gesendet werden. Bitte versuche es später erneut.');
      setSending(false);
    }
  }

  async function storeDraft() {
    if (savingDraft || sending) return;
    if (!subject.trim() && !content.trim()) { setError('Bitte gib einen Betreff oder Text ein.'); return; }
    setSavingDraft(true);
    setError('');
    try {
      await saveDraft({
        recipients: selected.map((r) => ({ id: r.id, type: r.type })),
        subject: subject.trim(),
        content: content.trim(),
      });
      setDraftSaved(true);
      setTimeout(() => { onSent?.(); onClose(); }, 950);
    } catch {
      setError('Der Entwurf konnte nicht gespeichert werden. Bitte versuche es später erneut.');
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
            Mitteilung an Lehrkraft
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
