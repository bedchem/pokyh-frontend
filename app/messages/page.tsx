'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Paperclip, Inbox, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import UntisGuard from '@/components/UntisGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import EmptyView from '@/components/ui/EmptyView';
import { fetchMessages, markAllMessagesRead } from '@/lib/api';
import type { MessagePreview } from '@/lib/types';

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
    // Primary: incomingMessages; fallback: messages, data.incomingMessages, data[]
    const arr =
      (root?.incomingMessages as unknown[]) ??
      (root?.messages as unknown[]) ??
      ((root?.data as Record<string, unknown>)?.incomingMessages as unknown[]) ??
      (Array.isArray(root?.data) ? (root.data as unknown[]) : null) ??
      [];

    return (arr as Record<string, unknown>[]).map((m) => {
      const sender =
        typeof m.sender === 'object' && m.sender !== null
          ? (m.sender as Record<string, unknown>)
          : null;
      const senderName =
        (sender?.displayName as string) ??
        (sender?.name as string) ??
        (m.senderName as string) ??
        'Unbekannt';
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

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchMessages();
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
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadIds = messages.filter((m) => !m.isRead).map((m) => m.id);

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
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadIds.length === 0}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-medium press-scale disabled:opacity-50"
            style={{ background: 'var(--app-surface)', color: 'var(--accent)' }}
          >
            {markingAll ? <Spinner size={14} /> : <CheckCheck size={16} />}
            {!markingAll && 'Alle als gelesen'}
          </button>
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
              title="Keine Nachrichten"
              subtitle="Du hast noch keine Nachrichten erhalten."
            />
          ) : (
            <div style={{ background: 'var(--app-surface)' }} className="fade-in delay-1">
              {messages.map((msg, i) => (
                <Link
                  key={msg.id}
                  href={`/messages/${msg.id}`}
                  className="block press-scale"
                  style={{
                    borderTop:
                      i > 0 ? '1px solid var(--app-separator)' : 'none',
                  }}
                >
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
                          style={{
                            background: 'var(--accent)',
                            borderColor: 'var(--app-surface)',
                          }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-sm truncate"
                          style={{
                            color: 'var(--app-text-primary)',
                            fontWeight: msg.isRead ? 400 : 700,
                          }}
                        >
                          {msg.subject}
                        </p>
                        <p
                          className="text-xs flex-shrink-0"
                          style={{ color: 'var(--app-text-tertiary)' }}
                        >
                          {formatMessageDate(msg.sentDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p
                          className="text-xs truncate flex-1"
                          style={{
                            color: 'var(--app-text-secondary)',
                            fontWeight: msg.isRead ? 400 : 500,
                          }}
                        >
                          {msg.senderName}
                          {msg.contentPreview ? ` · ${msg.contentPreview}` : ''}
                        </p>
                        {msg.hasAttachments && (
                          <Paperclip
                            size={12}
                            color="var(--app-text-tertiary)"
                          />
                        )}
                      </div>
                    </div>

                    <ChevronRight size={16} color="var(--app-text-tertiary)" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      </UntisGuard>
    </AuthGuard>
  );
}
