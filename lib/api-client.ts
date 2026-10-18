'use client';

// Resolve the backend base URL. NEXT_PUBLIC_* values are inlined into the client
// bundle at build time, so a stale/misconfigured `http://` value gets frozen in.
//
// Guard against Mixed Content: when the page is served over HTTPS, an `http://`
// API base makes the browser block every fetch and EventSource. If the page is
// HTTPS, force the API onto HTTPS too (the backend serves both schemes).
function resolveApiBase(): string {
  const configured = (
    process.env.NEXT_PUBLIC_API_BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'https://api.pokyh.com'
  ).replace(/\/$/, '');

  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    configured.startsWith('http://')
  ) {
    return `https://${configured.slice('http://'.length)}`;
  }
  return configured;
}

const API_BASE = resolveApiBase();
const API_KEY =
  process.env.NEXT_PUBLIC_API_BACKEND_KEY ??
  process.env.NEXT_PUBLIC_API_KEY ??
  '';

// ─── Token storage ────────────────────────────────────────────────────────────

// The tokens live in cookies only, set by the app's own routes: the access
// token readable for the Authorization header, the refresh token httpOnly.
// Deleting the site's cookies therefore signs out.

const LEGACY_TOKEN_KEYS = ['pokyh_api_token', 'pokyh_api_refresh'];

function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)pokyh_api_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Removes the copies of the tokens earlier versions kept in localStorage. */
export function forgetStoredTokens(): void {
  try { for (const key of LEGACY_TOKEN_KEYS) localStorage.removeItem(key); } catch { /* storage blocked */ }
}

/**
 * The account behind the current access token, read from the token's payload.
 * Not a security check (the backend verifies every token); it only tells
 * client code which account it is acting for.
 */
export function getSignedInUid(): string | null {
  const part = getToken()?.split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const payload = JSON.parse(atob(base64)) as { stableUid?: unknown };
    return typeof payload.stableUid === 'string' && payload.stableUid ? payload.stableUid : null;
  } catch {
    return null;
  }
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

let _refreshing: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  // Refresh via the same-origin Next.js route: the refresh token is stored in an
  // httpOnly cookie that JS cannot read, so we cannot call the backend directly.
  // The browser sends the httpOnly cookie automatically to /api/auth/refresh,
  // which exchanges it and sets a fresh pokyh_api_token cookie.
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
    });

    if (!res.ok) return false;
    const data = await res.json() as { token?: string };
    return !!data.token;
  } catch {
    return false;
  }
}

// Dispatch pokyh-session-expired once per expiry window so SessionProvider
// redirects to /login. Deduplicated because multiple simultaneous 401s would
// otherwise fire multiple redirects (SessionProvider also deduplicates via `handling`).
let _sessionExpiredPending = false;
function notifySessionExpired() {
  if (_sessionExpiredPending) return;
  _sessionExpiredPending = true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pokyh-session-expired'));
  }
  // Reset after 10s so a future re-login → re-expiry can trigger again
  setTimeout(() => { _sessionExpiredPending = false; }, 10_000);
}

