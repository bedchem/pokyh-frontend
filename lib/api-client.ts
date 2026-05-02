'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.pokyh.com';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';

// ─── Token storage ────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Check localStorage first, then cookie
  const ls = localStorage.getItem('pockyh_api_token');
  if (ls) return ls;
  // Fallback: read from cookie (set by server after login)
  const match = document.cookie.match(/(?:^|;\s*)pockyh_api_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pockyh_api_token', token);
}

function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pockyh_api_refresh', token);
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  const ls = localStorage.getItem('pockyh_api_refresh');
  if (ls) return ls;
  // Fallback: cookie
  const match = document.cookie.match(/(?:^|;\s*)pockyh_api_refresh=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pockyh_api_token');
  localStorage.removeItem('pockyh_api_refresh');
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

let _refreshing: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ refreshToken: rt }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const data = await res.json() as { token: string };
    setToken(data.token);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // 401 → try to refresh once
  if (res.status === 401) {
    if (!_refreshing) {
      _refreshing = refreshAccessToken().finally(() => { _refreshing = null; });
    }
    const refreshed = await _refreshing;

    if (refreshed) {
      const newToken = getToken();
      if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } else {
      // Session expired — signal the app
      if (typeof window !== 'undefined') {
        clearTokens();
        window.dispatchEvent(new CustomEvent('pockyh-session-expired'));
      }
    }
  }

  return res;
}

async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiUser {
  stableUid: string;
  username: string;
  webuntisKlasseId: number;
  webuntisKlasseName: string;
  classId: string | null;
  isAdmin: boolean;
}

export interface ApiTodo {
  id: string;
  stableUid: string;
  title: string;
  details: string;
  dueAt: string | null;
  done: boolean;
  doneAt: string | null;
  createdAt: string;
}

export interface ApiReminder {
  id: string;
  classId: string;
  title: string;
  body: string;
  remindAt: string;
  createdBy: string;
  createdByName: string;
  createdByUsername: string;
  createdAt: string;
}

export interface ApiClass {
  id: string;
  name: string;
  code: string;
  webuntisKlasseId: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  members: Array<{ stableUid: string; username: string; joinedAt?: string }>;
}

export interface DishRatingsData {
  ratings: Record<string, number>;
  myRating: number | null;
}

export interface CreateTodoData {
  title: string;
  details?: string;
  dueAt?: string | null;
}

export interface CreateReminderData {
  title: string;
  body?: string;
  remindAt: string;
}

// ─── EventSource management ───────────────────────────────────────────────────

function openSse(path: string): EventSource {
  const token = getToken();
  // EventSource doesn't support custom headers — pass token as query param
  const url = `${API_BASE}${path}?token=${encodeURIComponent(token ?? '')}&apiKey=${encodeURIComponent(API_KEY)}`;
  return new EventSource(url);
}

// ─── API object ───────────────────────────────────────────────────────────────

