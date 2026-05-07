'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, Bell, Trash2, BellOff, Users, LogIn, Calendar, X } from 'lucide-react';
import DateTimePicker from '@/components/ui/DateTimePicker';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import EmptyView from '@/components/ui/EmptyView';
import CommentSection from '@/components/ui/CommentSection';
import { useApp } from '@/providers/AppProvider';
import { useSession } from '@/providers/SessionProvider';
import { api, type ApiReminder, type ApiComment } from '@/lib/api-client';

interface Reminder {
  id: string;
  classId: string;
  title: string;
  body: string;
  remindAt: Date;
  createdByUid: string;
  createdByName: string;
  createdByUsername: string;
}

interface ClassMember {
  stableUid: string;
  username: string;
}

function memberColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i);
  return `hsl(${Math.abs(h) % 360}, 60%, 50%)`;
}

function timeUntil(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff < 0) return 'Fällig';
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `in ${d} Tag${d > 1 ? 'en' : ''}`;
  if (h > 0) return `in ${h} Std.`;
  return 'Gleich';
}

function apiReminderToReminder(r: ApiReminder): Reminder {
  return {
    id: r.id,
    classId: r.classId,
    title: r.title,
    body: r.body,
    remindAt: new Date(r.remindAt),
    createdByUid: r.createdBy,
    createdByName: r.createdByName,
    createdByUsername: r.createdByUsername,
  };
}

