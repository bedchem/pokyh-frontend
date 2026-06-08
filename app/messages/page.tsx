'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Paperclip, Inbox, CheckCheck, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import EmptyView from '@/components/ui/EmptyView';
import ComposeMessageSheet, { type ComposeInitial } from '@/components/messages/ComposeMessageSheet';
import { fetchMessages, markAllMessagesRead, fetchDraft, deleteDraft, type MessageFolder } from '@/lib/api';
import type { MessagePreview } from '@/lib/types';

const FOLDERS: { key: MessageFolder; label: string }[] = [
  { key: 'inbox', label: 'Posteingang' },
  { key: 'sent', label: 'Gesendet' },
  { key: 'drafts', label: 'Entwürfe' },
];

function senderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash << 5) - hash + name.charCodeAt(i);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 50%)`;
}

function parseMessages(json: unknown): MessagePreview[] {
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
      // For sent/draft messages there's no sender — show the recipients instead.
      const recipients = Array.isArray(m.recipients) ? (m.recipients as Record<string, unknown>[]) : [];
      const recipientLabel = recipients
        .map((r) => (r.displayName as string) ?? (r.name as string) ?? '')
        .filter(Boolean)
        .join(', ');
      const senderName =
        (sender?.displayName as string) ??
        (sender?.name as string) ??
        (m.senderName as string) ??
        (recipientLabel ? `An: ${recipientLabel}` : 'Unbekannt');
      const sentDate =
        (m.sentDateTime as string) ??
        (m.sentDate as string) ??
        (m.date as string) ??
        '';
      const rawRead =
        (m.isRead as unknown) ??
        (m.read as unknown) ??
        (m.isread as unknown) ??
        (m.readFlag as unknown) ??
        (m.readStatus as unknown);
      const isRead =
        typeof rawRead === 'boolean'
          ? rawRead
          : typeof rawRead === 'number'
            ? rawRead === 1
            : typeof rawRead === 'string'
              ? rawRead.toLowerCase() === 'true' || rawRead === '1'
              : true;
      return {
        id: m.id as number,
        subject: (m.subject as string) ?? '(Kein Betreff)',
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

function formatMessageDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0)
      return date.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return date.toLocaleDateString('de', { weekday: 'short' });
    return date.toLocaleDateString('de', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
}

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<MessagePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeInitial, setComposeInitial] = useState<ComposeInitial | undefined>(undefined);
  const [openingDraftId, setOpeningDraftId] = useState<number | null>(null);
  const [deletingDraftId, setDeletingDraftId] = useState<number | null>(null);
  const [folder, setFolder] = useState<MessageFolder>('inbox');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchMessages(folder);
      setMessages(parseMessages(res));
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') {
        router.replace('/login');
      } else {
        setError(e instanceof Error ? e.message : 'Fehler');
      }
    } finally {
      setLoading(false);
    }
  }, [router, folder]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadIds = messages.filter((m) => !m.isRead).map((m) => m.id);

  async function openDraft(id: number) {
    if (openingDraftId != null) return;
    setOpeningDraftId(id);
    try {
      const d = await fetchDraft(id);
      setComposeInitial({ draftId: id, subject: d.subject, content: d.content, recipients: d.recipients, attachments: d.attachments });
      setShowCompose(true);
    } catch (e) {
      if (e instanceof Error && e.message === 'session_expired') router.replace('/login');
      else setError('Der Entwurf konnte nicht geöffnet werden.');
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
      if (e instanceof Error && e.message === 'session_expired') router.replace('/login');
      else setError('Der Entwurf konnte nicht gelöscht werden.');
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
        window.dispatchEvent(new CustomEvent('pockyh-messages-updated', { detail: { unread: 0 } }));
      }
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <AuthGuard>
      <UntisGuard>
      <div
        className="h-full flex flex-col overflow-hidden"
      >
        {/* Nav */}
        <div className="px-5 pt-4 pb-4 flex items-center gap-3 fade-in flex-shrink-0">
          <h1
            className="flex-1 text-[28px] font-bold tracking-tight"
            style={{ color: 'var(--app-text-primary)' }}
          >
            Nachrichten
          </h1>
          {folder === 'inbox' && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll || unreadIds.length === 0}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-medium press-scale disabled:opacity-50"
              style={{ background: 'var(--app-surface)', color: 'var(--accent)' }}
            >
              {markingAll ? <Spinner size={14} /> : <CheckCheck size={16} />}
              {!markingAll && 'Alle als gelesen'}
            </button>
          )}
          <button
            onClick={newCompose}
            className="w-10 h-10 flex items-center justify-center rounded-full press-scale flex-shrink-0"
            style={{ background: 'var(--accent)', color: '#fff' }}
            aria-label="Mitteilung verfassen"
          >
            <Pencil size={18} />
          </button>
        </div>

        {/* Folder tabs */}
        <div className="px-5 pb-3 flex gap-2 flex-shrink-0 fade-in">
          {FOLDERS.map((f) => {
            const active = folder === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFolder(f.key)}
                className="px-4 h-9 rounded-full text-[13px] font-semibold press-scale"
                style={{
                  background: active ? 'var(--accent)' : 'var(--app-surface)',
                  color: active ? '#fff' : 'var(--app-text-secondary)',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-auto pb-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size={28} />
            </div>
          ) : error ? (
            <ErrorView message={error} onRetry={load} />
          ) : messages.length === 0 ? (
            <EmptyView
              icon={<Inbox size={56} color="var(--app-text-primary)" />}
              title={folder === 'sent' ? 'Nichts gesendet' : folder === 'drafts' ? 'Keine Entwürfe' : 'Keine Nachrichten'}
              subtitle={
                folder === 'sent'
                  ? 'Du hast noch keine Nachrichten gesendet.'
                  : folder === 'drafts'
                    ? 'Du hast noch keine Entwürfe gespeichert.'
                    : 'Du hast noch keine Nachrichten erhalten.'
              }
            />
          ) : (
            <div style={{ background: 'var(--app-surface)' }} className="fade-in delay-1">
              {messages.map((msg, i) => {
                const isDraft = folder === 'drafts';
                const borderTop = i > 0 ? '1px solid var(--app-separator)' : 'none';

                const inner = (
                  <div className="px-4 py-4 flex items-center gap-3">
                    {/* Avatar with unread dot */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: senderColor(msg.senderName) }}
                      >
                        {msg.senderName.slice(0, 1).toUpperCase()}
                      </div>
                      {!msg.isRead && (
                        <div
                          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                          style={{ background: 'var(--accent)', borderColor: 'var(--app-surface)' }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-sm truncate"
                          style={{ color: 'var(--app-text-primary)', fontWeight: msg.isRead ? 400 : 700 }}
                        >
                          {msg.subject}
                        </p>
                        <p className="text-xs flex-shrink-0" style={{ color: 'var(--app-text-tertiary)' }}>
                          {formatMessageDate(msg.sentDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p
                          className="text-xs truncate flex-1"
                          style={{ color: 'var(--app-text-secondary)', fontWeight: msg.isRead ? 400 : 500 }}
                        >
                          {msg.senderName}
                          {msg.contentPreview ? ` · ${msg.contentPreview}` : ''}
                        </p>
                        {msg.hasAttachments && <Paperclip size={12} color="var(--app-text-tertiary)" />}
                      </div>
                    </div>

                    {!isDraft && <ChevronRight size={16} color="var(--app-text-tertiary)" />}
                  </div>
                );

                if (!isDraft) {
                  return (
                    <Link key={msg.id} href={`/messages/${msg.id}`} className="block press-scale" style={{ borderTop }}>
                      {inner}
                    </Link>
                  );
                }

                // Drafts: tap to edit, with a delete action.
                return (
                  <div key={msg.id} className="flex items-center" style={{ borderTop }}>
                    <button
                      onClick={() => openDraft(msg.id)}
                      disabled={openingDraftId != null || deletingDraftId === msg.id}
                      className="flex-1 min-w-0 text-left press-scale disabled:opacity-60"
                    >
                      {inner}
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(msg.id)}
                      disabled={deletingDraftId != null || openingDraftId != null}
                      className="w-11 h-11 mr-2 flex items-center justify-center rounded-full press-scale flex-shrink-0 disabled:opacity-50"
                      style={{ color: 'var(--danger)' }}
                      aria-label="Entwurf löschen"
                    >
                      {deletingDraftId === msg.id ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {showCompose && (
        <ComposeMessageSheet
          initial={composeInitial}
          onClose={() => { setShowCompose(false); setComposeInitial(undefined); }}
          onSent={load}
        />
      )}
      </UntisGuard>
    </AuthGuard>
  );
}