export const api = {
  // Tokens
  setToken,
  setRefreshToken,
  getToken,
  clearTokens,

  auth: {
    async loginWithSession(
      username: string,
      klasseId: number,
      klasseName: string
    ): Promise<{ stableUid: string; classId: string | null; isAdmin: boolean }> {
      // This is called by FirebaseProvider replacement after Next.js sets cookies.
      // The tokens should already be in cookies — sync them to localStorage.
      const cookieToken = typeof document !== 'undefined'
        ? (() => {
            const m = document.cookie.match(/(?:^|;\s*)pockyh_api_token=([^;]*)/);
            return m ? decodeURIComponent(m[1]) : null;
          })()
        : null;

      const cookieRefresh = typeof document !== 'undefined'
        ? (() => {
            const m = document.cookie.match(/(?:^|;\s*)pockyh_api_refresh=([^;]*)/);
            return m ? decodeURIComponent(m[1]) : null;
          })()
        : null;

      if (cookieToken) setToken(cookieToken);
      if (cookieRefresh) setRefreshToken(cookieRefresh);

      // Fetch current user info
      try {
        const user = await apiJson<ApiUser>('/auth/me');
        return {
          stableUid: user.stableUid,
          classId: user.classId,
          isAdmin: user.isAdmin,
        };
      } catch {
        // Token not valid yet or not set — this can happen on first load
        return { stableUid: '', classId: null, isAdmin: false };
      }
    },

    async refresh(): Promise<boolean> {
      return refreshAccessToken();
    },

    async logout(): Promise<void> {
      const rt = getRefreshToken();
      if (rt) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: rt }),
        }).catch(() => {});
      }
      clearTokens();
    },

    async me(): Promise<ApiUser> {
      return apiJson<ApiUser>('/auth/me');
    },
  },

  users: {
    async get(userId: string): Promise<ApiUser> {
      return apiJson<ApiUser>(`/users/${encodeURIComponent(userId)}`);
    },
  },

  todos: {
    async list(username: string): Promise<ApiTodo[]> {
      return apiJson<ApiTodo[]>(`/users/${encodeURIComponent(username)}/todos`);
    },

    async create(username: string, data: CreateTodoData): Promise<ApiTodo> {
      return apiJson<ApiTodo>(`/users/${encodeURIComponent(username)}/todos`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async update(username: string, todoId: string, data: Partial<ApiTodo>): Promise<ApiTodo> {
      return apiJson<ApiTodo>(`/users/${encodeURIComponent(username)}/todos/${todoId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    async delete(username: string, todoId: string): Promise<void> {
      const res = await apiFetch(`/users/${encodeURIComponent(username)}/todos/${todoId}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
    },

    subscribe(username: string, callback: (todos: ApiTodo[]) => void): () => void {
      const token = getToken();
      if (!token) return () => {};

      // Use SSE — we need auth. Pass token as query param since EventSource can't set headers.
      const url = `${API_BASE}/sse/todos?apiKey=${encodeURIComponent(API_KEY)}&token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);

      es.addEventListener('todos', (e: MessageEvent) => {
        try {
          const todos = JSON.parse(e.data) as ApiTodo[];
          callback(todos);
        } catch {
          console.error('[api-client] Failed to parse todos SSE event');
        }
      });

      es.onerror = () => {
        // EventSource auto-reconnects
        console.warn('[api-client] SSE todos connection lost, reconnecting...');
      };

      return () => es.close();
    },
  },

  classes: {
    async get(classId: string): Promise<ApiClass> {
      return apiJson<ApiClass>(`/classes/${classId}`);
    },

    async getMine(): Promise<ApiClass | null> {
      try {
        return await apiJson<ApiClass | null>('/classes/mine');
      } catch {
        return null;
      }
    },
  },

  reminders: {
    async list(classId: string): Promise<ApiReminder[]> {
      return apiJson<ApiReminder[]>(`/classes/${classId}/reminders`);
    },

    async create(classId: string, data: CreateReminderData): Promise<ApiReminder> {
      return apiJson<ApiReminder>(`/classes/${classId}/reminders`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async delete(classId: string, reminderId: string): Promise<void> {
      const res = await apiFetch(`/classes/${classId}/reminders/${reminderId}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
    },

    subscribe(classId: string, callback: (reminders: ApiReminder[]) => void): () => void {
      const token = getToken();
      if (!token || !classId) return () => {};

      const url = `${API_BASE}/sse/reminders/${classId}?apiKey=${encodeURIComponent(API_KEY)}&token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);

      es.addEventListener('reminders', (e: MessageEvent) => {
        try {
          const reminders = JSON.parse(e.data) as ApiReminder[];
          callback(reminders);
        } catch {
          console.error('[api-client] Failed to parse reminders SSE event');
        }
      });

      es.onerror = () => {
        console.warn('[api-client] SSE reminders connection lost, reconnecting...');
      };

      return () => es.close();
    },
  },

  dishRatings: {
    async get(dishId: string): Promise<DishRatingsData> {
      return apiJson<DishRatingsData>(`/dish-ratings/${encodeURIComponent(dishId)}`);
    },

    async getBatch(dishIds: string[]): Promise<Record<string, DishRatingsData>> {
      return apiJson<Record<string, DishRatingsData>>('/dish-ratings/batch', {
        method: 'POST',
        body: JSON.stringify({ dishIds }),
      });
    },

    async rate(dishId: string, stars: number): Promise<void> {
      await apiJson(`/dish-ratings/${encodeURIComponent(dishId)}`, {
        method: 'POST',
        body: JSON.stringify({ stars }),
      });
    },

    subscribe(dishId: string, callback: (data: DishRatingsData) => void): () => void {
      const token = getToken();
      if (!token || !dishId) return () => {};

      const url = `${API_BASE}/sse/dish-ratings/${encodeURIComponent(dishId)}?apiKey=${encodeURIComponent(API_KEY)}&token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);

      es.addEventListener('dishRatings', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as DishRatingsData;
          callback(data);
        } catch {
          console.error('[api-client] Failed to parse dishRatings SSE event');
        }
      });

      es.onerror = () => {
        console.warn('[api-client] SSE dish-ratings connection lost, reconnecting...');
      };

      return () => es.close();
    },
  },
};
