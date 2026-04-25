'use client';

import type { Session } from './types';

const SESSION_KEY = 'pockyh_session';
const LAST_ACTIVE_KEY = 'pockyh_last_active';
const SESSION_TIMEOUT_MS = 60 * 1000; // 1 minute, matches Flutter

export function saveSession(session: Session): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  touchSession();
}

export function loadSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LAST_ACTIVE_KEY);
}

export function touchSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
}

export function isSessionExpired(): boolean {
  if (typeof window === 'undefined') return true;
  const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
  if (!lastActive) return true;
  return Date.now() - parseInt(lastActive, 10) > SESSION_TIMEOUT_MS;
}
