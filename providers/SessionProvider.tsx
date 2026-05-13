'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { logout as apiLogout } from '@/lib/api';
import { clearSessionCredentials } from '@/lib/passkey';

export interface UserInfo {
  username: string;
  studentId: number;
  klasseId: number;
  klasseName: string;
  isUntisUser?: boolean;
  loginAt?: number;
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
  const match = document.cookie.match(/(?:^|;\s*)pockyh_user=([^;]*)/);
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

  const refreshUser = useCallback(() => {
    setUser(readUserCookie());
    setIsLoading(false);
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  useEffect(() => {
    let handling = false;
    const handler = () => {
      if (handling) return;
      handling = true;
      setUser(null);
      setIsLoading(false);
      // Clear server-side pockyh_session cookie so middleware allows /login
      fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
        .catch(() => {})
        .finally(() => {
          const p = window.location.pathname;
          if (p !== '/login') {
            window.location.replace('/login');
          }
        });
    };
    window.addEventListener('pockyh-session-expired', handler);
    return () => window.removeEventListener('pockyh-session-expired', handler);
  }, []);

  // After a silent WebUntis re-login, re-read the updated pockyh_user cookie
  // so the proactive logout timer resets with the new loginAt.
  useEffect(() => {
    const handler = () => refreshUser();
    window.addEventListener('pockyh-session-refreshed', handler);
    return () => window.removeEventListener('pockyh-session-refreshed', handler);
  }, [refreshUser]);

  const logout = useCallback(async () => {
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
