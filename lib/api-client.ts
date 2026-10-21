'use client';

import { API_BASE, API_KEY, forgetSignIn, rememberAccessToken } from './backend';
import type { BellMarks } from './bell-feed';

// ─── Token storage ────────────────────────────────────────────────────────────

// The tokens live in cookies only: the access token readable on the website's
// address for the Authorization header (lib/backend.ts), the refresh token
// httpOnly on the API's address. Deleting the cookies therefore signs out.

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
  const stableUid = tokenPayload(getToken())?.stableUid;
  return typeof stableUid === 'string' && stableUid ? stableUid : null;
}

function tokenPayload(token: string | null): { stableUid?: unknown; exp?: unknown } | null {
  const part = token?.split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    return JSON.parse(atob(base64)) as { stableUid?: unknown; exp?: unknown };
  } catch {
    return null;
  }
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

let _refreshing: Promise<boolean> | null = null;

/** One renewal at a time, shared by every request waiting for it. */
function refreshOnce(): Promise<boolean> {
  _refreshing ??= refreshAccessToken().finally(() => { _refreshing = null; });
  return _refreshing;
}

// The access token lives an hour, its cookie longer. Routes that only *may*
// know the account (the page views, the usage heartbeat) accept a request
// with an expired token as anonymous instead of answering 401, so nothing
// would renew it: a phone opened hours later and used only for the timetable
// was never counted as the account's. Renewed before sending instead, also
// when the cookie is gone while the account is still signed in. A failed
// renewal is not tried again for a minute, so a signed-out device never
// floods the refresh route.
const EXPIRY_MARGIN_MS = 60_000;
const RETRY_REFRESH_AFTER_MS = 60_000;
let _refreshFailedAt = 0;

function needsRenewal(token: string | null): boolean {
  if (!token) return typeof document !== 'undefined' && /(?:^|;\s*)pokyh_user=/.test(document.cookie);
  const exp = tokenPayload(token)?.exp;
  return typeof exp === 'number' && exp * 1000 - Date.now() < EXPIRY_MARGIN_MS;
}

/** The access token, renewed first when it is about to expire. */
export function accessToken(): Promise<string | null> {
  return currentToken();
}

async function currentToken(): Promise<string | null> {
  const token = getToken();
  if (!needsRenewal(token) || Date.now() - _refreshFailedAt < RETRY_REFRESH_AFTER_MS) return token;
  if (await refreshOnce()) return getToken();
  _refreshFailedAt = Date.now();
  return token;
}

