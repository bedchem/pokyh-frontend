'use client';

import { useEffect, useState } from 'react';
import { Plus, Check, Trash2, CheckSquare, Clock, AlignLeft, X, Calendar } from 'lucide-react';
import DateTimePicker from '@/components/ui/DateTimePicker';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import EmptyView from '@/components/ui/EmptyView';
import { useFirebase } from '@/providers/FirebaseProvider';
import { useSession } from '@/providers/SessionProvider';

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

export default function TodosPage() {
  const { user } = useSession();
  const { ready } = useFirebase();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    if (!ready || !user) return;
    const q = query(
      collection(db!, 'users', user.username, 'todos'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      setTodos(
        snap.docs
          .map((d) => ({
            id: d.id,
            title: d.data().title ?? '',
            details: d.data().details ?? '',
            dueAt: (d.data().dueAt as Timestamp)?.toDate() ?? null,
            done: d.data().done ?? false,
            doneAt: (d.data().doneAt as Timestamp)?.toDate() ?? null,
            createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
          }))
          .filter((t) => !t.done || !t.doneAt || now - t.doneAt.getTime() < DAY_MS)
      );
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [ready, user]);

  async function addTodo() {
    if (!title.trim() || !user) return;
    setSaving(true);
    setAddError('');
    try {
      await addDoc(collection(db!, 'users', user.username, 'todos'), {
        title: title.trim(),
        details: details.trim(),
        dueAt: dueAt ? Timestamp.fromDate(new Date(dueAt)) : null,
        done: false,
        doneAt: null,
        createdAt: serverTimestamp(),
      });
      setTitle(''); setDetails(''); setDueAt(''); setShowAdd(false);
    } catch (e: unknown) {
      console.error('[todos] addDoc error:', e);
      setAddError(e instanceof Error ? e.message : 'Fehler beim Speichern. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(todo: Todo) {
    if (!user) return;
    const nowDone = !todo.done;
    await updateDoc(doc(db!, 'users', user.username, 'todos', todo.id), {
      done: nowDone,
      doneAt: nowDone ? serverTimestamp() : null,
    });
  }

  async function remove(id: string) {
    if (!user) return;
    await deleteDoc(doc(db!, 'users', user.username, 'todos', id));
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

        {/* Add sheet */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setShowAdd(false)}
            >
              <motion.div
                className="w-full rounded-t-2xl p-6 pb-12"
                style={{ background: 'var(--app-surface)' }}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--app-border)' }} />
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[18px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
                    Todo hinzufügen
                  </h3>
                  <button
                    onClick={() => setShowAdd(false)}
                    className="p-1.5 rounded-lg"
                    style={{ background: 'var(--app-card)', color: 'var(--app-text-secondary)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {showDatePicker && (
          <DateTimePicker
            value={dueAt}
            onChange={(v) => setDueAt(v)}
            onClose={() => setShowDatePicker(false)}
            title="Fälligkeitsdatum"
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
