'use client';

import { apiFetch, getSignedInUid } from './api-client';
import { markCookieChoiceSynced, readCookieChoice, saveCookieChoice } from './cookie-consent';
import { PRIVACY_NOTICE_DAY, PRIVACY_NOTICE_VERSION } from './privacy-notice';

// The privacy notice a signed-in account has to have read, and its consent to
// the personal usage statistics.
//
// - The notice is acknowledged at sign-in (LoginForm) and again whenever this
//   version changes (PrivacyGate). The acknowledgement only records that the
//   notice was shown and read; it is not consent.
// - The personal usage statistics (GDPR Art. 6(1)(a)) are chosen in the cookie
//   banner ("Alle akzeptieren" or its settings), never preset, and can be
//   changed there or in the profile at any time. Without them visits are only
//   counted anonymously.
//
// The version itself is set in lib/privacy-notice.ts, which the apps read too.

export { PRIVACY_NOTICE_VERSION };
// The date shown with the notice ("Stand").
export const PRIVACY_NOTICE_DATE = new Date(`${PRIVACY_NOTICE_DAY}T12:00:00`);

// Fired on window with { usageStats: boolean } whenever the choice changes.
export const USAGE_CONSENT_EVENT = 'pokyh-usage-consent-changed';

const PENDING_KEY = 'pokyh_privacy_ack_pending';

export interface PrivacyStatus {
  acknowledgedVersion: string | null;
  acknowledgedAt: string | null;
  usageStats: boolean;
  usageStatsAt: string | null;
}

// The sign-in form cannot reach the backend yet (its token arrives with the
// sign-in), so it leaves the acknowledgement here and PrivacyGate sends it
// right after.
export function rememberPendingAck(): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ version: PRIVACY_NOTICE_VERSION }));
  } catch {
    // Storage blocked: PrivacyGate simply asks again after sign-in.
  }
}

export function hasPendingAck(): boolean {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as { version?: unknown }).version === PRIVACY_NOTICE_VERSION;
  } catch {
    return false;
  }
}

export function clearPendingAck(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // nothing to clear
  }
}

// PrivacyGate, once shown for an account, stays until "Verstanden" — also when
// a navigation (the installed app opening on the landing page, a WebUntis
// session running out) or a reload remounts it before the server answers
// again. Kept for this tab only.
const OPEN_GATE_KEY = 'pokyh_privacy_gate_open';

export function rememberOpenGate(account: string): void {
  try {
    sessionStorage.setItem(OPEN_GATE_KEY, JSON.stringify({ account, version: PRIVACY_NOTICE_VERSION }));
  } catch {
    // Storage blocked: the gate asks the server again after a remount.
  }
}

export function isGateOpen(account: string): boolean {
  try {
    const raw = sessionStorage.getItem(OPEN_GATE_KEY);
    if (!raw) return false;
    const open = JSON.parse(raw) as { account?: unknown; version?: unknown };
    return open.account === account && open.version === PRIVACY_NOTICE_VERSION;
  } catch {
    return false;
  }
}

export function forgetOpenGate(): void {
  try {
    sessionStorage.removeItem(OPEN_GATE_KEY);
  } catch {
    // nothing to forget
  }
}

function announce(usageStats: boolean): void {
  window.dispatchEvent(new CustomEvent(USAGE_CONSENT_EVENT, { detail: { usageStats } }));
}

// Without a backend token a call would read as an expired session and sign
// the user out, so every call here needs one and quietly gives up otherwise.
function signedIn(): boolean {
  return getSignedInUid() !== null;
}

export async function fetchPrivacyStatus(): Promise<PrivacyStatus | null> {
  if (!signedIn()) return null;
  try {
    const res = await apiFetch('/privacy/status');
    return res.ok ? await res.json() as PrivacyStatus : null;
  } catch {
    return null;
  }
}

// Records that the current notice was read; the statistics choice is left as
// it is.
export async function acknowledgePrivacy(): Promise<boolean> {
  if (!signedIn()) return false;
  try {
    const res = await apiFetch('/privacy/acknowledge', {
      method: 'POST',
      body: JSON.stringify({ version: PRIVACY_NOTICE_VERSION }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function putUsageStats(enabled: boolean): Promise<boolean> {
  try {
    const res = await apiFetch('/privacy/usage-stats', { method: 'PUT', body: JSON.stringify({ enabled }) });
    if (res.ok) announce(enabled);
    return res.ok;
  } catch {
    return false;
  }
}

// The profile switch: the account's consent, and this device's cookie choice
// with it, so the banner shows the same.
export async function setUsageStatsConsent(enabled: boolean): Promise<boolean> {
  const uid = getSignedInUid();
  if (!uid) return false;
  const ok = await putUsageStats(enabled);
  if (ok) markCookieChoiceSynced(saveCookieChoice(enabled, readCookieChoice()?.ga ?? false), uid);
  return ok;
}

// Brings the signed-in account's consent in line with this device's cookie
// choice — once per choice, and only for the account that made it (signed in
// at the time, or the first to sign in after it). Someone else signing in on
// the same device is never opted in by another person's click.
export async function syncCookieChoice(): Promise<void> {
  const uid = getSignedInUid();
  const choice = readCookieChoice();
  if (!uid || !choice || choice.synced) return;
  if (choice.uid && choice.uid !== uid) return;
  if (await putUsageStats(choice.stats)) markCookieChoiceSynced(choice, uid);
}
