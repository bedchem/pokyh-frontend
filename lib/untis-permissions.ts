// Server-side helpers for the WebUntis "write" features (absence report/excuse,
// teacher messages). Centralises the base URL, the 18+ permission detection and
// the app-data fetch so the route handlers stay thin.
//
// NOTE: the underlying WebUntis endpoints are internal/undocumented and may
// differ per instance. All paths are overridable via env (see .env.example).

import { webUntisHeaders } from './server-session';
import type { Session } from './types';

export const WEBUNTIS_BASE =
  process.env.WEBUNTIS_BASE_URL || 'https://lbs-brixen.webuntis.com/WebUntis';

const APPDATA_CANDIDATES = [
  process.env.WEBUNTIS_API_PATH_APPDATA,
  '/api/rest/view/v1/app/data',
  '/api/app/data',
  '/api/rest/view/v1/users/me/data',
  '/api/rest/view/v2/app/data',
];

// Permission keys that indicate a student may self-report/excuse absences.
// WebUntis grants these only to students of legal age (volljährig).
// These are the WebUntis permission "resources" that grant reporting/excusing an
// absence. WebUntis emits them as `RESOURCE:RIGHTS:scope:assignment` strings
// (e.g. `STUDABS_REPORT:DCWR:0:ASSIGNED`) where RIGHTS contains C(reate)/W(rite)
// for users allowed to act (guardians + students of legal age). Plain tokens
// (no colon) are also matched for older instances. Overridable via env.
const ABSENCE_RIGHTS = (
  process.env.WEBUNTIS_ABSENCE_RIGHT ||
  'STUDABS_REPORT,SELF_ABSENCEREASON,WRITE_OWN_ABSENCE,WRITE_STUD_ABSENCE,STUDENT_ABSENCE,SELF_ABSENCE'
)
  .split(',')
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);

// Tokens in the app-data that indicate a guardian/parent account. Overridable
// via env so it works across WebUntis instances/locales out of the box.
const PARENT_ROLES = (
  process.env.WEBUNTIS_PARENT_ROLE ||
  'PARENT,GUARDIAN,LEGAL_GUARDIAN,LEGALGUARDIAN,ERZIEHUNGSBERECHTIGT,PARENT_ROLE,PERSONTYPE_PARENT'
)
  .split(',')
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);

// DEV override: allow the feature even without the right (e.g. to test the flow
// with an under-18 account). Reads the NEXT_PUBLIC_ flag so client + server agree.
export const FORCE_REPORT = process.env.NEXT_PUBLIC_FORCE_ABSENCE_REPORT === 'true';

type AppDataResult =
  | { ok: true; json: unknown }
  | { ok: false; expired?: boolean; status: number };

// Recursively collect every string value (uppercased) so we can scan for the
// permission tokens regardless of where WebUntis nests them in the app-data blob.
function collectStrings(node: unknown, out: Set<string>, depth = 0): void {
  if (depth > 8 || node == null) return;
  if (typeof node === 'string') {
    out.add(node.toUpperCase());
    return;
  }
  if (Array.isArray(node)) {
    for (const v of node) collectStrings(v, out, depth + 1);
    return;
  }
  if (typeof node === 'object') {
    for (const v of Object.values(node as Record<string, unknown>)) {
      collectStrings(v, out, depth + 1);
    }
  }
}

export function detectAbsenceRight(json: unknown): boolean {
  const strs = new Set<string>();
  collectStrings(json, strs);
  for (const s of strs) {
    const [resource, rights] = s.split(':');
    if (!ABSENCE_RIGHTS.includes(resource)) continue;
    // Permission strings (RESOURCE:RIGHTS:…) must grant write/create; bare tokens pass.
    if (rights === undefined || /[WC]/.test(rights)) return true;
  }
  return false;
}

export function detectParent(json: unknown): boolean {
  const strs = new Set<string>();
  collectStrings(json, strs);
  return PARENT_ROLES.some((r) => strs.has(r));
}

// Best-effort parent/guardian check from a session (used at login to hide the
// reminders tab for parents). Never throws — returns false on any error.
export async function isParentAccount(session: Session): Promise<boolean> {
  try {
    const data = await fetchAppData(session);
    return data.ok ? detectParent(data.json) : false;
  } catch {
    return false;
  }
}

