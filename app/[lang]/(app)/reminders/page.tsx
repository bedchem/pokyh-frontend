'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowClockwise, CalendarBlank, Plus, SignIn, TextAlignLeft, Trash, UsersThree } from '@phosphor-icons/react';
import DateTimePicker from '@/components/ui/DateTimePicker';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import Sheet from '@/components/ui/Sheet';
import CommentSection from '@/components/ui/CommentSection';
import { Button } from '@/components/ui/Button';
import { Page, PageHeader, Section } from '@/components/app/Page';
import { RowsSkeleton } from '@/components/app/Skeleton';
import PixelState from '@/components/app/PixelState';
import { initialsOf } from '@/components/app/hooks';
import { technicalReason } from '@/components/ui/ErrorView';
import { useApp } from '@/providers/AppProvider';
import { useSession } from '@/providers/SessionProvider';
import { api, type ApiComment, type ApiReminder } from '@/lib/api-client';
import { useDateLocale, useT } from '@/providers/LocaleProvider';
import { tasksDict, type TasksKey } from '@/lib/i18n/dictionaries/tasks';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { homeDict } from '@/lib/i18n/dictionaries/home';
import { formatDate, formatTime } from '@/lib/i18n/dateLocale';

// Class reminders: everyone in the class sees and comments on them. A quick
// line to add one (a time is required), then the reminders by day — what is
// already due first — and a sheet with the details and the comments.

type TFn = (key: TasksKey, vars?: Record<string, string | number>) => string;

interface Reminder {
  id: string;
  title: string;
  body: string;
  remindAt: Date;
  createdByUid: string;
  createdByName: string;
  createdByUsername: string;
}

const KEEP_MS = 25 * 3600 * 1000;

function fromApi(r: ApiReminder): Reminder {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    remindAt: new Date(r.remindAt),
    createdByUid: r.createdBy,
    createdByName: r.createdByName,
    createdByUsername: r.createdByUsername,
  };
}

function recent(list: ApiReminder[], now: number): Reminder[] {
  return list.map(fromApi).filter((r) => r.remindAt.getTime() > now - KEEP_MS);
}

