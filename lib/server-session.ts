import { cookies } from 'next/headers';
import { decryptSession } from './session-crypto';
import type { Session } from './types';

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('pockyh_session')?.value;
  if (!token) return null;
  return decryptSession<Session>(token);
}

export const SCHOOL_COOKIE_VAL = '_bGJzLWJyaXhlbg==';

export function webUntisHeaders(session: Session): Record<string, string> {
  return {
    Cookie: `JSESSIONID=${session.sessionId}; schoolname="${SCHOOL_COOKIE_VAL}"`,
    Accept: 'application/json',
    ...(session.bearerToken ? { Authorization: `Bearer ${session.bearerToken}` } : {}),
  };
}
