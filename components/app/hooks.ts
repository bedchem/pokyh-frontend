'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  fetchMensa,
  fetchMessages,
  fetchPermissions,
  getMensaStale,
  getMessagesStale,
  getStoredPermissions,
  refreshInbox,
  untisIdleMs,
} from '@/lib/api';
import { useSession } from '@/providers/SessionProvider';
import type { UntisPermissions } from '@/lib/types';
import { messageIsRead } from '@/lib/untis-parse';

// Small shared reads for the app frame. Each is fetched once per page load and
// shared by every component that asks, so the sidebar, the dashboard and the
// profile don't each call WebUntis for the same thing.

let permissions: Promise<UntisPermissions | null> | null = null;

/** The account's WebUntis capabilities (absence self-report, display name). */
export function useUntisPermissions(): UntisPermissions | null {
  const { user } = useSession();
  const untis = !!user && user.isUntisUser !== false;
  const [value, setValue] = useState<UntisPermissions | null>(null);

  useEffect(() => {
    if (!untis) return;
    // At once from the last live answer on this device (name and the report
    // button), then from the live one.
    const stored = getStoredPermissions();
    const early = stored ? window.setTimeout(() => setValue((v) => v ?? stored), 0) : undefined;
    permissions ??= fetchPermissions().catch(() => {
      permissions = null;
      return null;
    });
    let alive = true;
    permissions.then((p) => { if (alive && p) setValue(p); });
    return () => { alive = false; window.clearTimeout(early); };
  }, [untis]);

  return untis ? value : null;
}

/** Unread messages in a messages list response (inbox shape). */
export function countUnread(json: unknown): number {
  const root = (json ?? {}) as Record<string, unknown>;
  const data = (root.data ?? {}) as Record<string, unknown>;
  const list = (root.incomingMessages ?? data.incomingMessages ?? root.messages ?? []) as Array<Record<string, unknown>>;
  return Array.isArray(list) ? list.filter((m) => m && !messageIsRead(m)).length : 0;
}

// The unread count lives outside React: one value for every badge, filled
// from the stored inbox, then from WebUntis (once per page load), then from
// `pokyh-messages-updated` whenever the messages page marks things read.
let unreadValue: number | null = null;
let inboxRequested = false;
const unreadListeners = new Set<() => void>();

function setUnreadValue(n: number) {
  unreadValue = n;
  unreadListeners.forEach((l) => l());
}

function unreadSnapshot(): number {
  if (unreadValue === null) {
    const stale = getMessagesStale();
    unreadValue = stale === undefined ? 0 : countUnread(stale);
  }
  return unreadValue;
}

function subscribeUnread(cb: () => void) {
  unreadListeners.add(cb);
  const onUpdate = (e: Event) => {
    const n = (e as CustomEvent<{ unread?: number }>).detail?.unread;
    if (typeof n === 'number') setUnreadValue(n);
  };
  window.addEventListener('pokyh-messages-updated', onUpdate);
  return () => {
    unreadListeners.delete(cb);
    window.removeEventListener('pokyh-messages-updated', onUpdate);
  };
}

/** Unread inbox messages for the badges. */
export function useUnreadMessages(): number {
  const { user } = useSession();
  const untis = !!user && user.isUntisUser !== false;
  const unread = useSyncExternalStore(subscribeUnread, unreadSnapshot, () => 0);

  useEffect(() => {
    if (!untis || inboxRequested) return;
    inboxRequested = true;
    fetchMessages().then((json) => setUnreadValue(countUnread(json))).catch(() => { inboxRequested = false; });
  }, [untis]);

  return untis ? unread : 0;
}

// WebUntis ends a session after a few idle minutes, and the next request then
// pays for a refused answer and a new sign-in first. While someone is at the
// app (it is in view and was touched, typed in or scrolled lately), the inbox
// (the unread badges) is read again live once nothing else has asked WebUntis
// for a few minutes, and right away when the tab comes back after that long.
// Using the app keeps the session busy anyway: no extra request then. A tab
// left alone lets the session lapse as before.
const UNTIS_IDLE_MS = 3 * 60_000;
const PRESENT_MS = 3 * 60_000;