export function extractPersonName(json: unknown): string | undefined {
  const j = json as Record<string, any>;
  const u = j?.data?.user ?? j?.user ?? j?.data ?? j;
  const p = u?.person ?? u;
  const dn = p?.displayName ?? u?.displayName ?? p?.name;
  if (typeof dn === 'string' && dn.trim()) return dn.trim();
  const fn = p?.foreName ?? p?.firstName ?? p?.firstname;
  const ln = p?.longName ?? p?.lastName ?? p?.lastname;
  const full = `${fn ?? ''} ${ln ?? ''}`.trim();
  return full || undefined;
}

// The display name to show as the absence's subject ("Schüler/in"). For a
// guardian this is the child (app-data `user.students[0].displayName`); otherwise
// it's the logged-in person.
export function extractAbsenceSubjectName(json: unknown): string | undefined {
  const j = json as Record<string, any>;
  const students = j?.data?.user?.students ?? j?.user?.students ?? j?.students;
  if (Array.isArray(students) && students[0]?.displayName) {
    const n = String(students[0].displayName).trim();
    if (n) return n;
  }
  return extractPersonName(json);
}

function isObject(json: unknown): boolean {
  return !!json && typeof json === 'object' && !Array.isArray(json) && Object.keys(json as object).length > 0;
}

// Finds a child's student id from the app-data of a guardian/parent account.
// WebUntis exposes a guardian's children at `user.students` (objects shaped
// `{ id, displayName, imageUrl }` — note: no class/type field). We therefore look
// for any array keyed `students`/`children` first (the canonical location), then
// fall back to a heuristic for instances that nest it differently.
export function extractChildStudentId(json: unknown, excludeId: number): number | null {
  const fromArrays: number[] = [];
  const heuristic: number[] = [];

  function pushId(value: unknown, sink: number[]): void {
    const id = Number(value);
    if (Number.isFinite(id) && id > 0 && id !== excludeId) sink.push(id);
  }

  function walk(node: unknown, depth = 0): void {
    if (depth > 8 || node == null) return;
    if (Array.isArray(node)) {
      for (const v of node) walk(v, depth + 1);
      return;
    }
    if (typeof node === 'object') {
      const o = node as Record<string, unknown>;
      // Canonical: a "students"/"children" array of objects with a numeric id.
      for (const key of ['students', 'children'] as const) {
        const arr = o[key];
        if (Array.isArray(arr)) {
          for (const child of arr) {
            if (child && typeof child === 'object') {
              const c = child as Record<string, unknown>;
              pushId(c.id ?? c.studentId ?? c.personId, fromArrays);
            }
          }
        }
      }
      // Heuristic fallback: a student-like object (numeric id + class ref / type).
      const hasKlasse = o.klasseId != null || o.klasse != null || o.className != null || o.klasseName != null;
      const typeStr = String(o.type ?? o.role ?? o.personType ?? '').toUpperCase();
      if (hasKlasse || typeStr.includes('STUDENT') || typeStr === '5') {
        pushId(o.id ?? o.personId ?? o.studentId, heuristic);
      }
      for (const v of Object.values(o)) walk(v, depth + 1);
    }
  }
  walk(json);
  if (fromArrays.length) return fromArrays[0];
  return heuristic.length ? heuristic[0] : null;
}

export async function fetchAppData(session: Session): Promise<AppDataResult> {
  const result = await firstWorkingGet(session, APPDATA_CANDIDATES, isObject);
  if (result.ok) return { ok: true, json: result.json };
  return result.reason === 'expired' ? { ok: false, expired: true, status: 401 } : { ok: false, status: 404 };
}

// WebUntis' own age-aware flag for "may create an absence". It lives in the
// absences envelope (`data.showCreateAbsence`) and is the SAME flag the WebUntis
// UI uses: true for guardians and students of legal age, false for minors —
// unlike the raw permission tokens, which students hold regardless of age.
// Returns null when the flag can't be read (caller falls back).
export async function fetchAbsenceCreateFlag(session: Session): Promise<boolean | null> {
  const n = new Date();
  const d = `${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, '0')}${String(n.getDate()).padStart(2, '0')}`;
  const path = `/api/classreg/absences/students?studentId=${session.studentId}&startDate=${d}&endDate=${d}&excuseStatusId=-1`;
  try {
    const r = await fetch(`${WEBUNTIS_BASE}${path}`, {
      headers: webUntisHeaders(session),
      signal: AbortSignal.timeout(12000),
    });
    const t = await r.text();
    if (r.status === 401 || t.trimStart().startsWith('<') || !r.ok) return null;
    const flag = (JSON.parse(t) as { data?: { showCreateAbsence?: unknown } })?.data?.showCreateAbsence;
    return typeof flag === 'boolean' ? flag : null;
  } catch {
    return null;
  }
}

