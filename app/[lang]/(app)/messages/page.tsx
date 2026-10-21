'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { Checks, Paperclip, PencilSimple, Trash } from '@phosphor-icons/react';
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
import { fetchMessages, getMessagesStale, markAllMessagesRead, fetchDraft, deleteDraft, type MessageFolder } from '@/lib/api';
import type { MessagePreview } from '@/lib/types';
import { useDateLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { messagesDict, type MessagesKey } from '@/lib/i18n/dictionaries/messages';
import { formatDate, formatTime } from '@/lib/i18n/dateLocale';
import { messageIsRead, messageRecipientNames } from '@/lib/untis-parse';
import { loginPath } from '@/providers/SessionProvider';

type TFn = (key: MessagesKey, vars?: Record<string, string | number>) => string;

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

    return (arr as Record<string, unknown>[]).map((m) => {
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
      return {
        id: m.id as number,
        subject: (m.subject as string) ?? t('noSubject'),
        contentPreview: (m.contentPreview as string) ?? '',
        senderName,
        senderId: (sender?.userId as number) ?? 0,
        sentDate,
        isRead,
        hasAttachments: (m.hasAttachments as boolean) ?? false,
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
        window.location.replace(loginPath());
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

  const switchFolder = (next: MessageFolder) => {
    if (next === folder) return;
    setLoading(true);
    setError('');
    setFolder(next);
  };

  const unreadIds = messages.filter((m) => !m.isRead).map((m) => m.id);

  async function openDraft(id: number) {
    if (openingDraftId != null) return;
    setOpeningDraftId(id);
    try {
      const d = await fetchDraft(id);
      setComposeInitial({ draftId: id, subject: d.subject, content: d.content, recipients: d.recipients, attachments: d.attachments });
      setShowCompose(true);
    } catch (e) {
      if (e instanceof Error && e.message === 'session_expired') window.location.replace(loginPath());
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
      if (e instanceof Error && e.message === 'session_expired') window.location.replace(loginPath());
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

  const groups = useMemo(() => {
    const now = loadedAt;
    const out: Array<{ key: 'groupToday' | 'groupWeek' | 'groupOlder'; list: MessagePreview[] }> = [
      { key: 'groupToday', list: [] },
      { key: 'groupWeek', list: [] },
      { key: 'groupOlder', list: [] },
    ];
    for (const m of messages) {
      const d = new Date(m.sentDate);
      const valid = !Number.isNaN(d.getTime());
      const days = valid ? Math.floor((now - d.getTime()) / 86_400_000) : 99;
      const sameDay = valid && d.toDateString() === new Date(now).toDateString();
      out[sameDay ? 0 : days < 7 ? 1 : 2].list.push(m);
    }
    return out.filter((g) => g.list.length > 0);
  }, [messages, loadedAt]);

  const row = (msg: MessagePreview) => {
    const isDraft = folder === 'drafts';
    // Inbox rows name the sender; sent and draft rows name the recipients.
    const who = folder === 'inbox' ? msg.senderName : msg.senderName ? t('to', { names: msg.senderName }) : '';
    const inner = (
      <span className="flex items-center gap-3.5 px-3 py-3">
        <span
          aria-hidden="true"
          className={`relative grid size-11 shrink-0 place-items-center rounded-full text-[14px] font-bold ${msg.isRead ? 'bg-inset text-ink-2' : 'bg-periwinkle text-periwinkle-ink'}`}
        >
          {msg.senderName ? initialsOf(msg.senderName) : <PencilSimple size={18} weight="bold" />}
          {!msg.isRead && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-accent shadow-[0_0_0_2px_var(--surface)]" />}
        </span>
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
          </span>
        </span>
      </span>
    );
    const cls = 'block rounded-[18px] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--surface)_92%,var(--ink))]';
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
              folder === 'inbox' && unreadIds.length > 0 && (
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
              )
            }
            actions={
              <span className="hidden md:contents">
                {folder === 'inbox' && unreadIds.length > 0 && (
                  <Button variant="quiet" onClick={handleMarkAllRead} disabled={markingAll}>
                    {markingAll ? <Spinner size={16} /> : <Checks size={18} weight="bold" aria-hidden="true" />}
                    {t('markAllRead')}
                  </Button>
                )}
                <Button onClick={newCompose}>
                  <PencilSimple size={18} weight="bold" aria-hidden="true" />
                  {t('compose')}
                </Button>
              </span>
            }
          />
          <Fab label={t('compose')} onClick={newCompose}>
            <PencilSimple size={24} weight="bold" aria-hidden="true" />
          </Fab>

          <LayoutGroup id="message-folders">
            <div role="tablist" aria-label={t('title')} className="rise mb-8 inline-flex max-w-full gap-1 rounded-[16px] bg-surface p-1">
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

          {loading ? (
            <RowsSkeleton rows={6} lead="round" trailing />
          ) : error ? (
            <div className="squircle rounded-[26px] bg-surface"><ErrorView message={error} onRetry={reload} /></div>
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
