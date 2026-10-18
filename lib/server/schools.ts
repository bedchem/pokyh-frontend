// Every school on WebUntis, not one. A school is named by its WebUntis login
// name ("lbs-brixen") and the WebUntis server it runs on
// ("lbs-brixen.webuntis.com"); the public school search of WebUntis finds both.
//
// The server a client names is never trusted as a URL: only hosts under the
// configured WebUntis domains are accepted (WEBUNTIS_HOST_SUFFIXES, the same
// variable the backend uses), so no request of this app can be pointed
// anywhere else. Sessions from before schools existed carry no school and use
// the installation's default school (WEBUNTIS_BASE_URL / WEBUNTIS_SCHOOL).

import 'server-only';
import type { SessionSchool } from '@/lib/types';
import { aliasFor } from './school-aliases';

/** loginName: WebUntis login name ("lbs-brixen"); server: its host; name: as WebUntis lists it. */
export type SchoolRef = SessionSchool;

export interface SchoolHit extends Required<SchoolRef> {
  address: string;
  /** WebUntis' numeric school id (stable key for lists). */
  id: number;
}

const env = (name: string, fallback: string) => process.env[name]?.trim() || fallback;

const DEFAULT_BASE = env('WEBUNTIS_BASE_URL', env('WEBUNTIS_BASE', 'https://lbs-brixen.webuntis.com/WebUntis')).replace(/\/$/, '');
const DEFAULT_LOGIN_NAME = env('WEBUNTIS_SCHOOL', 'lbs-brixen');

const HOST_SUFFIXES = env('WEBUNTIS_HOST_SUFFIXES', 'webuntis.com')
  .split(',')
  .map((s) => s.trim().toLowerCase().replace(/^\.+/, ''))
  .filter(Boolean);

/**
 * Optional: only these schools may sign in (WebUntis login names). Empty: every
 * school on WebUntis. Lets an operator limit POKYH to schools that agreed.
 */
const ALLOWLIST = env('WEBUNTIS_SCHOOL_ALLOWLIST', '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function schoolAllowed(loginName: string): boolean {
  return ALLOWLIST.length === 0 || ALLOWLIST.includes(loginName.trim().toLowerCase());
}

/** The public WebUntis school search (JSON-RPC `searchSchool`). */
const SEARCH_URL = env('WEBUNTIS_SCHOOL_SEARCH_URL', 'https://mobile.webuntis.com/ms/schoolquery2');

// Same shape the backend accepts (services/schools.ts WEBUNTIS_SCHOOL_PATTERN).
const LOGIN_NAME = /^[\p{L}\p{N}][\p{L}\p{N} ._+&'()-]{0,99}$/u;
const HOST = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/** A WebUntis host this app may talk to, normalised; '' when it is not one. */
export function allowedServer(value: unknown): string {
  if (typeof value !== 'string') return '';
  const host = value.trim().toLowerCase().replace(/^https:\/\//, '').replace(/[/?#].*$/, '');
  if (!host || host.length > 253 || !HOST.test(host)) return '';
  return HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`)) ? host : '';
}

export function validLoginName(value: unknown): string {
  if (typeof value !== 'string') return '';
  const name = value.trim();
  return LOGIN_NAME.test(name) ? name : '';
}

/** A school reference from a request body, validated; null when unusable. */
export function parseSchool(value: unknown): SchoolRef | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const loginName = validLoginName(v.loginName);
  const server = allowedServer(v.server);
  if (!loginName || !server || !schoolAllowed(loginName)) return null;
  const name = typeof v.name === 'string' ? v.name.replace(/[\p{C}]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) : '';
  return { loginName, server, ...(name ? { name } : {}) };
}

/** The installation's own school (sessions without a school belong to it). */
export function defaultSchool(): SchoolRef {
  return { loginName: DEFAULT_LOGIN_NAME, server: new URL(DEFAULT_BASE).host };
}

/** `https://<server>/WebUntis` of a school, or of the default school. */
export function schoolBase(school?: SchoolRef | null): string {
  const server = school ? allowedServer(school.server) : '';
  return server ? `https://${server}/WebUntis` : DEFAULT_BASE;
}

export function schoolLoginName(school?: SchoolRef | null): string {
  return (school && validLoginName(school.loginName)) || DEFAULT_LOGIN_NAME;
}

/** Value of WebUntis' `schoolname` cookie for a school. */
export function schoolCookieValue(school?: SchoolRef | null): string {
  return '_' + Buffer.from(schoolLoginName(school)).toString('base64');
}

// ── Search ──────────────────────────────────────────────────────────────────

export type SearchResult =
  | { ok: true; schools: SchoolHit[] }
  | { ok: false; reason: 'too_many' | 'unavailable' };

// Answers are cached briefly per query, so typing and retyping a name or
// several people at one school do not reach WebUntis each time.
const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; result: SearchResult }>();

function remember(key: string, result: SearchResult) {
  if (cache.size > 400) {
    const now = Date.now();
    for (const [k, v] of cache) if (now - v.at > CACHE_MS) cache.delete(k);
    if (cache.size > 400) cache.delete(cache.keys().next().value as string);
  }
  cache.set(key, { at: Date.now(), result });
}

interface RawSchool {
  server?: unknown;
  displayName?: unknown;
  loginName?: unknown;
  address?: unknown;
  schoolId?: unknown;
}

/** Searches as typed; when nothing is found, once more by the local name of the place (school-aliases.ts). */
export async function searchSchools(query: string): Promise<SearchResult> {
  const result = await searchOnce(query);
  const alias = result.ok && result.schools.length === 0 ? aliasFor(query) : null;
  return alias ? searchOnce(alias) : result;
}

async function searchOnce(query: string): Promise<SearchResult> {
  const key = query.trim().toLowerCase().replace(/\s+/g, ' ');
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.result;

  let result: SearchResult;
  try {
    const res = await fetch(SEARCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: 'pokyh-school-search', method: 'searchSchool', params: [{ search: key }], jsonrpc: '2.0' }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false, reason: 'unavailable' };
    const json = (await res.json()) as { result?: { schools?: RawSchool[] }; error?: { code?: number } };
    if (json.error) {
      // -6003: "too many results", the query is too general.
      result = json.error.code === -6003 ? { ok: false, reason: 'too_many' } : { ok: false, reason: 'unavailable' };
    } else {
      const schools: SchoolHit[] = [];
      for (const s of json.result?.schools ?? []) {
        const loginName = validLoginName(s.loginName);
        const server = allowedServer(s.server);
        if (!loginName || !server || !schoolAllowed(loginName)) continue;
        schools.push({
          id: Number(s.schoolId) || 0,
          loginName,
          server,
          name: (typeof s.displayName === 'string' && s.displayName.trim()) || loginName,
          address: typeof s.address === 'string' ? s.address.trim() : '',
        });
      }
      result = { ok: true, schools: schools.slice(0, 50) };
    }
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  remember(key, result);
  return result;
}
