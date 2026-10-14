'use client';

import { getSignedInUid } from './api-client';

// The cookie banner's choice on this device.
//
// - Necessary: sign-in, security, settings — and the anonymous usage counting
//   (no name, no identifier on the device), which needs no consent.
// - stats: the personal usage statistics — the admin panel may show this
//   account's time, platforms and pages (GDPR Art. 6(1)(a)). Applied to the
//   account signed in when the choice was made, or the first one to sign in
//   after it (lib/privacy-consent.ts), never to every account on the device.
// - ga: Google Analytics, where this deployment has it.
//
// Both optional choices start unticked. "Nur notwendige" is asked again after
// about six months, not earlier (Garante, cookie guidelines of 10 June 2021).

// Versioned: raising it asks everyone again (done for the privacy update of
// 14 Oct 2026). Earlier keys are removed when the new choice is made.
export const COOKIE_CONSENT_STORAGE_KEY = 'pokyh_cookie_consent_v2';
const LEGACY_CONSENT_KEYS = ['pokyh_cookie_consent'];

// Fired on window with the new CookieChoice whenever it changes.
export const COOKIE_CONSENT_EVENT = 'cookie-consent-changed';

const ASK_AGAIN_AFTER_MS = 182 * 24 * 60 * 60 * 1000;

export interface CookieChoice {
  stats: boolean;
  ga: boolean;
  // When the choice was made (ISO).
  at: string;
  // The account the statistics choice belongs to, once known, and whether
  // the server has it.
  uid: string | null;
  synced: boolean;
}

export function readCookieChoice(): CookieChoice | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    // The plain values of the first version of this key.
    if (raw === 'all' || raw === 'necessary') {
      const all = raw === 'all';
      return { stats: all, ga: all, at: new Date(0).toISOString(), uid: null, synced: false };
    }
    const value = JSON.parse(raw) as Partial<CookieChoice>;
    if (typeof value.stats !== 'boolean' || typeof value.ga !== 'boolean' || typeof value.at !== 'string') return null;
    return {
      stats: value.stats,
      ga: value.ga,
      at: value.at,
      uid: typeof value.uid === 'string' ? value.uid : null,
      synced: value.synced === true,
    };
  } catch {
    // Storage blocked or unreadable: treated as no choice yet.
    return null;
  }
}

function write(choice: CookieChoice): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(choice));
    for (const key of LEGACY_CONSENT_KEYS) localStorage.removeItem(key);
  } catch {
    // Storage blocked: the choice holds for this page only.
  }
}

/** Whether the banner has to ask: no choice yet, or a refusal six months old. */
export function cookieChoiceNeeded(choice: CookieChoice | null = readCookieChoice()): boolean {
  if (!choice) return true;
  if (choice.stats) return false;
  const at = Date.parse(choice.at);
  return !Number.isFinite(at) || Date.now() - at > ASK_AGAIN_AFTER_MS;
}

export function saveCookieChoice(stats: boolean, ga: boolean): CookieChoice {
  const choice: CookieChoice = { stats, ga, at: new Date().toISOString(), uid: getSignedInUid(), synced: false };
  write(choice);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: choice }));
  return choice;
}

/** The statistics choice has reached the server for this account. */
export function markCookieChoiceSynced(choice: CookieChoice, uid: string): void {
  write({ ...choice, uid, synced: true });
}
