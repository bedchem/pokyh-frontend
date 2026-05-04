'use client';

// All API routes read the session from the httpOnly cookie automatically.
// No credentials are ever sent from the client.

import { cacheGet, cacheSet, cacheIsStale, cacheClear, cacheDel } from './cache';
import { pcGetStale, pcIsStale, pcSet, pcDel, pcClear } from './persist-cache';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_API === 'true';

function log(...args: unknown[]) {
  if (DEBUG) console.log('[api]', ...args);
}

let _logoutInFlight = false;
async function clearSessionOnce() {
  if (_logoutInFlight) return;
  _logoutInFlight = true;
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  cacheClear();
  pcClear();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pockyh-session-expired'));
  }
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
  const endYear = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
  return `${endYear}0630`;
}

async function apiFetch(url: string, opts?: RequestInit) {
  log('fetch', url);
  const res = await fetch(url, { credentials: 'same-origin', ...opts });

  if (res.status === 401) {
    log('401 from', url, '— clearing session');
    await clearSessionOnce();
    throw new Error('session_expired');
  }

  if (!res.ok) {
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('text/html')) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json().catch(() => ({}));
    const errMsg = (data as { error?: string }).error ?? `HTTP ${res.status}`;
    log('error from', url, ':', errMsg);
    if (errMsg === 'session_expired') {
      await clearSessionOnce();
      throw new Error('session_expired');
    }
    throw new Error(errMsg);
  }

  const json = await res.json();
  if ((json as { error?: string })?.error === 'session_expired') {
    await clearSessionOnce();
    throw new Error('session_expired');
  }

  log('success from', url);
  return json;
}

// In-memory + localStorage cache. Returns stale from memory, fetches fresh,
// and persists to localStorage so subsequent page loads render without a spinner.
async function apiFetchCached(url: string, opts?: RequestInit): Promise<unknown> {
  const inMem = cacheGet<unknown>(url);
  if (inMem !== undefined && !cacheIsStale(url)) {
    log('mem-hit', url);
    return inMem;
  }
  const data = await apiFetch(url, opts);
  cacheSet(url, data);
  pcSet(url, data);
  return data;
}

// ─── Stale-data getters (instant render from localStorage) ───────────────────

export function getTimetableStale(date?: string): unknown | undefined {
  return pcGetStale(`/api/webuntis/timetable?date=${date ?? todayFormatted()}`);
}

export function getGradesStale(): unknown | undefined {
  return pcGetStale('/api/webuntis/grades');
}

export function getMessagesStale(): unknown | undefined {
  return pcGetStale('/api/webuntis/messages');
}

export function getAbsencesStale(): unknown | undefined {
  const start = schoolYearStart();
  const end = schoolYearEnd();
  return pcGetStale(`/api/webuntis/absences?startDate=${start}&endDate=${end}`);
}

export function isTimetableStale(date?: string): boolean {
  return pcIsStale(`/api/webuntis/timetable?date=${date ?? todayFormatted()}`);
}

// ─── Exported fetch functions ─────────────────────────────────────────────────

export function fetchTimetable(date?: string) {
  const d = date ?? todayFormatted();
  return apiFetchCached(`/api/webuntis/timetable?date=${d}`);
}

export function fetchGrades() {
  return apiFetchCached('/api/webuntis/grades');
}

export function fetchAbsences() {
  const start = schoolYearStart();
  const end = schoolYearEnd();
  return apiFetchCached(`/api/webuntis/absences?startDate=${start}&endDate=${end}`);
}

export function fetchMessages() {
  return apiFetchCached('/api/webuntis/messages');
}

export function fetchMessageDetail(id: number) {
  return apiFetch(`/api/webuntis/messages?id=${id}`);
}

export function fetchMessageAttachments(id: number) {
  return apiFetch(`/api/webuntis/messages?id=${id}&attachments=1`);
}

export async function markMessageRead(id: number) {
  await fetch(`/api/webuntis/messages?id=${id}`, {
    method: 'POST',
    credentials: 'same-origin',
  });
}

export async function markAllMessagesRead(ids: number[]): Promise<void> {
  if (!ids.length) return;
  await Promise.allSettled(ids.map((id) => markMessageRead(id)));
  cacheDel('/api/webuntis/messages');
  pcDel('/api/webuntis/messages');
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
