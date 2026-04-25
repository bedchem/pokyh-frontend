'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout as apiLogout } from '@/lib/api';

export interface UserInfo {
  username: string;
  studentId: number;
  klasseId: number;
  klasseName: string;
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
  const router = useRouter();

  const refreshUser = useCallback(() => {
    const info = readUserCookie();
    setUser(info);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      /* best effort */
    }
    setUser(null);
    router.replace('/login');
  }, [router]);

  return (
    <Ctx.Provider value={{ user, isLoading, logout, refreshUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSession = () => useContext(Ctx);
