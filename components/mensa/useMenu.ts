'use client';

import { startTransition, useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { fetchCanteens, fetchMensa, getCanteensStale, getMensaStale } from '@/lib/api';
import { mensaAvailableIn } from '@/components/app/hooks';
import { CHOICE_PARAM, canteenOf, canteensFrom, menuOwner, rememberCanteen, rememberedCanteen, type Canteen } from '@/lib/mensa';
import { useSession } from '@/providers/SessionProvider';

// Which menu a Mensa page shows, and how its ratings and comments are read.
//
// Inside the app (/canteen) it is the account's own school's, as before. On
// the public page (/mensa) it is the canteen chosen there: the one a link
// names (?mensa=<school>), else the one chosen on this device, else, signed
// in, the account's own. With several canteens and none of these, the page
// asks which one; with a single canteen it is that one.
//
// The account's own canteen is shown as in the app: the comments in full and
// the account's own rating. Any other canteen a signed-in account sees as a
// guest does (pokyh-backend shows an account only its own school's threads).

export type MenuTarget =
  | { kind: 'choose' }
  | { kind: 'own' }
  /** A school's canteen as a guest sees it; null: the installation's default. */
  | { kind: 'school'; slug: string | null };

// The choice: what the address names, else what this device remembers. Read
// in the browser; the server renders without it.
let choice: string | null | undefined;
const listeners = new Set<() => void>();

function readChoice(): string | null {
  const linked = new URLSearchParams(window.location.search).get(CHOICE_PARAM);
  if (linked) return linked;
  if (choice === undefined) choice = rememberedCanteen();
  return choice;
}

function subscribeChoice(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Picks a canteen on this device (null: back to the list), and keeps the address in step. */
function setChoice(slug: string | null) {
  choice = slug;
  rememberCanteen(slug);
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set(CHOICE_PARAM, slug);
  else url.searchParams.delete(CHOICE_PARAM);
  window.history.replaceState(window.history.state, '', url);
  listeners.forEach((l) => l());
}

export interface MenuView {
  target: MenuTarget;
  /**
   * Everything the choice depends on is known. Before that (the prerendered
   * page, the first moments in the browser) the target is provisional: the
   * list of canteens when there are several, else the default menu.
   */
  settled: boolean;
  /** The canteens to choose from; null while not known. */
  canteens: Canteen[] | null;
  /** The menu answer for the target; undefined while it loads. */
  raw: unknown;
  error: string;
  /** The account's own canteen: full comments, its rating, live updates. */
  own: boolean;
  /** The school to name in rating and comment reads (a guest's view); null reads as the account or the default. */
  readSchool: string | null;
  /** The school chosen on the page (for links to a dish and back). */
  chosen: string | null;
  /** The signed-in account's own canteen (its id), if its school has one. */
  ownCanteen: string | null;
  choose: (slug: string | null) => void;
  retry: () => void;
}

export function useMenu({ inApp = false, initialRaw, initialCanteens, listed = true, ask = true }: {
  inApp?: boolean;
  /** The public default menu the page was prerendered with. */
  initialRaw?: unknown;
  initialCanteens?: Canteen[];
  /**
   * False: the backend had no list of canteens when the page was built (an
   * older one), so the browser does not ask for it either: one canteen, the
   * default.
   */
  listed?: boolean;
  /** False: never ask, show the default (a dish page reached without a choice). */
  ask?: boolean;
}): MenuView {
  const { user, isLoading } = useSession();
  const picked = useSyncExternalStore(subscribeChoice, readChoice, () => undefined);
  const [canteens, setCanteens] = useState<Canteen[] | null>(() => initialCanteens ?? null);
  // The account's own school's menu (undefined: not read yet, null: unreadable).
  const [ownRaw, setOwnRaw] = useState<unknown>(undefined);
  // A menu answer and which target it belongs to, so a switch shows no stale plan.
  const [shown, setShown] = useState<{ source: string; raw: unknown }>({ source: 'public:', raw: initialRaw });
  const [error, setError] = useState('');
  const [request, setRequest] = useState(0);

  // The list of canteens (public page only): the stored one at once, then
  // fresh. Not needed where nothing is asked and nothing has been chosen.
  const needList = !inApp && listed && (ask || !!picked);
  useEffect(() => {
    if (!needList) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      const stale = getCanteensStale();
      if (stale !== undefined) setCanteens((c) => c ?? canteensFrom(stale));
      fetchCanteens()
        .then((raw) => { if (alive) startTransition(() => setCanteens(canteensFrom(raw))); })
        // No list (an older backend, offline): one canteen, the default.
        .catch(() => { if (alive) setCanteens((c) => c ?? []); });
    }, 0);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [needList]);

  // Signed in on the public page: the account's own canteen, to tell it apart.
  useEffect(() => {
    if (inApp || !user) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      const stale = getMensaStale('account');
      if (stale !== undefined) setOwnRaw(stale);
      fetchMensa('account')
        .then((raw) => { if (alive) startTransition(() => setOwnRaw(raw)); })
        .catch(() => { if (alive) setOwnRaw((o: unknown) => (o === undefined ? null : o)); });
    }, 0);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [inApp, user]);

  const own = ownRaw && mensaAvailableIn(ownRaw) ? menuOwner(ownRaw) : null;
  // A choice that is not one of the canteens (any more) is dropped.
  const chosen = picked && (canteens === null || canteenOf(canteens, picked)) ? picked : null;

  let target: MenuTarget;
  if (inApp) target = { kind: 'own' };
  else if (chosen) {
    const ownSlug = own?.school?.slug;
    const canteen = canteens ? canteenOf(canteens, chosen) : null;
    target = ownSlug && (chosen === ownSlug || (canteen && canteen.id === own?.canteen?.id)) ? { kind: 'own' } : { kind: 'school', slug: chosen };
  } else if (own) target = { kind: 'own' };
  else if (ask && canteens && canteens.length > 1) target = { kind: 'choose' };
  else target = { kind: 'school', slug: null };
  // The list is waited for only where it is read: without it (a dish page
  // reached without a choice, a backend with no list) nothing would settle.
  const settled = inApp || (!isLoading && picked !== undefined && !(user && ownRaw === undefined) && (canteens !== null || !needList));

  const scope = target.kind === 'own' ? 'account' : 'public';
  const slug = target.kind === 'school' ? target.slug : null;
  const loads = settled && target.kind !== 'choose';
  const source = `${scope}:${slug ?? ''}`;

  useEffect(() => {
    if (!loads) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      // What this device stored last time shows at once; the fresh menu replaces it.
      const stale = getMensaStale(scope, slug);
      if (stale !== undefined) setShown({ source, raw: stale });
      setError('');
      fetchMensa(scope, slug)
        // A whole plan of dishes is a large render: as a transition React
        // draws it in slices, so the page stays responsive meanwhile.
        .then((raw) => { if (alive) startTransition(() => setShown({ source, raw })); })
        .catch((e: unknown) => { if (alive && stale === undefined) setError(e instanceof Error ? e.message : 'error'); });
    }, 0);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [loads, scope, slug, source, request]);

  const raw = shown.source === source ? shown.raw : undefined;
  const isOwn = target.kind === 'own';
  // A guest's view names its school, so a signed-in account is not read in.
  const readSchool = isOwn ? null : slug ?? menuOwner(raw).school?.slug ?? null;

  const retry = useCallback(() => {
    setError('');
    setShown((s) => ({ ...s, raw: undefined }));
    setRequest((n) => n + 1);
  }, []);

  return { target, settled, canteens, raw, error, own: isOwn, readSchool, chosen, ownCanteen: own?.canteen?.id ?? null, choose: setChoice, retry };
}
