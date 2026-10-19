'use client';

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, Flag, PaperPlaneRight, PencilSimple, Star, Trash, X } from '@phosphor-icons/react';
import Spinner from './Spinner';
import PixelState from '@/components/app/PixelState';
import { TONE_CLASS, type AppTone } from '@/components/app/nav';
import { initialsOf } from '@/components/app/hooks';
import type { ApiComment } from '@/lib/api-client';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { openReport, reportAddress } from '@/lib/report';
import { uiDict } from '@/lib/i18n/dictionaries/ui';
import type { UiKey } from '@/lib/i18n/dictionaries/ui';

// Comments under a dish or a class reminder: each with its author, when it
// was written and, under a dish, the stars that person gave it; your own can
// be edited, yours and (for admins) everyone's deleted, anyone else's reported
// (an e-mail to POKYH's contact point, Digital Services Act Art. 16). The field below grows
// with the text; Enter sends, Shift+Enter starts a new line.

// As long as the backend takes (pokyh-backend comment routes: 2000 characters),
// set per deployment with NEXT_PUBLIC_COMMENT_MAX_LENGTH.
const MAX_LENGTH = Number(process.env.NEXT_PUBLIC_COMMENT_MAX_LENGTH) || 2000;
const MAX_FIELD_HEIGHT = 168;
const TONES: AppTone[] = ['periwinkle', 'butter', 'sage', 'blush'];

/** The same person always gets the same tone. */
function toneOf(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return TONE_CLASS[TONES[Math.abs(h) % TONES.length]];
}

