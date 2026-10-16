import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { untis } from '@/lib/server/untis';
import { fetchMessagePermissions } from '@/lib/untis-messages';

export const runtime = 'nodejs';

export interface Recipient {
  id: number;
  type: string; // group type: CLASS_TEACHERS | TEACHERS | OTHERS
  name: string;
  role?: string; // sub-label (e.g. "Administrator*in")
  initials: string;
  category: 'classTeacher' | 'other'; // grouping for the UI
}

// The recipient list the official client loads for the TEACHER option
// (MessageCenter 2021): groups [{ persons: [{ displayName, userId, tags }], type }]
// for CLASS_TEACHERS / TEACHERS / OTHERS. Works for students and guardians.
const RECIPIENTS_PATH =
  process.env.WEBUNTIS_API_PATH_MSG_RECIPIENTS || '/api/rest/view/v1/messages/recipients/static/persons';

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
  const byId = new Map<number, Recipient>();
  for (const g of groups) {
    const type = String(g?.type ?? '').toUpperCase();
    for (const p of Array.isArray(g?.persons) ? g.persons : []) {
      const id = Number(p?.userId ?? p?.id);
      const name = String(p?.displayName ?? '').trim();
      if (!Number.isFinite(id) || !name) continue;
      // One entry per person: a class teacher also appears under TEACHERS.
      const existing = byId.get(id);
      if (existing) {
        if (type === 'CLASS_TEACHERS') existing.category = 'classTeacher';
        continue;
      }
      const tags = Array.isArray(p?.tags) ? p.tags.filter(Boolean) : [];
      byId.set(id, {
        id,
        type: type || 'TEACHERS',
        name,
        role: tags.length ? tags.join(', ') : undefined,
        initials: initialsOf(name),
        category: type === 'CLASS_TEACHERS' ? 'classTeacher' : 'other',
      });
    }
  }
  return [...byId.values()];
}

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'session_expired' }, { status: 401 });

  try {
    const res = await untis(session, RECIPIENTS_PATH, { timeoutMs: 12000 });
    if (res.expired) return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    if (!res.ok) {
      console.error('[recipients] WebUntis error:', res.status);
      return NextResponse.json({ error: 'Empfänger konnten nicht geladen werden.' }, { status: 502 });
    }
    // With the TEACHER option WebUntis takes exactly one recipient per message.
    const perms = await fetchMessagePermissions(session);
    const option = perms.recipientOptions[0] ?? 'TEACHER';
    return NextResponse.json({
      recipients: parseRecipients(res.json),
      recipientOption: option,
      single: option === 'TEACHER',
      maxFileCount: perms.maxFileCount,
      maxFileSize: perms.maxFileSize,
    });
  } catch {
    return NextResponse.json({ error: 'Empfänger konnten nicht geladen werden.' }, { status: 502 });
  }
}