function timeUntil(date: Date, now: number, t: TFn): string {
  const diff = date.getTime() - now;
  if (diff < 0) return t('due');
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return d > 1 ? t('inDays', { n: d }) : t('inDay');
  if (h > 0) return t('inHours', { n: h });
  return t('soon');
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function RemindersContent() {
  const { user, logout } = useSession();
  const { classId, stableUid, ready, retryInit } = useApp();
  const t = useT(tasksDict);
  const tc = useT(commonDict);
  const th = useT(homeDict);
  const { tag } = useDateLocale();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Array<{ stableUid: string; username: string }>>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showBody, setShowBody] = useState(false);
  const [due, setDue] = useState('');
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ready || !user) return;
    api.users.get(user.username).then((u) => setIsAdmin(u.isAdmin)).catch(() => {});
  }, [ready, user]);

  useEffect(() => {
    if (!ready || !classId) return;
    api.classes.get(classId).then((cls) => setMembers(cls.members.map((m) => ({ stableUid: m.stableUid, username: m.username })))).catch(() => {});
  }, [classId, ready]);

  const load = useCallback(() => {
    if (!classId) return;
    api.reminders.list(classId)
      .then((list) => { setReminders(recent(list, Date.now())); setError(null); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : t('remindersLoadError')))
      .finally(() => setLoading(false));
  }, [classId, t]);

  useEffect(() => {
    if (!ready || !classId) return;
    const unsub = api.reminders.subscribe(classId, (list) => {
      setReminders(recent(list, Date.now()));
      setLoading(false);
    });
    load();
    return () => unsub();
  }, [classId, ready, load]);

  async function add() {
    if (!title.trim() || !due || !classId || saving) return;
    setSaving(true);
    setAddError('');
    try {
      const created = await api.reminders.create(classId, { title: title.trim(), body: body.trim(), remindAt: new Date(due).toISOString() });
      setReminders((list) => (list.some((r) => r.id === created.id) ? list : [...list, fromApi(created)]));
      setTitle('');
      setBody('');
      setDue('');
      setShowBody(false);
    } catch (e: unknown) {
      setAddError(e instanceof Error && e.message ? e.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  function remove(r: Reminder) {
    if (!classId) return;
    setOpenId(null);
    setReminders((list) => list.filter((x) => x.id !== r.id));
    api.reminders.delete(classId, r.id).catch(() => setReminders((list) => [...list, r]));
  }

  const sorted = useMemo(() => [...reminders].sort((a, b) => a.remindAt.getTime() - b.remindAt.getTime()), [reminders]);
  const overdue = sorted.filter((r) => r.remindAt.getTime() < now);
  const days = useMemo(() => {
    const groups = new Map<string, Reminder[]>();
    for (const r of sorted) {
      if (r.remindAt.getTime() < now) continue;
      const k = dayKey(r.remindAt);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(r);
    }
    return [...groups.values()];
  }, [sorted, now]);

  const dayTitle = (d: Date) => {
    const today = new Date(now);
    const tomorrow = new Date(now + 86_400_000);
    const long = formatDate(d, tag, { weekday: 'long', day: 'numeric', month: 'long' });
    if (dayKey(d) === dayKey(today)) return `${th('today')} · ${long}`;
    if (dayKey(d) === dayKey(tomorrow)) return `${th('tomorrow')} · ${long}`;
    return long;
  };

  const dueLabel = due
    ? t('dateTime', {
        date: formatDate(new Date(due), tag, { weekday: 'short', day: 'numeric', month: 'short' }),
        time: formatTime(new Date(due), tag, { hour: '2-digit', minute: '2-digit' }),
      })
    : null;
  const openReminder = reminders.find((r) => r.id === openId) ?? null;

  const row = (r: Reminder, isOverdue: boolean) => (
    <motion.li
      key={r.id}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className="relative before:pointer-events-none before:absolute before:inset-x-3.5 before:top-0 before:h-px before:bg-line before:transition-opacity first:before:hidden hover:before:opacity-0 [&:hover+li]:before:opacity-0"
    >
      <button
        type="button"
        onClick={() => setOpenId(r.id)}
        className="flex w-full items-start gap-4 rounded-[18px] px-3 py-3.5 text-left transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--surface)_92%,var(--ink))]"
      >
        <span className="mono w-[46px] shrink-0 pt-0.5 text-[13.5px] font-medium text-ink">{formatTime(r.remindAt, tag, { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15.5px] font-semibold leading-snug">{r.title}</span>
          {r.body && <span className="mt-0.5 block line-clamp-2 text-[14px] text-ink-2">{r.body}</span>}
          <span className="mt-1 block text-[12.5px] text-ink-3">
            {r.createdByUid === stableUid ? t('you') : t('byUser', { name: r.createdByUsername || r.createdByName })}
          </span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold ${isOverdue ? 'bg-blush text-blush-ink' : 'bg-inset text-ink-2'}`}>
          {timeUntil(r.remindAt, now, t)}
        </span>
      </button>
    </motion.li>
  );

  const header = (
    <PageHeader
      title={t('remindersTitle')}
      subtitle={classId && user?.klasseName ? t('remindersLead', { klasse: user.klasseName }) : undefined}
      actions={classId && members.length > 0 && (
        <button
          type="button"
          onClick={() => setShowMembers(true)}
          className="inline-flex h-11 items-center gap-2.5 rounded-[14px] bg-surface pl-2 pr-4 text-[14.5px] font-semibold transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_92%,var(--ink))]"
        >
          <span className="flex -space-x-2">
            {members.slice(0, 3).map((m) => (
              <span key={m.stableUid} aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-periwinkle text-[11px] font-bold text-periwinkle-ink shadow-[0_0_0_2px_var(--surface)]">
                {initialsOf(m.username)}
              </span>
            ))}
          </span>
          {members.length === 1 ? t('memberOne', { n: 1 }) : t('memberMany', { n: members.length })}
        </button>
      )}
    />
  );

  if (ready && !classId) {
    return (
      <Page width="narrow">
        {header}
        <div className="squircle rounded-[26px] bg-surface">
          <PixelState
            sprite="search"
            title={t('classNotFound')}
            detail={t('syncFailed')}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="quiet" onClick={retryInit}><ArrowClockwise size={17} weight="bold" aria-hidden="true" />{tc('retry')}</Button>
                <Button variant="tone" onClick={() => void logout()}><SignIn size={17} weight="bold" aria-hidden="true" />{t('loginAgain')}</Button>
              </div>
            }
          />
        </div>
      </Page>
    );
  }

  return (
    <Page width="narrow">
      {header}

      <form onSubmit={(e) => { e.preventDefault(); void add(); }} className="squircle rise mb-10 rounded-[24px] bg-surface p-2">
        <div className="flex items-center gap-2">
          <span className="grid size-10 shrink-0 place-items-center text-ink-3" aria-hidden="true"><Plus size={20} weight="bold" /></span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('newReminder')}
            aria-label={t('addReminder')}
            maxLength={500}
            className="h-12 min-w-0 flex-1 bg-transparent text-[16px] font-medium outline-none placeholder:text-ink-3"
          />
          <Button type="submit" disabled={!title.trim() || !due || saving || !classId} className="shrink-0">
            {saving ? <Spinner size={16} /> : t('add')}
          </Button>
        </div>
        <AnimatePresence initial={false}>
          {showBody && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t('descriptionOptional')}
                rows={2}
                maxLength={5000}
                className="mx-1 mt-1 block w-[calc(100%-8px)] resize-none rounded-[14px] bg-inset px-4 py-3 text-[15px] outline-none placeholder:text-ink-3"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-wrap items-center gap-1.5 px-1 pb-1 pt-2">
          <button
            type="button"
            onClick={() => setPicking(true)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold transition-colors ${dueLabel ? 'bg-periwinkle text-periwinkle-ink' : 'bg-inset text-ink hover:brightness-95'}`}
          >
            <CalendarBlank size={15} weight="bold" aria-hidden="true" />
            {dueLabel ?? t('chooseDateTime')}
          </button>
          <button
            type="button"
            onClick={() => setShowBody((v) => !v)}
            aria-expanded={showBody}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold transition-colors ${showBody ? 'bg-periwinkle text-periwinkle-ink' : 'text-ink-2 hover:bg-inset hover:text-ink'}`}
          >
            <TextAlignLeft size={15} weight="bold" aria-hidden="true" />
            {t('moreDetails')}
          </button>
        </div>
        {addError && <p role="alert" className="px-3 pb-2 text-[13.5px] font-semibold text-danger-ink">{addError}</p>}
      </form>

      {!ready || loading ? (
        <RowsSkeleton rows={4} lead="time" trailing />
      ) : error ? (
        <div className="squircle rounded-[26px] bg-surface">
          <PixelState
            title={t('loadFailed')}
            detail={technicalReason(error)}
            action={<Button variant="quiet" onClick={() => { setLoading(true); load(); }}><ArrowClockwise size={17} weight="bold" aria-hidden="true" />{tc('retry')}</Button>}
          />
        </div>
      ) : reminders.length === 0 ? (
        <div className="squircle rounded-[26px] bg-surface">
          <PixelState sprite="bell" title={t('remindersEmptyTitle')} note={t('remindersEmptySubtitle')} />
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {overdue.length > 0 && (
            <Section title={t('due')}>
              <ul className="squircle flex flex-col rounded-[24px] bg-surface p-2">
                <AnimatePresence initial={false}>{overdue.map((r) => row(r, true))}</AnimatePresence>
              </ul>
            </Section>
          )}
          {days.map((list) => (
            <Section key={dayKey(list[0].remindAt)} title={dayTitle(list[0].remindAt)}>
              <ul className="squircle flex flex-col rounded-[24px] bg-surface p-2">
                <AnimatePresence initial={false}>{list.map((r) => row(r, false))}</AnimatePresence>
              </ul>
            </Section>
          ))}
        </div>
      )}

      {picking && <DateTimePicker value={due} onChange={(v) => setDue(v)} onBack={() => setPicking(false)} />}

      {openReminder && classId && (
        <ReminderSheet
          reminder={openReminder}
          classId={classId}
          stableUid={stableUid}
          isAdmin={isAdmin}
          now={now}
          onClose={() => setOpenId(null)}
          onDelete={remove}
        />
      )}

      <Sheet open={showMembers} onClose={() => setShowMembers(false)} title={user?.klasseName ?? ''} description={members.length === 1 ? t('memberOne', { n: 1 }) : t('memberMany', { n: members.length })} closeLabel={tc('close')}>
        <ul className="flex flex-col gap-0.5 pb-4">
          {members.map((m) => (
            <li key={m.stableUid} className="flex items-center gap-3 rounded-[14px] px-2 py-2">
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-periwinkle text-[13px] font-bold text-periwinkle-ink">{initialsOf(m.username)}</span>
              <span className="text-[15.5px] font-semibold">{m.username}</span>
              {m.stableUid === stableUid && <span className="ml-auto rounded-full bg-inset px-2.5 py-1 text-[12px] font-bold text-ink-2">{t('you')}</span>}
            </li>
          ))}
        </ul>
      </Sheet>
    </Page>
  );
}

function ReminderSheet({
  reminder,
  classId,
  stableUid,
  isAdmin,
  now,
  onClose,
  onDelete,
}: {
  reminder: Reminder;
  classId: string;
  stableUid: string | null;
  isAdmin: boolean;
  now: number;
  onClose: () => void;
  onDelete: (r: Reminder) => void;
}) {
  const t = useT(tasksDict);
  const tc = useT(commonDict);
  const { tag } = useDateLocale();
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const mine = stableUid != null && reminder.createdByUid === stableUid;
  const overdue = reminder.remindAt.getTime() < now;

  useEffect(() => {
    api.reminderComments.list(classId, reminder.id).then(setComments).catch(() => {}).finally(() => setCommentsLoading(false));
    const unsub = api.reminderComments.subscribe(reminder.id, (c) => { setComments(c); setCommentsLoading(false); });
    return () => unsub();
  }, [classId, reminder.id]);

  return (
    <Sheet
      open
      onClose={onClose}
      title={reminder.title}
      description={`${timeUntil(reminder.remindAt, now, t)} · ${t('dateTime', {
        date: formatDate(reminder.remindAt, tag, { weekday: 'long', day: 'numeric', month: 'long' }),
        time: formatTime(reminder.remindAt, tag, { hour: '2-digit', minute: '2-digit' }),
      })}`}
      closeLabel={tc('close')}
    >
      <div className="flex flex-col gap-6 pb-4">
        <div className={`rounded-[18px] px-4 py-3.5 ${overdue ? 'bg-blush text-blush-ink' : 'bg-inset'}`}>
          {reminder.body && <p className="whitespace-pre-line text-[15px] leading-relaxed">{reminder.body}</p>}
          <p className={`${reminder.body ? 'mt-2' : ''} text-[13px] font-semibold opacity-75`}>
            {mine ? t('you') : t('byUser', { name: reminder.createdByUsername || reminder.createdByName })}
          </p>
        </div>
        {(mine || isAdmin) && (
          <Button variant="danger" onClick={() => onDelete(reminder)} className="self-start">
            <Trash size={17} weight="bold" aria-hidden="true" />
            {isAdmin && !mine ? t('deleteAsAdmin') : t('deleteItem')}
          </Button>
        )}
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-[17px] font-extrabold tracking-[-0.02em]">
            <UsersThree size={18} weight="bold" aria-hidden="true" />
            {t('comments')}
          </h3>
          <CommentSection
            comments={comments}
            stableUid={stableUid}
            isAdmin={isAdmin}
            loading={commentsLoading}
            onAdd={(b) => api.reminderComments.create(classId, reminder.id, b)}
            onEdit={(id, b) => api.reminderComments.update(classId, reminder.id, id, b)}
            onDelete={(id) => api.reminderComments.delete(classId, reminder.id, id)}
          />
        </section>
      </div>
    </Sheet>
  );
}

export default function RemindersPage() {
  return (
    <AuthGuard>
      <RemindersContent />
    </AuthGuard>
  );
}