/** JSON from one of the app's own routes (same origin, cookies included). */
async function localJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers as Record<string, string> ?? {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // 401 → try to refresh once. If refresh also fails AND we had a session,
  // fire pokyh-session-expired so SessionProvider redirects to /login.
  if (res.status === 401) {
    // Capture before the refresh attempt (which clears the cookies on failure).
    // "Had a session" also covers the case where the access token is missing but
    // the user cookie still exists (e.g. the backend login-sync failed), without
    // this, a missing token would skip the redirect and loop forever.
    const hadSession =
      !!token ||
      (typeof document !== 'undefined' && /(?:^|;\s*)pokyh_user=/.test(document.cookie));

    if (!_refreshing) {
      _refreshing = refreshAccessToken().finally(() => { _refreshing = null; });
    }
    const refreshed = await _refreshing;

    if (refreshed) {
      const newToken = getToken();
      if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } else if (hadSession) {
      notifySessionExpired();
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
  role?: 'student' | 'parent';
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

export interface ApiComment {
  id: string;
  reminderId?: string;
  dishId?: string;
  classId?: string;
  stableUid: string;
  username: string;
  body: string;
  createdAt: string;
  updatedAt: string;
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
  const url = `${API_BASE}${path}?token=${encodeURIComponent(token ?? '')}&apiKey=${encodeURIComponent(API_KEY)}`;
  return new EventSource(url);
}

// ─── API object ───────────────────────────────────────────────────────────────

export const api = {
  // Tokens
  getToken,

  auth: {
    async loginWithSession(
      username: string,
      klasseId: number,
      klasseName: string
    ): Promise<{ stableUid: string; classId: string | null; isAdmin: boolean }> {
      // Called once the sign-in route has set the token cookies: who is signed in.
      try {
        const user = await apiJson<ApiUser>('/auth/me');
        return {
          stableUid: user.stableUid,
          classId: user.classId,
          isAdmin: user.isAdmin,
        };
      } catch {
        // Token not valid yet or not set, this can happen on first load
        return { stableUid: '', classId: null, isAdmin: false };
      }
    },

    async refresh(): Promise<boolean> {
      return refreshAccessToken();
    },

    async logout(): Promise<void> {
      // The refresh token is httpOnly: the app's route revokes it and clears the cookies.
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
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

      // Use SSE: pass token as query param (EventSource can't set headers).
      // The proxy route injects the API key server-side.
      const url = `${API_BASE}/sse/todos?token=${encodeURIComponent(token)}&apiKey=${encodeURIComponent(API_KEY)}`;
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

      const url = `${API_BASE}/sse/reminders/${classId}?token=${encodeURIComponent(token)}&apiKey=${encodeURIComponent(API_KEY)}`;
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

  reminderComments: {
    async list(classId: string, reminderId: string): Promise<ApiComment[]> {
      return apiJson<ApiComment[]>(`/classes/${classId}/reminders/${reminderId}/comments`);
    },

    async create(classId: string, reminderId: string, body: string): Promise<ApiComment> {
      return apiJson<ApiComment>(`/classes/${classId}/reminders/${reminderId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
    },

    async update(classId: string, reminderId: string, commentId: string, body: string): Promise<ApiComment> {
      return apiJson<ApiComment>(`/classes/${classId}/reminders/${reminderId}/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      });
    },

    async delete(classId: string, reminderId: string, commentId: string): Promise<void> {
      const res = await apiFetch(`/classes/${classId}/reminders/${reminderId}/comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
    },

    subscribe(reminderId: string, callback: (comments: ApiComment[]) => void): () => void {
      const token = getToken();
      if (!token || !reminderId) return () => {};
      const url = `${API_BASE}/sse/reminder-comments/${encodeURIComponent(reminderId)}?token=${encodeURIComponent(token)}&apiKey=${encodeURIComponent(API_KEY)}`;
      const es = new EventSource(url);
      es.addEventListener('reminderComments', (e: MessageEvent) => {
        try { callback(JSON.parse(e.data) as ApiComment[]); } catch { /* ignore */ }
      });
      es.onerror = () => { /* auto-reconnects */ };
      return () => es.close();
    },
  },

  dishComments: {
    // Read through the app's own route, so the Mensa backend (MENSA_API_URL) answers.
    async list(dishId: string): Promise<ApiComment[]> {
      return localJson<ApiComment[]>(`/api/mensa/comments?id=${encodeURIComponent(dishId)}`);
    },

    async create(dishId: string, body: string): Promise<ApiComment> {
      return apiJson<ApiComment>(`/dish-comments/${encodeURIComponent(dishId)}`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
    },

    async update(dishId: string, commentId: string, body: string): Promise<ApiComment> {
      return apiJson<ApiComment>(`/dish-comments/${encodeURIComponent(dishId)}/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      });
    },

    async delete(dishId: string, commentId: string): Promise<void> {
      const res = await apiFetch(`/dish-comments/${encodeURIComponent(dishId)}/${commentId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
    },

    subscribe(dishId: string, callback: (comments: ApiComment[]) => void): () => void {
      const token = getToken();
      if (!token || !dishId) return () => {};
      const url = `${API_BASE}/sse/dish-comments/${encodeURIComponent(dishId)}?token=${encodeURIComponent(token)}&apiKey=${encodeURIComponent(API_KEY)}`;
      const es = new EventSource(url);
      es.addEventListener('dishComments', (e: MessageEvent) => {
        try { callback(JSON.parse(e.data) as ApiComment[]); } catch { /* ignore */ }
      });
      es.onerror = () => { /* auto-reconnects */ };
      return () => es.close();
    },
  },

  subjectImages: {
    _cache: null as Set<string> | null,
    _promise: null as Promise<Set<string>> | null,
    _reported: false,

    async getCache(): Promise<Set<string>> {
      if (this._cache) return this._cache;
      if (this._promise) return this._promise;
      this._promise = apiFetch('/subject-images')
        .then(r => r.ok ? r.json() : [])
        .then((rows: Array<{ subject: string }>) => {
          this._cache = new Set(rows.map(r => r.subject));
          return this._cache!;
        })
        .catch(() => new Set<string>())
        .finally(() => { this._promise = null; });
      return this._promise;
    },

    invalidateCache(): void {
      this._cache = null;
      this._promise = null;
    },

    // The backend only accepts the API key as a header here, so this URL can't be used as
    // an <img src> directly: fetch it via fetchImage() and display a blob URL instead.
    imageUrl(subject: string): string {
      const key = subject.toLowerCase().trim();
      return `${API_BASE}/subject-images/${encodeURIComponent(key)}`;
    },

    fetchImage(url: string): Promise<Response> {
      // no-cache: always revalidate (cheap 304 via ETag) so replaced images show up right away.
      return fetch(url, { mode: 'cors', credentials: 'omit', cache: 'no-cache', headers: { 'X-API-Key': API_KEY } });
    },

    async reportSubjects(entries: Array<{ subjectName: string; subjectLong: string }>): Promise<void> {
      if (this._reported) return;
      this._reported = true;
      const map = new Map<string, { key: string; longName: string; shortName: string }>();
      for (const e of entries) {
        if (!e.subjectName && !e.subjectLong) continue;
        const key = (e.subjectLong || e.subjectName).toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, { key, longName: e.subjectLong || e.subjectName, shortName: e.subjectName });
        }
      }
      if (map.size === 0) return;
      await apiFetch('/subject-images/report', {
        method: 'POST',
        body: JSON.stringify({ subjects: [...map.values()] }),
      }).catch(() => {});
    },
  },

  dishRatings: {
    async get(dishId: string): Promise<DishRatingsData> {
      return localJson<DishRatingsData>(`/api/mensa/ratings?id=${encodeURIComponent(dishId)}`);
    },

    async getBatch(dishIds: string[]): Promise<Record<string, DishRatingsData>> {
      return localJson<Record<string, DishRatingsData>>('/api/mensa/ratings', {
        method: 'POST',
        body: JSON.stringify({ dishIds }),
      });
    },

    // Returns the dish's ratings after the vote, including this user's myRating.
    async rate(dishId: string, stars: number): Promise<DishRatingsData> {
      return apiJson<DishRatingsData>(`/dish-ratings/${encodeURIComponent(dishId)}`, {
        method: 'POST',
        body: JSON.stringify({ stars }),
      });
    },

    // Live ratings of every dish, fires whenever anyone rates anywhere (web or app).
    subscribeAll(callback: (dishId: string, data: DishRatingsData) => void): () => void {
      const token = getToken();
      if (!token) return () => {};

      const url = `${API_BASE}/sse/dish-ratings?token=${encodeURIComponent(token)}&apiKey=${encodeURIComponent(API_KEY)}`;
      const es = new EventSource(url);

      es.addEventListener('dishRating', (e: MessageEvent) => {
        try {
          const { dishId, ...data } = JSON.parse(e.data) as DishRatingsData & { dishId: string };
          callback(dishId, data);
        } catch {
          console.error('[api-client] Failed to parse dishRating SSE event');
        }
      });

      es.onerror = () => {
        console.warn('[api-client] SSE all dish-ratings connection lost, reconnecting...');
      };

      return () => es.close();
    },

    subscribe(dishId: string, callback: (data: DishRatingsData) => void): () => void {
      const token = getToken();
      if (!token || !dishId) return () => {};

      const url = `${API_BASE}/sse/dish-ratings/${encodeURIComponent(dishId)}?token=${encodeURIComponent(token)}&apiKey=${encodeURIComponent(API_KEY)}`;
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
