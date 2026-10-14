'use client';

import { apiFetch, getSignedInUid } from './api-client';

// The privacy notice a signed-in account has to have read, and its optional
// consent to the usage statistics.
//
// - The notice is acknowledged at sign-in (LoginForm) and again whenever this
//   version changes (PrivacyGate). The acknowledgement only records that the
//   notice was shown and read; it is not consent.
// - The usage statistics are a separate opt-in (GDPR Art. 6(1)(a)): asked on
//   the same screen, never preset, revocable in the profile at any time.
//
// Raise PRIVACY_NOTICE_VERSION whenever the privacy notice changes in a way
// people should see again; everyone is then asked once more.

export const PRIVACY_NOTICE_VERSION = '2026-10-14';
// The date shown with the notice ("Stand").
export const PRIVACY_NOTICE_DATE = new Date('2026-10-14T12:00:00');

// Fired on window with { usageStats: boolean } whenever the choice changes.
export const USAGE_CONSENT_EVENT = 'pokyh-usage-consent-changed';

const PENDING_KEY = 'pokyh_privacy_ack_pending';

export interface PrivacyStatus {
  acknowledgedVersion: string | null;
  acknowledgedAt: string | null;
  usageStats: boolean;
  usageStatsAt: string | null;
}

interface PendingAck {
  version: string;
  usageStats: boolean;
}

// The sign-in form cannot reach the backend yet (its token arrives with the
// sign-in), so it leaves the choice here and PrivacyGate sends it right after.
export function rememberPendingAck(usageStats: boolean): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ version: PRIVACY_NOTICE_VERSION, usageStats } satisfies PendingAck));
  } catch {
    // Storage blocked: PrivacyGate simply asks again after sign-in.
  }
}

export function takePendingAck(): PendingAck | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<PendingAck>;
    if (value.version !== PRIVACY_NOTICE_VERSION || typeof value.usageStats !== 'boolean') return null;
    return { version: value.version, usageStats: value.usageStats };
  } catch {
    return null;
  }
}

export function clearPendingAck(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // nothing to clear
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

export async function acknowledgePrivacy(usageStats: boolean): Promise<boolean> {
  if (!signedIn()) return false;
  try {
    const res = await apiFetch('/privacy/acknowledge', {
      method: 'POST',
      body: JSON.stringify({ version: PRIVACY_NOTICE_VERSION, usageStats }),
    });
    if (res.ok) announce(usageStats);
    return res.ok;
  } catch {
    return false;
  }
}

export async function setUsageStatsConsent(enabled: boolean): Promise<boolean> {
  if (!signedIn()) return false;
  try {
    const res = await apiFetch('/privacy/usage-stats', { method: 'PUT', body: JSON.stringify({ enabled }) });
    if (res.ok) announce(enabled);
    return res.ok;
  } catch {
    return false;
  }
}