// Server-side gate used before any absence write. Prefers WebUntis' age-aware
// `showCreateAbsence` flag; only falls back to the permission-token scan if the
// flag is unavailable. The dev override forces it on.
export async function canReportAbsence(session: Session): Promise<boolean> {
  if (FORCE_REPORT) return true;
  const flag = await fetchAbsenceCreateFlag(session);
  if (flag !== null) return flag;
  const data = await fetchAppData(session);
  return data.ok ? detectAbsenceRight(data.json) : false;
}

// Headers for WebUntis classreg POSTs (cookie-session based). Mark as XHR which
// some classreg endpoints require.
export function writeHeaders(session: Session, contentType?: string): Record<string, string> {
  return {
    ...webUntisHeaders(session),
    'X-Requested-With': 'XMLHttpRequest',
    ...(contentType ? { 'Content-Type': contentType } : {}),
  };
}

export type GetResult =
  | { ok: true; json: unknown; path: string }
  | { ok: false; reason: 'expired' | 'none' };

// Tries each candidate path (read-only GET) and returns the first whose JSON the
// `accept` predicate approves. Lets the read endpoints self-heal across the
// differing internal paths of WebUntis instances. Falsy candidates are skipped
// and duplicates ignored.
export async function firstWorkingGet(
  session: Session,
  candidates: (string | undefined)[],
  accept: (json: unknown) => boolean,
): Promise<GetResult> {
  let sawExpired = false;
  const seen = new Set<string>();
  for (const p of candidates) {
    if (!p || seen.has(p)) continue;
    seen.add(p);
    try {
      const res = await fetch(`${WEBUNTIS_BASE}${p}`, {
        headers: webUntisHeaders(session),
        signal: AbortSignal.timeout(12000),
      });
      const text = await res.text();
      if (res.status === 401 || text.trimStart().startsWith('<')) { sawExpired = true; continue; }
      if (!res.ok) continue;
      let json: unknown;
      try { json = JSON.parse(text); } catch { continue; }
      if (accept(json)) return { ok: true, json, path: p };
    } catch { /* try next candidate */ }
  }
  return { ok: false, reason: sawExpired ? 'expired' : 'none' };
}

export type PostResult =
  | { ok: true; data: unknown; path: string }
  | { ok: false; reason: 'expired' | 'notfound' }
  | { ok: false; reason: 'error'; status: number; body: string };

// POST that walks candidate paths but ONLY advances on a 404 — a 404 means the
// path doesn't exist so nothing was written, making the retry safe. Any other
// response (success or real error) is returned immediately, so a write is never
// attempted twice. Network errors also stop immediately (outcome unknown).
export async function firstWorkingPost(
  session: Session,
  candidates: (string | undefined)[],
  init: { headers: Record<string, string>; body: string },
): Promise<PostResult> {
  const seen = new Set<string>();
  for (const p of candidates) {
    if (!p || seen.has(p)) continue;
    seen.add(p);
    let res: Response;
    try {
      res = await fetch(`${WEBUNTIS_BASE}${p}`, {
        method: 'POST',
        headers: init.headers,
        body: init.body,
        signal: AbortSignal.timeout(15000),
      });
    } catch (e) {
      return { ok: false, reason: 'error', status: 0, body: e instanceof Error ? e.message : 'network' };
    }
    const text = await res.text();
    if (res.status === 404) continue; // wrong path → nothing happened, try next
    if (res.status === 401 || text.trimStart().startsWith('<')) return { ok: false, reason: 'expired' };
    if (!res.ok) return { ok: false, reason: 'error', status: res.status, body: text.slice(0, 300) };
    let data: unknown = null;
    try { data = JSON.parse(text); } catch { /* empty body ok */ }
    return { ok: true, data, path: p };
  }
  return { ok: false, reason: 'notfound' };
}
