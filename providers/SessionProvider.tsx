'use client';

import { stripLocale } from '@/lib/i18n/locale';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { logout as apiLogout } from '@/lib/api';
import { clearSessionCredentials } from '@/lib/passkey';

export interface UserInfo {
  username: string;
  studentId: number;
  klasseId: number;
  klasseName: string;
  isUntisUser?: boolean;
  loginAt?: number;
  personType?: number;
  isParent?: boolean;
}

interface SessionCtx {
  user: UserInfo | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const Ctx = createContext<SessionCtx>({
  user: null,
  isLoading: true,
  logout: async () => {},
  refreshUser: () => {},
});

function readUserCookie(): UserInfo | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)pokyh_user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as UserInfo;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Prevents pokyh-session-refreshed from overwriting user=null once logout starts.
  // Without this guard a concurrent re-login event can undo the setUser(null) that
  // pokyh-session-expired set, leaving the app stuck with an expired session.
  const loggingOut = useRef(false);

  const refreshUser = useCallback(() => {
    if (loggingOut.current) return;
    setUser(readUserCookie());
    setIsLoading(false);
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  useEffect(() => {
    let handling = false;
    const handler = () => {
      if (handling) return;
      handling = true;
      loggingOut.current = true;
      setUser(null);
      setIsLoading(false);
      // Clear server-side pokyh_session cookie so middleware allows /login
      fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
        .catch(() => {})
        .finally(() => {
          const p = window.location.pathname;
          if (stripLocale(p) !== '/login') {
            window.location.replace('/login');
          }
        });
    };
    window.addEventListener('pokyh-session-expired', handler);
    return () => window.removeEventListener('pokyh-session-expired', handler);
  }, []);

  // After a silent WebUntis re-login, re-read the updated pokyh_user cookie
  // so the proactive logout timer resets with the new loginAt.
  // Guarded by loggingOut so a pokyh-session-refreshed that fires concurrently
  // with pokyh-session-expired cannot overwrite the user=null state.
  useEffect(() => {
    const handler = () => refreshUser();
    window.addEventListener('pokyh-session-refreshed', handler);
    return () => window.removeEventListener('pokyh-session-refreshed', handler);
  }, [refreshUser]);

  const logout = useCallback(async () => {
    loggingOut.current = true;
    try { await apiLogout(); } catch { /* best effort */ }
    clearSessionCredentials();
    setUser(null);
    window.location.replace('/login');
  }, []);

  // Proactive timer: fire logout when the 4 h POKYH session is about to expire
  useEffect(() => {
    if (!user?.loginAt) return;
    const SESSION_MS = 4 * 60 * 60 * 1000;
    const remaining = user.loginAt + SESSION_MS - Date.now();
    if (remaining <= 0) {
      const t = setTimeout(() => logout(), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => logout(), remaining);
    return () => clearTimeout(t);
  }, [user, logout]);

  return (
    <Ctx.Provider value={{ user, isLoading, logout, refreshUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSession = () => useContext(Ctx);
