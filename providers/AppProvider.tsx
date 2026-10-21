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

  const init = useCallback(async () => {
    try {
      const result = await api.auth.loginWithSession();
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
    void init();
  }, [user, init]);

  // Started right after the render, not inside the effect itself.
  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => { void init(); }, 0);
    return () => window.clearTimeout(timer);
  }, [user, init]);

  // Periodically verify the backend session is still valid.
  // apiFetch fires pokyh-session-expired when the token can't be refreshed,
  // which SessionProvider catches and redirects to /login.
  useEffect(() => {
    if (!user) return;

    async function checkSession() {
      // Skip if no token present, avoids noisy 401s on unauthenticated state
      if (!api.getToken()) return;
      try {
        await apiFetch('/auth/me');
      } catch {
        // Network error or server down, non-fatal, will retry next interval
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