export default function RemindersPage() {
  const router = useRouter();
  const { user, logout } = useSession();
  const { classId, stableUid, ready, retryInit } = useApp();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [detailReminder, setDetailReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    api.users.get(user.username)
      .then((u) => setIsAdmin(u.isAdmin))
      .catch(() => {});
  }, [ready, user]);

  useEffect(() => {
    if (!ready || !classId) return;
    api.classes.get(classId)
      .then((cls) => {
        setMembers(cls.members.map((m) => ({ stableUid: m.stableUid, username: m.username })));
      })
      .catch(() => {});
  }, [classId, ready]);

  useEffect(() => {
    if (!ready) return;
    if (!classId) { setLoading(false); return; }

    const cutoff = Date.now() - 25 * 3600 * 1000;

    const unsub = api.reminders.subscribe(classId, (apiReminders) => {
      setReminders(
        apiReminders
          .map(apiReminderToReminder)
          .filter((r) => r.remindAt.getTime() > cutoff)
      );
      setLoading(false);
    });

    api.reminders.list(classId)
      .then((apiReminders) => {
        setReminders(
          apiReminders
            .map(apiReminderToReminder)
            .filter((r) => r.remindAt.getTime() > cutoff)
        );
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Fehler beim Laden der Erinnerungen.');
        setLoading(false);
      });

    return () => unsub();
  }, [classId, ready]);

  async function addReminder() {
    if (!title.trim() || !due || !classId || !stableUid || !user) return;
    setSaving(true);
    setAddError('');
    try {
      await api.reminders.create(classId, {
        title: title.trim(),
        body: body.trim(),
        remindAt: new Date(due).toISOString(),
      });
      setTitle(''); setBody(''); setDue(''); setShowAdd(false);
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Fehler beim Speichern. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteReminder(reminder: Reminder) {
    if (!classId) return;
    await api.reminders.delete(classId, reminder.id);
  }

  const upcoming = reminders.filter((r) => r.remindAt >= new Date(Date.now() - 1000));
  const overdue = reminders.filter((r) => r.remindAt < new Date());

  return (
    <AuthGuard>
      <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--app-bg)' }}>
        {/* Header */}
        <div className="px-5 pt-4 pb-3 fade-in flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full press-scale"
              style={{ background: 'var(--app-surface)' }}
            >
              <ChevronLeft size={20} color="var(--accent)" />
            </button>
            <h1 className="flex-1 text-[28px] font-bold tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
              Erinnerungen
            </h1>
            {classId && (
              <button
                onClick={() => setShowAdd(true)}
                className="p-2 rounded-full press-scale"
                style={{ background: 'color-mix(in srgb, var(--orange) 15%, var(--app-surface))' }}
              >
                <Plus size={20} color="var(--orange)" />
              </button>
            )}
          </div>

          {ready && classId && (
            <button
              onClick={() => setShowMembers(true)}
              className="mt-2.5 ml-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-full press-scale"
              style={{ background: 'var(--app-surface)' }}
            >
              <Users size={13} color="var(--accent)" />
              <span className="text-[13px] font-medium" style={{ color: 'var(--app-text-primary)' }}>
                {user?.klasseName}
              </span>
              {members.length > 0 && (
                <span className="text-[12px]" style={{ color: 'var(--app-text-secondary)' }}>
                  · {members.length}
                </span>
              )}
              <ChevronRight size={12} color="var(--app-text-tertiary)" />
            </button>
          )}
        </div>

        <div className="flex-1 px-4 pb-6 overflow-auto">
          {!ready || loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)' }}>
                <Bell size={28} color="var(--danger)" />
              </div>
              <p className="text-base font-semibold" style={{ color: 'var(--app-text-primary)' }}>Fehler beim Laden</p>
              <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); if (classId) api.reminders.list(classId).then((r) => { const cutoff = Date.now() - 25 * 3600 * 1000; setReminders(r.map(apiReminderToReminder).filter((x) => x.remindAt.getTime() > cutoff)); setLoading(false); }).catch((e: unknown) => { setError(e instanceof Error ? e.message : 'Fehler'); setLoading(false); }); }}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white press-scale"
                style={{ background: 'var(--accent)' }}
              >
                Erneut versuchen
              </button>
            </div>
          ) : !classId ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--orange) 15%, transparent)' }}
              >
                <Users size={32} color="var(--orange)" />
              </div>
              <p className="text-base font-semibold" style={{ color: 'var(--app-text-primary)' }}>
                Klasse nicht gefunden
              </p>
              <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
                Synchronisierung fehlgeschlagen. Versuche es erneut oder melde dich neu an.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  onClick={retryInit}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm press-scale"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  <Users size={16} />
                  Erneut versuchen
                </button>
                <button
                  onClick={() => logout()}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm press-scale"
                  style={{ background: 'var(--app-surface)', color: 'var(--app-text-primary)' }}
                >
                  <LogIn size={16} />
                  Neu anmelden
                </button>
              </div>
            </div>
          ) : reminders.length === 0 ? (
            <EmptyView
              icon={<BellOff size={56} color="var(--app-text-primary)" />}
              title="Keine Erinnerungen"
              subtitle="Füge Hausaufgaben oder Erinnerungen für deine Klasse hinzu."
            />
          ) : (
            <div className="flex flex-col gap-3 fade-in">
              {overdue.length > 0 && (
                <p className="text-xs font-semibold uppercase tracking-wider px-1 mt-1"
                   style={{ color: 'var(--danger)' }}>
                  FÄLLIG
                </p>
              )}
              {overdue.map((r) => (
                <ReminderCard
                  key={r.id}
                  r={r}
                  stableUid={stableUid}
                  isAdmin={isAdmin}
                  onDelete={deleteReminder}
                  onOpen={() => setDetailReminder(r)}
                  overdue
                />
              ))}
              {upcoming.filter(r => r.remindAt >= new Date()).length > 0 && (
                <p className="text-xs font-semibold uppercase tracking-wider px-1 mt-2"
                   style={{ color: 'var(--app-text-secondary)' }}>
                  KOMMEND
                </p>
              )}
              {upcoming.filter(r => r.remindAt >= new Date()).map((r) => (
                <ReminderCard
                  key={r.id}
                  r={r}
                  stableUid={stableUid}
                  isAdmin={isAdmin}
                  onDelete={deleteReminder}
                  onOpen={() => setDetailReminder(r)}
                  overdue={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reminder detail + comments sheet */}
        {detailReminder && classId && (
          <ReminderDetailSheet
            reminder={detailReminder}
            classId={classId}
            stableUid={stableUid}
            isAdmin={isAdmin}
            onClose={() => setDetailReminder(null)}
            onDelete={(r) => { deleteReminder(r); setDetailReminder(null); }}
          />
        )}

        {/* Add reminder modal */}
        {showAdd && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setShowAdd(false); setShowDatePicker(false); }}
          >
            <div
              className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-[28px] fade-in"
              style={{ background: 'var(--app-surface)', animationDuration: '0.25s' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--orange) 15%, transparent)' }}
                  >
                    <Bell size={20} color="var(--orange)" />
                  </div>
                  <h3 className="text-[18px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
                    Erinnerung hinzufügen
                  </h3>
                </div>
                <button
                  onClick={() => setShowAdd(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full press-scale flex-shrink-0"
                  style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 pb-8 flex flex-col gap-3 mt-4">
                <input
                  placeholder="Titel *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-[15px] outline-none"
                  style={{ background: 'var(--app-card)', color: 'var(--app-text-primary)' }}
                  autoFocus
                />
                <input
                  placeholder="Beschreibung (optional)"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-[15px] outline-none"
                  style={{ background: 'var(--app-card)', color: 'var(--app-text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="w-full rounded-xl px-4 py-3 text-[15px] text-left flex items-center gap-3 press-scale"
                  style={{
                    background: 'var(--app-card)',
                    color: due ? 'var(--app-text-primary)' : 'var(--app-text-tertiary)',
                    border: `1.5px solid ${due ? 'var(--accent)' : 'transparent'}`,
                  }}
                >
                  <Calendar size={16} color={due ? 'var(--accent)' : 'var(--app-text-tertiary)'} />
                  {due
                    ? (() => {
                        const d = new Date(due);
                        return d.toLocaleDateString('de', { weekday: 'short', day: 'numeric', month: 'short' }) +
                          ' · ' + d.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
                      })()
                    : 'Datum & Uhrzeit wählen *'
                  }
                </button>
                {addError && (
                  <p className="text-sm px-3 py-2.5 rounded-xl" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}>
                    {addError}
                  </p>
                )}
                <button
                  onClick={addReminder}
                  disabled={!title.trim() || !due || saving}
                  className="h-12 rounded-xl font-semibold text-white press-scale disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                  style={{ background: 'var(--accent)' }}
                >
                  {saving ? <Spinner size={18} /> : 'Hinzufügen'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showAdd && showDatePicker && (
          <DateTimePicker
            value={due}
            onChange={(v) => setDue(v)}
            onBack={() => setShowDatePicker(false)}
          />
        )}

        {/* Class members sheet */}
        {showMembers && (
          <div
            className="fixed inset-0 z-50 flex items-end fade-backdrop"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowMembers(false)}
          >
            <div
              className="w-full rounded-t-2xl pb-12 slide-up"
              style={{ background: 'var(--app-surface)', maxHeight: '70dvh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: 'var(--app-border)' }} />
              <div className="px-6">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
                  >
                    <Users size={20} color="var(--accent)" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
                      {user?.klasseName}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
                      {members.length} {members.length === 1 ? 'Mitglied' : 'Mitglieder'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {members.map((m) => (
                    <div
                      key={m.stableUid}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: 'var(--app-card)' }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: memberColor(m.username) }}
                      >
                        {m.username.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="font-medium text-[15px]" style={{ color: 'var(--app-text-primary)' }}>
                        {m.username}
                      </p>
                      {m.stableUid === stableUid && (
                        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                          Du
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

function ReminderCard({
  r,
  stableUid,
  isAdmin,
  onDelete,
  onOpen,
  overdue,
}: {
  r: Reminder;
  stableUid: string | null;
  isAdmin: boolean;
  onDelete: (r: Reminder) => void;
  onOpen: () => void;
  overdue: boolean;
}) {
  const isMine = stableUid != null && r.createdByUid === stableUid;
  const canDelete = isMine || isAdmin;
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-2xl p-4 text-left press-scale"
      style={{
        background: 'var(--app-surface)',
        border: overdue ? '1px solid color-mix(in srgb, var(--danger) 25%, transparent)' : 'none',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: overdue
              ? 'color-mix(in srgb, var(--danger) 15%, transparent)'
              : 'color-mix(in srgb, var(--orange) 15%, transparent)',
          }}
        >
          <Bell size={18} color={overdue ? 'var(--danger)' : 'var(--orange)'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px]" style={{ color: 'var(--app-text-primary)' }}>
            {r.title}
          </p>
          {r.body && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
              {r.body}
            </p>
          )}
          <p className="text-xs mt-1.5" style={{ color: overdue ? 'var(--danger)' : 'var(--app-text-tertiary)' }}>
            {timeUntil(r.remindAt)} · {r.remindAt.toLocaleDateString('de', { day: 'numeric', month: 'short' })}{' '}
            {r.remindAt.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-tertiary)' }}>
            von {r.createdByUsername || r.createdByName}
          </p>
        </div>
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(r); }}
            className="p-1.5 press-scale flex-shrink-0"
            title={isAdmin && !isMine ? 'Als Admin löschen' : undefined}
          >
            <Trash2 size={16} color={isAdmin && !isMine ? 'var(--orange)' : 'var(--danger)'} />
          </button>
        )}
      </div>
    </button>
  );
}

function ReminderDetailSheet({
  reminder,
  classId,
  stableUid,
  isAdmin,
  onClose,
  onDelete,
}: {
  reminder: Reminder;
  classId: string;
  stableUid: string | null;
  isAdmin: boolean;
  onClose: () => void;
  onDelete: (r: Reminder) => void;
}) {
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const overdue = reminder.remindAt < new Date();
  const isMine = stableUid != null && reminder.createdByUid === stableUid;
  const canDelete = isMine || isAdmin;

  useEffect(() => {
    setCommentsLoading(true);

    // Initial fetch
    api.reminderComments.list(classId, reminder.id)
      .then((c) => { setComments(c); setCommentsLoading(false); })
      .catch(() => setCommentsLoading(false));

    // Live updates
    const unsub = api.reminderComments.subscribe(reminder.id, (c) => {
      setComments(c);
      setCommentsLoading(false);
    });

    return () => unsub();
  }, [classId, reminder.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-[28px] fade-in"
        style={{ background: 'var(--app-surface)', animationDuration: '0.25s' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: overdue
                  ? 'color-mix(in srgb, var(--danger) 15%, transparent)'
                  : 'color-mix(in srgb, var(--orange) 15%, transparent)',
              }}
            >
              <Bell size={20} color={overdue ? 'var(--danger)' : 'var(--orange)'} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[17px] font-bold leading-snug" style={{ color: 'var(--app-text-primary)' }}>
                {reminder.title}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: overdue ? 'var(--danger)' : 'var(--app-text-tertiary)' }}>
                {timeUntil(reminder.remindAt)} · {reminder.remindAt.toLocaleDateString('de', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
                {reminder.remindAt.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })} Uhr
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {canDelete && (
              <button
                onClick={() => onDelete(reminder)}
                className="w-8 h-8 flex items-center justify-center rounded-full press-scale"
                style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)' }}
                title={isAdmin && !isMine ? 'Als Admin löschen' : 'Löschen'}
              >
                <Trash2 size={15} color={isAdmin && !isMine ? 'var(--orange)' : 'var(--danger)'} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full press-scale"
              style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="px-5 pb-6">
          {reminder.body && (
            <p className="text-[14px] mb-3 -mt-1" style={{ color: 'var(--app-text-secondary)' }}>
              {reminder.body}
            </p>
          )}
          <p className="text-xs mb-4" style={{ color: 'var(--app-text-tertiary)' }}>
            von {reminder.createdByUsername || reminder.createdByName}
          </p>

          {/* Divider */}
          <div className="h-px mb-4" style={{ background: 'var(--app-border)' }} />
          {/* Comments */}
          <CommentSection
            comments={comments}
            stableUid={stableUid}
            isAdmin={isAdmin}
            loading={commentsLoading}
            onAdd={(body) => api.reminderComments.create(classId, reminder.id, body)}
            onEdit={(commentId, body) => api.reminderComments.update(classId, reminder.id, commentId, body)}
            onDelete={(commentId) => api.reminderComments.delete(classId, reminder.id, commentId)}
          />
        </div>
      </div>
    </div>
  );
}
