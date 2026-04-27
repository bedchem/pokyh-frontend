'use client';

import { use, useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  FileText,
  Image as ImageIcon,
  Archive,
  Film,
  File,
  Music,
  X,
  AlertTriangle,
  ExternalLink,
  Paperclip,
  RefreshCw,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import { fetchMessageDetail, fetchMessageAttachments, markMessageRead, getAttachmentUrl } from '@/lib/api';
import type { MessageDetail, MessageAttachment } from '@/lib/types';

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

const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;

function sanitizeMessageHtml(raw: string): string {
  if (!raw) return '';
  if (typeof window === 'undefined') return raw.replace(/<[^>]+>/g, '').trim();

  const looksLikeHtml = /<[a-z][^>]*>/i.test(raw);
  let html: string;
  if (looksLikeHtml) {
    html = raw;
  } else {
    html = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(URL_REGEX, '<a href="$1">$1</a>');
  }

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    for (const tag of ['script', 'style', 'iframe', 'object', 'embed', 'form', 'meta', 'link', 'input', 'button']) {
      doc.querySelectorAll(tag).forEach((el) => el.remove());
    }
    doc.body.querySelectorAll('*').forEach((el) => {
      const toRemove = [...el.attributes].filter((a) => {
        if (a.name.startsWith('on')) return true;
        if (a.name === 'style') return true;
        if ((a.name === 'href' || a.name === 'src') && /^javascript:/i.test(a.value.trim())) return true;
        return false;
      });
      toRemove.forEach((a) => el.removeAttribute(a.name));
    });
    return doc.body.innerHTML;
  } catch {
    return raw.replace(/<[^>]+>/g, '').replace(/\n/g, '<br>');
  }
}

function coerceAttachmentList(v: unknown): Array<Record<string, unknown>> | null {
  if (Array.isArray(v)) return v as Array<Record<string, unknown>>;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    for (const key of ['attachments', 'messageFile', 'files', 'data']) {
      if (Array.isArray(o[key])) return o[key] as Array<Record<string, unknown>>;
    }
  }
  return null;
}

function parseOneAttachment(a: Record<string, unknown>): MessageAttachment {
  const rawId = a.id ?? a.fileId;
  const numId = typeof rawId === 'number' ? rawId : parseInt(String(rawId ?? '0'), 10);
  return {
    id: isNaN(numId) ? 0 : numId,
    storageId: (a.storageId as string) ?? '',
    name: ((a.name ?? a.fileName ?? a.originalName ?? a.src ?? 'Anhang') as string),
    size: typeof a.size === 'number' ? a.size : typeof a.fileSize === 'number' ? a.fileSize : 0,
  };
}

function parseStorageAttachment(a: Record<string, unknown>): MessageAttachment {
  return {
    id: 0,
    storageId: (a.id as string) ?? '',  // storageAttachments uses 'id' as UUID
    name: (a.name as string) ?? 'Anhang',
    size: 0,
  };
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

    // Mirror Flutter: try all known field names, including singular 'attachment'
    const rawList =
      coerceAttachmentList(msg.attachments) ??
      coerceAttachmentList(msg.messageFile) ??
      coerceAttachmentList(msg.files) ??
      coerceAttachmentList(msg.fileAttachments) ??
      coerceAttachmentList(msg.attachment) ??
      coerceAttachmentList(msg.data) ??
      [];
    const normalAttachments = rawList.map(parseOneAttachment);

    // Mirror Flutter: storageAttachments is a separate array (UUID-keyed)
    const storageList = Array.isArray(msg.storageAttachments)
      ? (msg.storageAttachments as Array<Record<string, unknown>>)
      : [];
    const storageAttachments = storageList.map(parseStorageAttachment);

    const attachments = normalAttachments.length > 0 ? normalAttachments : storageAttachments;

    const hasAttachments =
      attachments.length > 0 ||
      (msg.hasAttachments as boolean) === true ||
      ((msg.attachmentCount as number) ?? 0) > 0;

    return {
      id: msg.id as number,
      subject: (msg.subject as string) ?? '(Kein Betreff)',
      contentPreview: '',
      senderName,
      senderId: (sender?.userId as number) ?? 0,
      sentDate,
      isRead: true,
      hasAttachments,
      body: (msg.body as string) ?? (msg.content as string) ?? '',
      attachments,
    };
  } catch {
    return null;
  }
}

