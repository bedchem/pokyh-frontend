'use client';

import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import { accessToken } from './api-client';
import { API_KEY, clientHeaders, untisUrl, type SignInAnswer } from './backend';
import { isPWA } from './pwa';

// Signing in with the device's own lock — Face ID, Touch ID, a fingerprint or
// the PIN — instead of the password, in the installed website only
// (pokyh-backend services/webPasskeys.ts). Turning it on makes a passkey on
// the device; the sign-in it unlocks stays on the device too, sealed in an
// httpOnly cookie of the API that no page script can read. Signing in needs
// both, and WebUntis still checks the account every time.

const BASE = '/api/webuntis/login/passkey';

// The API's challenges live 5 minutes; one older than this is asked again.
const CHALLENGE_FRESH_MS = 4 * 60_000;

/** How the device's lock is called: Face ID on an iPhone or iPad, the fingerprint on Android. */
export type UnlockPlatform = 'ios' | 'android' | 'other';

export function unlockPlatform(): UnlockPlatform {
  const ua = navigator.userAgent;
  // iPads name themselves a Mac, with a touch screen.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return /Android/.test(ua) ? 'android' : 'other';
}

let supported: Promise<boolean> | null = null;

/** Whether this device can do it: the installed website, with the device's own authenticator. */
export function deviceUnlockSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !isPWA() || !browserSupportsWebAuthn()) return Promise.resolve(false);
  supported ??= platformAuthenticatorIsAvailable().catch(() => false);
  return supported;
}

type Answer<T> = { ok: boolean; status: number; data: Partial<T> & { error?: string; code?: string } };

async function call<T>(path: string, init: { method?: string; body?: unknown; signedIn?: boolean } = {}): Promise<Answer<T>> {
  const method = init.method ?? 'POST';
  const headers: Record<string, string> = { ...clientHeaders() };
  if (method !== 'GET') headers['X-API-Key'] = API_KEY;
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  if (init.signedIn) {
    const token = await accessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(untisUrl(`${BASE}${path}`), {
    method,
    credentials: 'include',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = (await res.json().catch(() => ({}))) as Answer<T>['data'];
  return { ok: res.ok, status: res.status, data };
}

// The page's own address goes along: behind `next dev`'s proxy the API sees
// no Origin. It only picks among the website's own addresses.
const here = () => ({ origin: window.location.origin });

/** A passkey prompt the person closed (or that came without a tap, on iOS). */
function cancelled(err: unknown): boolean {
  const name = err instanceof Error ? err.name : '';
  return name === 'NotAllowedError' || name === 'AbortError';
}

export const isFresh = (challenge: { at: number }) => Date.now() - challenge.at < CHALLENGE_FRESH_MS;

// ─── Signing in ───────────────────────────────────────────────────────────────

/** The account this device's passkey signs in to; null when there is none. */
export async function deviceUnlockAccount(): Promise<string | null> {
  try {
    const r = await call<{ username: string }>('', { method: 'GET' });
    return r.ok && r.data.username ? r.data.username : null;
  } catch {
    return null;
  }
}

export interface UnlockChallenge {
  username: string;
  options: PublicKeyCredentialRequestOptionsJSON;
  challengeToken: string;
  at: number;
}

/**
 * The challenge for this device's passkey, asked before the tap: iOS starts
 * Face ID only straight from one. Null when the device has none.
 */
export async function unlockChallenge(): Promise<UnlockChallenge | null> {
  try {
    const r = await call<Omit<UnlockChallenge, 'at'>>('/options', { body: here() });
    const { username, options, challengeToken } = r.data;
    return r.ok && username && options && challengeToken ? { username, options, challengeToken, at: Date.now() } : null;
  } catch {
    return null;
  }
}

export type UnlockResult =
  | { kind: 'signed-in'; answer: SignInAnswer }
  /** The account has two-factor sign-in: the authenticator app's code follows with the ticket. */
  | { kind: 'code'; ticket: string; wrong: boolean }
  /** WebUntis no longer takes the saved password: the password once, then it works again. */
  | { kind: 'stale'; username: string }
  | { kind: 'none' }
  | { kind: 'cancelled' }
  | { kind: 'failed'; code?: string };

async function finish(body: { challengeToken: string; response: AuthenticationResponseJSON } | { ticket: string; token: string }): Promise<UnlockResult> {
  let r: Answer<SignInAnswer & { ok: boolean; ticket: string; username: string }>;
  try {
    r = await call('', { body });
  } catch {
    return { kind: 'failed', code: 'network' };
  }
  const { code, ticket } = r.data;
  if (r.ok && r.data.ok) return { kind: 'signed-in', answer: r.data };
  if ((code === 'two_factor_required' || code === 'two_factor_invalid') && ticket) return { kind: 'code', ticket, wrong: code === 'two_factor_invalid' };
  if (code === 'passkey_stale') return { kind: 'stale', username: r.data.username ?? '' };
  if (code === 'none') return { kind: 'none' };
  return { kind: 'failed', code };
}

/** Face ID (the fingerprint, the PIN) for the challenge, then the sign-in. */
export async function unlockWithDevice(challenge: UnlockChallenge): Promise<UnlockResult> {
  let response: AuthenticationResponseJSON;
  try {
    response = await startAuthentication({ optionsJSON: challenge.options });
  } catch (err) {
    return cancelled(err) ? { kind: 'cancelled' } : { kind: 'failed' };
  }
  return finish({ challengeToken: challenge.challengeToken, response });
}

/** The authenticator app's code, after the passkey (accounts with two-factor sign-in). */
export function unlockWithCode(ticket: string, token: string): Promise<UnlockResult> {
  return finish({ ticket, token });
}

// ─── Turning it on and off (the settings) ────────────────────────────────────

export interface SetupChallenge {
  options: PublicKeyCredentialCreationOptionsJSON;
  challengeToken: string;
  at: number;
}

/** The challenge for a new passkey, asked before the tap (as above); `code` says why there is none. */
export async function setupChallenge(): Promise<{ challenge: SetupChallenge } | { code: string }> {
  try {
    const r = await call<Omit<SetupChallenge, 'at'>>('/setup/options', { body: here(), signedIn: true });
    const { options, challengeToken } = r.data;
    if (r.ok && options && challengeToken) return { challenge: { options, challengeToken, at: Date.now() } };
    return { code: r.data.code ?? 'failed' };
  } catch {
    return { code: 'network' };
  }
}

export type SetupResult = { kind: 'on' } | { kind: 'cancelled' } | { kind: 'failed'; code?: string };

/** Makes the passkey (the device asks for Face ID, the fingerprint or the PIN) and turns it on. */
export async function turnOnDeviceUnlock(challenge: SetupChallenge): Promise<SetupResult> {
  let response: RegistrationResponseJSON;
  try {
    response = await startRegistration({ optionsJSON: challenge.options });
  } catch (err) {
    return cancelled(err) ? { kind: 'cancelled' } : { kind: 'failed' };
  }
  try {
    const r = await call<{ ok: boolean }>('/setup', { body: { challengeToken: challenge.challengeToken, response }, signedIn: true });
    return r.ok && r.data.ok ? { kind: 'on' } : { kind: 'failed', code: r.data.code };
  } catch {
    return { kind: 'failed', code: 'network' };
  }
}

/** Turns it off on this device. */
export async function turnOffDeviceUnlock(): Promise<boolean> {
  try {
    return (await call<{ ok: boolean }>('', { method: 'DELETE' })).ok;
  } catch {
    return false;
  }
}
