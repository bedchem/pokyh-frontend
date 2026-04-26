'use client';

// All API routes read the session from the httpOnly cookie automatically.
// No credentials are ever sent from the client.

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_API === 'true';

function log(...args: unknown[]) {
  if (DEBUG) console.log('[api]', ...args);
}

// Prevent multiple simultaneous 401s from each triggering a logout call
let _logoutInFlight = false;
async function clearSessionOnce() {
  if (_logoutInFlight) return;
  _logoutInFlight = true;
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
}

function todayFormatted(): string {
  return new Date().toISOString().split('T')[0];
}

function dateFormatted(date: Date): string {
  return date.toISOString().split('T')[0];
}

function schoolYearStart(): string {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}0901`;
}

function schoolYearEnd(): string {
  const now = new Date();
  // End year is always the year AFTER the start year
  const endYear = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
  return `${endYear}0630`; // June 30 — covers all possible school year end dates
}

async function apiFetch(url: string, opts?: RequestInit) {
  log('fetch', url);
  const res = await fetch(url, { credentials: 'same-origin', ...opts });

  // If we got redirected to /login (HTML page), the session is expired
  if (res.redirected && res.url.includes('/login')) {
    log('redirected to login, session expired — clearing session');
    await clearSessionOnce();
    throw new Error('session_expired');
  }

  const contentType = res.headers.get('content-type') ?? '';

  if (res.status === 401) {
    log('401 response from', url, '— clearing session');
    await clearSessionOnce();
    throw new Error('session_expired');
  }

  if (!res.ok) {
    // Try to parse JSON error, but handle HTML responses (login redirect)
    if (contentType.includes('text/html')) {
      console.error('[api] Got HTML response for', url, '(session likely expired)');
      throw new Error('session_expired');
    }
    const data = await res.json().catch(() => ({}));
    const errMsg = (data as { error?: string }).error ?? `HTTP ${res.status}`;
    log('error response from', url, ':', errMsg);
    if (errMsg === 'session_expired') throw new Error('session_expired');
    throw new Error(errMsg);
  }

  // Guard against HTML responses (login page redirect) even on 200
  if (contentType.includes('text/html')) {
    console.error('[api] Got HTML 200 for', url, '(session likely expired)');
    throw new Error('session_expired');
  }

  const json = await res.json();
  // Check if the JSON body itself signals session_expired
  if ((json as { error?: string })?.error === 'session_expired') {
    throw new Error('session_expired');
  }

  log('success from', url);
  return json;
}

export function fetchTimetable(date?: string) {
  const d = date ?? todayFormatted();
  return apiFetch(`/api/webuntis/timetable?date=${d}`);
}

export function fetchGrades() {
  return apiFetch('/api/webuntis/grades');
}

export function fetchAbsences() {
  const start = schoolYearStart();
  // Use school year end (not today) — WebUntis treats endDate as exclusive, so
  // using today misses the current day's absences. School year end is always future.
  const end = schoolYearEnd();
  return apiFetch(`/api/webuntis/absences?startDate=${start}&endDate=${end}`);
}

export function fetchMessages() {
  return apiFetch('/api/webuntis/messages');
}

export function fetchMessageDetail(id: number) {
  return apiFetch(`/api/webuntis/messages?id=${id}`);
}

export async function markMessageRead(id: number) {
  await fetch(`/api/webuntis/messages?id=${id}`, {
    method: 'POST',
    credentials: 'same-origin',
  });
}

export function fetchHomework() {
  const start = todayFormatted().replace(/-/g, '');
  const future = new Date();
  future.setDate(future.getDate() + 30);
  const end = dateFormatted(future).replace(/-/g, '');
  return apiFetch(`/api/webuntis/homework?startDate=${start}&endDate=${end}`);
}

export function fetchMensa() {
  return apiFetch('/api/mensa');
}

export function getAttachmentUrl(messageId: number, storageId: string, name: string, attachmentId?: number): string {
  const p = new URLSearchParams({ messageId: String(messageId), storageId, name });
  if (attachmentId != null) p.set('attachmentId', String(attachmentId));
  return `/api/webuntis/attachment?${p.toString()}`;
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
}