function timeAgo(iso: string, t: (key: UiKey, vars?: Record<string, number>) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('justNow');
  if (min < 60) return t('minutesAgo', { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t('hoursAgo', { n: h });
  const d = Math.floor(h / 24);
  return d > 1 ? t('daysAgo', { n: d }) : t('dayAgo');
}

/** Grows a textarea with its text, up to a few lines. */
function useAutoHeight(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_FIELD_HEIGHT)}px`;
  }, [ref, value]);
}

/** Enter sends; Shift+Enter (and Enter while composing an accented letter) doesn't. */
function isSendKey(e: KeyboardEvent<HTMLTextAreaElement>): boolean {
  return e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing;
}

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span role="img" aria-label={label} className="flex shrink-0 items-center gap-px">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={12} weight={s <= value ? 'fill' : 'bold'} color={s <= value ? 'var(--star)' : 'var(--ink-3)'} className={s <= value ? '' : 'opacity-40'} />
      ))}
    </span>
  );
}

interface Props {
  comments: ApiComment[];
  stableUid: string | null;
  isAdmin: boolean;
  loading: boolean;
  onAdd: (body: string) => Promise<unknown>;
  onEdit: (commentId: string, body: string) => Promise<unknown>;
  onDelete: (commentId: string) => Promise<unknown>;
  /** When set and there is no stableUid, the input is shown but asks for a login instead. */
  onRequireLogin?: () => void;
  /** Stars per account (stableUid → 1–5), shown beside the author's name. */
  ratings?: Record<string, number>;
}

export default function CommentSection({ comments, stableUid, isAdmin, loading, onAdd, onEdit, onDelete, onRequireLogin, ratings }: Props) {
  const t = useT(uiDict);
  const localize = useLocalizeHref();

  // A report: the mail program opens with the notice prepared; without the
  // address (offline), the imprint's contact section instead.
  const report = async (c: ApiComment) => {
    const body = t('reportBody', {
      url: window.location.href,
      author: c.username,
      date: new Date(c.createdAt).toLocaleString(),
      id: c.id,
      text: c.body.length > 400 ? `${c.body.slice(0, 400)}…` : c.body,
    });
    if (!(await openReport(t('reportSubject'), body))) window.location.assign(localize('/legal/impressum'));
  };
  const guestPrompt = !stableUid && onRequireLogin ? onRequireLogin : null;
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  useAutoHeight(inputRef, draft);
  useAutoHeight(editRef, editingId ? editBody : '');

  // New comments are followed only while the end of the list is in view, and
  // never when the list first fills: opening a page must not jump down to it.
  const lastCount = useRef<number | null>(null);
  useEffect(() => {
    const prev = lastCount.current;
    lastCount.current = comments.length;
    if (!prev || comments.length <= prev) return;
    const el = bottomRef.current;
    if (el && el.getBoundingClientRect().top < window.innerHeight + 160) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [comments.length]);

  useEffect(() => {
    const el = editRef.current;
    if (editingId && el) {
      el.focus();
      el.selectionStart = el.value.length;
    }
  }, [editingId]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setFailed(false);
    try {
      await onAdd(body);
      setDraft('');
      inputRef.current?.focus();
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  async function handleEdit(commentId: string) {
    const body = editBody.trim();
    if (!body || editBusy) return;
    setEditBusy(true);
    try {
      await onEdit(commentId, body);
      setEditingId(null);
    } catch { /* keep the edit open */ } finally {
      setEditBusy(false);
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    try {
      await onDelete(commentId);
    } catch { /* the comment stays */ } finally {
      setDeletingId(null);
    }
  }

  const canSend = !!draft.trim() && !sending;

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <div className="flex justify-center py-6"><Spinner size={20} /></div>
      ) : comments.length === 0 ? (
        <PixelState compact sprite="chat" title={t('noComments')} note={stableUid || guestPrompt ? t('noCommentsHint') : undefined} className="!py-4" />
      ) : (
        <ul className="flex flex-col">
          {comments.map((c) => {
            const isMine = stableUid != null && c.stableUid === stableUid;
            const canDelete = isMine || isAdmin;
            const canReport = stableUid != null && !isMine;
            const isEditing = editingId === c.id;
            const stars = ratings?.[c.stableUid];

            return (
              <li key={c.id} className="group relative flex gap-3 py-3.5 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-line first:pt-1 first:before:hidden">
                <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-full text-[12.5px] font-bold ${toneOf(c.username)}`}>
                  {initialsOf(c.username)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex min-h-9 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="min-w-0 truncate text-[14.5px] font-bold text-ink">{c.username}</span>
                    {isMine && <span className="rounded-full bg-periwinkle px-2 py-px text-[11.5px] font-bold text-periwinkle-ink">{t('you')}</span>}
                    {stars ? <Stars value={stars} label={t('ratedStars', { n: stars })} /> : null}
                    <span className="text-[12.5px] text-ink-3">
                      {timeAgo(c.createdAt, t)}
                      {c.updatedAt !== c.createdAt && <> · {t('edited')}</>}
                    </span>
                    {(isMine || canDelete || canReport) && !isEditing && (
                      <span className="ml-auto flex items-center opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        {isMine && (
                          <button
                            type="button"
                            onClick={() => { setEditingId(c.id); setEditBody(c.body); }}
                            aria-label={t('editComment')}
                            className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-inset hover:text-ink"
                          >
                            <PencilSimple size={15} weight="bold" />
                          </button>
                        )}
                        {canReport && (
                          <button
                            type="button"
                            onClick={() => void report(c)}
                            onPointerEnter={() => void reportAddress().catch(() => {})}
                            onFocus={() => void reportAddress().catch(() => {})}
                            aria-label={t('reportComment')}
                            title={t('reportComment')}
                            className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-inset hover:text-ink"
                          >
                            <Flag size={15} weight="bold" aria-hidden="true" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => void handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            aria-label={t('deleteComment')}
                            className={`grid size-8 place-items-center rounded-full transition-colors hover:bg-inset disabled:opacity-50 ${isAdmin && !isMine ? 'text-orange-ink' : 'text-ink-3 hover:text-danger-ink'}`}
                          >
                            {deletingId === c.id ? <Spinner size={14} /> : <Trash size={15} weight="bold" />}
                          </button>
                        )}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-1.5 rounded-[16px] bg-inset p-1.5 shadow-[0_0_0_2px_var(--accent)]">
                      <textarea
                        ref={editRef}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') { e.stopPropagation(); setEditingId(null); return; }
                          if (isSendKey(e)) { e.preventDefault(); void handleEdit(c.id); }
                        }}
                        rows={1}
                        maxLength={MAX_LENGTH}
                        aria-label={t('editComment')}
                        className="block w-full resize-none bg-transparent px-2.5 py-1.5 text-[15px] leading-[1.5] text-ink outline-none"
                      />
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-surface hover:text-ink"
                        >
                          <X size={13} weight="bold" aria-hidden="true" />
                          {t('cancelEdit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleEdit(c.id)}
                          disabled={!editBody.trim() || editBusy}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent px-3 text-[13px] font-semibold text-on-accent transition-[filter] hover:brightness-95 disabled:opacity-45"
                        >
                          {editBusy ? <Spinner size={13} /> : <Check size={13} weight="bold" aria-hidden="true" />}
                          {t('saveComment')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[15px] leading-[1.55] text-ink [overflow-wrap:anywhere] whitespace-pre-wrap">{c.body}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div ref={bottomRef} aria-hidden="true" className="-mt-4" />

      {(stableUid || guestPrompt) && (
        <div>
          <div className="flex items-end gap-2 rounded-[22px] bg-inset p-1.5 pl-4 transition-[box-shadow,background-color] focus-within:bg-surface focus-within:shadow-[0_0_0_2px_var(--accent)]">
            <textarea
              ref={inputRef}
              value={draft}
              readOnly={!!guestPrompt}
              // Guests: open the prompt on click (not mousedown/focus), otherwise the
              // mouseup lands on the freshly opened dialog backdrop and closes it.
              onMouseDown={guestPrompt ? (e) => e.preventDefault() : undefined}
              onClick={guestPrompt ?? undefined}
              onFocus={guestPrompt ? (e) => { e.currentTarget.blur(); guestPrompt(); } : undefined}
              onChange={(e) => { setDraft(e.target.value); if (failed) setFailed(false); }}
              onKeyDown={(e) => { if (isSendKey(e)) { e.preventDefault(); void handleSend(); } }}
              placeholder={t('writeComment')}
              aria-label={t('writeComment')}
              rows={1}
              maxLength={MAX_LENGTH}
              className="block min-h-10 flex-1 resize-none self-center bg-transparent py-2 text-[15.5px] leading-[1.5] text-ink outline-none placeholder:text-ink-3"
            />
            <button
              type="button"
              onClick={guestPrompt ?? (() => void handleSend())}
              disabled={!guestPrompt && !canSend}
              aria-label={t('send')}
              className={`grid size-10 shrink-0 place-items-center rounded-full transition-[background-color,color,filter] duration-200 ${
                canSend || guestPrompt ? 'bg-accent text-on-accent hover:brightness-95' : 'text-ink-3'
              }`}
            >
              {sending ? <Spinner size={16} /> : <PaperPlaneRight size={18} weight="fill" />}
            </button>
          </div>
          {failed && <p role="alert" className="mt-2 px-1 text-[13px] font-semibold text-danger-ink">{t('commentFailed')}</p>}
          {draft.length > MAX_LENGTH * 0.9 && (
            <p className="mt-1.5 px-1 text-right text-[12px] text-ink-3 tnum">{draft.length} / {MAX_LENGTH}</p>
          )}
        </div>
      )}
    </div>
  );
}
