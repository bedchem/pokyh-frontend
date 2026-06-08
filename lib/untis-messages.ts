// Server-side helpers for WebUntis MessageCenter writes (send / draft / attachments).
//
// The MessageCenter web client posts messages as `multipart/form-data` to the v2
// endpoints. MessageCenter runs as a separate service (the JWT `route` claim
// points at `mese1.internal…`), so writes additionally need the `Tenant-Id` and
// `X-Webuntis-Api-School-Year-Id` headers the browser sends — without them the
// service rejects the request. Both are derived from the session (tenant from the
// JWT, school year via the JSON-RPC the rest of the app already uses); nothing
// instance-specific is hardcoded.

import { SCHOOL_COOKIE_VAL } from './server-session';
import { WEBUNTIS_BASE } from './untis-permissions';
import type { Session } from './types';

const SCHOOL = process.env.WEBUNTIS_SCHOOL || 'lbs-brixen';

// The cookie header every WebUntis request needs (session + school).
export function cookieHeader(session: Session): string {
  return `JSESSIONID=${session.sessionId}; schoolname="${SCHOOL_COOKIE_VAL}"`;
}

// Decode a JWT payload (no verification — we only read claims we already trust).
function decodeJwt(token?: string): Record<string, unknown> | null {
  if (!token) return null;
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

// The tenant id is carried in the bearer token's `tenant_id` claim.
export function tenantIdFrom(...tokens: (string | undefined)[]): string | undefined {
  for (const t of tokens) {
    const claim = decodeJwt(t)?.tenant_id;
    if (claim != null && String(claim).trim()) return String(claim);
  }
  return undefined;
}

// Fetch a fresh MessageCenter bearer token via the cookie session. WebUntis
// issues short-lived JWTs; the web client calls /api/token/new before each write.
// Falls back to the token stored at login if the refresh is unavailable.
export async function fetchFreshToken(session: Session): Promise<string | undefined> {
  try {
    const res = await fetch(`${WEBUNTIS_BASE}/api/token/new`, {
      headers: { Cookie: cookieHeader(session), Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    const text = await res.text();
    if (!res.ok || text.trimStart().startsWith('<')) return session.bearerToken;
    const t = text.trim();
    if (t.startsWith('{')) {
      const j = JSON.parse(t) as Record<string, unknown>;
      const tok = j.accessToken ?? j.token ?? j.access_token ?? j.jwt;
      return typeof tok === 'string' && tok ? tok : session.bearerToken;
    }
    const bare = t.replace(/^"|"$/g, '');
    return bare || session.bearerToken;
  } catch {
    return session.bearerToken;
  }
}

// Resolve the current school year id (the `X-Webuntis-Api-School-Year-Id` header)
// via the same JSON-RPC the grades view uses. Best-effort: returns undefined on
// any failure so the caller simply omits the header.
export async function fetchSchoolYearId(session: Session): Promise<number | undefined> {
  try {
    const res = await fetch(`${WEBUNTIS_BASE}/jsonrpc.do?school=${SCHOOL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader(session) },
      body: JSON.stringify({ id: 'sy', method: 'getCurrentSchoolyear', params: {}, jsonrpc: '2.0' }),
      signal: AbortSignal.timeout(10000),
    });
    const json = (await res.json()) as { result?: { id?: unknown } };
    const id = json?.result?.id;
    return typeof id === 'number' ? id : undefined;
  } catch {
    return undefined;
  }
}

// Headers for a MessageCenter write. Crucially omits Content-Type so `fetch` sets
// the multipart boundary itself. Includes Tenant-Id + school-year id so the
// MessageCenter service accepts the request (matching the real web client).
export function messageWriteHeaders(
  session: Session,
  token: string | undefined,
  schoolYearId?: number,
): Record<string, string> {
  const tenant = tenantIdFrom(token, session.bearerToken);
  return {
    Cookie: cookieHeader(session),
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenant ? { 'Tenant-Id': tenant } : {}),
    ...(schoolYearId != null ? { 'X-Webuntis-Api-School-Year-Id': String(schoolYearId) } : {}),
  };
}

export interface MessagePermissions {
  recipientOptions: string[];
  maxFileSize: number;
  maxFileCount: number;
  showDraftsTab: boolean;
  showSentTab: boolean;
}

const DEFAULT_PERMISSIONS: MessagePermissions = {
  recipientOptions: ['TEACHER'],
  maxFileSize: 7_000_000,
  maxFileCount: 5,
  showDraftsTab: true,
  showSentTab: true,
};

// The MessageCenter config for this account: which recipient option(s) are
// allowed (e.g. ["TEACHER"]) and the attachment limits. Used to set the required
// `recipientOption` on writes without hardcoding it, and to validate files.
// Best-effort: returns sensible defaults if the endpoint is unavailable.
export async function fetchMessagePermissions(
  session: Session,
  token: string | undefined,
  schoolYearId?: number,
): Promise<MessagePermissions> {
  try {
    const res = await fetch(`${WEBUNTIS_BASE}/api/rest/view/v1/messages/permissions`, {
      headers: messageWriteHeaders(session, token, schoolYearId),
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    if (!res.ok || text.trimStart().startsWith('<')) return DEFAULT_PERMISSIONS;
    const j = JSON.parse(text) as Partial<MessagePermissions>;
    const opts = Array.isArray(j.recipientOptions) && j.recipientOptions.length
      ? j.recipientOptions
      : DEFAULT_PERMISSIONS.recipientOptions;
    return {
      recipientOptions: opts,
      maxFileSize: Number(j.maxFileSize) || DEFAULT_PERMISSIONS.maxFileSize,
      maxFileCount: Number(j.maxFileCount) || DEFAULT_PERMISSIONS.maxFileCount,
      showDraftsTab: j.showDraftsTab !== false,
      showSentTab: j.showSentTab !== false,
    };
  } catch {
    return DEFAULT_PERMISSIONS;
  }
}
