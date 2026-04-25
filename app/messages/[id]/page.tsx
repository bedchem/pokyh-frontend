'use client';

import { use, useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  FileText,
  Image as ImageIcon,
  Archive,
  Film,
  File,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import { fetchMessageDetail, markMessageRead, getAttachmentUrl } from '@/lib/api';
import type { MessageDetail } from '@/lib/types';

function senderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash << 5) - hash + name.charCodeAt(i);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 50%)`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('de', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  } catch {
    return dateStr;
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseMessageDetail(json: unknown): MessageDetail | null {
  try {
    const root = json as Record<string, unknown>;
    const msg =
      ((root?.data as Record<string, unknown>)?.message as Record<string, unknown>) ??
      (root?.message as Record<string, unknown>) ??
      (root?.data as Record<string, unknown>) ??
      root;

    if (!msg || !msg.id) return null;

    const sender =
      typeof msg.sender === 'object' && msg.sender !== null
        ? (msg.sender as Record<string, unknown>)
        : null;
    const senderName =
      (sender?.displayName as string) ??
      (sender?.name as string) ??
      (msg.senderName as string) ??
      'Unbekannt';
    const sentDate =
      (msg.sentDateTime as string) ??
      (msg.sentDate as string) ??
      (msg.date as string) ??
      '';

    const rawAttachments =
      (msg.attachments as Array<Record<string, unknown>>) ?? [];
    const attachments = rawAttachments.map((a) => ({
      id: a.id as number,
      storageId: (a.storageId as string) ?? '',
      name: (a.name as string) ?? 'Anhang',
      size: (a.size as number) ?? 0,
    }));

    return {
      id: msg.id as number,
      subject: (msg.subject as string) ?? '(Kein Betreff)',
      contentPreview: '',
      senderName,
      senderId: (sender?.userId as number) ?? 0,
      sentDate,
      isRead: true,
      hasAttachments: attachments.length > 0,
      body: (msg.body as string) ?? (msg.content as string) ?? '',
      attachments,
    };
  } catch {
    return null;
  }
}

function attachmentIcon(name: string): React.ReactNode {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic'].includes(ext))
    return <ImageIcon size={18} color="var(--accent)" />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
    return <Archive size={18} color="var(--orange)" />;
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext))
    return <Film size={18} color="var(--accent-soft)" />;
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext))
    return <FileText size={18} color="var(--accent)" />;
  return <File size={18} color="var(--app-text-secondary)" />;
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [msg, setMsg] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMessageDetail(parseInt(id));
      const parsed = parseMessageDetail(data);
      setMsg(parsed);
      markMessageRead(parseInt(id)).catch(() => {});
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') {
        router.replace('/login');
      } else {
        setError(e instanceof Error ? e.message : 'Fehler');
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AuthGuard>
      <div
        className="h-dvh flex flex-col overflow-hidden"
        style={{ background: 'var(--app-bg)' }}
      >
        {/* Nav */}
        <div className="px-5 pt-14 pb-4 flex items-center gap-3 fade-in">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full press-scale"
            style={{ background: 'var(--app-surface)' }}
          >
            <ChevronLeft size={20} color="var(--accent)" />
          </button>
          <h1
            className="flex-1 text-[17px] font-semibold truncate"
            style={{ color: 'var(--app-text-primary)' }}
          >
            {msg?.subject ?? 'Nachricht'}
          </h1>
        </div>

        <div className="flex-1 px-4 pb-10 overflow-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size={28} />
            </div>
          ) : error ? (
            <ErrorView message={error} onRetry={load} />
          ) : msg ? (
            <div className="flex flex-col gap-4">
              {/* Header card */}
              <div
                className="rounded-2xl p-4 fade-in delay-1"
                style={{ background: 'var(--app-surface)' }}
              >
                <p
                  className="text-[17px] font-bold mb-3"
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  {msg.subject}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: senderColor(msg.senderName) }}
                  >
                    {msg.senderName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      {msg.senderName}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--app-text-tertiary)' }}
                    >
                      {formatDate(msg.sentDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div
                className="rounded-2xl p-5 fade-in delay-2"
                style={{ background: 'var(--app-surface)' }}
              >
                <p
                  className="text-[15px] leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  {htmlToText(msg.body ?? '')}
                </p>
              </div>

              {/* Attachments */}
              {msg.attachments?.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden fade-in delay-3"
                  style={{ background: 'var(--app-surface)' }}
                >
                  <p
                    className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--app-text-secondary)' }}
                  >
                    Anhänge ({msg.attachments.length})
                  </p>
                  {msg.attachments.map((att, i) => (
                    <a
                      key={att.id}
                      href={getAttachmentUrl(msg.id, att.storageId, att.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 flex items-center gap-3 press-scale"
                      style={{
                        borderTop:
                          i > 0 ? '1px solid var(--app-separator)' : 'none',
                        display: 'flex',
                        textDecoration: 'none',
                      }}
                    >
                      <div className="flex-shrink-0">
                        {attachmentIcon(att.name)}
                      </div>
                      <p
                        className="flex-1 text-sm truncate"
                        style={{ color: 'var(--app-text-primary)' }}
                      >
                        {att.name}
                      </p>
                      {att.size > 0 && (
                        <p
                          className="text-xs flex-shrink-0"
                          style={{ color: 'var(--app-text-tertiary)' }}
                        >
                          {formatFileSize(att.size)}
                        </p>
                      )}
                      <ExternalLink size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </AuthGuard>
  );
}
