'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { ArrowRight, Eye, EyeSlash, LockSimple, MagnifyingGlass, X } from '@phosphor-icons/react';
import Sheet from '@/components/ui/Sheet';
import Spinner from '@/components/ui/Spinner';
import ForgotPasswordForm from '@/components/account/ForgotPasswordForm';
import SiteHeader from '@/components/site/SiteHeader';
import { untisActionsDict } from '@/lib/i18n/dictionaries/untisActions';
import { loginDict, type LoginKey } from '@/lib/i18n/dictionaries/login';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import {
  hasDeclinedPasskey,
  storePasswordCredential,
  getPasswordCredential,
  isPasswordCredentialSupported,
} from '@/lib/passkey';
import { readCookieChoice, COOKIE_CONSENT_EVENT } from '@/lib/cookie-consent';
import { rememberPendingAck } from '@/lib/privacy-consent';
import { API_BASE, API_KEY, rememberSignIn, untisUrl, type SignInAnswer } from '@/lib/backend';
import { untisSignIn } from '@/lib/api';
import { useSession } from '@/providers/SessionProvider';
import { forgetSchoolChoice, readSchoolChoice, saveSchoolChoice, type SchoolChoice } from '@/lib/school-choice';
import { prefersReducedMotion } from '@/lib/motion';
import { looksLikeAppKey } from '@/lib/app-access';
import { closeView, enteringWith, openView, useRoomView } from '@/components/room/route';
import { HallwayScene, MascotBadge, type MascotEvent, type MascotState } from './Hallway';
import OfficeSignIn, { MicrosoftMark } from './OfficeSignIn';

// Room A+2/05, behind the hallway's door: a little secret classroom,
// fetched and built only when someone goes near the door (components/room).
// Its first frame is the same warm wall the door opens onto.
const loadRoom = () => import('@/components/room/Classroom');
const Classroom = dynamic(loadRoom, { ssr: false, loading: RoomWait });

function RoomWait() {
  const t = useT(loginDict);
  return <p className="visually-hidden" role="status">{t('roomLoading')}</p>;
}

// Initials and a tone per school, so results are told apart at a glance.
const SCHOOL_TONES = [
  'bg-[var(--periwinkle)] text-[var(--periwinkle-ink)]',
  'bg-[var(--butter)] text-[var(--butter-ink)]',
  'bg-[var(--sage)] text-[var(--sage-ink)]',
  'bg-[var(--blush)] text-[var(--blush-ink)]',
  'bg-[var(--mint)] text-[var(--mint-ink)]',
];
function schoolTone(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return SCHOOL_TONES[h % SCHOOL_TONES.length];
}
function initials(name: string): string {
  const words = name.replace(/["“”„'’()]/g, ' ').split(/[\s.-]+/).filter((w) => /\p{L}|\d/u.test(w));
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase();
}

/** The name with the searched words marked. */
function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.trim().split(/\s+/).filter((w) => w.length > 1).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${words.join('|')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <mark key={i} className="rounded-[4px] bg-[var(--accent-tint)] text-inherit">{part}</mark> : part))}
    </>
  );
}

