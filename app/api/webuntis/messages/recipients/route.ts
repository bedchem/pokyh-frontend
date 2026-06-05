import { NextResponse } from 'next/server';
import { getServerSession, webUntisHeaders } from '@/lib/server-session';
import { WEBUNTIS_BASE } from '@/lib/untis-permissions';

export interface Recipient {
  id: number;
  type: string; // group type: CLASS_TEACHERS | TEACHERS | OTHERS
  name: string;
  role?: string; // sub-label (e.g. "Administrator*in")
  initials: string;
  category: 'classTeacher' | 'other'; // grouping for the UI
}

// The real WebUntis (MessageCenter 2021) recipient endpoint. Returns groups
// [{ persons:[{displayName,userId,tags}], type }] for CLASS_TEACHERS / TEACHERS /
// OTHERS. Works for students AND guardians. Env-overridable.
const RECIPIENTS_PATH =
  process.env.WEBUNTIS_API_PATH_MSG_RECIPIENTS ||
  '/api/rest/view/v1/messages/recipients/static/persons';

function initialsOf(name: string): string {
  const parts = name.replace(/[(),]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface PersonGroup {
  type?: string;
  persons?: { displayName?: string; userId?: number; id?: number; tags?: string[] }[];
}

function parseRecipients(json: unknown): Recipient[] {
  const groups: PersonGroup[] = Array.isArray(json) ? (json as PersonGroup[]) : [];
  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const g of groups) {
    const type = String(g?.type ?? '').toUpperCase();
    const persons = Array.isArray(g?.persons) ? g.persons : [];
    for (const p of persons) {
      const id = Number(p?.userId ?? p?.id);
      const name = String(p?.displayName ?? '').trim();
      if (!Number.isFinite(id) || !name) continue;
      const key = `${type}:${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const tags = Array.isArray(p?.tags) ? p.tags.filter(Boolean) : [];
      out.push({
        id,
        type: type || 'TEACHERS',
        name,
        role: tags.length ? tags.join(', ') : undefined,
        initials: initialsOf(name),
        category: type === 'CLASS_TEACHERS' ? 'classTeacher' : 'other',
      });
    }
  }
  return out;
}

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  try {
    const res = await fetch(`${WEBUNTIS_BASE}${RECIPIENTS_PATH}`, {
      headers: webUntisHeaders(session),
      signal: AbortSignal.timeout(12000),
    });
    const text = await res.text();
    if (res.status === 401 || text.trimStart().startsWith('<')) {
      return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    }
    if (!res.ok) {
      console.error('[recipients] API error:', res.status, text.slice(0, 200));
      return NextResponse.json({ recipients: [] });
    }
    return NextResponse.json({ recipients: parseRecipients(JSON.parse(text)) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Fehler';
    console.error('[recipients] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
