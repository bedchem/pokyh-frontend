import type { NextRequest, NextResponse } from 'next/server';
import { decryptSession, encryptSession } from '@/lib/session-crypto';
import { defaultSchool, parseSchool, type SchoolRef } from './schools';

// A sign-in lives in the browser's cookies and nowhere else, so deleting the
// site's cookies signs out. Besides the session itself, the renewal cookie
// lets the server sign in again by itself when WebUntis ends its session
// early: it holds user name, password and school sealed with SESSION_SECRET
// (AES-GCM), is httpOnly (page scripts cannot read it), is only sent to the
// sign-in route and is only accepted next to the session it belongs to.

/** Options of the session cookies (pokyh_session, pokyh_user): 4 hours. */
export const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 4 * 60 * 60,
};

export const RENEWAL_COOKIE = 'pokyh_renew';
const RENEWAL_PATH = '/api/webuntis/login';

export interface SavedSignIn {
  username: string;
  password: string;
  school: SchoolRef;
}

type Sealed = { kind?: unknown; u?: unknown; p?: unknown; s?: unknown };

export async function sealRenewal(res: NextResponse, signIn: SavedSignIn): Promise<void> {
  const sealed = await encryptSession({ kind: 'renewal', u: signIn.username, p: signIn.password, s: signIn.school });
  res.cookies.set(RENEWAL_COOKIE, sealed, { ...SESSION_COOKIE_OPTS, path: RENEWAL_PATH });
}

export function clearRenewal(res: NextResponse): void {
  res.cookies.set(RENEWAL_COOKIE, '', { ...SESSION_COOKIE_OPTS, path: RENEWAL_PATH, maxAge: 0 });
}

/**
 * The saved sign-in of the request's session, or null when there is none:
 * no renewal cookie, no session cookie, an expired session, or one of a
 * different account or school.
 */
export async function openRenewal(req: NextRequest): Promise<SavedSignIn | null> {
  const sealed = req.cookies.get(RENEWAL_COOKIE)?.value;
  const current = req.cookies.get('pokyh_session')?.value;
  if (!sealed || !current) return null;

  const [saved, session] = await Promise.all([
    decryptSession<Sealed>(sealed),
    decryptSession<{ username?: string; school?: SchoolRef; loginAt?: number }>(current),
  ]);
  if (saved?.kind !== 'renewal' || typeof saved.u !== 'string' || typeof saved.p !== 'string' || !session) return null;
  if (typeof session.loginAt === 'number' && Date.now() - session.loginAt > SESSION_COOKIE_OPTS.maxAge * 1000) return null;

  const school = parseSchool(saved.s);
  const sessionSchool = session.school ?? defaultSchool();
  if (!school || session.username !== saved.u || sessionSchool.loginName !== school.loginName) return null;
  return { username: saved.u, password: saved.p, school };
}