export function useKeepUntisSession(): void {
  const { user } = useSession();
  const untis = !!user && user.isUntisUser !== false;

  useEffect(() => {
    if (!untis) return;
    let activeAt = Date.now();
    const check = () => {
      if (document.visibilityState !== 'visible' || Date.now() - activeAt > PRESENT_MS || untisIdleMs() < UNTIS_IDLE_MS) return;
      refreshInbox().then((json) => setUnreadValue(countUnread(json))).catch(() => {});
    };
    const active = () => { activeAt = Date.now(); };
    const back = () => {
      if (document.visibilityState !== 'visible') return;
      active();
      check();
    };
    const timer = window.setInterval(check, 30_000);
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
    for (const e of events) window.addEventListener(e, active, { passive: true, capture: true });
    document.addEventListener('visibilitychange', back);
    return () => {
      window.clearInterval(timer);
      for (const e of events) window.removeEventListener(e, active, { capture: true });
      document.removeEventListener('visibilitychange', back);
    };
  }, [untis]);
}

/**
 * Whether a menu answer says the school has a Mensa: pokyh-backend sends
 * `available: false` for a school without a menu (none assigned in the admin
 * panel, or taken away there). Older answers without the flag count as one.
 */
export function mensaAvailableIn(raw: unknown): boolean {
  return !(raw && typeof raw === 'object' && (raw as { available?: unknown }).available === false);
}

// Like the unread count: one value for the whole frame. The menu stored on
// the device answers at once (no tab that pops in or out on later visits);
// the menu is then read once per page load, which also has it ready for the
// Mensa page. Unknown (first visit, still loading) shows the Mensa.
let mensaValue: boolean | null = null;
let mensaRequested = false;
const mensaListeners = new Set<() => void>();

function mensaSnapshot(): boolean | null {
  if (mensaValue === null) {
    const stale = getMensaStale('account');
    if (stale !== undefined) mensaValue = mensaAvailableIn(stale);
  }
  return mensaValue;
}

function subscribeMensa(cb: () => void) {
  mensaListeners.add(cb);
  return () => { mensaListeners.delete(cb); };
}

/** The account's school has a Mensa: true, false, or null while not known yet. */
export function useMensaAvailable(): boolean | null {
  const { user } = useSession();
  const value = useSyncExternalStore(subscribeMensa, mensaSnapshot, () => null);

  useEffect(() => {
    if (!user || mensaRequested) return;
    mensaRequested = true;
    fetchMensa('account')
      .then((raw) => {
        mensaValue = mensaAvailableIn(raw);
        mensaListeners.forEach((l) => l());
      })
      .catch(() => { mensaRequested = false; });
  }, [user]);

  return user ? value : null;
}

/**
 * The first name for greetings. WebUntis gives a display name ("Last First" or
 * "First Last", depending on the school) and a username built as
 * "last-first" abbreviations at LBS Brixen ("pfei-eman"); the name word the
 * username's last part starts is the first name. Guardians see their child's
 * name in the display name, so they get no name at all.
 */
export function useFirstName(): string {
  const { user } = useSession();
  const perms = useUntisPermissions();
  if (!user || user.isParent) return '';
  if (user.isUntisUser === false) return user.username;
  const words = (perms?.personName ?? '').trim().split(/\s+/).filter(Boolean);
  const parts = user.username.toLowerCase().split(/[-._\s]+/).filter((p) => p.length >= 2);
  for (const part of [...parts].reverse()) {
    const hit = words.find((w) => w.toLowerCase().startsWith(part));
    if (hit) return hit;
  }
  return '';
}

/** First letters of up to two words, for avatars without a picture. */
export function initialsOf(name: string): string {
  const words = name.replace(/[._-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
