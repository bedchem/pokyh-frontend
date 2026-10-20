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
import { forgetSchoolChoice, readSchoolChoice, saveSchoolChoice, type SchoolChoice } from '@/lib/school-choice';
import { prefersReducedMotion } from '@/lib/motion';
import { closeView, openView, useRoomView } from '@/components/room/route';
import { HallwayScene, MascotBadge, type MascotEvent, type MascotState } from './Hallway';

// Room 2B, behind the hallway's door: a little secret classroom, fetched only
// when someone goes near the door (components/room). Its first frame is the
// same warm wall the door opens onto.
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
// school flies from the list into its place above the form.
function transition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || prefersReducedMotion()) { update(); return; }
  doc.startViewTransition(() => { flushSync(update); });
}

/** The same, for a change that lands a moment later (the browser going back in its history). */
function transitionUntil(update: () => Promise<void>) {
  const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => unknown };
  if (!doc.startViewTransition || prefersReducedMotion()) { void update(); return; }
  doc.startViewTransition(update);
}

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
};

/** Search results for a query; each answer is kept with the query it belongs to. */
function useSchoolSearch(query: string): SearchState {
  const q = query.trim();
  const [answer, setAnswer] = useState<{ q: string; state: SearchState } | null>(null);
  useEffect(() => {
    if (q.length < 3) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/webuntis/schools?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
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
  // What the mascot answers: the focused field, each key, and events.
  const [focus, setFocus] = useState<MascotState['focus']>(null);
  const [keys, setKeys] = useState(0);
  const [event, setEvent] = useState<MascotEvent>(null);
  const typed = () => setKeys((n) => n + 1);
  const happen = (kind: NonNullable<MascotEvent>['kind']) => setEvent({ kind, n: Date.now() });
  const autofill = () => setEvent(autofilled);
  const focusOn = (field: NonNullable<MascotState['focus']>) => ({
    onFocus: () => setFocus(field),
    onBlur: () => setFocus((f) => (f === field ? null : f)),
    // Autofill styles a field, which starts an animation (globals.css).
    onAnimationStart: (e: React.AnimationEvent<HTMLInputElement>) => { if (e.animationName === 'login-autofill') autofill(); },
  });

  // Room 2B: open while the address says so (#2b…); the door shuts behind
  // whoever comes back out.
  const view = useRoomView();
  const inRoom = view !== null;
  const [returns, setReturns] = useState(0);
  const [wasInRoom, setWasInRoom] = useState(inRoom);
  if (wasInRoom !== inRoom) {
    setWasInRoom(inRoom);
    if (!inRoom) setReturns((n) => n + 1);
  }
  const fetchRoom = useCallback(() => { void loadRoom(); }, []);
  const enterRoom = useCallback(() => {
    void loadRoom().then(() => transition(() => openView('room')), () => openView('room'));
  }, []);
  const leaveRoom = useCallback(() => transitionUntil(() => closeView(null)), []);

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

    // The notice was shown next to the form; recorded right after signing in (PrivacyGate).
    rememberPendingAck();
    setLoading(true);
    setLoadingMsg(t('loggingIn'));
    setError('');

    // Read at the moment of signing in (the address is final by then), not
    // with useSearchParams: that would keep the whole form out of the page's
    // prerendered HTML, which search engines and slow phones see first.
    const raw = new URLSearchParams(window.location.search).get('next') ?? '';
    const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : localize('/home');

    try {
      const untisRes = await fetch('/api/webuntis/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          school: { loginName: school.loginName, server: school.server, name: school.name },
        }),
        credentials: 'same-origin',
      });
      const untisData = (await untisRes.json().catch(() => ({}))) as { ok?: boolean; code?: string };

      if (untisRes.ok && untisData.ok) {
        setLoadingMsg(t('almostDone'));
        happen('success');
        if (isPasswordCredentialSupported() && !hasDeclinedPasskey()) {
          storePasswordCredential(username.trim(), password).catch(() => {});
        }
        window.location.replace(next);
        return;
      }
      if (untisData.code === 'school_invalid') {
        forgetSchoolChoice();
        setRemembered(null);
        setPicked(null);
      }

      // Wrong WebUntis credentials may still be a POKYH-only account.
      if (untisData.code === 'bad_credentials' || untisData.code === 'refused') {
        setLoadingMsg(t('checkingPokyh'));
        const pokyhRes = await fetch('/api/auth/pokyh-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password }),
          credentials: 'same-origin',
        });
        const pokyhData = (await pokyhRes.json().catch(() => ({}))) as { ok?: boolean };
        if (pokyhRes.ok && pokyhData.ok) {
          setLoadingMsg(t('almostDone'));
          happen('success');
          window.location.replace(next);
          return;
        }
      }

      const key = untisData.code ? ERROR_KEYS[untisData.code] : undefined;
      setError(t(key ?? 'errFailed'));
      happen('error');
    } catch {
      setError(t('errNetwork'));
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
    <div className="site login-page fixed inset-0 flex flex-col overflow-hidden">
      {/* The site's own bar on top, fixed; the room below keeps it clear. */}
      <SiteHeader />
      <div aria-hidden="true" className="h-[72px] shrink-0 md:h-[84px]" style={{ marginTop: 'var(--safe-top)' }} />

      {/* Room 2B: the sign-in stays as it was beneath, hidden, until you come back. */}
      {inRoom && (
        <div className="flex min-h-0 flex-1 px-3 pb-3 lg:px-4 lg:pb-4">
          <div className="room-stage relative min-w-0 flex-1 overflow-hidden rounded-[28px] lg:rounded-[36px]" style={{ viewTransitionName: 'login-stage' }}>
            <Classroom view={view} onLeave={leaveRoom} />
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1" hidden={inRoom}>
      {/* Desktops: the mascot in its hallway (with the door of room 2B) beside the form; phones get it small above the form, without the door. */}
      <aside className="hidden px-4 pb-4 lg:block lg:w-[54%] xl:w-[57%]">
        <HallwayScene state={mascot} onDoor={enterRoom} onDoorIntent={fetchRoom} returns={returns} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">

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
              <div className="login-field flex h-[54px] items-center gap-3 rounded-[16px] bg-[var(--surface)] px-4 shadow-[0_0_0_1px_var(--line)] transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent-ink)]">
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

              <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-2.5" noValidate>
                <label htmlFor="login-user" className="visually-hidden">{t('username')}</label>
                <div className="login-field flex h-[54px] items-center gap-3 rounded-[16px] bg-[var(--surface)] px-4 shadow-[0_0_0_1px_var(--line)] transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent-ink)]">
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
                <div className="login-field flex h-[54px] items-center gap-3 rounded-[16px] bg-[var(--surface)] px-4 shadow-[0_0_0_1px_var(--line)] transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent-ink)]">
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

              <Sheet open={forgotOpen} onClose={() => setForgotOpen(false)} title={ta('resetTitle')} description={ta('resetLead')} closeLabel={ta('close')}>
                <div className="pb-2">
                  <ForgotPasswordForm initialUsername={username} school={school} />
                </div>
              </Sheet>
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
