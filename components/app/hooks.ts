'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { fetchMessages, fetchPermissions, getMessagesStale } from '@/lib/api';
import { useSession } from '@/providers/SessionProvider';
import type { UntisPermissions } from '@/lib/types';

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
    permissions ??= fetchPermissions().catch(() => {
      permissions = null;
      return null;
    });
    let alive = true;
    permissions.then((p) => { if (alive) setValue(p); });
    return () => { alive = false; };
  }, [untis]);

  return untis ? value : null;
}

/** Unread messages in a messages list response (inbox shape). */
export function countUnread(json: unknown): number {
  const root = (json ?? {}) as Record<string, unknown>;
  const data = (root.data ?? {}) as Record<string, unknown>;
  const list = (root.incomingMessages ?? data.incomingMessages ?? root.messages ?? []) as Array<{ isRead?: boolean }>;
  return Array.isArray(list) ? list.filter((m) => m && m.isRead === false).length : 0;
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
