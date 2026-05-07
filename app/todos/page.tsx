'use client';

import { useEffect, useState } from 'react';
import { Plus, Check, Trash2, CheckSquare, Clock, AlignLeft, X, Calendar } from 'lucide-react';
import DateTimePicker from '@/components/ui/DateTimePicker';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import EmptyView from '@/components/ui/EmptyView';
import { useApp } from '@/providers/AppProvider';
import { useSession } from '@/providers/SessionProvider';
import { api, type ApiTodo } from '@/lib/api-client';

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

function apiTodoToTodo(t: ApiTodo): Todo {
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

export default function TodosPage() {
  const { user } = useSession();
  const { ready } = useApp();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    if (!ready || !user) return;

    // Subscribe to SSE for real-time updates
    const unsub = api.todos.subscribe(user.username, (apiTodos) => {
      const now = Date.now();
      setTodos(
        apiTodos
          .map(apiTodoToTodo)
          .filter((t) => !t.done || !t.doneAt || now - t.doneAt.getTime() < DAY_MS)
      );
      setLoading(false);
    });

    // Also fetch immediately in case SSE hasn't fired yet
    api.todos.list(user.username)
      .then((apiTodos) => {
        const now = Date.now();
        setTodos(
          apiTodos
            .map(apiTodoToTodo)
            .filter((t) => !t.done || !t.doneAt || now - t.doneAt.getTime() < DAY_MS)
        );
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Fehler beim Laden der Todos.');
        setLoading(false);
      });

    return () => unsub();
  }, [ready, user]);

  async function addTodo() {
    if (!title.trim() || !user) return;
    setSaving(true);
    setAddError('');
    try {
      await api.todos.create(user.username, {
        title: title.trim(),
        details: details.trim(),
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      });
      setTitle(''); setDetails(''); setDueAt(''); setShowAdd(false);
    } catch (e: unknown) {
      console.error('[todos] create error:', e);
      setAddError(e instanceof Error ? e.message : 'Fehler beim Speichern. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(todo: Todo) {
    if (!user) return;
    const nowDone = !todo.done;
    await api.todos.update(user.username, todo.id, {
      done: nowDone,
      doneAt: nowDone ? new Date().toISOString() : null,
    });
  }

  async function remove(id: string) {
    if (!user) return;
    await api.todos.delete(user.username, id);
  }

  const active = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <AuthGuard>
      <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--app-bg)' }}>
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-3 fade-in flex-shrink-0">
          <h1 className="flex-1 text-[28px] font-bold tracking-tight" style={{ color: 'var(--app-text-primary)' }}>
            Todos
          </h1>
          {ready && (
            <button
              onClick={() => setShowAdd(true)}
              className="p-2 rounded-full press-scale"
              style={{ background: 'color-mix(in srgb, var(--accent) 15%, var(--app-surface))' }}
            >
              <Plus size={20} color="var(--accent)" />
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 px-4 pb-10 overflow-auto">
          {!ready || loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)' }}>
                <CheckSquare size={28} color="var(--danger)" />
              </div>
              <p className="text-base font-semibold" style={{ color: 'var(--app-text-primary)' }}>Fehler beim Laden</p>
              <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); if (user) api.todos.list(user.username).then((t) => { setTodos(t.map(apiTodoToTodo)); setLoading(false); }).catch((e: unknown) => { setError(e instanceof Error ? e.message : 'Fehler'); setLoading(false); }); }}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white press-scale"
                style={{ background: 'var(--accent)' }}
              >
                Erneut versuchen
              </button>
            </div>
          ) : todos.length === 0 ? (
            <EmptyView
              icon={<CheckSquare size={56} color="var(--app-text-primary)" />}
              title="Keine Todos"
              subtitle="Füge deine ersten Aufgaben hinzu."
            />
          ) : (
            <div className="flex flex-col gap-4 fade-in">
              {active.length > 0 && (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
                    style={{ color: 'var(--app-text-secondary)' }}>
                    Offen ({active.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {active.map((t) => (
                      <TodoCard key={t.id} todo={t} onToggle={toggle} onDelete={remove} />
                    ))}
                  </div>
                </section>
              )}
              {done.length > 0 && (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
                    style={{ color: 'var(--app-text-secondary)' }}>
                    Erledigt ({done.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {done.map((t) => (
                      <TodoCard key={t.id} todo={t} onToggle={toggle} onDelete={remove} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Add modal */}
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
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
                  >
                    <CheckSquare size={20} color="var(--accent)" />
                  </div>
                  <h3 className="text-[18px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
                    Todo hinzufügen
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
                  onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) addTodo(); }}
                  className="w-full rounded-xl px-4 py-3 text-[15px] outline-none"
                  style={{ background: 'var(--app-card)', color: 'var(--app-text-primary)' }}
                  autoFocus
                />
                <div className="relative">
                  <AlignLeft size={15} className="absolute left-3.5 top-3.5 pointer-events-none" color="var(--app-text-tertiary)" />
                  <input
                    placeholder="Details (optional)"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-[15px] outline-none"
                    style={{ background: 'var(--app-card)', color: 'var(--app-text-primary)' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="w-full rounded-xl px-4 py-3 text-[15px] text-left flex items-center gap-3 press-scale"
                  style={{
                    background: 'var(--app-card)',
                    color: dueAt ? 'var(--app-text-primary)' : 'var(--app-text-tertiary)',
                    border: `1.5px solid ${dueAt ? 'var(--accent)' : 'transparent'}`,
                  }}
                >
                  <Calendar size={16} color={dueAt ? 'var(--accent)' : 'var(--app-text-tertiary)'} />
                  {dueAt
                    ? (() => {
                        const d = new Date(dueAt);
                        return d.toLocaleDateString('de', { weekday: 'short', day: 'numeric', month: 'short' }) +
                          ' · ' + d.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
                      })()
                    : 'Fälligkeitsdatum wählen (optional)'
                  }
                </button>
                {addError && (
                  <p className="text-sm px-3 py-2.5 rounded-xl" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}>
                    {addError}
                  </p>
                )}
                <button
                  onClick={addTodo}
                  disabled={!title.trim() || saving}
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
            value={dueAt}
            onChange={(v) => setDueAt(v)}
            onBack={() => setShowDatePicker(false)}
          />
        )}
      </div>
    </AuthGuard>
  );
}

function TodoCard({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: (t: Todo) => void;
  onDelete: (id: string) => void;
}) {
  function formatDue(d: Date) {
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Heute ${time}`;
    return d.toLocaleDateString('de', { day: 'numeric', month: 'short' }) + ' ' + time;
  }

  const isPast = !!todo.dueAt && todo.dueAt < new Date() && !todo.done;

  return (
    <div
      className="rounded-2xl px-4 py-3.5"
      style={{
        background: 'var(--app-surface)',
        border: isPast
          ? '1px solid color-mix(in srgb, var(--danger) 30%, transparent)'
          : '1px solid var(--app-border)',
      }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(todo)}
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 press-scale mt-0.5"
          style={{
            borderColor: todo.done ? 'var(--tint)' : 'var(--app-border)',
            background: todo.done ? 'var(--tint)' : 'transparent',
          }}
        >
          {todo.done && <Check size={13} color="#fff" />}
        </button>
        <div className="flex-1 min-w-0">
          <p
            className="text-[15px] font-medium leading-snug"
            style={{
              color: 'var(--app-text-primary)',
              textDecoration: todo.done ? 'line-through' : 'none',
              opacity: todo.done ? 0.45 : 1,
            }}
          >
            {todo.title}
          </p>
          {todo.details && !todo.done && (
            <p className="text-sm mt-0.5 line-clamp-2" style={{ color: 'var(--app-text-secondary)' }}>
              {todo.details}
            </p>
          )}
          {todo.dueAt && !todo.done && (
            <div className="flex items-center gap-1 mt-1.5">
              <Clock size={11} color={isPast ? 'var(--danger)' : 'var(--app-text-tertiary)'} />
              <span className="text-xs" style={{ color: isPast ? 'var(--danger)' : 'var(--app-text-tertiary)' }}>
                {formatDue(todo.dueAt)}
              </span>
            </div>
          )}
        </div>
        <button onClick={() => onDelete(todo.id)} className="p-1 press-scale flex-shrink-0 mt-0.5">
          <Trash2 size={15} color="var(--app-text-tertiary)" />
        </button>
      </div>
    </div>
  );
}
