'use client';

// WebUntis through the API (api.pokyh.com/webuntis/*): every route reads the
// person's WebUntis session from the API's httpOnly cookie, which the browser
// sends along (credentials: 'include'). No credentials are ever sent from the
// page, except at sign-in. The /api/webuntis/… addresses below stay the keys
// of the data stored on the device; lib/backend.ts maps them to the API.
//
// Reads carry no extra header, so the browser sends them without asking the
// API first (no CORS preflight); writes carry the API key, which makes the
// browser check the API's allowed origins before it sends them.

import { API_KEY, apiUrl, rememberSignIn, untisUrl } from './backend';
import { accessToken, signOutEverywhere } from './api-client';
import { cacheGet, cacheSet, cacheIsStale, cacheClear, cacheDel } from './cache';
import { pcGetStale, pcIsStale, pcSet, pcDel, pcClear } from './persist-cache';
import type {
  UntisPermissions,
  AbsenceReason,
  MessageRecipient,
  ReportAbsenceInput,
  SendMessageInput,
} from './types';
import { messageIsRead } from './untis-parse';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_API === 'true';

function log(...args: unknown[]) {
  if (DEBUG) console.log('[api]', ...args);
}

/** Request options for the API: its cookies along, the API key on writes. */
function untisInit(opts: RequestInit = {}): RequestInit {
  const method = (opts.method ?? 'GET').toUpperCase();
  const write = method !== 'GET' && method !== 'HEAD';
  return {
    ...opts,
    credentials: 'include',
    headers: { ...(write ? { 'X-API-Key': API_KEY } : {}), ...(opts.headers as Record<string, string> ?? {}) },
  };
}

let _logoutInFlight = false;
async function clearSessionOnce() {
  if (_logoutInFlight) return;
  _logoutInFlight = true;
  await signOutEverywhere();
  cacheClear();
  pcClear();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pokyh-session-expired'));
  }
}

// Silent re-login: when WebUntis kills the session, the API signs in again
// with the sign-in sealed in the session's httpOnly renewal cookie (on the
// API's address). Without the cookies there is nothing to renew.
let _reloginInFlight: Promise<boolean> | null = null;
async function attemptSilentRelogin(): Promise<boolean> {
  if (_reloginInFlight) return _reloginInFlight;
  _reloginInFlight = fetch(untisUrl('/api/webuntis/login'), untisInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ renewal: true }),
  }))
    .then(async (r) => {
      if (!r.ok) return false;
      cacheClear();
      // Only signal a session refresh when the POKYH backend layer was actually
      // re-synced (fresh token issued). If the WebUntis session was renewed but
      // the backend sync failed (pokyhSynced=false), dispatching the refresh
      // event would re-run loginWithSession against a stale POKYH token →
      // /auth/me 401 → infinite re-login loop. WebUntis data still works.
      const data = await r.json().catch(() => ({} as { pokyhSynced?: boolean }));
      // The renewed sign-in's display data (a new loginAt) and access token.
      rememberSignIn(data as Parameters<typeof rememberSignIn>[0]);
      if (data?.pokyhSynced) {
        window.dispatchEvent(new CustomEvent('pokyh-session-refreshed'));
      }
      return true;
    })
    .catch(() => false)
    .finally(() => { _reloginInFlight = null; });
  return _reloginInFlight;
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

/**
 * The API request behind one of the website's former addresses (the keys of
 * the data stored on the device): /api/webuntis/… → <API>/webuntis/…, the
 * Mensa reads → <API>/dishes (the account's own school with its token).
 */
async function backendRequest(url: string, opts?: RequestInit): Promise<[string, RequestInit]> {
  if (!url.startsWith('/api/mensa')) return [untisUrl(url), untisInit(opts)];
  const { pathname, searchParams } = new URL(url, 'http://local');
  if (pathname === '/api/mensa/canteens') return [apiUrl('/dishes/canteens'), opts ?? {}];
  if (pathname === '/api/mensa/mine') {
    const token = await accessToken();
    return [apiUrl('/dishes'), { ...opts, cache: 'no-store', headers: { 'X-API-Key': API_KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}) } }];
  }
  const school = searchParams.get('school');
  return [apiUrl(`/dishes${school ? `?school=${encodeURIComponent(school)}` : ''}`), opts ?? {}];
}

