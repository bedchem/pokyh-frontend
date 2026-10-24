'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { Check, CheckSquare, Checks, MagnifyingGlass, Paperclip, PencilSimple, Trash, X } from '@phosphor-icons/react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import { Button } from '@/components/ui/Button';
import { Page, PageHeader, Section } from '@/components/app/Page';
import { RowsSkeleton } from '@/components/app/Skeleton';
import PixelState from '@/components/app/PixelState';
import Fab from '@/components/app/Fab';
import { initialsOf } from '@/components/app/hooks';
import ComposeMessageSheet, { type ComposeInitial } from '@/components/messages/ComposeMessageSheet';
import { fetchMessages, getMessagesStale, markAllMessagesRead, fetchDraft, deleteDraft, deleteMessages, searchMessages, type MessageFolder } from '@/lib/api';
import type { MessagePreview } from '@/lib/types';
import { useDateLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { messagesDict, type MessagesKey } from '@/lib/i18n/dictionaries/messages';
import { formatDate, formatTime } from '@/lib/i18n/dateLocale';
import { messageIsRead, messageRecipientNames } from '@/lib/untis-parse';
import { leaveForLogin } from '@/providers/SessionProvider';

type TFn = (key: MessagesKey, vars?: Record<string, string | number>) => string;

const pill = 'shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-bold';

const FOLDERS: { key: MessageFolder; label: MessagesKey }[] = [
  { key: 'inbox', label: 'inbox' },
  { key: 'sent', label: 'sent' },
  { key: 'drafts', label: 'drafts' },
];


function parseMessages(json: unknown, t: TFn, folder: MessageFolder): MessagePreview[] {
  try {
    const root = json as Record<string, unknown>;
    const data = (root?.data as Record<string, unknown>) ?? {};
    // Inbox → incomingMessages, Sent → sentMessages, Drafts → draftMessages.
    const arr =
      (root?.incomingMessages as unknown[]) ??
      (root?.sentMessages as unknown[]) ??
      (root?.draftMessages as unknown[]) ??
      (root?.messages as unknown[]) ??
      (data?.incomingMessages as unknown[]) ??
      (data?.sentMessages as unknown[]) ??
      (data?.draftMessages as unknown[]) ??
      (Array.isArray(root?.data) ? (root.data as unknown[]) : null) ??
      [];
    // The inbox lists messages waiting for a read confirmation on their own, first.
    const confirm = folder === 'inbox' ? ((root?.readConfirmationMessages ?? data?.readConfirmationMessages) as unknown[] | undefined) : undefined;
    const waiting = new Set(Array.isArray(confirm) ? (confirm as Record<string, unknown>[]).map((m) => m.id) : []);
    const all = [...(Array.isArray(confirm) ? confirm : []), ...(arr as unknown[])] as Record<string, unknown>[];
    const seen = new Set<unknown>();
    const list = all.filter((m) => m && !seen.has(m.id) && seen.add(m.id));

    return list.map((m) => {
      const sender =
        typeof m.sender === 'object' && m.sender !== null
          ? (m.sender as Record<string, unknown>)
          : null;
      // Sent and draft messages show who they went to; drafts may have nobody yet.
      const senderName =
        folder === 'inbox'
          ? (sender?.displayName as string) ?? (sender?.name as string) ?? (m.senderName as string) ?? t('unknown')
          : messageRecipientNames(m).join(', ');
      const sentDate =
        (m.sentDateTime as string) ??
        (m.sentDate as string) ??
        (m.date as string) ??
        '';
      const isRead = messageIsRead(m);
      const rc = m.requestConfirmation && typeof m.requestConfirmation === 'object' ? m.requestConfirmation as Record<string, unknown> : null;
      const status = m.requestConfirmationStatus && typeof m.requestConfirmationStatus === 'object' ? m.requestConfirmationStatus as Record<string, unknown> : null;
      return {
        id: m.id as number,
        subject: (m.subject as string) ?? t('noSubject'),
        contentPreview: (m.contentPreview as string) ?? '',
        senderName,
        senderId: (sender?.userId as number) ?? 0,
        sentDate,
        isRead,
        hasAttachments: (m.hasAttachments as boolean) ?? false,
        needsConfirmation: rc ? rc.allowSendRequestConfirmation === true && !rc.confirmationDate : waiting.has(m.id),
        readStatus: status ? { confirmed: Number(status.confirmedRequestCount) || 0, total: Number(status.totalRequestCount) || 0 } : null,
        isRevoked: m.isRevoked === true,
      };
    });
  } catch {
    return [];
  }
}

function formatMessageDate(dateStr: string, tag: string, yesterday: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0)
      return formatTime(date, tag, { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return yesterday;
    if (diffDays < 7) return formatDate(date, tag, { weekday: 'short' });
    return formatDate(date, tag, { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
}

export default function MessagesPage() {
  const t = useT(messagesDict);
  const { tag } = useDateLocale();
  const localize = useLocalizeHref();
  const [messages, setMessages] = useState<MessagePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeInitial, setComposeInitial] = useState<ComposeInitial | undefined>(undefined);
  const [openingDraftId, setOpeningDraftId] = useState<number | null>(null);
  const [deletingDraftId, setDeletingDraftId] = useState<number | null>(null);
  const [folder, setFolder] = useState<MessageFolder>('inbox');
  // When the list was loaded; "Heute" and "Diese Woche" are counted from it.
  const [loadedAt, setLoadedAt] = useState(0);
  // Choosing inbox messages to delete: tapping a row picks it instead of opening it.
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  // Searching inbox or sent: the loaded list filtered at once, WebUntis' own
  // search (subject, text, people, also older messages) once typing stops.
  const [query, setQuery] = useState('');
  // list null: WebUntis' search failed, the filtered list stays.
  const [found, setFound] = useState<{ q: string; list: MessagePreview[] | null } | null>(null);
  const searchSeq = useRef(0);
  const q = query.trim();

  useEffect(() => {
    if (q.length < 2 || folder === 'drafts') return;
    const seq = ++searchSeq.current;
    const timer = window.setTimeout(() => {
      searchMessages(folder, q)
        .then((res) => { if (seq === searchSeq.current) setFound({ q, list: parseMessages(res, t, folder) }); })
        .catch((e) => {
          if (e instanceof Error && e.message === 'session_expired') leaveForLogin();
          else if (seq === searchSeq.current) setFound({ q, list: null });
        });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [q, folder, t]);

  const changeQuery = (next: string) => {
    setQuery(next);
    if (next.trim().length < 2) {
      searchSeq.current++;
      setFound(null);
    }
  };

  // Fetches the folder; the caller shows the loading state first.
  const load = useCallback(async () => {
    // What this device stored last time shows at once; the fresh list follows.
    const stale = getMessagesStale(folder);
    if (stale !== undefined) {
      setMessages(parseMessages(stale, t, folder));
      setLoadedAt(Date.now());
      setLoading(false);
    }
    try {
      const res = await fetchMessages(folder);
      setMessages(parseMessages(res, t, folder));
      setLoadedAt(Date.now());
      setError('');
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') {
        leaveForLogin();
      } else {
        setError(e instanceof Error ? e.message : 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [folder, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const reload = () => {
    setLoading(true);
    setError('');
    void load();
  };

  const stopSelecting = () => {
    setSelecting(false);
    setPicked(new Set());
    setConfirmDelete(false);
    setDeleteError('');
  };

  const switchFolder = (next: MessageFolder) => {
    if (next === folder) return;
    stopSelecting();
    changeQuery('');
    setLoading(true);
    setError('');
    setFolder(next);
  };

  const togglePick = (id: number) => {
    setConfirmDelete(false);
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  async function handleDeleteSelected() {
    if (picked.size === 0 || deleting) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setDeleteError('');
    const ids = [...picked];
    try {
      const deleted = new Set(await deleteMessages(ids));
      setMessages((prev) => prev.filter((m) => !deleted.has(m.id)));
      if (deleted.size < ids.length) {
        setPicked(new Set(ids.filter((id) => !deleted.has(id))));
        setDeleteError(t('deleteFailed'));
      } else {
        stopSelecting();
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'session_expired') leaveForLogin();
      else setDeleteError(t('deleteFailed'));
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const unreadIds = messages.filter((m) => !m.isRead).map((m) => m.id);

  async function openDraft(id: number) {
    if (openingDraftId != null) return;
    setOpeningDraftId(id);
    try {
      const d = await fetchDraft(id);
      setComposeInitial({ draftId: id, subject: d.subject, content: d.content, recipients: d.recipients, attachments: d.attachments });
      setShowCompose(true);
    } catch (e) {
      if (e instanceof Error && e.message === 'session_expired') leaveForLogin();
      else setError(t('draftOpenFailed'));
    } finally {
      setOpeningDraftId(null);
    }
  }

  async function handleDeleteDraft(id: number) {
    if (deletingDraftId != null) return;
    setDeletingDraftId(id);
    try {
      await deleteDraft(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      if (e instanceof Error && e.message === 'session_expired') leaveForLogin();
      else setError(t('draftDeleteFailed'));
    } finally {
      setDeletingDraftId(null);
    }
  }

  function newCompose() {
    setComposeInitial(undefined);
    setShowCompose(true);
  }

  async function handleMarkAllRead() {
    if (markingAll || unreadIds.length === 0) return;
    setMarkingAll(true);
    try {
      await markAllMessagesRead(unreadIds);
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pokyh-messages-updated', { detail: { unread: 0 } }));
      }
    } finally {
      setMarkingAll(false);
    }
  }

  const searching = q.length >= 2 && folder !== 'drafts';
  // While WebUntis' answer is on its way, the loaded messages that match.
  const shown = useMemo(() => {
    if (!searching) return messages;
    if (found?.q === q && found.list) return found.list;
    const needle = q.toLocaleLowerCase();
    return messages.filter((m) => `${m.subject} ${m.senderName} ${m.contentPreview}`.toLocaleLowerCase().includes(needle));
  }, [searching, messages, found, q]);
  const searchPending = searching && found?.q !== q;

  const groups = useMemo(() => {
    const now = loadedAt;
    const out: Array<{ key: 'groupToday' | 'groupWeek' | 'groupOlder'; list: MessagePreview[] }> = [
      { key: 'groupToday', list: [] },
      { key: 'groupWeek', list: [] },
      { key: 'groupOlder', list: [] },
    ];
    for (const m of shown) {
      const d = new Date(m.sentDate);
      const valid = !Number.isNaN(d.getTime());
      const days = valid ? Math.floor((now - d.getTime()) / 86_400_000) : 99;
      const sameDay = valid && d.toDateString() === new Date(now).toDateString();
      out[sameDay ? 0 : days < 7 ? 1 : 2].list.push(m);
    }
    return out.filter((g) => g.list.length > 0);
  }, [shown, loadedAt]);

  const row = (msg: MessagePreview) => {
    const isDraft = folder === 'drafts';
    // Inbox rows name the sender; sent and draft rows name the recipients.
    const who = folder === 'inbox' ? msg.senderName : msg.senderName ? t('to', { names: msg.senderName }) : '';
    const isPicked = picked.has(msg.id);
    const inner = (
      <span className="flex items-center gap-3.5 px-3 py-3">
        {selecting && !isDraft ? (
          <span
            aria-hidden="true"
            className={`grid size-11 shrink-0 place-items-center rounded-full transition-colors ${isPicked ? 'bg-accent text-on-accent' : 'bg-inset text-transparent'}`}
          >
            <Check size={20} weight="bold" />
          </span>
        ) : (
        <span
          aria-hidden="true"
          className={`relative grid size-11 shrink-0 place-items-center rounded-full text-[14px] font-bold ${msg.isRead ? 'bg-inset text-ink-2' : 'bg-periwinkle text-periwinkle-ink'}`}
        >
          {msg.senderName ? initialsOf(msg.senderName) : <PencilSimple size={18} weight="bold" />}
          {!msg.isRead && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-accent shadow-[0_0_0_2px_var(--surface)]" />}
        </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className={`truncate text-[15.5px] text-ink ${msg.isRead ? 'font-medium' : 'font-bold'}`}>{msg.subject}</span>
            <span className="shrink-0 text-[12.5px] text-ink-3">{formatMessageDate(msg.sentDate, tag, t('yesterday'))}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-1.5">
            <span className="min-w-0 truncate text-[13.5px] text-ink-2">
              {who && <span className={msg.isRead ? '' : 'font-semibold text-ink'}>{who}</span>}
              {msg.contentPreview ? `${who ? ' · ' : ''}${msg.contentPreview}` : ''}
            </span>
            {msg.hasAttachments && <Paperclip size={14} weight="bold" className="shrink-0 text-ink-3" aria-hidden="true" />}
            {msg.needsConfirmation && <span className={`${pill} bg-butter text-butter-ink`}>{t('needsConfirmation')}</span>}
            {folder === 'sent' && msg.isRevoked && <span className={`${pill} bg-inset text-ink-2`}>{t('revoked')}</span>}
            {folder === 'sent' && !msg.isRevoked && msg.readStatus && msg.readStatus.total > 0 && (
              <span className={`${pill} tnum ${msg.readStatus.confirmed >= msg.readStatus.total ? 'bg-sage text-sage-ink' : 'bg-inset text-ink-2'}`}>
                {t('readCount', { confirmed: msg.readStatus.confirmed, total: msg.readStatus.total })}
              </span>
            )}
          </span>
        </span>
      </span>
    );
    const cls = 'block rounded-[18px] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--surface)_92%,var(--ink))]';
    if (selecting && !isDraft) {
      return (
        <li key={msg.id} className="relative before:pointer-events-none before:absolute before:inset-x-3.5 before:top-0 before:h-px before:bg-line before:transition-opacity first:before:hidden hover:before:opacity-0 [&:hover+li]:before:opacity-0">
          <button
            type="button"
            role="checkbox"
            aria-checked={isPicked}
            onClick={() => togglePick(msg.id)}
            className={`${cls} w-full text-left ${isPicked ? 'bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]' : ''}`}
          >
            {inner}
          </button>
        </li>
      );
    }
    if (!isDraft) {
      return <li key={msg.id} className="relative before:pointer-events-none before:absolute before:inset-x-3.5 before:top-0 before:h-px before:bg-line before:transition-opacity first:before:hidden hover:before:opacity-0 [&:hover+li]:before:opacity-0"><Link href={localize(folder === 'sent' ? `/messages/${msg.id}?folder=sent` : `/messages/${msg.id}`)} className={cls}>{inner}</Link></li>;
    }
    return (
      <li key={msg.id} className="flex items-center relative before:pointer-events-none before:absolute before:inset-x-3.5 before:top-0 before:h-px before:bg-line before:transition-opacity first:before:hidden hover:before:opacity-0 [&:hover+li]:before:opacity-0">
        <button type="button" onClick={() => openDraft(msg.id)} disabled={openingDraftId != null || deletingDraftId === msg.id} className={`${cls} min-w-0 flex-1 text-left disabled:opacity-60`}>
          {inner}
        </button>
        <button
          type="button"
          onClick={() => handleDeleteDraft(msg.id)}
          disabled={deletingDraftId != null || openingDraftId != null}
          className="mr-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-inset hover:text-danger-ink disabled:opacity-50"
          aria-label={t('deleteDraft')}
        >
          {deletingDraftId === msg.id ? <Spinner size={16} /> : <Trash size={17} weight="bold" />}
        </button>
      </li>
    );
  };

  return (
    <AuthGuard>
      <UntisGuard>
        <Page>
          <PageHeader
            title={t('title')}
            mobileAside={
              folder === 'inbox' && messages.length > 0 && (
                <span className="flex gap-2">
                  {unreadIds.length > 0 && !selecting && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={markingAll}
                      aria-label={t('markAllRead')}
                      title={t('markAllRead')}
                      className="grid size-11 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-inset disabled:opacity-50"
                    >
                      {markingAll ? <Spinner size={16} /> : <Checks size={20} weight="bold" aria-hidden="true" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
                    aria-pressed={selecting}
                    aria-label={selecting ? t('selectDone') : t('select')}
                    title={selecting ? t('selectDone') : t('select')}
                    className={`grid size-11 place-items-center rounded-full transition-colors ${selecting ? 'bg-periwinkle text-periwinkle-ink' : 'bg-surface text-ink hover:bg-inset'}`}
                  >
                    <CheckSquare size={20} weight="bold" aria-hidden="true" />
                  </button>
                </span>
              )
            }
            actions={
              <span className="hidden md:contents">
                {folder === 'inbox' && unreadIds.length > 0 && !selecting && (
                  <Button variant="quiet" onClick={handleMarkAllRead} disabled={markingAll}>
                    {markingAll ? <Spinner size={16} /> : <Checks size={18} weight="bold" aria-hidden="true" />}
                    {t('markAllRead')}
                  </Button>
                )}
                {folder === 'inbox' && messages.length > 0 && (
                  <Button variant={selecting ? 'tone' : 'quiet'} onClick={() => (selecting ? stopSelecting() : setSelecting(true))} aria-pressed={selecting}>
                    <CheckSquare size={18} weight="bold" aria-hidden="true" />
                    {selecting ? t('selectDone') : t('select')}
                  </Button>
                )}
                {!selecting && (
                  <Button onClick={newCompose}>
                    <PencilSimple size={18} weight="bold" aria-hidden="true" />
                    {t('compose')}
                  </Button>
                )}
              </span>
            }
          />
          {!selecting && (
            <Fab label={t('compose')} onClick={newCompose}>
              <PencilSimple size={24} weight="bold" aria-hidden="true" />
            </Fab>
          )}

          <div className="rise mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <LayoutGroup id="message-folders">
            <div role="tablist" aria-label={t('title')} className="inline-flex max-w-full gap-1 self-start rounded-[16px] bg-surface p-1">
              {FOLDERS.map((f) => {
                const active = folder === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => switchFolder(f.key)}
                    className={`relative h-10 rounded-[12px] px-4 text-[14.5px] font-semibold transition-colors duration-200 ${active ? 'text-periwinkle-ink' : 'text-ink-2 hover:text-ink'}`}
                  >
                    {active && <motion.span layoutId="folder-active" className="absolute inset-0 rounded-[12px] bg-periwinkle" transition={{ type: 'spring', stiffness: 520, damping: 42 }} />}
                    <span className="relative">{t(f.label)}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
          {folder !== 'drafts' && (
            <div className="relative w-full md:max-w-[340px]">
              <MagnifyingGlass size={18} weight="bold" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                type="search"
                value={query}
                onChange={(e) => changeQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') changeQuery(''); }}
                placeholder={t('searchLabel')}
                aria-label={t('searchLabel')}
                enterKeyHint="search"
                className="h-12 w-full rounded-[14px] bg-surface pl-11 pr-11 text-[16px] text-ink outline-none transition-shadow placeholder:text-ink-3 focus:shadow-[0_0_0_2px_var(--accent)] [&::-webkit-search-cancel-button]:hidden"
              />
              {searchPending ? (
                <span className="absolute right-4 top-1/2 -translate-y-1/2"><Spinner size={16} /></span>
              ) : query ? (
                <button
                  type="button"
                  onClick={() => changeQuery('')}
                  aria-label={t('searchClear')}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-3 transition-colors hover:bg-inset hover:text-ink"
                >
                  <X size={16} weight="bold" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          )}
          </div>

          {loading ? (
            <RowsSkeleton rows={6} lead="round" trailing />
          ) : error ? (
            <div className="squircle rounded-[26px] bg-surface"><ErrorView message={error} onRetry={reload} /></div>
          ) : searching && shown.length === 0 ? (
            <div className="squircle rounded-[26px] bg-surface px-6 py-12 text-center">
              <p className="text-[15.5px] font-semibold text-ink-2" aria-live="polite">{searchPending ? t('searchLabel') : t('searchNone', { q })}</p>
            </div>
          ) : messages.length === 0 ? (
            <div key={folder} className="squircle rounded-[26px] bg-surface">
              <PixelState
                sprite="mail"
                title={folder === 'sent' ? t('emptySentTitle') : folder === 'drafts' ? t('emptyDraftsTitle') : t('emptyInboxTitle')}
                note={folder === 'sent' ? t('emptySentText') : folder === 'drafts' ? t('emptyDraftsText') : t('emptyInboxText')}
              />
            </div>
          ) : (
            <div key={folder} className="flex flex-col gap-10">
              {groups.map((g) => (
                <Section key={g.key} title={t(g.key)} className="rise">
                  <ul className="squircle flex flex-col rounded-[24px] bg-surface p-2">
                    {g.list.map(row)}
                  </ul>
                </Section>
              ))}
            </div>
          )}
          {/* Room for the floating button over the last row */}
          <div className="h-20 lg:hidden" aria-hidden="true" />

          {selecting && folder === 'inbox' && (
            <div
              role="toolbar"
              aria-label={t('selected', { n: picked.size })}
              className="sheet-in sticky bottom-4 z-30 mx-auto mt-2 flex w-full max-w-[640px] flex-wrap items-center gap-2 rounded-[20px] bg-surface p-2 pl-4 shadow-[var(--shadow-float)]"
              style={{ marginBottom: 'var(--safe-bottom)' }}
            >
              <span className="mr-auto text-[14.5px] font-semibold tnum" aria-live="polite">{t('selected', { n: picked.size })}</span>
              {deleteError && <span role="alert" className="w-full text-[13px] font-semibold text-danger-ink sm:order-last">{deleteError}</span>}
              <Button
                variant="quiet"
                size="sm"
                onClick={() => { setConfirmDelete(false); setPicked(picked.size === messages.length ? new Set() : new Set(messages.map((m) => m.id))); }}
              >
                {t('selectAll')}
              </Button>
              <Button variant="danger" size="sm" disabled={picked.size === 0 || deleting} onClick={() => void handleDeleteSelected()}>
                {deleting ? <Spinner size={15} /> : <Trash size={16} weight="bold" aria-hidden="true" />}
                {confirmDelete ? t('deleteConfirm') : t('deleteSelected')}
              </Button>
            </div>
          )}
        </Page>
        {showCompose && (
          <ComposeMessageSheet
            initial={composeInitial}
            onClose={() => { setShowCompose(false); setComposeInitial(undefined); }}
            onSent={reload}
          />
        )}
      </UntisGuard>
    </AuthGuard>
  );
}
