'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api } from '@/lib/api-client';
import { useSession } from '@/providers/SessionProvider';

interface FirebaseCtx {
  firebaseUid: string | null;
  stableUid: string | null;
  classId: string | null;
  ready: boolean;
  retryInit: () => void;
}

const Ctx = createContext<FirebaseCtx>({
  firebaseUid: null,
  stableUid: null,
  classId: null,
  ready: false,
  retryInit: () => {},
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const [stableUid, setStableUid] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const init = useCallback(async (username: string, klasseId: number, klasseName: string) => {
    try {
      const result = await api.auth.loginWithSession(username, klasseId, klasseName);
      if (result.stableUid) {
        setStableUid(result.stableUid);
        setClassId(result.classId);
      }
    } catch (e) {
      console.error('[FirebaseProvider] init error:', e);
    } finally {
      setReady(true);
    }
  }, []);

  const retryInit = useCallback(() => {
    if (!user) return;
    setReady(false);
    setClassId(null);
    init(user.username, user.klasseId, user.klasseName);
  }, [user, init]);

  useEffect(() => {
    if (!user) return;
    init(user.username, user.klasseId, user.klasseName);
  }, [user, init]);

  return (
    <Ctx.Provider value={{ firebaseUid: null, stableUid, classId, ready, retryInit }}>
      {children}
    </Ctx.Provider>
  );
}

export const useFirebase = () => useContext(Ctx);