function SchoolBadge({ school, className = '' }: { school: SchoolChoice; className?: string }) {
  return (
    <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-[12px] text-[13px] font-extrabold tracking-[-0.02em] ${schoolTone(school.loginName)} ${className}`}>
      {initials(school.name)}
    </span>
  );
}

// A step change as a View Transition where the browser has them: the chosen
// school flies from the list into its place above the form. Returns the
// transition (null without one).
function transition(update: () => void): { finished: Promise<void> } | null {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (!doc.startViewTransition || prefersReducedMotion()) { update(); return null; }
  return doc.startViewTransition(() => { flushSync(update); });
}

/**
 * The room's frame as a clip of the stage: the panel at `at` (the hallway's,
 * in the window) seen from the stage at `stage`, rounded like both.
 */
function clipTo(at: DOMRect, stage: DOMRect): string {
  const px = (v: number) => `${Math.max(0, v).toFixed(1)}px`;
  return `inset(${px(at.top - stage.top)} ${px(stage.right - at.right)} ${px(stage.bottom - at.bottom)} ${px(at.left - stage.left)} round 36px)`;
}
const FULL = 'inset(0px 0px 0px 0px round 36px)';

// Sign-in in two steps, like WebUntis itself: first the school (any school on
// WebUntis, found through its public school search, see
// app/api/webuntis/schools), then the account. The school is remembered in
// this browser until the end of the school year (lib/school-choice.ts), so the
// next visit starts at the password. Credentials go to the server route,
// which signs in at exactly that school's WebUntis server.

type SearchState =
  | { kind: 'idle' }
  | { kind: 'short' }
  | { kind: 'loading' }
  | { kind: 'done'; schools: SchoolChoice[] }
  | { kind: 'error'; reason: 'too_many' | 'unavailable' | 'rate' };

const ERROR_KEYS: Record<string, LoginKey> = {
  bad_credentials: 'errBadCredentials',
  refused: 'errRefused',
  unavailable: 'errUnavailable',
  rate_limited: 'errRate',
  school_invalid: 'errSchool',
  missing: 'errMissing',
  account_refused: 'errAccount',
};

// The same answers to a sign-in with the app key, in its words.
const KEY_ERROR_KEYS: Record<string, LoginKey> = {
  ...ERROR_KEYS,
  bad_credentials: 'errKeyBad',
  missing: 'errKeyMissing',
  key_invalid: 'errKeyInvalid',
};

type Credential = { password: string } | { key: string };

/** How a school signs in, as its WebUntis sign-in page offers it. */
interface LoginOptions {
  password: boolean;
  office365: boolean;
}

/**
 * The sign-in options of the chosen school (the API reads them from the
 * school's own WebUntis page); null until they are known or when they cannot
 * be, which leaves the password form as it always was.
 */
function useLoginOptions(loginName: string | undefined, server: string | undefined): LoginOptions | null {
  const id = loginName && server ? `${server}/${loginName}` : '';
  const [answer, setAnswer] = useState<{ id: string; options: LoginOptions | null } | null>(null);
  useEffect(() => {
    if (!loginName || !server) return;
    const ctrl = new AbortController();
    const at = `${server}/${loginName}`;
    fetch(untisUrl(`/api/webuntis/login-options?school=${encodeURIComponent(loginName)}&server=${encodeURIComponent(server)}`), { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Partial<LoginOptions> | null) => setAnswer({
        id: at,
        options: data && typeof data.office365 === 'boolean' ? { office365: data.office365, password: data.password !== false } : null,
      }))
      .catch((e: Error) => { if (e.name !== 'AbortError') setAnswer({ id: at, options: null }); });
    return () => ctrl.abort();
  }, [loginName, server]);
  return answer?.id === id ? answer.options : null;
}

/** Search results for a query; each answer is kept with the query it belongs to. */
function useSchoolSearch(query: string): SearchState {
  const q = query.trim();
  const [answer, setAnswer] = useState<{ q: string; state: SearchState } | null>(null);
  useEffect(() => {
    if (q.length < 3) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(untisUrl(`/api/webuntis/schools?q=${encodeURIComponent(q)}`), { signal: ctrl.signal });
        const data = (await res.json().catch(() => ({}))) as { schools?: SchoolChoice[]; reason?: string };
        setAnswer({
          q,
          state: res.ok && Array.isArray(data.schools)
            ? { kind: 'done', schools: data.schools }
            : { kind: 'error', reason: data.reason === 'too_many' ? 'too_many' : data.reason === 'rate' ? 'rate' : 'unavailable' },
        });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setAnswer({ q, state: { kind: 'error', reason: 'unavailable' } });
      }
    }, 260);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [q]);
  if (!q) return { kind: 'idle' };
  if (q.length < 3) return { kind: 'short' };
  return answer?.q === q ? answer.state : { kind: 'loading' };
}

/** The browser filled the form: one event for both fields. */
function autofilled(old: MascotEvent): MascotEvent {
  return old?.kind === 'autofill' && Date.now() - old.n < 1500 ? old : { kind: 'autofill', n: Date.now() };
}

// Browser-only values read without an extra render pass.
const noop = () => () => {};
function subscribeConsent(fn: () => void) {
  window.addEventListener(COOKIE_CONSENT_EVENT, fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, fn);
    window.removeEventListener('storage', fn);
  };
}
let rememberedCache: { value: SchoolChoice | null } | null = null;
function rememberedSnapshot(): SchoolChoice | null {
  // One read per page load is enough; a stable object keeps React calm.
  if (!rememberedCache) rememberedCache = { value: readSchoolChoice() };
  return rememberedCache.value;
}

export default function LoginForm() {
  const t = useT(loginDict);
  const { user: signedIn, isLoading: sessionLoading } = useSession();
  const ta = useT(untisActionsDict);
  const localize = useLocalizeHref();

  const ready = useSyncExternalStore(noop, () => true, () => false);
  const storedSchool = useSyncExternalStore(noop, rememberedSnapshot, () => null);
  // undefined: nothing picked on this page yet, the remembered school applies.
  const [picked, setPicked] = useState<SchoolChoice | null | undefined>(undefined);
  const [remembered, setRemembered] = useState<SchoolChoice | null | undefined>(undefined);
  const school = picked === undefined ? storedSchool : picked;
  const lastSchool = remembered === undefined ? storedSchool : remembered;
  const [query, setQuery] = useState('');
  const [activeRaw, setActive] = useState(0);
  const search = useSchoolSearch(query);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const consentGiven = useSyncExternalStore(subscribeConsent, () => readCookieChoice() !== null, () => false);
  const [cookieError, setCookieError] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [officeOpen, setOfficeOpen] = useState(false);
  const [officeError, setOfficeError] = useState('');
  const options = useLoginOptions(school?.loginName, school?.server);
  // What the mascot answers: the focused field, each key, and events.
  const [focus, setFocus] = useState<MascotState['focus']>(null);
  const [keys, setKeys] = useState(0);
  const [event, setEvent] = useState<MascotEvent>(null);
  const typed = () => setKeys((n) => n + 1);
  const happen = (kind: NonNullable<MascotEvent>['kind']) => setEvent({ kind, n: Date.now() });
  const autofill = () => setEvent(autofilled);

  // Already signed in: straight on to the app (where ?next= points, or home).
  useEffect(() => {
    if (sessionLoading || !signedIn || loading) return;
    const raw = new URLSearchParams(window.location.search).get('next') ?? '';
    window.location.replace(raw.startsWith('/') && !raw.startsWith('//') ? raw : localize('/home'));
  }, [sessionLoading, signedIn, loading, localize]);

  const focusOn = (field: NonNullable<MascotState['focus']>) => ({
    onFocus: () => setFocus(field),
    onBlur: () => setFocus((f) => (f === field ? null : f)),
    // Autofill styles a field, which starts an animation (globals.css).
    onAnimationStart: (e: React.AnimationEvent<HTMLInputElement>) => { if (e.animationName === 'login-autofill') autofill(); },
  });

  // Room A+2/05: open while the address says so (#a205…); the door shuts behind
  // whoever comes back out.
  const view = useRoomView();
  const inRoom = view !== null;
  const [returns, setReturns] = useState(0);
  const [wasInRoom, setWasInRoom] = useState(inRoom);
  // As soon as someone goes near the door, the room is built: in its place
  // under the header, clipped to the hallway's panel and lying under it, so
  // nothing heavy happens while the door opens and the view walks through,
  // and stepping in only has to let its frame grow.
  const [staged, setStaged] = useState<{ top: number; clip: string } | null>(null);
  if (wasInRoom !== inRoom) {
    setWasInRoom(inRoom);
    if (!inRoom) { setReturns((n) => n + 1); setStaged(null); }
  }
  const page = useRef<HTMLDivElement>(null);
  const spacer = useRef<HTMLDivElement>(null);
  // Going in: the hallway's panel (all warm light by now) becomes the room's
  // frame, which then grows to the whole stage; nothing in it is scaled.
  // The room clears its light while the frame grows. Coming out, the frame
  // shrinks back to the panel and the hallway takes over there.
  const roomStage = useRef<HTMLDivElement>(null);
  const hallAt = useRef<{ rect: DOMRect; width: number } | null>(null);
  // Lets the room clear its light once its frame has started to grow.
  const lightUp = useRef<(() => void) | null>(null);
  // The door opens: the form steps aside (straight on the page, no new
  // render while the door moves).
  const openDoor = useCallback(() => { page.current?.setAttribute('data-entering', ''); }, []);
  useEffect(() => { if (returns) page.current?.removeAttribute('data-entering'); }, [returns]);
  // Where the hallway's panel is now, as a clip of the room's stage under the
  // header (16 px in from the edges, the hallway's own padding).
  const underHall = useCallback(() => {
    const hall = document.querySelector<HTMLElement>('.login-hall')?.getBoundingClientRect();
    const top = spacer.current?.getBoundingClientRect().bottom;
    if (!hall || top === undefined) return null;
    hallAt.current = { rect: hall, width: window.innerWidth };
    return { top, clip: clipTo(hall, new DOMRect(16, top, window.innerWidth - 32, window.innerHeight - top - 16)) };
  }, []);
  // Near the door (the pointer or the focus on it): the room is fetched and,
  // once the browser is idle, built underneath. Clicked before that, it is
  // built as the view walks through.
  const staging = useRef(false);
  const stageRoom = useCallback(() => {
    if (staging.current || prefersReducedMotion()) return;
    staging.current = true;
    void loadRoom().then(() => {
      const at = underHall();
      if (!at) { staging.current = false; return; }
      enteringWith(new Promise<void>((done) => { lightUp.current = () => window.setTimeout(done, 300); }));
      setStaged(at);
    }, () => { staging.current = false; });
  }, [underHall]);
  const fetchRoom = useCallback(() => {
    void loadRoom().then(() => {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(stageRoom, { timeout: 400 });
      else setTimeout(stageRoom, 0);
    }, () => {});
  }, [stageRoom]);
  // Back out of the room: the next visit is built afresh.
  useEffect(() => { if (returns) staging.current = false; }, [returns]);
  // The window changes size while the room waits underneath: it keeps to the panel.
  useEffect(() => {
    if (!staged || inRoom) return;
    const onResize = () => { const at = underHall(); if (at) setStaged(at); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [staged, inRoom, underHall]);
  const enterRoom = useCallback(() => {
    void loadRoom().then(() => {
      const hall = hallAt.current?.rect ?? document.querySelector<HTMLElement>('.login-hall')?.getBoundingClientRect() ?? null;
      const moving = !!hall && !prefersReducedMotion();
      if (!lightUp.current) enteringWith(moving ? new Promise((done) => window.setTimeout(done, 300)) : null);
      flushSync(() => openView('room'));
      lightUp.current?.();
      lightUp.current = null;
      const el = roomStage.current;
      el?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
      if (!moving || !el?.animate) return;
      el.animate([{ clipPath: clipTo(hall, el.getBoundingClientRect()) }, { clipPath: FULL }], { duration: 720, easing: 'cubic-bezier(0.65, 0, 0.2, 1)' });
    }, () => openView('room'));
  }, []);
  const leaveRoom = useCallback(() => {
    const el = roomStage.current;
    const back = () => { void closeView(null); };
    if (!el?.animate || prefersReducedMotion() || !window.matchMedia('(min-width: 1024px)').matches) { back(); return; }
    const r = el.getBoundingClientRect();
    const saved = hallAt.current;
    // The hallway's panel where it was, or where the layout puts it (54 %, 57 % from 1280 px).
    const hall = saved && saved.width === window.innerWidth
      ? saved.rect
      : new DOMRect(r.left, r.top, window.innerWidth * (window.innerWidth >= 1280 ? 0.57 : 0.54) - 32, r.height);
    const anim = el.animate([{ clipPath: FULL }, { clipPath: clipTo(hall, r) }], { duration: 520, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' });
    anim.onfinish = back;
  }, []);

  const searchInput = useRef<HTMLInputElement>(null);
  const userInput = useRef<HTMLInputElement>(null);
  const listId = useId();
  const statusId = useId();

  // Saved browser credentials fill the form (Credential Management API).
  useEffect(() => {
    if (!isPasswordCredentialSupported()) return;
    let live = true;
    const started = setTimeout(() => { if (live) setAutoFilling(true); }, 0);
    getPasswordCredential()
      .then((cred) => {
        if (!live || !cred) return;
        setUsername(cred.username);
        setPassword(cred.password);
        // Saved credentials filled in count as autofill too.
        setEvent(autofilled);
      })
      .catch(() => {})
      .finally(() => { clearTimeout(started); if (live) setAutoFilling(false); });
    return () => { live = false; };
  }, []);

  // Focus follows the step.
  useEffect(() => {
    if (!ready || inRoom) return;
    const el = school ? userInput.current : searchInput.current;
    // Not on touch screens: the keyboard would cover the page on arrival.
    if (el && window.matchMedia('(pointer: fine)').matches) el.focus({ preventScroll: true });
  }, [ready, school, inRoom]);

  const results = search.kind === 'done' ? search.schools : [];
  const active = Math.min(activeRaw, Math.max(0, results.length - 1));

  const pick = useCallback((s: SchoolChoice) => {
    setPicked(s);
    setError('');
    saveSchoolChoice(s);
    setRemembered(s);
  }, []);

  const changeSchool = () => transition(() => {
    setPicked(null);
    setQuery('');
    setActive(0);
    setError('');
  });

  // Picking a school: the row flies up into the chip above the form.
  const choose = (s: SchoolChoice, row?: HTMLElement | null) => {
    if (row) row.style.viewTransitionName = 'login-school';
    transition(() => pick(s));
    happen('picked');
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[active], document.getElementById(`${listId}-${active}`)); }
  };

  // Keep the active option in view while moving with the keys.
  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!school) return;
    if (!consentGiven) {
      setCookieError(true);
      setTimeout(() => setCookieError(false), 3500);
      return;
    }
    if (!username.trim() || !password.trim()) {
      setError(t('errMissing'));
      return;
    }
    // The browser filling in the key it saved for the Office 365 sign-in.
    const credential: Credential = options?.office365 && looksLikeAppKey(password) ? { key: password.trim() } : { password };
    await signIn(username.trim(), credential, setError);
  }

  const openOffice = () => {
    setOfficeError('');
    setOfficeOpen(true);
  };

  // The Office 365 sign-in, with the account's app key (lib/app-access.ts).
  function handleOffice(user: string, key: string) {
    if (!consentGiven) {
      setOfficeError(t('cookieError'));
      return;
    }
    void signIn(user, { key }, setOfficeError);
  }

  // Signs in with the password or the app key; `fail` says what went wrong
  // where the person is looking (the form or the Office 365 sheet).
  async function signIn(user: string, credential: Credential, fail: (message: string) => void) {
    if (!school) return;
    // The notice was shown next to the form; recorded right after signing in (PrivacyGate).
    rememberPendingAck();
    setLoading(true);
    setLoadingMsg(t('loggingIn'));
    fail('');

    // Read at the moment of signing in (the address is final by then), not
    // with useSearchParams: that would keep the whole form out of the page's
    // prerendered HTML, which search engines and slow phones see first.
    const raw = new URLSearchParams(window.location.search).get('next') ?? '';
    const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : localize('/home');
    const withKey = 'key' in credential;

    try {
      const untisRes = await untisSignIn({
        username: user,
        ...credential,
        school: { loginName: school.loginName, server: school.server, name: school.name },
      });
      const untisData = (await untisRes.json().catch(() => ({}))) as { ok?: boolean; code?: string } & SignInAnswer;

      if (untisRes.ok && untisData.ok) {
        rememberSignIn(untisData);
        setLoadingMsg(t('almostDone'));
        happen('success');
        if (isPasswordCredentialSupported() && !hasDeclinedPasskey()) {
          storePasswordCredential(user, withKey ? credential.key : credential.password).catch(() => {});
        }
        window.location.replace(next);
        return;
      }
      if (untisData.code === 'school_invalid') {
        forgetSchoolChoice();
        setRemembered(null);
        setPicked(null);
        setOfficeOpen(false);
      }

      // Wrong WebUntis credentials may still be a POKYH-only account.
      if (!withKey && (untisData.code === 'bad_credentials' || untisData.code === 'refused')) {
        setLoadingMsg(t('checkingPokyh'));
        const pokyhRes = await fetch(`${API_BASE}/auth/web/local-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
          body: JSON.stringify({ username: user.toLowerCase(), password: credential.password }),
          credentials: 'include',
        });
        const pokyhData = (await pokyhRes.json().catch(() => ({}))) as { ok?: boolean } & SignInAnswer;
        if (pokyhRes.ok && pokyhData.ok) {
          rememberSignIn(pokyhData);
          setLoadingMsg(t('almostDone'));
          happen('success');
          window.location.replace(next);
          return;
        }
      }

      const key = untisData.code ? (withKey ? KEY_ERROR_KEYS : ERROR_KEYS)[untisData.code] : undefined;
      fail(t(key ?? 'errFailed'));
      happen('error');
    } catch {
      fail(t('errNetwork'));
      happen('error');
    }
    setLoading(false);
    setLoadingMsg('');
  }

  // Only what needs saying; the number of results is for screen readers.
  const searchMessage =
    search.kind === 'short' ? t('schoolShort')
    : search.kind === 'error' ? t(search.reason === 'too_many' ? 'schoolTooMany' : search.reason === 'rate' ? 'schoolRate' : 'schoolError')
    : search.kind === 'done' && !results.length ? t('schoolNone')
    : '';
  const searchAnnouncement = search.kind === 'done' && results.length ? t('schoolResults', { n: results.length }) : searchMessage;

  const mascot: MascotState = {
    step: school ? 'account' : 'school',
    focus,
    query,
    search: search.kind,
    results: results.length,
    username,
    showPw,
    loading,
    keys,
    event,
  };

  return (
    // One quiet column on a fixed screen: the page itself never scrolls; on
    // very small screens or with the keyboard open only the column does.
    <div ref={page} className="site login-page fixed inset-0 flex flex-col overflow-hidden">
      {/* The site's own bar on top, fixed; the room below keeps it clear. */}
      <SiteHeader />
      <div ref={spacer} aria-hidden="true" className="h-[72px] shrink-0 md:h-[84px]" style={{ marginTop: 'var(--safe-top)' }} />

      {/* Room A+2/05: the sign-in stays as it was beneath, hidden, until you come back. */}
      {(inRoom || staged) && (
        <div
          className={inRoom ? 'flex min-h-0 flex-1 px-3 pb-3 lg:px-4 lg:pb-4' : 'pointer-events-none absolute inset-x-0 bottom-0 -z-10 flex px-3 pb-3 lg:px-4 lg:pb-4'}
          style={inRoom || !staged ? undefined : { top: staged.top }}
          inert={!inRoom || undefined}
          aria-hidden={!inRoom || undefined}
        >
          <div ref={roomStage} className="room-stage relative min-w-0 flex-1 overflow-hidden rounded-[28px] lg:rounded-[36px]" style={inRoom || !staged ? undefined : { clipPath: staged.clip }}>
            <Classroom view={view ?? 'room'} onLeave={leaveRoom} />
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1" hidden={inRoom}>
      {/* Desktops: the mascot in its hallway (with the door of room 2B) beside the form; phones get it small above the form, without the door. */}
      <aside className="hidden px-4 pb-4 lg:block lg:w-[54%] xl:w-[57%]">
        <HallwayScene state={mascot} onDoor={enterRoom} onDoorIntent={fetchRoom} onDoorOpen={openDoor} onWalk={stageRoom} returns={returns} />
      </aside>

      <div className="login-col flex min-w-0 flex-1 flex-col">

      <main id="main" data-lenis-prevent className="login-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5" style={{ paddingBottom: 'max(16px, var(--safe-bottom))' }}>
        <section aria-labelledby="login-title" className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-6">
          <div className="mb-5 lg:hidden"><MascotBadge state={mascot} /></div>
          <h1 id="login-title" className="font-display text-[clamp(38px,5vw,52px)] leading-[0.95]">{t('title')}</h1>
          <p className="mt-2 text-[15px] text-ink-3">{t('subtitle')}</p>

          {!ready ? (
            <div className="mt-8 h-[180px]" aria-hidden="true" />
          ) : !school ? (
            /* ── The school ─────────────────────────────────────────────── */
            <div key="school" className="login-step mt-8 flex min-h-0 flex-col">
              <label htmlFor="school-search" className="visually-hidden">{t('schoolLabel')}</label>
              <div className="login-field flex h-[54px] items-center gap-3 rounded-[16px] bg-[var(--surface)] px-4 transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent-ink)]">
                <MagnifyingGlass size={19} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3" />
                <input
                  ref={searchInput}
                  id="school-search"
                  type="search"
                  role="combobox"
                  aria-expanded={results.length > 0}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
                  aria-describedby={statusId}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActive(0); typed(); }}
                  onKeyDown={onSearchKey}
                  {...focusOn('school')}
                  placeholder={t('schoolPlaceholder')}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="search"
                  maxLength={80}
                  suppressHydrationWarning
                  className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-medium text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                />
                {search.kind === 'loading' && <Spinner size={17} />}
                {query && search.kind !== 'loading' && (
                  <button type="button" onClick={() => { setQuery(''); searchInput.current?.focus(); }} aria-label={t('schoolClear')} className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-inset hover:text-ink">
                    <X size={15} weight="bold" aria-hidden="true" />
                  </button>
                )}
              </div>

              <p id={statusId} className="visually-hidden" role="status" aria-live="polite">{searchAnnouncement}</p>
              {searchMessage && (
                <p className={`mt-3 px-1 text-[13.5px] ${search.kind === 'error' ? 'text-[var(--blush-ink)]' : 'text-ink-3'}`}>{searchMessage}</p>
              )}

              {results.length > 0 && (
                <ul id={listId} role="listbox" aria-label={t('schoolLabel')} data-lenis-prevent className="login-results mt-2 max-h-[min(340px,44dvh)] min-h-0 overflow-y-auto overscroll-contain">
                  {results.map((s, i) => (
                    <li
                      key={`${s.loginName}-${s.server}`}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      onPointerMove={() => setActive(i)}
                      onClick={(e) => choose(s, e.currentTarget)}
                      className={`flex cursor-pointer items-center gap-3 rounded-[14px] px-2.5 py-2 transition-colors ${i === active ? 'bg-inset' : ''}`}
                      style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
                    >
                      <SchoolBadge school={s} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-ink"><Highlight text={s.name} query={query} /></span>
                        {s.address && <span className="block truncate text-[12.5px] text-ink-3"><Highlight text={s.address} query={query} /></span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {!query && lastSchool && (
                <button
                  type="button"
                  onClick={(e) => choose(lastSchool, e.currentTarget)}
                  className="group mt-4 flex items-center gap-3 rounded-[14px] px-2.5 py-2 text-left transition-colors hover:bg-inset"
                >
                  <SchoolBadge school={lastSchool} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold text-ink-3">{t('schoolLast')}</span>
                    <span className="block truncate text-[15px] font-semibold">{lastSchool.name}</span>
                  </span>
                  <ArrowRight size={16} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          ) : (
            /* ── The account ────────────────────────────────────────────── */
            <div key="account" className="login-step mt-8">
              <div className="flex items-center gap-3 rounded-[16px] bg-inset px-2.5 py-2" style={{ viewTransitionName: 'login-school' }}>
                <SchoolBadge school={school} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{school.name}</span>
                  <span className="flex min-w-0 items-center gap-1 text-[12px] text-ink-3">
                    <LockSimple size={11} weight="bold" aria-hidden="true" className="shrink-0" />
                    <span className="truncate">{t('serverShort', { server: school.server })}</span>
                  </span>
                </span>
                <button type="button" onClick={changeSchool} aria-label={t('schoolChange')} title={t('schoolChange')} className="grid size-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-[var(--surface)] hover:text-ink">
                  <X size={15} weight="bold" aria-hidden="true" />
                </button>
              </div>

              {!consentGiven && (
                <p role={cookieError ? 'alert' : undefined} className={`mt-3 rounded-[12px] px-3.5 py-2 text-[13px] leading-[1.45] transition-colors ${cookieError ? 'bg-[var(--butter)] text-[var(--butter-ink)]' : 'text-ink-3'}`}>
                  {cookieError ? t('cookieError') : t('cookieHint')}
                </p>
              )}

              {/* As on the school's own WebUntis page: Office 365 first, then the password. */}
              {options?.office365 && (
                <div className="mt-4 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={openOffice}
                    disabled={loading || autoFilling}
                    className="key key-lg w-full [--key-bg:var(--surface)] [--key-fg:var(--ink)] disabled:opacity-60"
                  >
                    <MicrosoftMark />
                    {t('office')}
                  </button>
                  {options.password && (
                    <p aria-hidden="true" className="flex items-center gap-3 text-[12.5px] font-semibold text-ink-3">
                      <span className="h-px flex-1 bg-[var(--line)]" />
                      {t('or')}
                      <span className="h-px flex-1 bg-[var(--line)]" />
                    </p>
                  )}
                </div>
              )}

              {options?.password !== false && (
              <form onSubmit={handleLogin} className={`${options?.office365 ? 'mt-2.5' : 'mt-4'} flex flex-col gap-2.5`} noValidate>
                <label htmlFor="login-user" className="visually-hidden">{t('username')}</label>
                <div className="login-field flex h-[54px] items-center gap-3 rounded-[16px] bg-[var(--surface)] px-4 transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent-ink)]">
                  <input
                    ref={userInput}
                    id="login-user"
                    type="text"
                    placeholder={t('username')}
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); typed(); }}
                    {...focusOn('user')}
                    autoCapitalize="none"
                    autoComplete="username"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={100}
                    suppressHydrationWarning
                    className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-medium outline-none placeholder:text-ink-3"
                  />
                </div>
                <label htmlFor="login-pass" className="visually-hidden">{t('password')}</label>
                <div className="login-field flex h-[54px] items-center gap-3 rounded-[16px] bg-[var(--surface)] px-4 transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent-ink)]">
                  <input
                    id="login-pass"
                    type={showPw ? 'text' : 'password'}
                    placeholder={t('password')}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); typed(); }}
                    {...focusOn('password')}
                    autoComplete="current-password"
                    maxLength={200}
                    suppressHydrationWarning
                    className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-medium outline-none placeholder:text-ink-3"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? t('hidePassword') : t('showPassword')}
                    aria-pressed={showPw}
                    className="grid size-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-inset hover:text-ink"
                  >
                    {showPw ? <EyeSlash size={17} weight="bold" aria-hidden="true" /> : <Eye size={17} weight="bold" aria-hidden="true" />}
                  </button>
                </div>

                {error && (
                  <p role="alert" className="px-1 text-[13.5px] font-medium leading-[1.45] text-[var(--blush-ink)]">{error}</p>
                )}

                <button type="submit" disabled={loading || autoFilling} className="key key-lg key-indigo mt-2 w-full disabled:opacity-60">
                  {loading || autoFilling ? (
                    <><Spinner size={18} /><span>{loadingMsg || t('loggingIn')}</span></>
                  ) : (
                    <>{t('login')}<span aria-hidden="true" className="key-arrow">→</span></>
                  )}
                </button>
                <button type="button" onClick={() => setForgotOpen(true)} className="mt-1 self-center rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink-3 transition-colors hover:text-ink">
                  {ta('forgot')}
                </button>
              </form>
              )}

              <Sheet open={forgotOpen} onClose={() => setForgotOpen(false)} title={ta('resetTitle')} description={ta('resetLead')} closeLabel={ta('close')}>
                <div className="pb-2">
                  <ForgotPasswordForm initialUsername={username} school={school} />
                </div>
              </Sheet>

              {options?.office365 && (
                <Sheet open={officeOpen} onClose={() => setOfficeOpen(false)} title={t('office')} description={t('officeLead')} closeLabel={ta('close')}>
                  <OfficeSignIn
                    key={`${school.server}/${school.loginName}`}
                    school={school}
                    initialUser={username.trim()}
                    initialKey={looksLikeAppKey(password) ? password.trim() : ''}
                    busy={loading}
                    busyLabel={loadingMsg || t('loggingIn')}
                    error={officeError}
                    onSubmit={handleOffice}
                    onInvalid={setOfficeError}
                  />
                </Sheet>
              )}
            </div>
          )}
        </section>

        {/* The fine print, in one line: age, and the privacy policy where the data is entered (GDPR Art. 13). */}
        <footer className="mx-auto flex w-full max-w-[520px] shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-4 text-[12px] text-ink-3">
          <span>{t('ageShort')}</span>
          <Link href={localize('/legal/datenschutz')} className="font-semibold hover:text-ink">{t('privacyLink')}</Link>
          <Link href={localize('/legal/impressum')} className="font-semibold hover:text-ink">{t('imprint')}</Link>
          <Link href={localize('/legal/nutzungsbedingungen')} className="font-semibold hover:text-ink">{t('terms')}</Link>
        </footer>
      </main>
      </div>
      </div>
    </div>
  );
}
