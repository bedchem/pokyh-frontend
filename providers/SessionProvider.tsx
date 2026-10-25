'use client';

import { DEFAULT_LOCALE, isLocale, stripLocale } from '@/lib/i18n/locale';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { forgetStoredTokens, signOutEverywhere } from '@/lib/api-client';
import { cacheClear } from '@/lib/cache';
import { forgetTabCredentials } from '@/lib/passkey';
import { pcClear } from '@/lib/persist-cache';
import { isProtectedAppRoute } from '@/lib/routes';

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

// The sign-in lives in cookies only (lib/server/sign-in-cookies.ts): when they
// are deleted, the account is signed out. How often an open page looks for
// them where the browser does not report cookie changes itself.
const COOKIE_CHECK_MS = 2000;

const hasUserCookie = () => /(?:^|;\s*)pokyh_user=/.test(document.cookie);

/**
 * The sign-in page in the language of the current page, coming back here
 * afterwards. The website is static, so nothing in front of it adds the
 * language or the way back any more.
 */
export function loginPath(comeBack = true): string {
  const lang = window.location.pathname.split('/')[1] || DEFAULT_LOCALE;
  const here = window.location.pathname + window.location.search;
  const path = `/${isLocale(lang) ? lang : DEFAULT_LOCALE}/login/`;
  return comeBack && isProtectedAppRoute(stripLocale(window.location.pathname)) ? `${path}?next=${encodeURIComponent(here)}` : path;
}

/** How long a sign-in lasts (pokyh-backend's session cookies, pokyh_user). */
export const SESSION_MS = 4 * 60 * 60 * 1000;

// Off to the sign-in page once, whichever part of the page notices first: a
// second navigation would start the sign-in page loading all over again.
let leaving = false;
export function leaveForLogin(comeBack = true): void {
  if (leaving) return;
  leaving = true;
  window.location.replace(loginPath(comeBack));
}

/** The account's school data kept on the device for quick display goes with the sign-in. */
function forgetSignedInData() {
  cacheClear();
  pcClear();
}

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

  useEffect(() => {
    // What earlier versions kept in browser storage goes; without a sign-in,
    // so does the data of the last one.
    forgetTabCredentials();
    forgetStoredTokens();
    if (!hasUserCookie()) forgetSignedInData();
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    let handling = false;
    const handler = () => {
      if (handling) return;
      handling = true;
      loggingOut.current = true;
      setUser(null);
      setIsLoading(false);
      forgetSignedInData();
      // The page's own sign-in cookies go at once, so the sign-in page shows
      // the form instead of sending straight back; the API's follow on the
      // way (an expired sign-in has nothing to wait for).
      void signOutEverywhere();
      // Pages that need a sign-in send to it; public ones stay, for a guest.
      if (isProtectedAppRoute(stripLocale(window.location.pathname))) leaveForLogin();
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
    // The WebUntis client loads only here: guests (every public page) never need it.
    try { await (await import('@/lib/api')).logout(); } catch { /* best effort */ }
    forgetSignedInData();
    setUser(null);
    leaveForLogin(false);
  }, []);

  // Signed in means the cookies are there. When they go (deleted in the
  // browser, or expired), this page signs out too: at once where the browser
  // reports cookie changes, otherwise on focus or the next check.
  useEffect(() => {
    if (!user) return;
    const check = () => {
      if (!loggingOut.current && !hasUserCookie()) window.dispatchEvent(new CustomEvent('pokyh-session-expired'));
    };
    const store = (window as Window & { cookieStore?: EventTarget }).cookieStore;
    const timer = setInterval(check, COOKIE_CHECK_MS);
    store?.addEventListener('change', check);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      store?.removeEventListener('change', check);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [user]);

  // When the 4 h sign-in runs out, the page treats it as expired: straight to
  // the sign-in page, without waiting for the API (a phone back from hours in
  // the background may not have its connection yet).
  useEffect(() => {
    if (!user?.loginAt) return;
    const expire = () => window.dispatchEvent(new CustomEvent('pokyh-session-expired'));
    const t = setTimeout(expire, Math.max(0, user.loginAt + SESSION_MS - Date.now()));
    return () => clearTimeout(t);
  }, [user]);

  return (
    <Ctx.Provider value={{ user, isLoading, logout, refreshUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSession = () => useContext(Ctx);