async function refreshAccessToken(): Promise<boolean> {
  // The refresh token is an httpOnly cookie of the API that page scripts cannot
  // read: the browser sends it along with this request, the API rotates it and
  // answers a fresh access token, kept in pokyh_api_token.
  try {
    const res = await fetch(`${API_BASE}/auth/web/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-API-Key': API_KEY },
    });

    if (!res.ok) return false;
    const data = await res.json() as { token?: string };
    if (!data.token) return false;
    rememberAccessToken(data.token);
    return true;
  } catch {
    return false;
  }
}

/** Ends the sign-in everywhere it lives: the API revokes and clears its cookies, the page its own. */
export async function signOutEverywhere(): Promise<void> {
  await fetch(`${API_BASE}/auth/web/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-API-Key': API_KEY },
  }).catch(() => {});
  forgetSignIn();
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

/**
 * A Mensa read (comments, ratings). A signed-in account reads its own school's
 * menu; `guest` reads as nobody, which is what the public Mensa page shows of
 * a school named with ?school=.
 */
async function mensaJson<T>(path: string, init: RequestInit & { guest?: boolean } = {}): Promise<T> {
  const { guest, ...rest } = init;
  const token = guest ? null : await currentToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      'X-API-Key': API_KEY,
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/** The school a Mensa read names, as a query part ("&school=…"), or nothing. */
const schoolQuery = (school: string | null | undefined, lead: '?' | '&') => (school ? `${lead}school=${encodeURIComponent(school)}` : '');

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await currentToken();
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

    const refreshed = await refreshOnce();

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

// ─── Live streams ─────────────────────────────────────────────────────────────

// EventSource can't send headers, so the token and API key ride in the address.
// The browser retries a dropped stream by itself, but with that same address
// (an expired token after an hour), and never after an error answer such as
// 401 or 429: the stream then stays shut. Every error therefore closes it and
// opens a new one with a current token, waiting twice as long each time up to
// five minutes, so a rate limit or an outage isn't hammered. The waits are
// spread so a school's streams that dropped together don't return together.
const STREAM_RETRY_MIN_MS = 2_000;
const STREAM_RETRY_MAX_MS = 5 * 60_000;

function liveStream<T>(path: string, event: string, onData: (data: T) => void): () => void {
  let source: EventSource | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let delay = STREAM_RETRY_MIN_MS;
  let stopped = false;

  const retry = () => {
    if (stopped) return;
    timer = setTimeout(() => { void open(); }, delay * (0.5 + Math.random() / 2));
    delay = Math.min(delay * 2, STREAM_RETRY_MAX_MS);
  };

  const open = async () => {
    const token = await currentToken();
    if (stopped) return;
    if (!token) { retry(); return; }
    const es = new EventSource(`${API_BASE}${path}?token=${encodeURIComponent(token)}&apiKey=${encodeURIComponent(API_KEY)}`);
    source = es;
    es.onopen = () => { delay = STREAM_RETRY_MIN_MS; };
    es.addEventListener(event, (e: MessageEvent<string>) => {
      let data: T;
      try {
        data = JSON.parse(e.data) as T;
      } catch {
        console.error(`[api-client] Failed to parse ${event} SSE event`);
        return;
      }
      onData(data);
    });
    es.onerror = () => {
      es.close();
      source = null;
      retry();
    };
  };

  void open();
  return () => {
    stopped = true;
    clearTimeout(timer);
    source?.close();
  };
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
  /** Under a dish, signed in: the stars its author gave it (pokyh-backend matches them by account, also across a changed stableUid). */
  stars?: number | null;
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

// ─── API object ───────────────────────────────────────────────────────────────

export const api = {
  // Tokens
  getToken,

  auth: {
    async loginWithSession(): Promise<{ stableUid: string; classId: string | null; isAdmin: boolean }> {
      // Called once the sign-in has set the token cookies: who is signed in.
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
      await signOutEverywhere();
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

  // Which of the bell's notifications the account has seen and cleared away,
  // the same on every device (identifiers only, kept 30 days).
  bell: {
    async marks(): Promise<BellMarks> {
      return apiJson<BellMarks>('/users/me/bell');
    },
    async mark(marks: BellMarks): Promise<void> {
      const res = await apiFetch('/users/me/bell', { method: 'POST', body: JSON.stringify(marks) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
      return liveStream('/sse/todos', 'todos', callback);
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
      if (!classId) return () => {};
      return liveStream(`/sse/reminders/${encodeURIComponent(classId)}`, 'reminders', callback);
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
      if (!reminderId) return () => {};
      return liveStream(`/sse/reminder-comments/${encodeURIComponent(reminderId)}`, 'reminderComments', callback);
    },
  },

  dishComments: {
    // With `school`: what a guest sees of that school's comments.
    async list(dishId: string, school?: string | null): Promise<ApiComment[]> {
      return mensaJson<ApiComment[]>(`/dish-comments/${encodeURIComponent(dishId)}${schoolQuery(school, '?')}`, { guest: !!school });
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
      if (!dishId) return () => {};
      return liveStream(`/sse/dish-comments/${encodeURIComponent(dishId)}`, 'dishComments', callback);
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
    // With `school`: what a guest sees of that school's ratings.
    async get(dishId: string, school?: string | null): Promise<DishRatingsData> {
      return mensaJson<DishRatingsData>(`/dish-ratings/${encodeURIComponent(dishId)}${schoolQuery(school, '?')}`, { guest: !!school });
    },

    async getBatch(dishIds: string[], school?: string | null): Promise<Record<string, DishRatingsData>> {
      const ids = dishIds.filter((d) => /^[a-z0-9-]{1,120}$/i.test(d)).slice(0, 100);
      if (!ids.length) return {};
      return mensaJson<Record<string, DishRatingsData>>(`/dish-ratings/batch${schoolQuery(school, '?')}`, {
        method: 'POST',
        body: JSON.stringify({ dishIds: ids }),
        guest: !!school,
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
      return liveStream<DishRatingsData & { dishId: string }>('/sse/dish-ratings', 'dishRating', ({ dishId, ...data }) => callback(dishId, data));
    },

    subscribe(dishId: string, callback: (data: DishRatingsData) => void): () => void {
      if (!dishId) return () => {};
      return liveStream(`/sse/dish-ratings/${encodeURIComponent(dishId)}`, 'dishRatings', callback);
    },
  },
};
