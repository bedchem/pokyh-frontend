'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Check, Trash2, CheckSquare } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import EmptyView from '@/components/ui/EmptyView';

interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'pockyh_todos';

function loadTodos(): Todo[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export default function TodosPage() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    setTodos(loadTodos());
  }, []);

  const update = useCallback((next: Todo[]) => {
    setTodos(next);
    saveTodos(next);
  }, []);

  function add() {
    if (!input.trim()) return;
    update([
      ...todos,
      {
        id: Date.now().toString(),
        text: input.trim(),
        done: false,
        createdAt: Date.now(),
      },
    ]);
    setInput('');
  }

  function toggle(id: string) {
    update(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function remove(id: string) {
    update(todos.filter((t) => t.id !== id));
  }

  const active = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <AuthGuard>
      <div
        className="min-h-dvh flex flex-col"
        style={{ background: 'var(--app-bg)' }}
      >
        <div className="px-5 pt-14 pb-4 flex items-center gap-3 fade-in flex-shrink-0">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full press-scale"
            style={{ background: 'var(--app-surface)' }}
          >
            <ChevronLeft size={20} color="var(--accent)" />
          </button>
          <h1
            className="flex-1 text-[28px] font-bold tracking-tight"
            style={{ color: 'var(--app-text-primary)' }}
          >
            Todos
          </h1>
        </div>

        {/* Input */}
        <div className="px-4 mb-4 fade-in delay-1">
          <div className="flex gap-2">
            <input
              placeholder="Neue Aufgabe…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add();
              }}
              className="flex-1 rounded-xl px-4 py-3 text-[15px] outline-none border"
              style={{
                background: 'var(--app-surface)',
                borderColor: 'var(--app-border)',
                color: 'var(--app-text-primary)',
              }}
            />
            <button
              onClick={add}
              disabled={!input.trim()}
              className="w-12 h-12 rounded-xl flex items-center justify-center press-scale disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              <Plus size={20} color="#fff" />
            </button>
          </div>
        </div>

        <div className="flex-1 px-4 pb-10 overflow-auto">
          {todos.length === 0 ? (
            <EmptyView
              icon={<CheckSquare size={56} color="var(--app-text-primary)" />}
              title="Keine Todos"
              subtitle="Füge deine ersten Aufgaben hinzu."
            />
          ) : (
            <div className="flex flex-col gap-4 fade-in delay-2">
              {active.length > 0 && (
                <section>
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
                    style={{ color: 'var(--app-text-secondary)' }}
                  >
                    Offen ({active.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {active.map((t) => (
                      <TodoRow
                        key={t.id}
                        todo={t}
                        onToggle={toggle}
                        onDelete={remove}
                      />
                    ))}
                  </div>
                </section>
              )}
              {done.length > 0 && (
                <section>
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
                    style={{ color: 'var(--app-text-secondary)' }}
                  >
                    Erledigt ({done.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {done.map((t) => (
                      <TodoRow
                        key={t.id}
                        todo={t}
                        onToggle={toggle}
                        onDelete={remove}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

function TodoRow({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ background: 'var(--app-surface)' }}
    >
      <button
        onClick={() => onToggle(todo.id)}
        className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 press-scale"
        style={{
          borderColor: todo.done ? 'var(--tint)' : 'var(--app-border)',
          background: todo.done ? 'var(--tint)' : 'transparent',
        }}
      >
        {todo.done && <Check size={13} color="#fff" />}
      </button>
      <p
        className="flex-1 text-[15px]"
        style={{
          color: 'var(--app-text-primary)',
          textDecoration: todo.done ? 'line-through' : 'none',
          opacity: todo.done ? 0.5 : 1,
        }}
      >
        {todo.text}
      </p>
      <button onClick={() => onDelete(todo.id)} className="p-1 press-scale">
        <Trash2 size={16} color="var(--app-text-tertiary)" />
      </button>
    </div>
  );
}
