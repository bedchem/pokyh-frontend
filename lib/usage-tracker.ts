'use client';

import { apiFetch, getSignedInUid } from './api-client';
import { isPWA } from './pwa';

// Usage statistics for the admin panel ("how long is Pokyh open, on which
// kind of device"). Described in the privacy notice under "Nutzungsstatistik".
//
// - For every signed-in visit. The server stores it anonymously — a day-scoped
//   key instead of the account — unless the account consented to the personal
//   usage statistics (cookie banner or profile); only then is it named.
// - Guests and the public pages send nothing.
// - One random id per visit, held in memory only: nothing is written to
//   cookies or browser storage, and a reload starts a new visit.
// - While the page is visible a ping goes out about once a minute with the
//   foreground seconds and the number of opened screens since the last one,
//   plus a final one when the page is hidden or closed.
// - A browser that sends the Global Privacy Control signal is not measured.

const PING_INTERVAL_MS = 60_000;
// Hidden for longer than this, the next foreground time is a new visit.
const NEW_VISIT_AFTER_MS = 30 * 60_000;

type Device = 'ios' | 'android' | 'desktop' | 'other';

let visit: { id: string; uid: string } | null = null;
let visibleSince: number | null = null;
let hiddenAt: number | null = null;
let pendingMs = 0;
let pendingScreens = 0;
let started = false;

function reset(): void {
  visit = null;
  pendingMs = 0;
  pendingScreens = 0;
}

function randomId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // randomUUID needs a secure context; plain-http development falls back here.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function device(): Device {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; the touch screen gives it away.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Windows|Macintosh|CrOS|X11|Linux/.test(ua)) return 'desktop';
  return 'other';
}

function measuringAllowed(): boolean {
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl !== true;
}

function send(final: boolean): void {
  const now = Date.now();
  if (visibleSince !== null) {
    pendingMs += now - visibleSince;
    visibleSince = document.visibilityState === 'visible' ? now : null;
  }

  const uid = getSignedInUid();
  if (!uid || !measuringAllowed()) {
    reset();
    return;
  }
  if (!visit || visit.uid !== uid) {
    // Time gathered under another account (or while signed out) is not this
    // account's; a fresh sign-in starts from zero.
    if (visit) {
      pendingMs = 0;
      pendingScreens = 0;
    }
    visit = { id: randomId(), uid };
  }

  const activeSeconds = Math.floor(pendingMs / 1000);
  pendingMs -= activeSeconds * 1000;
  const screens = pendingScreens;
  pendingScreens = 0;

  apiFetch('/usage/ping', {
    method: 'POST',
    // Lets the last ping outlive a closing tab.
    keepalive: final,
    body: JSON.stringify({
      sessionId: visit.id,
      device: device(),
      client: isPWA() ? 'pwa' : 'browser',
      activeSeconds,
      screens,
    }),
  }).catch(() => {});
}

function onVisibility(): void {
  if (document.visibilityState === 'hidden') {
    send(true);
    visibleSince = null;
    hiddenAt = Date.now();
    return;
  }
  if (hiddenAt !== null && Date.now() - hiddenAt > NEW_VISIT_AFTER_MS) visit = null;
  hiddenAt = null;
  visibleSince = Date.now();
  send(false);
}

/** Starts measuring for this page; calling it again does nothing. */
export function startUsageTracking(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  visibleSince = document.visibilityState === 'visible' ? Date.now() : null;
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', () => send(true));
  window.setInterval(() => {
    if (document.visibilityState === 'visible') send(false);
  }, PING_INTERVAL_MS);
  // A moment's delay, so a session restored on load has its token in place.
  window.setTimeout(() => send(false), 2_000);
}

/** One more screen opened in this visit. */
export function noteScreen(): void {
  pendingScreens += 1;
}