function parseAttachmentsFallback(json: unknown): MessageAttachment[] {
  try {
    if (Array.isArray(json)) {
      return (json as Record<string, unknown>[]).map(parseOneAttachment);
    }
    const root = json as Record<string, unknown>;
    const arr =
      coerceAttachmentList(root.attachments) ??
      coerceAttachmentList(root.messageFile) ??
      coerceAttachmentList(root.files) ??
      coerceAttachmentList(root.fileAttachments) ??
      coerceAttachmentList(root.attachment) ??
      coerceAttachmentList(root.items) ??
      coerceAttachmentList(root.content) ??
      null;
    if (arr) return arr.map(parseOneAttachment);

    // storageAttachments fallback
    if (Array.isArray(root.storageAttachments)) {
      return (root.storageAttachments as Record<string, unknown>[]).map(parseStorageAttachment);
    }
    return [];
  } catch {
    return [];
  }
}

interface FileStyle {
  icon: React.ReactNode;
  color: string;
  type: 'image' | 'pdf' | 'other';
}

function getFileStyle(name: string): FileStyle {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf'))
    return { icon: <FileText size={22} />, color: '#E53935', type: 'pdf' };
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.heic'].some((e) => n.endsWith(e)))
    return { icon: <ImageIcon size={22} />, color: '#1E88E5', type: 'image' };
  if (['.doc', '.docx'].some((e) => n.endsWith(e)))
    return { icon: <FileText size={22} />, color: '#1565C0', type: 'other' };
  if (['.xls', '.xlsx'].some((e) => n.endsWith(e)))
    return { icon: <FileText size={22} />, color: '#2E7D32', type: 'other' };
  if (['.ppt', '.pptx'].some((e) => n.endsWith(e)))
    return { icon: <FileText size={22} />, color: '#E65100', type: 'other' };
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].some((e) => n.endsWith(e)))
    return { icon: <Archive size={22} />, color: '#6D4C41', type: 'other' };
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].some((e) => n.endsWith(e)))
    return { icon: <Film size={22} />, color: '#6A1B9A', type: 'other' };
  if (['.mp3', '.m4a', '.wav'].some((e) => n.endsWith(e)))
    return { icon: <Music size={22} />, color: '#AD1457', type: 'other' };
  return { icon: <File size={22} />, color: 'var(--accent)', type: 'other' };
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

  // Attachment fallback state (null = not yet attempted)
  const [loadedAttachments, setLoadedAttachments] = useState<MessageAttachment[] | null>(null);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsFetchFailed, setAttachmentsFetchFailed] = useState(false);

  const [linkWarning, setLinkWarning] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string; type: 'image' | 'pdf' | 'other' } | null>(null);

  const fetchFallbackAttachments = useCallback(async (msgId: number) => {
    setAttachmentsLoading(true);
    setAttachmentsFetchFailed(false);
    try {
      const data = await fetchMessageAttachments(msgId);
      const list = parseAttachmentsFallback(data);
      setLoadedAttachments(list); // empty array = no attachments, that's fine
    } catch {
      setAttachmentsFetchFailed(true);
      setLoadedAttachments([]);
    } finally {
      setAttachmentsLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setLoadedAttachments(null);
    setAttachmentsFetchFailed(false);
    try {
      const data = await fetchMessageDetail(parseInt(id));
      const parsed = parseMessageDetail(data);
      setMsg(parsed);
      markMessageRead(parseInt(id)).catch(() => {});

      // Always probe for attachments when the detail response didn't include them.
      // WebUntis sometimes returns hasAttachments:false even when attachments exist.
      if (parsed && parsed.attachments.length === 0) {
        fetchFallbackAttachments(parsed.id);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') {
        router.replace('/login');
      } else {
        setError(e instanceof Error ? e.message : 'Fehler');
      }
    } finally {
      setLoading(false);
    }
  }, [id, router, fetchFallbackAttachments]);

  useEffect(() => {
    load();
  }, [load]);

  // Effective attachment list: from detail or from fallback
  const attachments: MessageAttachment[] =
    msg && msg.attachments.length > 0
      ? msg.attachments
      : loadedAttachments ?? [];

  const showAttachmentSection =
    attachments.length > 0 ||
    attachmentsLoading ||
    attachmentsFetchFailed;

  function openAttachment(att: MessageAttachment) {
    const url = getAttachmentUrl(msg!.id, att.storageId, att.name, att.id);
    const { type } = getFileStyle(att.name);
    if (type === 'image' || type === 'pdf') {
      setPreview({ url, name: att.name, type });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <AuthGuard>
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{ background: 'var(--app-bg)' }}
      >
        {/* Nav */}
        <div className="px-5 pt-4 pb-4 flex items-center gap-3 fade-in">
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
            <div className="flex flex-col gap-3">
              {/* Header card: subject + sender */}
              <div
                className="rounded-2xl p-4 fade-in delay-1"
                style={{ background: 'var(--app-surface)' }}
              >
                <p
                  className="text-[20px] font-bold mb-3 leading-tight"
                  style={{ color: 'var(--app-text-primary)', letterSpacing: '-0.3px' }}
                >
                  {msg.subject}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      background: `color-mix(in srgb, ${senderColor(msg.senderName)} 15%, transparent)`,
                      color: senderColor(msg.senderName),
                    }}
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
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      {formatDate(msg.sentDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body + Attachments — one card (mail-app style) */}
              <div
                className="rounded-2xl overflow-hidden fade-in delay-2"
                style={{ background: 'var(--app-surface)' }}
              >
                {/* Body */}
                {msg.body ? (
                  /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
                  <div
                    className="message-html-body text-[15px] leading-relaxed px-4"
                    style={{
                      color: 'var(--app-text-primary)',
                      paddingTop: 16,
                      paddingBottom: showAttachmentSection ? 12 : 16,
                    }}
                    dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(msg.body) }}
                    onClick={(e) => {
                      const anchor = (e.target as HTMLElement).closest('a');
                      if (!anchor) return;
                      e.preventDefault();
                      const href = anchor.getAttribute('href') ?? '';
                      if (href) setLinkWarning(href);
                    }}
                  />
                ) : null}

                {/* Divider */}
                {showAttachmentSection && msg.body ? (
                  <div style={{ height: 1, background: 'var(--app-separator)', opacity: 0.5 }} />
                ) : null}

                {/* Attachment section */}
                {showAttachmentSection && (
                  <div>
                    {/* Header row */}
                    <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-1.5">
                      <Paperclip size={13} color="var(--app-text-tertiary)" />
                      {attachmentsLoading ? (
                        <>
                          <Spinner size={10} />
                          <span className="text-xs" style={{ color: 'var(--app-text-tertiary)' }}>
                            Anhänge werden geladen…
                          </span>
                        </>
                      ) : (
                        <span
                          className="text-xs font-semibold"
                          style={{ color: 'var(--app-text-tertiary)', letterSpacing: '0.2px' }}
                        >
                          {attachments.length === 1 ? '1 Anhang' : attachments.length > 1 ? `${attachments.length} Anhänge` : 'Fehler beim Laden'}
                        </span>
                      )}
                    </div>

                    {/* Attachment tiles */}
                    {attachments.length > 0 && (
                      <div className="px-3 pb-3 flex flex-col gap-1.5">
                        {attachments.map((att) => {
                          const { icon, color } = getFileStyle(att.name);
                          const url = getAttachmentUrl(msg.id, att.storageId, att.name, att.id);
                          return (
                            <div
                              key={att.id ?? att.storageId}
                              className="flex items-center gap-1.5 rounded-xl overflow-hidden"
                              style={{ background: 'var(--app-bg)' }}
                            >
                              {/* Main open button */}
                              <button
                                onClick={() => openAttachment(att)}
                                className="flex items-center gap-3 px-2.5 py-2.5 press-scale flex-1 text-left min-w-0"
                              >
                                {/* Colored file-type icon box */}
                                <div
                                  className="flex items-center justify-center rounded-xl flex-shrink-0"
                                  style={{
                                    width: 44,
                                    height: 44,
                                    background: `${color}1f`,
                                    color,
                                  }}
                                >
                                  {icon}
                                </div>

                                {/* Name + size */}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="text-sm font-medium leading-snug truncate"
                                    style={{ color: 'var(--app-text-primary)' }}
                                  >
                                    {att.name}
                                  </p>
                                  {att.size > 0 && (
                                    <p
                                      className="text-xs mt-0.5"
                                      style={{ color: 'var(--app-text-tertiary)' }}
                                    >
                                      {formatFileSize(att.size)}
                                    </p>
                                  )}
                                </div>

                                <ArrowUpRight size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
                              </button>

                              {/* Download button */}
                              <a
                                href={url}
                                download={att.name}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center flex-shrink-0 press-scale"
                                style={{
                                  width: 44,
                                  height: 44,
                                  marginRight: 6,
                                  borderRadius: 12,
                                  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                                }}
                                title="Herunterladen"
                              >
                                <Download size={18} color="var(--accent)" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Retry button */}
                    {attachmentsFetchFailed && attachments.length === 0 && !attachmentsLoading && (
                      <div className="px-3 pb-3">
                        <button
                          onClick={() => fetchFallbackAttachments(msg.id)}
                          className="flex items-center gap-3 rounded-xl px-3.5 py-3.5 press-scale w-full text-left"
                          style={{ background: 'var(--app-bg)' }}
                        >
                          <div
                            className="flex items-center justify-center rounded-xl flex-shrink-0"
                            style={{
                              width: 44,
                              height: 44,
                              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                            }}
                          >
                            <ArrowUpRight size={22} color="var(--accent)" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                              Anhang laden
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-tertiary)' }}>
                              Tippen zum erneuten Laden
                            </p>
                          </div>
                          <RefreshCw size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
                        </button>
                      </div>
                    )}

                    {/* Bottom padding when loading or empty-not-failed */}
                    {(attachmentsLoading || (attachments.length === 0 && !attachmentsFetchFailed)) && (
                      <div style={{ height: 8 }} />
                    )}
                  </div>
                )}

                {/* Bottom padding when no attachments at all */}
                {!showAttachmentSection && !msg.body && <div style={{ height: 16 }} />}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Link warning modal */}
      {linkWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setLinkWarning(null)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            style={{ background: 'var(--app-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--warning) 15%, transparent)' }}
              >
                <AlertTriangle size={20} color="var(--warning)" />
              </div>
              <div>
                <p className="font-bold text-[16px]" style={{ color: 'var(--app-text-primary)' }}>
                  Externer Link
                </p>
                <p className="text-xs" style={{ color: 'var(--app-text-secondary)' }}>
                  Du verlässt die POKYH App
                </p>
              </div>
            </div>
            <p
              className="text-sm break-all px-3 py-2.5 rounded-xl mb-5"
              style={{ background: 'var(--app-card)', color: 'var(--accent)' }}
            >
              {linkWarning}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLinkWarning(null)}
                className="flex-1 py-3 rounded-xl font-medium text-sm"
                style={{ background: 'var(--app-card)', color: 'var(--app-text-primary)' }}
              >
                Abbrechen
              </button>
              <a
                href={linkWarning}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white text-center press-scale flex items-center justify-center gap-1.5"
                style={{ background: 'var(--accent)' }}
                onClick={() => setLinkWarning(null)}
              >
                Öffnen
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Attachment preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(0,0,0,0.92)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm font-medium text-white/80 truncate flex-1 mr-4">{preview.name}</p>
            <div className="flex items-center gap-2">
              <a
                href={preview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl press-scale"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <ExternalLink size={16} color="white" />
              </a>
              <button
                onClick={() => setPreview(null)}
                className="p-2 rounded-xl press-scale"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <X size={18} color="white" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
            {preview.type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt={preview.name}
                className="max-w-full max-h-full object-contain rounded-xl"
                style={{ boxShadow: '0 0 60px rgba(0,0,0,0.5)' }}
              />
            ) : preview.type === 'pdf' ? (
              <iframe
                src={preview.url}
                title={preview.name}
                className="w-full h-full rounded-xl"
                style={{ border: 'none', background: '#fff' }}
              />
            ) : null}
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
