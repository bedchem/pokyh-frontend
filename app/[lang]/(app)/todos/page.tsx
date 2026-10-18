'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowClockwise, CalendarBlank, Check, CheckSquare, Plus, TextAlignLeft, Trash, X } from '@phosphor-icons/react';
import DateTimePicker from '@/components/ui/DateTimePicker';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Page, PageHeader, Section } from '@/components/app/Page';
import { RowsSkeleton } from '@/components/app/Skeleton';
import PixelState from '@/components/app/PixelState';
import { technicalReason } from '@/components/ui/ErrorView';
import { useApp } from '@/providers/AppProvider';
import { useSession } from '@/providers/SessionProvider';
import { api, type ApiTodo } from '@/lib/api-client';
import { useDateLocale, useT } from '@/providers/LocaleProvider';
import { tasksDict } from '@/lib/i18n/dictionaries/tasks';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { formatDate, formatTime } from '@/lib/i18n/dateLocale';

// Personal to-dos: a quick line to add one (details and a due date when you
// want them), the open ones on top, the done ones underneath until they go
// away after a day. Ticking one off moves it at once and glides it into place;
// the backend's live updates keep every device in step.

interface Todo {
  id: string;
  title: string;
  details: string;
  dueAt: Date | null;
  done: boolean;
  doneAt: Date | null;
  createdAt: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function fromApi(t: ApiTodo): Todo {
  return {
    id: t.id,
    title: t.title,
    details: t.details,
    dueAt: t.dueAt ? new Date(t.dueAt) : null,
    done: t.done,
    doneAt: t.doneAt ? new Date(t.doneAt) : null,
    createdAt: new Date(t.createdAt),
  };
}

function visible(list: ApiTodo[]): Todo[] {
  const now = Date.now();
  return list.map(fromApi).filter((t) => !t.done || !t.doneAt || now - t.doneAt.getTime() < DAY_MS);
}

function TodoRow({ todo, now, onToggle, onDelete }: { todo: Todo; now: number; onToggle: (t: Todo) => void; onDelete: (t: Todo) => void }) {
  const t = useT(tasksDict);
  const { tag } = useDateLocale();
  const overdue = !!todo.dueAt && todo.dueAt.getTime() < now && !todo.done;

  const due = (d: Date) => {
    const time = formatTime(d, tag, { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === new Date().toDateString()) return t('todayAt', { time });
    return t('dateTime', { date: formatDate(d, tag, { weekday: 'short', day: 'numeric', month: 'short' }), time });
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className="group flex items-start gap-3.5 rounded-[18px] px-3 py-3 transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--surface)_92%,var(--ink))]"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.done}
        aria-label={todo.done ? t('markOpen') : t('markDone')}
        onClick={() => onToggle(todo)}
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-200 ${
          todo.done ? 'bg-success text-white' : 'shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--ink)_28%,transparent)] hover:shadow-[inset_0_0_0_2px_var(--success)]'
        }`}
      >
        <AnimatePresence>
          {todo.done && (
            <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.18 }}>
              <Check size={14} weight="bold" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-[15.5px] font-semibold leading-snug transition-colors duration-300 ${todo.done ? 'text-ink-3 line-through' : 'text-ink'}`}>{todo.title}</p>
        {todo.details && !todo.done && <p className="mt-0.5 line-clamp-2 text-[14px] text-ink-2">{todo.details}</p>}
        {todo.dueAt && !todo.done && (
          <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12.5px] font-bold ${overdue ? 'bg-blush text-blush-ink' : 'bg-inset text-ink-2'}`}>
            <CalendarBlank size={13} weight="bold" aria-hidden="true" />
            {overdue ? `${t('overdue')} · ` : ''}{due(todo.dueAt)}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(todo)}
        aria-label={`${t('deleteItem')}: ${todo.title}`}
        className="grid size-9 shrink-0 place-items-center rounded-full text-ink-3 opacity-100 transition-[opacity,background-color,color] duration-200 hover:bg-inset hover:text-danger-ink sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      >
        <Trash size={17} weight="bold" />
      </button>
    </motion.li>
  );
}

function TodosContent() {
  const { user } = useSession();
  const { ready } = useApp();
  const t = useT(tasksDict);
  const tc = useT(commonDict);
  const { tag } = useDateLocale();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [dueAt, setDueAt] = useState('');
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  // The time overdue is measured against, moved on every minute.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(() => {
    if (!user) return;
    api.todos.list(user.username)
      .then((list) => { setTodos(visible(list)); setError(null); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : t('todosLoadError')))
      .finally(() => setLoading(false));
  }, [user, t]);

  useEffect(() => {
    if (!ready || !user) return;
    const unsub = api.todos.subscribe(user.username, (list) => {
      setTodos(visible(list));
      setLoading(false);
    });
    load();
    return () => unsub();
  }, [ready, user, load]);

  async function add() {
    if (!title.trim() || !user || saving) return;
    setSaving(true);
    setAddError('');
    try {
      const created = await api.todos.create(user.username, {
        title: title.trim(),
        details: details.trim(),
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      });
      setTodos((list) => (list.some((x) => x.id === created.id) ? list : [fromApi(created), ...list]));
      setTitle('');
      setDetails('');
      setDueAt('');
      setShowDetails(false);
      input.current?.focus();
    } catch (e: unknown) {
      setAddError(e instanceof Error && e.message ? e.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  function toggle(todo: Todo) {
    if (!user) return;
    const done = !todo.done;
    const doneAt = done ? new Date() : null;
    setTodos((list) => list.map((x) => (x.id === todo.id ? { ...x, done, doneAt } : x)));
    api.todos.update(user.username, todo.id, { done, doneAt: doneAt ? doneAt.toISOString() : null }).catch(() => {
      setTodos((list) => list.map((x) => (x.id === todo.id ? todo : x)));
    });
  }

  function remove(todo: Todo) {
    if (!user) return;
    setTodos((list) => list.filter((x) => x.id !== todo.id));
    api.todos.delete(user.username, todo.id).catch(() => setTodos((list) => [todo, ...list]));
  }

  const open = todos
    .filter((x) => !x.done)
    .sort((a, b) => (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity) || b.createdAt.getTime() - a.createdAt.getTime());
  const done = todos.filter((x) => x.done).sort((a, b) => (b.doneAt?.getTime() ?? 0) - (a.doneAt?.getTime() ?? 0));
  const dueLabel = dueAt
    ? t('dateTime', {
        date: formatDate(new Date(dueAt), tag, { weekday: 'short', day: 'numeric', month: 'short' }),
        time: formatTime(new Date(dueAt), tag, { hour: '2-digit', minute: '2-digit' }),
      })
    : null;

  return (
    <Page width="narrow">
      <PageHeader title={t('todosTitle')} subtitle={!loading && !error ? t('todosLead', { n: open.length }) : undefined} />

      <form
        onSubmit={(e) => { e.preventDefault(); void add(); }}
        className="squircle rise mb-10 rounded-[24px] bg-surface p-2"
      >
        <div className="flex items-center gap-2">
          <span className="grid size-10 shrink-0 place-items-center text-ink-3" aria-hidden="true"><Plus size={20} weight="bold" /></span>
          <input
            ref={input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('composePlaceholder')}
            aria-label={t('addTodo')}
            maxLength={500}
            className="h-12 min-w-0 flex-1 bg-transparent text-[16px] font-medium outline-none placeholder:text-ink-3"
          />
          <Button type="submit" disabled={!title.trim() || saving || !ready} className="shrink-0">
            {saving ? <Spinner size={16} /> : t('add')}
          </Button>
        </div>
        <AnimatePresence initial={false}>
          {showDetails && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t('detailsOptional')}
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
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold transition-colors ${showDetails ? 'bg-periwinkle text-periwinkle-ink' : 'text-ink-2 hover:bg-inset hover:text-ink'}`}
          >
            <TextAlignLeft size={15} weight="bold" aria-hidden="true" />
            {t('moreDetails')}
          </button>
          <button
            type="button"
            onClick={() => setPicking(true)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold transition-colors ${dueLabel ? 'bg-periwinkle text-periwinkle-ink' : 'text-ink-2 hover:bg-inset hover:text-ink'}`}
          >
            <CalendarBlank size={15} weight="bold" aria-hidden="true" />
            {dueLabel ?? t('dueOptional')}
          </button>
          {dueLabel && (
            <button type="button" onClick={() => setDueAt('')} aria-label={tc('delete')} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-inset hover:text-ink">
              <X size={14} weight="bold" />
            </button>
          )}
        </div>
        {addError && <p role="alert" className="px-3 pb-2 text-[13.5px] font-semibold text-danger-ink">{addError}</p>}
      </form>

      {!ready || loading ? (
        <RowsSkeleton rows={4} lead="round" />
      ) : error ? (
        <div className="squircle rounded-[26px] bg-surface">
          <PixelState
            title={t('loadFailed')}
            detail={technicalReason(error)}
            action={<Button variant="quiet" onClick={() => { setLoading(true); load(); }}><ArrowClockwise size={17} weight="bold" aria-hidden="true" />{tc('retry')}</Button>}
          />
        </div>
      ) : todos.length === 0 ? (
        <div className="rise flex flex-col items-center py-12 text-center">
          <span className="grid size-16 place-items-center rounded-[20px] bg-sage text-sage-ink"><CheckSquare size={30} weight="bold" aria-hidden="true" /></span>
          <p className="mt-5 text-[18px] font-bold tracking-[-0.02em]">{t('todosEmptyTitle')}</p>
          <p className="mt-1 text-[15px] text-ink-2">{t('todosEmptySubtitle')}</p>
        </div>
      ) : (
        <div className="grid gap-10 xl:grid-cols-2 xl:items-start xl:gap-6">
          {open.length > 0 && (
            <Section title={t('openTitle')}>
              <ul className="squircle flex flex-col gap-0.5 rounded-[24px] bg-surface p-2">
                <AnimatePresence initial={false}>
                  {open.map((x) => <TodoRow key={x.id} todo={x} now={now} onToggle={toggle} onDelete={remove} />)}
                </AnimatePresence>
              </ul>
            </Section>
          )}
          {done.length > 0 && (
            <Section title={t('doneTitle')}>
              <ul className="squircle flex flex-col gap-0.5 rounded-[24px] bg-surface p-2">
                <AnimatePresence initial={false}>
                  {done.map((x) => <TodoRow key={x.id} todo={x} now={now} onToggle={toggle} onDelete={remove} />)}
                </AnimatePresence>
              </ul>
            </Section>
          )}
        </div>
      )}

      {picking && (
        <DateTimePicker value={dueAt} onChange={(v) => setDueAt(v)} onBack={() => setPicking(false)} />
      )}
    </Page>
  );
}

export default function TodosPage() {
  return (
    <AuthGuard>
      <TodosContent />
    </AuthGuard>
  );
}
