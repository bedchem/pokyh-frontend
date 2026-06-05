import { NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';
import { WEBUNTIS_BASE } from '@/lib/untis-permissions';
import type { Session } from '@/lib/types';

export interface Recipient {
  id: number;
  type: string; // e.g. TEACHER, STAFF, ...
  name: string;
  role?: string; // sub-label shown under the name
  initials: string;
  category: 'classTeacher' | 'other'; // grouping for the UI
}

// Modern WebUntis (MessageCenter 2021) exposes recipients in two steps:
//   1. GET …/messages/permissions  → { recipientOptions: ["TEACHER", …] }
//   2. GET …/messages/recipients/{OPTION}  → list of people for that option
// Both paths are env-overridable; {option} in the recipients path is templated.
const PERMISSIONS_PATH =
  process.env.WEBUNTIS_API_PATH_MSG_PERMISSIONS || '/api/rest/view/v1/messages/permissions';
const RECIPIENTS_PATH =
  process.env.WEBUNTIS_API_PATH_MSG_RECIPIENTS || '/api/rest/view/v1/messages/recipients/{option}';

function recipientsPathFor(option: string): string {
  return RECIPIENTS_PATH.includes('{option}')
    ? RECIPIENTS_PATH.replace('{option}', encodeURIComponent(option))
    : `${RECIPIENTS_PATH.replace(/\/$/, '')}/${encodeURIComponent(option)}`;
}

type FetchResult =
  | { ok: true; json: unknown }
  | { ok: false; expired?: boolean; status?: number };

async function getJson(session: Session, path: string): Promise<FetchResult> {
  try {
    const r = await fetch(`${WEBUNTIS_BASE}${path}`, {
      headers: webUntisHeaders(session),
      signal: AbortSignal.timeout(12000),
    });
    const text = await r.text();
    if (r.status === 401 || text.trimStart().startsWith('<')) return { ok: false, expired: true };
    if (!r.ok) return { ok: false, status: r.status };
    return { ok: true, json: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function initialsOf(name: string): string {
  const parts = name.replace(/[(),]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Recursively find arrays of recipient-like objects (have an id and a name).
function collectRecipients(node: unknown, out: Record<string, unknown>[], depth = 0): void {
  if (depth > 6 || node == null) return;
  if (Array.isArray(node)) {
    for (const v of node) {
      if (
        v && typeof v === 'object' &&
        ('id' in v || 'personId' in v || 'userId' in v) &&
        ('name' in v || 'displayName' in v || 'longName' in v)
      ) {
        out.push(v as Record<string, unknown>);
      } else {
        collectRecipients(v, out, depth + 1);
      }
    }
    return;
  }
  if (typeof node === 'object') {
    for (const v of Object.values(node as Record<string, unknown>)) {
      collectRecipients(v, out, depth + 1);
    }
  }
}

function parseRecipients(json: unknown, defaultType: string): Recipient[] {
  const raw: Record<string, unknown>[] = [];
  collectRecipients(json, raw);

  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const r of raw) {
    const id = Number(r.id ?? r.personId ?? r.userId);
    const type = String(r.type ?? r.role ?? r.recipientType ?? defaultType).toUpperCase();
    const name = String(r.displayName ?? r.name ?? r.longName ?? '').trim();
    if (!Number.isFinite(id) || !name) continue;
    const key = `${type}:${id}:${name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const roleLabel = (r.className ?? r.role ?? r.subTitle ?? r.description ?? '') as string;
    const isClassTeacher =
      r.isClassTeacher === true ||
      /class.?teacher|klassenlehr/i.test(`${r.type ?? ''} ${roleLabel}`);

    out.push({
      id,
      type,
      name,
      role: roleLabel ? String(roleLabel) : undefined,
      initials: initialsOf(name),
      category: isClassTeacher ? 'classTeacher' : 'other',
    });
  }
  return out;
}

function recipientOptionsFrom(json: unknown): string[] {
  const opts = (json as Record<string, unknown>)?.recipientOptions;
  if (Array.isArray(opts) && opts.length) {
    return opts.map((o) => String(o).toUpperCase()).filter(Boolean);
  }
  return ['TEACHER'];
}

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  try {
    // 1. Which recipient categories may this user message? (default: TEACHER)
    const perms = await getJson(session, PERMISSIONS_PATH);
    if (!perms.ok && perms.expired) {
      return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    }
    const options = perms.ok ? recipientOptionsFrom(perms.json) : ['TEACHER'];

    // 2. Fetch the people for each allowed category.
    const all: Recipient[] = [];
    let expired = false;
    for (const option of options) {
      const res = await getJson(session, recipientsPathFor(option));
      if (res.ok) {
        all.push(...parseRecipients(res.json, option));
      } else if (res.expired) {
        expired = true;
      }
    }

    if (all.length === 0) {
      if (expired) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
      // No recipients available to this account (e.g. guardian without teacher-messaging right).
      return NextResponse.json({ recipients: [] });
    }

    // De-duplicate across categories.
    const seen = new Set<string>();
    const recipients = all.filter((r) => {
      const k = `${r.type}:${r.id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return NextResponse.json({ recipients });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[recipients] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
