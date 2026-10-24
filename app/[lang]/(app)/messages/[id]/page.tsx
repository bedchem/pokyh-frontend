'use client';

import { use, useCallback, useEffect, useState } from 'react';
import ComposeMessageSheet from '@/components/messages/ComposeMessageSheet';
import { fetchReplyForm } from '@/lib/api';
import { untisActionsDict } from '@/lib/i18n/dictionaries/untisActions';
import {
  ArrowLeft,
  ArrowSquareOut,
  ArrowClockwise,
  ArrowUUpLeft,
  ArrowCounterClockwise,
  Check,
  CheckCircle,
  DownloadSimple,
  Eye,
  File,
  FileArchive,
  FileAudio,
  FileDoc,
  FileImage,
  FilePdf,
  FilePpt,
  FileVideo,
  FileXls,
  PaperPlaneTilt,
  Paperclip,
  Trash,
  WarningCircle,
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { MediaItem } from '@/components/ui/MediaViewer';
import { uiDict } from '@/lib/i18n/dictionaries/ui';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import Sheet from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Page } from '@/components/app/Page';
import { Bone, Line } from '@/components/app/Skeleton';
import { initialsOf } from '@/components/app/hooks';
import ErrorView from '@/components/ui/ErrorView';
import { fetchMessageDetail, fetchMessageAttachments, markOpenedMessageRead, getAttachmentUrl, getMessageDetailStale, getMessagesStale, deleteMessages, confirmMessageRead, fetchReadStatus, revokeMessage, type ReadStatusRecipient } from '@/lib/api';
import { messageRecipientNames } from '@/lib/untis-parse';
import type { MessageDetail, MessageAttachment } from '@/lib/types';
import { useDateLocale, useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { messagesDict, type MessagesKey } from '@/lib/i18n/dictionaries/messages';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { formatDateTime } from '@/lib/i18n/dateLocale';
import { leaveForLogin } from '@/providers/SessionProvider';
import { ROUTE_PLACEHOLDER, useRouteId } from '@/lib/route-id';

const MediaViewer = dynamic(() => import('@/components/ui/MediaViewer'), { ssr: false });

type TFn = (key: MessagesKey, vars?: Record<string, string | number>) => string;

function formatDate(dateStr: string, tag: string): string {
  if (!dateStr) return '';
  try {
    return formatDateTime(new Date(dateStr), tag, {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  } catch {
    return dateStr;
  }
}

const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;

function sanitizeMessageHtml(input: string): string {
  // Trailing blank lines and breaks only add empty space under the text.
  const raw = (input ?? '').replace(/(\s|<br\s*\/?>|&nbsp;)+$/i, '');
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

function parseOneAttachment(a: Record<string, unknown>, fallbackName = 'file'): MessageAttachment {
  const rawId = a.id ?? a.fileId;
  const numId = typeof rawId === 'number' ? rawId : parseInt(String(rawId ?? '0'), 10);
  return {
    id: isNaN(numId) ? 0 : numId,
    storageId: (a.storageId as string) ?? '',
    name: ((a.name ?? a.fileName ?? a.originalName ?? a.src ?? fallbackName) as string),
    size: typeof a.size === 'number' ? a.size : typeof a.fileSize === 'number' ? a.fileSize : 0,
  };
}

function parseStorageAttachment(a: Record<string, unknown>, fallbackName = 'file'): MessageAttachment {
  return {
    id: 0,
    storageId: (a.id as string) ?? '',
    name: (a.name as string) ?? fallbackName,
    size: 0,
  };
}

// A sent message as the stored "Gesendet" list has it, for what the detail
// response leaves out (recipients, read confirmations).
function sentListEntry(id: number): Record<string, unknown> | undefined {
  const root = (getMessagesStale('sent') ?? {}) as Record<string, unknown>;
  const data = (root.data as Record<string, unknown>) ?? {};
  const list = (root.sentMessages ?? data.sentMessages ?? []) as Record<string, unknown>[];
  return Array.isArray(list) ? list.find((x) => x.id === id) : undefined;
}

function sentListRecipients(id: number): string {
  const m = sentListEntry(id);
  return m ? messageRecipientNames(m).join(', ') : '';
}

function parseMessageDetail(json: unknown, t: TFn, outgoing = false): MessageDetail | null {
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
    // A sent message names its recipients instead of a sender.
    const senderName = outgoing
      ? messageRecipientNames(msg).join(', ') || sentListRecipients(msg.id as number)
      : (sender?.displayName as string) ??
        (sender?.name as string) ??
        (msg.senderName as string) ??
        t('unknown');
    const sentDate =
      (msg.sentDateTime as string) ??
      (msg.sentDate as string) ??
      (msg.date as string) ??
      '';

    const rawList =
      coerceAttachmentList(msg.attachments) ??
      coerceAttachmentList(msg.messageFile) ??
      coerceAttachmentList(msg.files) ??
      coerceAttachmentList(msg.fileAttachments) ??
      coerceAttachmentList(msg.attachment) ??
      coerceAttachmentList(msg.data) ??
      [];
    const normalAttachments = rawList.map((a) => parseOneAttachment(a, t('attachment')));

    const storageList = Array.isArray(msg.storageAttachments)
      ? (msg.storageAttachments as Array<Record<string, unknown>>)
      : [];
    const storageAttachments = storageList.map((a) => parseStorageAttachment(a, t('attachment')));

    // A single file sent with the message itself (WebUntis "blobAttachment").
    const blob = msg.blobAttachment && typeof msg.blobAttachment === 'object' ? msg.blobAttachment as Record<string, unknown> : null;
    const blobAttachments = blob && (blob.id ?? blob.name) ? [parseOneAttachment(blob, t('attachment'))] : [];

    const attachments = normalAttachments.length > 0 ? normalAttachments : storageAttachments.length > 0 ? storageAttachments : blobAttachments;

    const hasAttachments =
      attachments.length > 0 ||
      (msg.hasAttachments as boolean) === true ||
      ((msg.attachmentCount as number) ?? 0) > 0;

    // Read confirmations: asked of this reader (inbox), or how many recipients gave one (sent).
    const rc = msg.requestConfirmation && typeof msg.requestConfirmation === 'object' ? msg.requestConfirmation as Record<string, unknown> : null;
    const rawStatus = msg.requestConfirmationStatus ?? (outgoing ? sentListEntry(msg.id as number)?.requestConfirmationStatus : null);
    const status = rawStatus && typeof rawStatus === 'object' ? rawStatus as Record<string, unknown> : null;

    return {
      id: msg.id as number,
      subject: (msg.subject as string) ?? t('noSubject'),
      contentPreview: '',
      senderName,
      senderId: (sender?.userId as number) ?? 0,
      sentDate,
      isRead: true,
      hasAttachments,
      body: (msg.body as string) ?? (msg.content as string) ?? '',
      attachments,
      requestConfirmation: rc ? {
        canConfirm: rc.allowSendRequestConfirmation === true && !rc.confirmationDate,
        confirmedAt: typeof rc.confirmationDate === 'string' ? rc.confirmationDate : null,
        confirmedBy: typeof rc.confirmerUserDisplayName === 'string' ? rc.confirmerUserDisplayName : null,
      } : null,
      readStatus: status ? { confirmed: Number(status.confirmedRequestCount) || 0, total: Number(status.totalRequestCount) || 0 } : null,
      canRevoke: outgoing && msg.allowMessageDeletion === true && msg.isRevoked !== true,
      isRevoked: msg.isRevoked === true,
    };
  } catch {
    return null;
  }
}

// The list the API answers to `attachments=1`, taken from the detail already
// loaded instead of asking for the same message again.
function attachmentListOf(detail: unknown): { attachments: unknown } {
  const root = (detail ?? {}) as Record<string, unknown>;
  const data = (root.data as Record<string, unknown>) ?? root;
  return { attachments: data.storageAttachments ?? data.attachments ?? [] };
}

function parseAttachmentsFallback(json: unknown, fallbackName: string): MessageAttachment[] {
  try {
    if (Array.isArray(json)) {
      return (json as Record<string, unknown>[]).map((a) => parseOneAttachment(a, fallbackName));
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
    if (arr) return arr.map((a) => parseOneAttachment(a, fallbackName));

    if (Array.isArray(root.storageAttachments)) {
      return (root.storageAttachments as Record<string, unknown>[]).map((a) => parseStorageAttachment(a, fallbackName));
    }
    return [];
  } catch {
    return [];
  }
}

/** A tile per file kind, in the app's tones. */
function fileKind(name: string): { Icon: typeof File; tone: string } {
  const n = name.toLowerCase();
  const ends = (...ext: string[]) => ext.some((e) => n.endsWith(e));
  if (ends('.pdf')) return { Icon: FilePdf, tone: 'bg-blush text-blush-ink' };
  if (ends('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.heic')) return { Icon: FileImage, tone: 'bg-periwinkle text-periwinkle-ink' };
  if (ends('.doc', '.docx', '.odt', '.rtf', '.txt')) return { Icon: FileDoc, tone: 'bg-periwinkle text-periwinkle-ink' };
  if (ends('.xls', '.xlsx', '.ods', '.csv')) return { Icon: FileXls, tone: 'bg-sage text-sage-ink' };
  if (ends('.ppt', '.pptx', '.odp')) return { Icon: FilePpt, tone: 'bg-butter text-butter-ink' };
  if (ends('.zip', '.rar', '.7z', '.tar', '.gz')) return { Icon: FileArchive, tone: 'bg-butter text-butter-ink' };
  if (ends('.mp4', '.mov', '.avi', '.mkv', '.webm')) return { Icon: FileVideo, tone: 'bg-blush text-blush-ink' };
  if (ends('.mp3', '.m4a', '.wav')) return { Icon: FileAudio, tone: 'bg-sage text-sage-ink' };
  return { Icon: File, tone: 'bg-inset text-ink-2' };
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const rowLine = 'relative before:absolute before:inset-x-3.5 before:top-0 before:h-px before:bg-line before:transition-opacity first:before:hidden hover:before:opacity-0 [&:hover+li]:before:opacity-0';

/** PDFs and pictures open in the viewer; anything else only downloads. */
function viewerKind(name: string): 'pdf' | 'image' | null {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf')) return 'pdf';
  if (/\.(jpe?g|png|gif|webp)$/.test(n)) return 'image';
  return null;
}

function AttachmentRow({ att, msgId, onOpen }: { att: MessageAttachment; msgId: number; onOpen: (item: MediaItem) => void }) {
  const tu = useT(uiDict);
  const [downloading, setDownloading] = useState(false);
  const { Icon, tone } = fileKind(att.name);
  const url = getAttachmentUrl(msgId, att.storageId, att.name, att.id);
  const kind = viewerKind(att.name);

  async function download() {
    if (downloading) return;
    setDownloading(true);
    try {
      // From the API: its session cookie has to go along.
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('download_failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = att.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch {
      // the row stays as it was; tapping it again retries
    } finally {
      setDownloading(false);
    }
  }

  const open = () => {
    if (kind === 'pdf') onOpen({ kind: 'pdf', src: url, name: att.name });
    else if (kind === 'image') onOpen({ kind: 'image', src: url, name: att.name, download: true });
    else void download();
  };

  return (
    <li className={`${rowLine} flex items-center gap-1 pr-2`}>
      <button
        type="button"
        onClick={open}
        aria-busy={!kind && downloading}
        aria-label={kind ? tu('viewerOpenFile', { name: att.name }) : `${att.name}, ${tu('viewerDownload')}`}
        className="flex min-w-0 flex-1 items-center gap-3.5 rounded-[18px] px-3 py-3 text-left transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--surface)_92%,var(--ink))]"
      >
        <span className={`grid size-11 shrink-0 place-items-center rounded-[13px] ${tone}`} aria-hidden="true">
          <Icon size={22} weight="bold" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{att.name}</span>
          {att.size > 0 && <span className="mt-0.5 block text-[13px] text-ink-3 tnum">{formatFileSize(att.size)}</span>}
        </span>
      </button>
      {/* Download right beside it, whatever the file is. */}
      <a
        href={url}
        onClick={(e) => { e.preventDefault(); void download(); }}
        aria-label={`${att.name}, ${tu('viewerDownload')}`}
        aria-busy={downloading}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-inset text-ink transition-colors hover:bg-[color-mix(in_srgb,var(--inset)_86%,var(--ink))]"
      >
        {downloading ? <Spinner size={16} /> : <DownloadSimple size={18} weight="bold" aria-hidden="true" />}
      </a>
    </li>
  );
}

function MessageSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6 text-ink">
      <span className="flex flex-col gap-3"><Line w="70%" h={30} /><Line w="45%" h={30} /></span>
      <span className="flex items-center gap-3">
        <Bone className="!rounded-full" style={{ width: 44, height: 44 }} />
        <span className="flex flex-col gap-2"><Line w={140} h={13} /><Line w={110} h={11} /></span>
      </span>
      <span className="squircle flex flex-col gap-3 rounded-[24px] bg-surface p-5 md:p-7">
        {['92%', '86%', '95%', '60%', '', '88%', '74%'].map((w, i) => (w ? <Line key={i} w={w} h={13} /> : <span key={i} className="h-2" />))}
      </span>
    </div>
  );
}

// The message named by the address, once it is known in the browser (lib/route-id.ts).
export default function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = useRouteId(use(params).id);
  if (id === ROUTE_PLACEHOLDER) return null;
  return <MessageDetailView key={id} id={id} />;
}

function MessageDetailView({ id }: { id: string }) {
  const t = useT(messagesDict);
  const tc = useT(commonDict);
  const ta = useT(untisActionsDict);
  const { tag } = useDateLocale();
  const localize = useLocalizeHref();
  const [msg, setMsg] = useState<MessageDetail | null>(null);
  const [outgoing, setOutgoing] = useState(false);
  const [reply, setReply] = useState<{ messageId: number; subject: string; recipientName: string } | null>(null);
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [loadedAttachments, setLoadedAttachments] = useState<MessageAttachment[] | null>(null);
  const [viewing, setViewing] = useState<MediaItem | null>(null);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsFetchFailed, setAttachmentsFetchFailed] = useState(false);

  const [linkWarning, setLinkWarning] = useState<string | null>(null);
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [readOpen, setReadOpen] = useState(false);
  const [readStatus, setReadStatus] = useState<ReadStatusRecipient[] | null>(null);
  const [readError, setReadError] = useState('');
  const [revokeArmed, setRevokeArmed] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState('');

  // The read confirmation the sender asked for.
  async function confirmRead() {
    if (!msg || confirming) return;
    setConfirming(true);
    setConfirmError('');
    try {
      await confirmMessageRead(msg.id);
      setMsg((m) => m && { ...m, requestConfirmation: { canConfirm: false, confirmedAt: new Date().toISOString(), confirmedBy: null } });
    } catch (e) {
      if (e instanceof Error && e.message === 'session_expired') leaveForLogin();
      else setConfirmError(t('confirmFailed'));
    } finally {
      setConfirming(false);
    }
  }

  // Who of the recipients has confirmed reading, asked for each time it is opened.
  async function openReadStatus() {
    if (!msg) return;
    setReadOpen(true);
    setReadError('');
    try {
      setReadStatus((await fetchReadStatus(msg.id)).recipients);
    } catch (e) {
      if (e instanceof Error && e.message === 'session_expired') leaveForLogin();
      else setReadError(t('readStatusFailed'));
    }
  }

  async function handleRevoke() {
    if (!msg || revoking) return;
    if (!revokeArmed) {
      setRevokeArmed(true);
      return;
    }
    setRevoking(true);
    setRevokeError('');
    try {
      await revokeMessage(msg.id);
      setMsg((m) => m && { ...m, canRevoke: false, isRevoked: true });
    } catch (e) {
      if (e instanceof Error && e.message === 'session_expired') leaveForLogin();
      else setRevokeError(t('revokeFailed'));
    } finally {
      setRevoking(false);
      setRevokeArmed(false);
    }
  }

  async function handleDelete() {
    if (!msg || deleting) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      const deleted = await deleteMessages([msg.id]);
      if (deleted.includes(msg.id)) {
        router.replace(localize('/messages'));
        return;
      }
      setDeleteError(t('deleteFailed'));
    } catch (e) {
      if (e instanceof Error && e.message === 'session_expired') leaveForLogin();
      else setDeleteError(t('deleteFailed'));
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const fetchFallbackAttachments = useCallback(async (msgId: number) => {
    setAttachmentsLoading(true);
    setAttachmentsFetchFailed(false);
    try {
      const data = await fetchMessageAttachments(msgId);
      setLoadedAttachments(parseAttachmentsFallback(data, t('attachment')));
    } catch {
      setAttachmentsFetchFailed(true);
      setLoadedAttachments([]);
    } finally {
      setAttachmentsLoading(false);
    }
  }, [t]);

  const load = useCallback(async () => {
    const msgId = parseInt(id);
    const sent = new URLSearchParams(window.location.search).get('folder') === 'sent';
    const show = (data: unknown) => {
      const parsed = parseMessageDetail(data, t, sent);
      setOutgoing(sent);
      setMsg(parsed);
      setLoadedAttachments(parsed && parsed.attachments.length === 0 ? parseAttachmentsFallback(attachmentListOf(data), t('attachment')) : null);
      return parsed;
    };
    setError('');
    setAttachmentsFetchFailed(false);
    // The copy from the last time it was opened at once; the live one replaces it.
    const stored = getMessageDetailStale(msgId);
    const shown = stored !== undefined && show(stored) !== null;
    setLoading(!shown);
    try {
      show(await fetchMessageDetail(msgId));
      if (!sent) markOpenedMessageRead(msgId);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') leaveForLogin();
      else if (!shown) setError(e instanceof Error ? e.message : 'error');
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function openReply() {
    if (!msg) return;
    setReplyBusy(true);
    setReplyError('');
    try {
      // WebUntis' own reply form: prefilled subject and the original sender.
      const form = await fetchReplyForm(msg.id);
      setReply({ messageId: msg.id, subject: form.subject || msg.subject, recipientName: form.recipient?.name || msg.senderName });
    } catch (e) {
      const m = e instanceof Error ? e.message : '';
      setReplyError(m && m !== 'session_expired' && !/^HTTP \d/.test(m) ? m : ta('replyUnavailable'));
    } finally {
      setReplyBusy(false);
    }
  }

  const attachments: MessageAttachment[] = msg && msg.attachments.length > 0 ? msg.attachments : loadedAttachments ?? [];
  const showAttachments = attachments.length > 0 || attachmentsLoading || attachmentsFetchFailed;
  const attachmentsTitle = attachmentsLoading
    ? t('attachmentsLoading')
    : attachments.length === 1
      ? t('oneAttachment')
      : attachments.length > 1
        ? t('nAttachments', { n: attachments.length })
        : t('attachmentsError');

  return (
    <AuthGuard>
      <Page width="narrow">
        <div className="mx-auto w-full max-w-[860px] pb-6 pt-4 md:pt-8">
          <Link
            href={localize('/messages')}
            className="-ml-1 mb-5 inline-flex h-9 items-center gap-1.5 rounded-full pl-1 pr-3 text-[15px] font-semibold text-ink-2 transition-colors hover:bg-inset hover:text-ink"
          >
            <ArrowLeft size={17} weight="bold" aria-hidden="true" />
            {t('title')}
          </Link>

          {loading ? (
            <MessageSkeleton />
          ) : error ? (
            <div className="squircle rounded-[26px] bg-surface"><ErrorView message={error} onRetry={load} /></div>
          ) : msg ? (
            <article className="rise flex flex-col gap-6">
              <h1 className="text-[clamp(26px,4.2vw,40px)] font-extrabold leading-[1.08] tracking-[-0.045em] [overflow-wrap:anywhere]">{msg.subject}</h1>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-periwinkle text-[14px] font-bold text-periwinkle-ink">
                    {msg.senderName ? initialsOf(msg.senderName) : <PaperPlaneTilt size={19} weight="bold" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15.5px] font-bold">
                      {!outgoing ? msg.senderName : msg.senderName ? t('to', { names: msg.senderName }) : t('sent')}
                    </span>
                    <span className="block text-[13.5px] text-ink-2">{formatDate(msg.sentDate, tag)}</span>
                  </span>
                </div>
                {!outgoing && (
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button variant="tone" onClick={openReply} disabled={replyBusy} className="flex-1 sm:flex-none">
                      {replyBusy ? <Spinner size={16} /> : <ArrowUUpLeft size={18} weight="bold" aria-hidden="true" />}
                      {ta('reply')}
                    </Button>
                    <Button
                      variant={confirmDelete ? 'danger' : 'quiet'}
                      onClick={() => void handleDelete()}
                      disabled={deleting}
                      aria-label={confirmDelete ? t('deleteMessageConfirm') : t('deleteMessage')}
                      onBlur={() => setConfirmDelete(false)}
                    >
                      {deleting ? <Spinner size={16} /> : <Trash size={18} weight="bold" aria-hidden="true" />}
                      <span className={confirmDelete ? '' : 'max-sm:sr-only'}>{confirmDelete ? t('deleteMessageConfirm') : t('deleteMessage')}</span>
                    </Button>
                  </div>
                )}
                {outgoing && msg.canRevoke && (
                  <Button
                    variant={revokeArmed ? 'danger' : 'quiet'}
                    onClick={() => void handleRevoke()}
                    disabled={revoking}
                    onBlur={() => setRevokeArmed(false)}
                    className="w-full sm:w-auto"
                  >
                    {revoking ? <Spinner size={16} /> : <ArrowCounterClockwise size={18} weight="bold" aria-hidden="true" />}
                    {revokeArmed ? t('revokeConfirm') : t('revoke')}
                  </Button>
                )}
              </div>
              {replyError && <p role="alert" className="-mt-3 text-[13.5px] font-semibold text-danger-ink">{replyError}</p>}
              {deleteError && <p role="alert" className="-mt-3 text-[13.5px] font-semibold text-danger-ink">{deleteError}</p>}
              {revokeArmed && !revokeError && <p className="-mt-3 text-[13.5px] text-ink-2">{t('revokeHint')}</p>}
              {revokeError && <p role="alert" className="-mt-3 text-[13.5px] font-semibold text-danger-ink">{revokeError}</p>}

              {!outgoing && msg.requestConfirmation?.canConfirm && (
                <div className="squircle flex flex-col gap-4 rounded-[22px] bg-butter px-5 py-4 text-butter-ink sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0">
                    <span className="block text-[15.5px] font-bold">{t('confirmTitle')}</span>
                    <span className="mt-0.5 block text-[13.5px] font-semibold opacity-80">{t('confirmText', { name: msg.senderName })}</span>
                    {confirmError && <span role="alert" className="mt-1.5 block text-[13.5px] font-semibold text-danger-ink">{confirmError}</span>}
                  </span>
                  <Button onClick={() => void confirmRead()} disabled={confirming} className="shrink-0">
                    {confirming ? <Spinner size={16} /> : <Check size={18} weight="bold" aria-hidden="true" />}
                    {t('confirmAction')}
                  </Button>
                </div>
              )}
              {!outgoing && msg.requestConfirmation && !msg.requestConfirmation.canConfirm && msg.requestConfirmation.confirmedAt && (
                <p className="-mt-2 flex items-center gap-2 text-[14px] font-semibold text-success-ink">
                  <CheckCircle size={18} weight="fill" aria-hidden="true" />
                  {msg.requestConfirmation.confirmedBy
                    ? t('confirmDoneBy', { name: msg.requestConfirmation.confirmedBy, date: formatDate(msg.requestConfirmation.confirmedAt, tag) })
                    : t('confirmDone', { date: formatDate(msg.requestConfirmation.confirmedAt, tag) })}
                </p>
              )}

              {outgoing && msg.isRevoked && (
                <p className="squircle flex items-start gap-3 rounded-[18px] bg-inset px-4 py-3 text-[14px] font-semibold text-ink-2">
                  <ArrowCounterClockwise size={18} weight="bold" className="mt-px shrink-0" aria-hidden="true" />
                  {t('revokedNotice')}
                </p>
              )}
              {outgoing && msg.readStatus && msg.readStatus.total > 0 && (
                <button
                  type="button"
                  onClick={() => void openReadStatus()}
                  className="squircle group flex items-center justify-between gap-4 rounded-[22px] bg-surface px-5 py-4 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_92%,var(--ink))]"
                >
                  <span className="flex min-w-0 items-center gap-3.5">
                    <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-[13px] ${msg.readStatus.confirmed >= msg.readStatus.total ? 'bg-sage text-sage-ink' : 'bg-periwinkle text-periwinkle-ink'}`}>
                      <Eye size={21} weight="bold" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-bold">{t('readStatusTitle')}</span>
                      <span className="block text-[13.5px] text-ink-2 tnum">{t('readStatus', { confirmed: msg.readStatus.confirmed, total: msg.readStatus.total })}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-[14px] font-semibold text-ink-2 group-hover:text-ink">{t('readStatusOpen')}</span>
                </button>
              )}

              {msg.body && (
                <div className="squircle rounded-[24px] bg-surface px-5 py-5 md:px-7 md:py-6">
                  <div
                    className="message-html-body text-[16px] leading-[1.65] text-ink [overflow-wrap:anywhere]"
                    dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(msg.body) }}
                    onClick={(e) => {
                      const anchor = (e.target as HTMLElement).closest('a');
                      if (!anchor) return;
                      e.preventDefault();
                      const href = anchor.getAttribute('href') ?? '';
                      if (href) setLinkWarning(href);
                    }}
                  />
                </div>
              )}

              {showAttachments && (
                <section aria-label={attachmentsTitle}>
                  <h2 className="mb-3 flex items-center gap-2 text-[17px] font-extrabold tracking-[-0.02em]">
                    <Paperclip size={18} weight="bold" aria-hidden="true" />
                    {attachmentsTitle}
                  </h2>
                  {attachmentsLoading ? (
                    <span aria-hidden="true" className="squircle flex items-center gap-3.5 rounded-[24px] bg-surface p-5 text-ink">
                      <Bone className="!rounded-[13px]" style={{ width: 44, height: 44 }} />
                      <span className="flex flex-1 flex-col gap-2"><Line w="55%" h={13} /><Line w={60} h={11} /></span>
                    </span>
                  ) : attachments.length > 0 ? (
                    <ul className="squircle flex flex-col rounded-[24px] bg-surface p-2">
                      {attachments.map((att) => <AttachmentRow key={att.id || att.storageId} att={att} msgId={msg.id} onOpen={setViewing} />)}
                    </ul>
                  ) : (
                    <div className="squircle flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-surface px-5 py-4">
                      <span className="text-[14.5px] text-ink-2">{t('tapToReload')}</span>
                      <Button variant="quiet" size="sm" onClick={() => fetchFallbackAttachments(msg.id)}>
                        <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
                        {tc('retry')}
                      </Button>
                    </div>
                  )}
                </section>
              )}
            </article>
          ) : null}
        </div>
      </Page>

      {reply && <ComposeMessageSheet reply={reply} onClose={() => setReply(null)} onSent={() => setReply(null)} />}
      {viewing && <MediaViewer item={viewing} onClose={() => setViewing(null)} />}

      <Sheet open={readOpen} onClose={() => setReadOpen(false)} title={t('readStatusTitle')} closeLabel={tc('close')}>
        {readError ? (
          <div className="flex flex-col items-start gap-3 pb-2">
            <p role="alert" className="text-[14.5px] font-semibold text-danger-ink">{readError}</p>
            <Button variant="quiet" size="sm" onClick={() => void openReadStatus()}>
              <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
              {tc('retry')}
            </Button>
          </div>
        ) : !readStatus ? (
          <div className="grid place-items-center py-10"><Spinner size={22} /></div>
        ) : (
          <ul className="flex flex-col pb-2">
            {readStatus.map((r) => {
              // A class as one recipient: how many of it have confirmed.
              const group = r.people.length > 1;
              const confirmedPeople = r.people.filter((p) => p.date).length;
              return (
                <li key={r.id || r.name} className={`${rowLine} flex items-center gap-3.5 py-3`}>
                  <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-inset text-[14px] font-bold text-ink-2">
                    {initialsOf(r.name || r.className || '?')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">
                      {r.name}
                      {r.className && <span className="font-normal text-ink-3"> · {r.className}</span>}
                    </span>
                    <span className={`block text-[13px] tnum ${(group ? confirmedPeople === r.people.length : r.confirmedAt) ? 'text-success-ink' : 'text-ink-3'}`}>
                      {group
                        ? t('readCount', { confirmed: confirmedPeople, total: r.people.length })
                        : r.confirmedAt ? t('readConfirmedOn', { date: formatDate(r.confirmedAt, tag) }) : t('readPending')}
                    </span>
                  </span>
                  {(group ? confirmedPeople === r.people.length : r.confirmedAt) && <CheckCircle size={20} weight="fill" className="shrink-0 text-success-ink" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>

      <Sheet open={!!linkWarning} onClose={() => setLinkWarning(null)} title={t('externalLink')} description={t('leavingApp')} closeLabel={tc('close')}>
        <div className="flex flex-col gap-5 pb-2">
          <p className="flex items-start gap-3 rounded-[16px] bg-inset px-4 py-3 text-[14px] font-medium text-ink [overflow-wrap:anywhere]">
            <WarningCircle size={20} weight="bold" className="mt-px shrink-0 text-butter-ink" aria-hidden="true" />
            {linkWarning}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="quiet" onClick={() => setLinkWarning(null)}>{tc('cancel')}</Button>
            <a
              href={linkWarning ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setLinkWarning(null)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-accent px-5 text-[15px] font-semibold text-on-accent transition-[filter] hover:brightness-[0.93] dark:hover:brightness-110"
            >
              {t('open')}
              <ArrowSquareOut size={16} weight="bold" aria-hidden="true" />
            </a>
          </div>
        </div>
      </Sheet>
    </AuthGuard>
  );
}