async function apiFetch(url: string, opts?: RequestInit) {
  log('fetch', url);
  const res = await fetch(...(await backendRequest(url, opts)));

  if (res.status === 401) {
    log('401 from', url, '- attempting silent re-login');
    const relogged = await attemptSilentRelogin();
    if (relogged) {
      log('silent re-login ok - retrying', url);
      const retry = await fetch(...(await backendRequest(url, opts)));
      if (retry.ok) {
        const json = await retry.json();
        if ((json as { error?: string })?.error === 'session_expired') {
          await clearSessionOnce();
          throw new Error('session_expired');
        }
        return json;
      }
    }
    log('silent re-login failed - clearing session');
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

// Requests under way, by address: whoever asks for the same data meanwhile
// (the app frame and a page, say) shares the one request.
const inFlight = new Map<string, Promise<unknown>>();

// In-memory + localStorage cache. Returns stale from memory, fetches fresh,
// and persists to localStorage so subsequent page loads render without a spinner.
async function apiFetchCached(url: string, opts?: RequestInit): Promise<unknown> {
  const inMem = cacheGet<unknown>(url);
  if (inMem !== undefined && !cacheIsStale(url)) {
    log('mem-hit', url);
    return inMem;
  }
  const pending = inFlight.get(url);
  if (pending) return pending;
  const request = apiFetch(url, opts)
    .then((data) => {
      cacheSet(url, data);
      pcSet(url, data);
      return data;
    })
    .finally(() => inFlight.delete(url));
  inFlight.set(url, request);
  return request;
}

// ─── Stale-data getters (instant render from localStorage) ───────────────────

export function getTimetableStale(date?: string): unknown | undefined {
  return pcGetStale(`/api/webuntis/timetable?date=${date ?? todayFormatted()}`);
}

/** Stored grades: without a year the current ones (as the dashboard loads them), with a year that year's. */
export function getGradesStale(year?: number): unknown | undefined {
  return pcGetStale(year ? `/api/webuntis/grades?year=${year}` : '/api/webuntis/grades');
}

export function getMessagesStale(folder: MessageFolder = 'inbox'): unknown | undefined {
  return pcGetStale(`/api/webuntis/messages?folder=${folder}`);
}

export function getAbsencesStale(year?: number): unknown | undefined {
  const start = year ? `${year}0901` : schoolYearStart();
  const end = year ? `${year + 1}0630` : schoolYearEnd();
  return pcGetStale(`/api/webuntis/absences?startDate=${start}&endDate=${end}`);
}

export function getClassregEventsStale(year?: number): unknown | undefined {
  const url = year
    ? `/api/webuntis/classregevents?year=${year}`
    : '/api/webuntis/classregevents';
  return pcGetStale(url);
}

/** True when the stored Abwesenheiten of that school year are older than the cache's TTL. */
export function areAbsencesStale(year?: number): boolean {
  const start = year ? `${year}0901` : schoolYearStart();
  const end = year ? `${year + 1}0630` : schoolYearEnd();
  return pcIsStale(`/api/webuntis/absences?startDate=${start}&endDate=${end}`);
}

export function isTimetableStale(date?: string): boolean {
  return pcIsStale(`/api/webuntis/timetable?date=${date ?? todayFormatted()}`);
}

// ─── Exported fetch functions ─────────────────────────────────────────────────

export function fetchTimetable(date?: string) {
  const d = date ?? todayFormatted();
  return apiFetchCached(`/api/webuntis/timetable?date=${d}`);
}

export function fetchGrades(year?: number) {
  const url = year ? `/api/webuntis/grades?year=${year}` : '/api/webuntis/grades';
  return apiFetchCached(url);
}

/**
 * The Abwesenheiten of one date range (yyyyMMdd), for the timetable overlay.
 *
 * A school year walks 100 entries per page and takes noticeably longer than the one week of
 * timetable it is drawn over; one week is a single page and lands with the lessons.
 */
export function fetchAbsencesRange(startDate: string, endDate: string) {
  return apiFetchCached(`/api/webuntis/absences?startDate=${startDate}&endDate=${endDate}`);
}

export function fetchAbsences(year?: number) {
  const start = year ? `${year}0901` : schoolYearStart();
  const end = year ? `${year + 1}0630` : schoolYearEnd();
  return apiFetchCached(`/api/webuntis/absences?startDate=${start}&endDate=${end}`);
}

export type MessageFolder = 'inbox' | 'sent' | 'drafts';

export function fetchMessages(folder: MessageFolder = 'inbox') {
  return apiFetchCached(`/api/webuntis/messages?folder=${folder}`);
}

export function fetchMessageDetail(id: number) {
  return apiFetch(`/api/webuntis/messages?id=${id}`);
}

export function fetchMessageAttachments(id: number) {
  return apiFetch(`/api/webuntis/messages?id=${id}&attachments=1`);
}

const INBOX_URL = '/api/webuntis/messages?folder=inbox';

/**
 * Marks messages as read in the stored inbox as well, so the list, the
 * dashboard and every unread badge agree at once, and tells the badges the
 * new count ('pokyh-messages-updated', components/app/hooks.ts).
 */
function markReadInStoredInbox(ids: number[]): void {
  const stored = cacheGet<unknown>(INBOX_URL) ?? pcGetStale<unknown>(INBOX_URL);
  if (!stored || typeof stored !== 'object') return;
  const read = new Set(ids);
  const patch = (list: unknown) => Array.isArray(list)
    ? list.map((m) => (m && typeof m === 'object' && read.has((m as { id?: number }).id ?? -1) ? { ...m, isMessageRead: true, isRead: true } : m))
    : list;
  const root = stored as Record<string, unknown>;
  const data = root.data && typeof root.data === 'object' ? root.data as Record<string, unknown> : null;
  const next: Record<string, unknown> = data?.incomingMessages
    ? { ...root, data: { ...data, incomingMessages: patch(data.incomingMessages) } }
    : { ...root, incomingMessages: patch(root.incomingMessages) };
  cacheSet(INBOX_URL, next);
  pcSet(INBOX_URL, next);
  const list = (next.incomingMessages ?? (next.data as Record<string, unknown> | undefined)?.incomingMessages ?? []) as Array<Record<string, unknown>>;
  const unread = list.filter((m) => m && !messageIsRead(m)).length;
  window.dispatchEvent(new CustomEvent('pokyh-messages-updated', { detail: { unread } }));
}

export async function markMessageRead(id: number) {
  await fetch(untisUrl(`/api/webuntis/messages?id=${id}`), untisInit({ method: 'POST' }));
  markReadInStoredInbox([id]);
}

export async function markAllMessagesRead(ids: number[]): Promise<void> {
  if (!ids.length) return;
  await Promise.allSettled(ids.map((id) => fetch(untisUrl(`/api/webuntis/messages?id=${id}`), untisInit({ method: 'POST' }))));
  markReadInStoredInbox(ids);
}

export function fetchHomework() {
  const start = todayFormatted().replace(/-/g, '');
  const future = new Date();
  future.setDate(future.getDate() + 30);
  const end = dateFormatted(future).replace(/-/g, '');
  return apiFetch(`/api/webuntis/homework?startDate=${start}&endDate=${end}`);
}

export function fetchClassregEvents(year?: number) {
  const url = year
    ? `/api/webuntis/classregevents?year=${year}`
    : '/api/webuntis/classregevents';
  return apiFetchCached(url);
}

export function fetchClassServices() {
  return apiFetch('/api/webuntis/classservices');
}

export function fetchExams(startDate: string, endDate: string) {
  return apiFetch(`/api/webuntis/exams?startDate=${startDate}&endDate=${endDate}`);
}

export function fetchHomeworkRange(startDate: string, endDate: string) {
  return apiFetch(`/api/webuntis/homework?startDate=${startDate}&endDate=${endDate}`);
}

/**
 * The public menu (the default school's, or with `school` the one chosen on
 * the public Mensa page), or with `account` the menu of the signed-in
 * account's own school.
 */
const mensaUrl = (scope: 'public' | 'account', school?: string | null) =>
  scope === 'account' ? '/api/mensa/mine' : school ? `/api/mensa?school=${encodeURIComponent(school)}` : '/api/mensa';

/** The menu, from memory when it is fresh; stored on the device for an instant next visit. */
export function fetchMensa(scope: 'public' | 'account' = 'public', school?: string | null) {
  return apiFetchCached(mensaUrl(scope, school));
}

/** The menu this device stored last time, to show while the fresh one loads. */
export function getMensaStale(scope: 'public' | 'account' = 'public', school?: string | null): unknown | undefined {
  return cacheGet<unknown>(mensaUrl(scope, school)) ?? pcGetStale(mensaUrl(scope, school));
}

/** The canteens to choose from on the public Mensa page (lib/mensa.ts canteensFrom). */
export function fetchCanteens() {
  return apiFetchCached('/api/mensa/canteens');
}

export function getCanteensStale(): unknown | undefined {
  return cacheGet<unknown>('/api/mensa/canteens') ?? pcGetStale('/api/mensa/canteens');
}

export function getAttachmentUrl(messageId: number, storageId: string, name: string, attachmentId?: number): string {
  const p = new URLSearchParams({ messageId: String(messageId), storageId, name });
  if (attachmentId != null) p.set('attachmentId', String(attachmentId));
  // Loaded straight from the API (as an image or a download); the browser
  // sends the session cookie along.
  return untisUrl(`/api/webuntis/attachment?${p.toString()}`);
}

// ─── Absence write features + teacher messages ─────────────────────────────────

// Drop cached absences for every school year so the list reflects a write.
function invalidateAbsences() {
  const now = new Date();
  const cur = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const keys = new Set<string>();
  for (let y = cur; y >= cur - 4; y--) {
    keys.add(`/api/webuntis/absences?startDate=${y}0901&endDate=${y + 1}0630`);
  }
  keys.add(`/api/webuntis/absences?startDate=${schoolYearStart()}&endDate=${schoolYearEnd()}`);
  for (const k of keys) { cacheDel(k); pcDel(k); }
}

export function fetchPermissions(): Promise<UntisPermissions> {
  // Never cached (browser or memory), the 18+/report gate is always read fresh.
  return apiFetch('/api/webuntis/permissions', { cache: 'no-store' }) as Promise<UntisPermissions>;
}

export function fetchAbsenceReasons(): Promise<{ reasons: AbsenceReason[] }> {
  return apiFetchCached('/api/webuntis/absence-reasons') as Promise<{ reasons: AbsenceReason[] }>;
}

export interface RecipientList {
  recipients: MessageRecipient[];
  recipientOption?: string;
  /** WebUntis takes exactly one recipient per message (TEACHER option). */
  single?: boolean;
  maxFileCount?: number;
  maxFileSize?: number;
}

export function fetchRecipients(): Promise<RecipientList> {
  return apiFetchCached('/api/webuntis/messages/recipients') as Promise<RecipientList>;
}

export async function createAbsence(input: ReportAbsenceInput): Promise<unknown> {
  const res = await apiFetch('/api/webuntis/absences/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  invalidateAbsences();
  return res;
}

export async function excuseAbsence(
  absenceIds: number[],
  reasonId?: number,
  text?: string,
): Promise<unknown> {
  const res = (await apiFetch('/api/webuntis/absences/excuse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ absenceIds, reasonId, text }),
  })) as { ok?: boolean; error?: string };
  invalidateAbsences();
  // 207: only some of the absences were saved; report it rather than "done".
  if (res && res.ok === false) throw new Error(res.error || 'excuse_failed');
  return res;
}

// Build a multipart body so attachments ride along with the message. The browser
// sets the multipart Content-Type (with boundary) itself, so we don't set headers.
function messageFormData(input: SendMessageInput): FormData {
  const fd = new FormData();
  fd.append('subject', input.subject);
  fd.append('content', input.content);
  fd.append('recipients', JSON.stringify(input.recipients));
  for (const f of input.files ?? []) fd.append('attachments', f, f.name);
  return fd;
}

export function sendMessage(input: SendMessageInput): Promise<unknown> {
  return apiFetch('/api/webuntis/messages/send', {
    method: 'POST',
    body: messageFormData(input),
  });
}

export function saveDraft(input: SendMessageInput): Promise<unknown> {
  // Editing an existing draft → update in place (server PUTs it, keeping the
  // draft's already-uploaded attachments). New compose → create a fresh draft.
  const qs = input.draftId ? `?draft=1&id=${input.draftId}` : '?draft=1';
  const res = apiFetch(`/api/webuntis/messages/send${qs}`, {
    method: 'POST',
    body: messageFormData(input),
  });
  invalidateDrafts();
  return res;
}

export interface DraftData {
  id?: number;
  subject: string;
  content: string;
  recipients: { id: number; type: string; name: string }[];
  attachments: { id: string; name: string }[];
}

export function fetchDraft(id: number): Promise<DraftData> {
  return apiFetch(`/api/webuntis/messages/draft?id=${id}`) as Promise<DraftData>;
}

export async function deleteDraft(id: number): Promise<void> {
  await apiFetch(`/api/webuntis/messages/draft?id=${id}`, { method: 'DELETE' });
  invalidateDrafts();
}

// Drop the cached drafts list so it reflects a save/delete.
function invalidateDrafts() {
  cacheDel('/api/webuntis/messages?folder=drafts');
  pcDel('/api/webuntis/messages?folder=drafts');
}

// ─── Absence actions (WebUntis classic absence API) ──────────────────────────

export interface AbsenceMeta {
  reasons: AbsenceReason[];
  defaultReasonId: number | null;
  defaultDate: number | null;
  defaultStartTime: number | null;
  defaultEndTime: number | null;
}

export function fetchAbsenceMeta(): Promise<AbsenceMeta> {
  return apiFetchCached('/api/webuntis/absences/meta') as Promise<AbsenceMeta>;
}

/** Removes absences the account reported itself (WebUntis decides what may go). */
export async function deleteAbsences(absenceIds: number[]): Promise<void> {
  await apiFetch('/api/webuntis/absences/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ absenceIds }),
  });
  invalidateAbsences();
}

/** URL of the excuse letter PDF WebUntis generates (per lesson = 1, per day = 2). */
export function excuseLetterUrl(start: string, end: string, absenceIds: number[] = [], group: 1 | 2 = 1): string {
  const p = new URLSearchParams({ start, end, group: String(group) });
  if (absenceIds.length) p.set('ids', absenceIds.join(','));
  return untisUrl(`/api/webuntis/absences/excuse-letter?${p.toString()}`);
}

// ─── Replies ─────────────────────────────────────────────────────────────────

export interface ReplyForm {
  subject: string;
  recipient: { name: string; id: number | null } | null;
}

export function fetchReplyForm(messageId: number): Promise<ReplyForm> {
  return apiFetch(`/api/webuntis/messages/reply?id=${messageId}`) as Promise<ReplyForm>;
}

export function sendReply(messageId: number, input: { subject: string; content: string; files?: File[] }): Promise<unknown> {
  const fd = new FormData();
  fd.append('subject', input.subject);
  fd.append('content', input.content);
  for (const f of input.files ?? []) fd.append('attachments', f, f.name);
  return apiFetch(`/api/webuntis/messages/reply?id=${messageId}`, { method: 'POST', body: fd });
}

// ─── WebUntis password ───────────────────────────────────────────────────────

/** Changes the WebUntis password; the error text is WebUntis' own reason. */
export async function changeUntisPassword(oldPassword: string, newPassword: string): Promise<void> {
  await apiFetch('/api/webuntis/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

/** Starts WebUntis' own "forgot password" e-mail. Works without a session. */
export async function requestPasswordReset(
  username: string,
  email: string,
  school?: { loginName: string; server: string } | null,
): Promise<void> {
  const res = await fetch(untisUrl('/api/webuntis/password-reset'), untisInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, ...(school ? { school: { loginName: school.loginName, server: school.server } } : {}) }),
  }));
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
}

export async function logout() {
  await signOutEverywhere();
}

/**
 * A WebUntis read that is not one of the helpers above (the lesson details of
 * the timetable): the API's answer, with the cookies along.
 */
export function untisGet(path: string, init?: RequestInit): Promise<Response> {
  return fetch(untisUrl(path), untisInit(init));
}

/** Signs in with WebUntis through the API (the sign-in page). */
export function untisSignIn(body: { username: string; password: string; school: { loginName: string; server: string; name?: string } }): Promise<Response> {
  return fetch(untisUrl('/api/webuntis/login'), untisInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}
