import { cookies } from 'next/headers';
import { decryptSession } from './session-crypto';
import type { Session } from './types';
import { cookieHeader } from './server/untis';

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('pokyh_session')?.value;
  if (!token) return null;
  return decryptSession<Session>(token);
}

export function webUntisHeaders(session: Session): Record<string, string> {
  return {
    Cookie: cookieHeader(session),
    Accept: 'application/json',
    ...(session.bearerToken ? { Authorization: `Bearer ${session.bearerToken}` } : {}),
  };
}
