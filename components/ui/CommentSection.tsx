'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Pencil, Trash2, Send, X, Check } from 'lucide-react';
import Spinner from './Spinner';
import type { ApiComment } from '@/lib/api-client';

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i);
  return `hsl(${Math.abs(h) % 360}, 60%, 50%)`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  return `vor ${d} Tag${d > 1 ? 'en' : ''}`;
}

interface Props {
  comments: ApiComment[];
  stableUid: string | null;
  isAdmin: boolean;
  loading: boolean;
  onAdd: (body: string) => Promise<unknown>;
  onEdit: (commentId: string, body: string) => Promise<unknown>;
  onDelete: (commentId: string) => Promise<unknown>;
}

export default function CommentSection({ comments, stableUid, isAdmin, loading, onAdd, onEdit, onDelete }: Props) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [editingId]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await onAdd(body);
      setDraft('');
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  async function handleEdit(commentId: string) {
    const body = editBody.trim();
    if (!body) return;
    try {
      await onEdit(commentId, body);
      setEditingId(null);
    } catch { /* keep edit open */ }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    try {
      await onDelete(commentId);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={15} color="var(--app-text-secondary)" />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-secondary)' }}>
          Kommentare
          {comments.length > 0 && (
            <span className="ml-1.5 text-[11px] font-normal normal-case" style={{ color: 'var(--app-text-tertiary)' }}>
              ({comments.length})
            </span>
          )}
        </p>
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-4"><Spinner size={20} /></div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-center py-3 px-2" style={{ color: 'var(--app-text-tertiary)' }}>
          Noch keine Kommentare. Sei der Erste!
        </p>
      ) : (
        <div className="flex flex-col gap-2 mb-3">
          {comments.map((c) => {
            const isMine = stableUid != null && c.stableUid === stableUid;
            const canDelete = isMine || isAdmin;
            const isEditing = editingId === c.id;

            return (
              <div
                key={c.id}
                className="rounded-xl px-3 py-2.5"
                style={{ background: 'var(--app-card)' }}
              >
                {/* Top row: avatar + name + time + actions */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: avatarColor(c.username) }}
                  >
                    {c.username.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-[13px] font-semibold flex-1 min-w-0 truncate" style={{ color: 'var(--app-text-primary)' }}>
                    {c.username}
                    {isMine && (
                      <span className="ml-1.5 text-[10px] font-medium" style={{ color: 'var(--accent)' }}>Du</span>
                    )}
                  </p>
                  <p className="text-[11px] flex-shrink-0" style={{ color: 'var(--app-text-tertiary)' }}>
                    {timeAgo(c.createdAt)}
                    {c.updatedAt !== c.createdAt && (
                      <span className="ml-1" style={{ color: 'var(--app-text-tertiary)' }}>· bearbeitet</span>
                    )}
                  </p>
                  {/* Action buttons */}
                  {(isMine || canDelete) && !isEditing && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {isMine && (
                        <button
                          onClick={() => { setEditingId(c.id); setEditBody(c.body); }}
                          className="p-1 rounded-lg press-scale"
                          style={{ color: 'var(--app-text-tertiary)' }}
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="p-1 rounded-lg press-scale disabled:opacity-50"
                          style={{ color: isAdmin && !isMine ? 'var(--orange)' : 'var(--danger)' }}
                        >
                          {deletingId === c.id ? <Spinner size={13} /> : <Trash2 size={13} />}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Body or edit input */}
                {isEditing ? (
                  <div className="flex flex-col gap-1.5">
                    <textarea
                      ref={editRef}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(c.id); }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      rows={2}
                      className="w-full text-[13px] rounded-lg px-2.5 py-1.5 resize-none outline-none"
                      style={{ background: 'var(--app-surface)', color: 'var(--app-text-primary)', border: '1.5px solid var(--accent)' }}
                    />
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg press-scale"
                        style={{ background: 'var(--app-surface)', color: 'var(--app-text-secondary)' }}
                      >
                        <X size={13} />
                      </button>
                      <button
                        onClick={() => handleEdit(c.id)}
                        disabled={!editBody.trim()}
                        className="p-1.5 rounded-lg press-scale disabled:opacity-50"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                      >
                        <Check size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--app-text-primary)' }}>
                    {c.body}
                  </p>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Add comment input */}
      {stableUid && (
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2"
          style={{ background: 'var(--app-card)', border: '1.5px solid var(--app-border)' }}
        >
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="Kommentar schreiben…"
            rows={1}
            className="flex-1 text-[14px] resize-none outline-none bg-transparent leading-relaxed"
            style={{
              color: 'var(--app-text-primary)',
              minHeight: 24,
              maxHeight: 96,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center press-scale disabled:opacity-40 transition-opacity"
            style={{ background: draft.trim() ? 'var(--accent)' : 'var(--app-surface)' }}
          >
            {sending ? <Spinner size={14} /> : <Send size={14} color={draft.trim() ? '#fff' : 'var(--app-text-tertiary)'} />}
          </button>
        </div>
      )}
    </div>
  );
}
