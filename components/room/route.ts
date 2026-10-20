'use client';

import { useSyncExternalStore } from 'react';

// Where in room A+2/05 the sign-in page is: an anchor of the page's
// address, so the browser's back button leaves the vending machine, the
// console or the room the way it came, and a reload stays where it was. Only
// the door in the hallway leads here; the address is the door's, not another
// way in. Entries the room adds carry a marker in the history state (Next.js
// keeps its own state beside it), so "back" knows whether to go back or
// replace. The addresses of the room's old number (#2b…) still lead in.

export type RoomView = 'room' | 'shop' | 'console' | 'bag';

const HASH: Record<RoomView, string> = { room: '#a205', shop: '#a205/shop', console: '#a205/console', bag: '#a205/bag' };
const OLD: Record<string, RoomView> = { '#2b': 'room', '#2b/snacks': 'shop', '#2b/tablet': 'console', '#2b/bag': 'bag' };
const CHANGE = 'pokyh:room-view';

export function viewOf(hash: string): RoomView | null {
  const h = hash.toLowerCase();
  return (Object.keys(HASH) as RoomView[]).find((v) => HASH[v] === h) ?? OLD[h] ?? null;
}

// The way in through the door: the View Transition that carries the
// hallway's panel into the room's (app/[lang]/login). The room keeps its
// warm light up until it is over, then clears it.
let wayIn: Promise<unknown> | null = null;

export function enteringWith(done: Promise<unknown> | null) {
  wayIn = done;
}

/** The last way in through the door (settled long ago on a later look), or null when there was none. */
export function wayInto(): Promise<unknown> | null {
  return wayIn;
}

function current(): RoomView | null {
  return viewOf(window.location.hash);
}

function subscribe(fn: () => void) {
  window.addEventListener('popstate', fn);
  window.addEventListener('hashchange', fn);
  window.addEventListener(CHANGE, fn);
  return () => {
    window.removeEventListener('popstate', fn);
    window.removeEventListener('hashchange', fn);
    window.removeEventListener(CHANGE, fn);
  };
}

export function useRoomView(): RoomView | null {
  return useSyncExternalStore(subscribe, current, () => null);
}

const ours = () => typeof window.history.state?.pokyhRoom === 'number';
const address = (view: RoomView | null) => `${window.location.pathname}${window.location.search}${view ? HASH[view] : ''}`;

/** Opens a view with a new history entry. */
export function openView(view: RoomView) {
  if (current() === view) return;
  const depth = ours() ? (window.history.state.pokyhRoom as number) + 1 : 1;
  window.history.pushState({ pokyhRoom: depth }, '', address(view));
  window.dispatchEvent(new Event(CHANGE));
}

/**
 * Goes one step back towards `to` (the room from a machine or the tablet,
 * the sign-in page from the room): through the history when the room added
 * the entry, otherwise by replacing the address (a reload or a link).
 * Resolves once the page shows where it went.
 */
export function closeView(to: RoomView | null): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener('popstate', finish);
      window.removeEventListener(CHANGE, finish);
      // React has drawn the new view by the next task.
      window.setTimeout(resolve, 0);
    };
    window.addEventListener('popstate', finish);
    window.addEventListener(CHANGE, finish);
    window.setTimeout(finish, 600);
    // Entries the room pushed (depth 1 and up) sit right after the one to go
    // back to: the sign-in page before the room, the room before the rest.
    if (ours() && window.history.state.pokyhRoom >= 1) {
      window.history.back();
      return;
    }
    // Depth 0: an entry that came from outside (a reload or a link); the next
    // step back from it replaces again instead of leaving the site.
    window.history.replaceState(to ? { pokyhRoom: 0 } : null, '', address(to));
    window.dispatchEvent(new Event(CHANGE));
  });
}
