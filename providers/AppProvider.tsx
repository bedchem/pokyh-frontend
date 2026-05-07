'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api, apiFetch } from '@/lib/api-client';
import { useSession } from '@/providers/SessionProvider';

interface AppCtx {
  stableUid: string | null;
  classId: string | null;
  ready: boolean;
  retryInit: () => void;
}

const Ctx = createContext<AppCtx>({
  stableUid: null,
  classId: null,
  ready: false,
  retryInit: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
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
      console.error('[AppProvider] init error:', e);
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

  // Periodically verify the backend session is still valid.
  // If /auth/me returns 401, the session was revoked → force re-login.
  useEffect(() => {
    if (!user) return;

    async function checkSession() {
      try {
        const res = await apiFetch('/auth/me');
        if (res.status === 401) {
          window.dispatchEvent(new Event('pockyh-session-expired'));
        }
      } catch {
        // Network error / server down — don't log out
      }
    }

    void checkSession();
    const interval = setInterval(() => { void checkSession(); }, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <Ctx.Provider value={{ stableUid, classId, ready, retryInit }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
