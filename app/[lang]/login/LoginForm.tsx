'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeSlash, LockSimple, MagnifyingGlass, MapPin, ShieldCheck, User, X } from '@phosphor-icons/react';
import Sheet from '@/components/ui/Sheet';
import Spinner from '@/components/ui/Spinner';
import ForgotPasswordForm from '@/components/account/ForgotPasswordForm';
import PrivacyChoices from '@/components/PrivacyChoices';
import LanguageButton from '@/components/site/LanguageButton';
import { ThemeButton } from '@/components/site/ThemeToggle';
import { untisActionsDict } from '@/lib/i18n/dictionaries/untisActions';
import { loginDict, type LoginKey } from '@/lib/i18n/dictionaries/login';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import {
  hasDeclinedPasskey,
  saveSessionCredentials,
  storePasswordCredential,
  getPasswordCredential,
  isPasswordCredentialSupported,
} from '@/lib/passkey';
import { readCookieChoice, COOKIE_CONSENT_EVENT } from '@/lib/cookie-consent';
import { rememberPendingAck } from '@/lib/privacy-consent';
import { forgetSchoolChoice, readSchoolChoice, saveSchoolChoice, type SchoolChoice } from '@/lib/school-choice';
import LoginArt from './LoginArt';

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
    <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-[14px] text-[14px] font-extrabold tracking-[-0.02em] ${schoolTone(school.loginName)} ${className}`}>
      {initials(school.name)}
    </span>
  );
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
  const params = useSearchParams();
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
      .then((cred) => { if (live && cred) { setUsername(cred.username); setPassword(cred.password); } })
      .catch(() => {})
      .finally(() => { clearTimeout(started); if (live) setAutoFilling(false); });
    return () => { live = false; };
  }, []);

  // Focus follows the step.
  useEffect(() => {
    if (!ready) return;
    const el = school ? userInput.current : searchInput.current;
    // Not on touch screens: the keyboard would cover the page on arrival.
    if (el && window.matchMedia('(pointer: fine)').matches) el.focus({ preventScroll: true });
  }, [ready, school]);

  const results = search.kind === 'done' ? search.schools : [];
  const active = Math.min(activeRaw, Math.max(0, results.length - 1));

  const pick = useCallback((s: SchoolChoice) => {
    setPicked(s);
    setError('');
    saveSchoolChoice(s);
    setRemembered(s);
  }, []);

  const changeSchool = () => {
    setPicked(null);
    setQuery('');
    setActive(0);
    setError('');
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(results[active]); }
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

    const raw = params.get('next') ?? '';
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
        saveSessionCredentials(username.trim(), password, { loginName: school.loginName, server: school.server, name: school.name });
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
          window.location.replace(next);
          return;
        }
      }

      const key = untisData.code ? ERROR_KEYS[untisData.code] : undefined;
      setError(t(key ?? 'errFailed'));
    } catch {
      setError(t('errNetwork'));
    }
    setLoading(false);
    setLoadingMsg('');
  }

  const searchMessage =
    search.kind === 'short' ? t('schoolShort')
    : search.kind === 'loading' ? t('schoolSearching')
    : search.kind === 'error' ? t(search.reason === 'too_many' ? 'schoolTooMany' : search.reason === 'rate' ? 'schoolRate' : 'schoolError')
    : search.kind === 'done' && !results.length ? t('schoolNone')
    : search.kind === 'done' ? t('schoolResults', { n: results.length })
    : '';

  const step = school ? 2 : 1;

  return (
    // A fixed screen: the page itself never scrolls; on very small screens or
    // with the keyboard open only the form column does.
    <div className="site login-page fixed inset-0 flex flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center justify-between px-4 md:h-20 md:px-8" style={{ paddingTop: 'var(--safe-top)' }}>
        <Link href={localize('/')} aria-label={`POKYH, ${t('home')}`} className="group flex items-center gap-3 rounded-xl">
          <Image src="/POKYH_Logo.png" alt="" width={44} height={44} loading="eager" fetchPriority="high" className="size-9 md:size-10" />
          <span className="hidden items-center gap-1.5 text-[14px] font-semibold text-ink-2 transition-colors group-hover:text-ink sm:flex">
            <ArrowLeft size={14} weight="bold" aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-0.5" />
            {t('home')}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <LanguageButton />
          <ThemeButton className="size-10 rounded-full opacity-80 transition-opacity hover:opacity-100" />
        </div>
      </header>

      <main id="main" className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-6 px-4 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 lg:pb-8" style={{ paddingBottom: 'max(16px, var(--safe-bottom))' }}>
        {/* The panel: the school day, what POKYH is, and the promises that matter now */}
        <aside className="login-panel relative hidden min-h-0 overflow-hidden rounded-[32px] bg-[var(--indigo)] p-10 text-white lg:flex lg:flex-col lg:justify-end xl:p-12">
          <LoginArt />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[var(--indigo)] from-55% to-transparent" />
          <h2 className="font-display relative max-w-[11ch] text-[clamp(40px,4.2vw,72px)] leading-[0.94]">{t('panelTitle')}</h2>
          <p className="relative mt-4 max-w-[42ch] text-[16px] leading-[1.55] text-white/80 xl:text-[17px]">{t('panelText')}</p>
          <ul className="relative mt-6 flex flex-col gap-2.5 text-[14px] font-medium text-white/85 xl:text-[15px]">
            {(['trust1', 'trust2', 'trust3'] as const).map((k) => (
              <li key={k} className="flex items-start gap-3">
                <ShieldCheck size={19} weight="fill" aria-hidden="true" className="mt-px shrink-0 text-[var(--glow)]" />
                {t(k)}
              </li>
            ))}
          </ul>
        </aside>

        <section aria-labelledby="login-title" className="flex min-h-0 flex-col">
          <div data-lenis-prevent className="login-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col py-2 lg:justify-center">
              {/* Phones and tablets: the panel as a narrow band (only while choosing the school) */}
              {step === 1 && (
                <div className="relative mb-6 h-[88px] shrink-0 overflow-hidden rounded-[24px] bg-[var(--indigo)] px-5 py-4 text-white lg:hidden [@media(max-height:640px)]:hidden">
                  <LoginArt compact />
                  <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[64%] bg-gradient-to-r from-[var(--indigo)] from-60% to-transparent" />
                  <p className="font-display relative z-[2] max-w-[10ch] text-[22px] leading-[1] sm:text-[26px]">{t('panelTitle')}</p>
                </div>
              )}

              {/* Progress through the two steps */}
              <ol className="mb-6 grid shrink-0 grid-cols-2 gap-2" aria-label={`${t('step1')}, ${t('step2')}`}>
                {[t('step1'), t('step2')].map((label, i) => {
                  const n = i + 1;
                  return (
                    <li key={label} aria-current={n === step ? 'step' : undefined}>
                      <span aria-hidden="true" className={`block h-1 rounded-full transition-colors duration-500 ${n <= step ? 'bg-[var(--indigo)]' : 'bg-line'}`} />
                      <span className={`mt-2 block text-[12.5px] font-bold ${n <= step ? 'text-ink' : 'text-ink-3'}`}>{n}. {label}</span>
                    </li>
                  );
                })}
              </ol>

              {!ready ? (
                <div className="h-[320px]" aria-hidden="true" />
              ) : !school ? (
                /* ── Step 1: the school ─────────────────────────────────────── */
                <div key="school" className="login-step flex min-h-0 flex-col">
                  <h1 id="login-title" className="font-display text-[clamp(34px,4.4vw,56px)] leading-[0.96]">{t('schoolTitle')}</h1>
                  <p className="mt-3 max-w-[44ch] text-[15.5px] leading-[1.55] text-ink-2 md:text-[16.5px] [@media(max-height:700px)]:hidden">{t('schoolLead')}</p>

                  <label htmlFor="school-search" className="visually-hidden">{t('schoolLabel')}</label>
                  <div className="login-field mt-6 flex h-14 shrink-0 items-center gap-3 rounded-[18px] bg-[var(--surface)] px-4 shadow-[0_0_0_1.5px_var(--line)] transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent-ink)] md:h-[60px] md:px-5">
                    <MagnifyingGlass size={21} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3" />
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
                      onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                      onKeyDown={onSearchKey}
                      placeholder={t('schoolPlaceholder')}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      enterKeyHint="search"
                      maxLength={80}
                      suppressHydrationWarning
                      className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-medium text-ink outline-none placeholder:text-ink-3 md:text-[17px] [&::-webkit-search-cancel-button]:hidden"
                    />
                    {search.kind === 'loading' && <Spinner size={18} />}
                    {query && search.kind !== 'loading' && (
                      <button type="button" onClick={() => { setQuery(''); searchInput.current?.focus(); }} aria-label={t('schoolClear')} className="grid size-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-inset hover:text-ink">
                        <X size={16} weight="bold" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <p id={statusId} role="status" aria-live="polite" className={`mt-2.5 min-h-[20px] shrink-0 px-1 text-[13.5px] ${search.kind === 'error' ? 'text-[var(--blush-ink)]' : 'text-ink-3'}`}>
                    {searchMessage}
                  </p>

                  {results.length > 0 && (
                    <ul id={listId} role="listbox" aria-label={t('schoolLabel')} data-lenis-prevent className="login-results mt-1.5 max-h-[min(360px,42dvh)] min-h-0 overflow-y-auto overscroll-contain rounded-[20px] bg-[var(--surface)] p-1.5 shadow-[0_0_0_1px_var(--line)]">
                      {results.map((s, i) => (
                        <li
                          key={`${s.loginName}-${s.server}`}
                          id={`${listId}-${i}`}
                          role="option"
                          aria-selected={i === active}
                          onPointerMove={() => setActive(i)}
                          onClick={() => pick(s)}
                          className={`flex cursor-pointer items-center gap-3.5 rounded-[14px] px-3 py-2.5 transition-colors ${i === active ? 'bg-inset' : ''}`}
                          style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                        >
                          <SchoolBadge school={s} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15.5px] font-bold text-ink"><Highlight text={s.name} query={query} /></span>
                            {s.address && (
                              <span className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-ink-2">
                                <MapPin size={12} weight="bold" aria-hidden="true" className="shrink-0" />
                                <span className="truncate"><Highlight text={s.address} query={query} /></span>
                              </span>
                            )}
                          </span>
                          <ArrowRight size={17} weight="bold" aria-hidden="true" className={`shrink-0 text-ink-3 transition-transform duration-300 ${i === active ? 'translate-x-0.5 text-ink' : ''}`} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {!query && lastSchool && (
                    <div className="mt-2">
                      <p className="mb-2 px-1 text-[12.5px] font-semibold text-ink-3">{t('schoolLast')}</p>
                      <button type="button" onClick={() => pick(lastSchool)} className="flex w-full items-center gap-3.5 rounded-[18px] bg-[var(--surface)] px-3.5 py-3 text-left shadow-[0_0_0_1px_var(--line)] transition-[box-shadow,transform] hover:shadow-[0_0_0_1.5px_var(--ink-3)] active:scale-[0.99]">
                        <SchoolBadge school={lastSchool} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15.5px] font-bold">{lastSchool.name}</span>
                          <span className="block truncate text-[13px] text-ink-2">{lastSchool.address || lastSchool.server}</span>
                        </span>
                        <ArrowRight size={17} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Step 2: the account ────────────────────────────────────── */
                <div key="account" className="login-step">
                  <h1 id="login-title" className="font-display text-[clamp(34px,4.4vw,56px)] leading-[0.96]">{t('loginTitle')}</h1>
                  <p className="mt-3 text-[15.5px] leading-[1.55] text-ink-2 md:text-[16.5px] [@media(max-height:760px)]:hidden">{t('loginLead')}</p>

                  <div className="mt-5 flex items-center gap-3.5 rounded-[18px] bg-[var(--surface)] px-3.5 py-3 shadow-[0_0_0_1px_var(--line)]">
                    <SchoolBadge school={school} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15.5px] font-bold">{school.name}</span>
                      <span className="block truncate text-[13px] text-ink-2">{school.address || school.server}</span>
                    </span>
                    <button type="button" onClick={changeSchool} className="shrink-0 rounded-full px-3 py-2 text-[13.5px] font-semibold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-tint)]">
                      {t('schoolChange')}
                    </button>
                  </div>

                  {!consentGiven && (
                    <p role={cookieError ? 'alert' : undefined} className={`mt-4 rounded-[14px] px-4 py-2.5 text-[13.5px] leading-[1.5] transition-colors ${cookieError ? 'bg-[var(--butter)] text-[var(--butter-ink)]' : 'bg-inset text-ink-2'}`}>
                      {cookieError ? t('cookieError') : t('cookieHint')}
                    </p>
                  )}

                  <form onSubmit={handleLogin} className="mt-5 flex flex-col gap-3.5" noValidate>
                    <div>
                      <label htmlFor="login-user" className="mb-1.5 block px-1 text-[13.5px] font-semibold text-ink-2">{t('username')}</label>
                      <div className="login-field flex h-[52px] items-center gap-3 rounded-[16px] bg-[var(--surface)] px-4 shadow-[0_0_0_1.5px_var(--line)] transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent-ink)]">
                        <User size={18} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3" />
                        <input
                          ref={userInput}
                          id="login-user"
                          type="text"
                          placeholder={t('usernamePlaceholder')}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          autoCapitalize="none"
                          autoComplete="username"
                          autoCorrect="off"
                          spellCheck={false}
                          maxLength={100}
                          suppressHydrationWarning
                          className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-medium outline-none placeholder:text-ink-3"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between px-1">
                        <label htmlFor="login-pass" className="text-[13.5px] font-semibold text-ink-2">{t('password')}</label>
                        <button type="button" onClick={() => setForgotOpen(true)} className="text-[13px] font-semibold text-[var(--accent-ink)] underline-offset-4 hover:underline">
                          {ta('forgot')}
                        </button>
                      </div>
                      <div className="login-field flex h-[52px] items-center gap-3 rounded-[16px] bg-[var(--surface)] px-4 shadow-[0_0_0_1.5px_var(--line)] transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent-ink)]">
                        <LockSimple size={18} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3" />
                        <input
                          id="login-pass"
                          type={showPw ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          maxLength={200}
                          suppressHydrationWarning
                          className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-medium outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          aria-label={showPw ? t('hidePassword') : t('showPassword')}
                          aria-pressed={showPw}
                          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-inset hover:text-ink"
                        >
                          {showPw ? <EyeSlash size={18} weight="bold" aria-hidden="true" /> : <Eye size={18} weight="bold" aria-hidden="true" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <p role="alert" className="rounded-[14px] bg-[var(--blush)] px-4 py-2.5 text-[13.5px] font-medium leading-[1.5] text-[var(--blush-ink)]">
                        {error}
                      </p>
                    )}

                    <button type="submit" disabled={loading || autoFilling} className="key key-lg key-indigo mt-1 w-full disabled:opacity-60">
                      {loading || autoFilling ? (
                        <><Spinner size={18} /><span>{loadingMsg || t('loggingIn')}</span></>
                      ) : (
                        <>{t('login')}<span aria-hidden="true" className="key-arrow">→</span></>
                      )}
                    </button>
                  </form>

                  <div className="mt-5 flex flex-col gap-2 text-[12.5px] leading-[1.5] text-ink-2">
                    <p className="flex items-start gap-2">
                      <ShieldCheck size={15} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0 text-ink-3" />
                      <span className="min-w-0 [overflow-wrap:anywhere]">{t('serverHint', { server: school.server })}</span>
                    </p>
                    <PrivacyChoices />
                    <p className="text-ink-3">{t('ageNote')} {t('pokyhHint')}</p>
                  </div>

                  <Sheet open={forgotOpen} onClose={() => setForgotOpen(false)} title={ta('resetTitle')} description={ta('resetLead')} closeLabel={ta('close')}>
                    <div className="pb-2">
                      <ForgotPasswordForm initialUsername={username} school={school} />
                    </div>
                  </Sheet>
                </div>
              )}
            </div>
          </div>

          <nav aria-label={t('privacy')} className="mx-auto flex w-full max-w-[480px] shrink-0 flex-wrap items-center gap-x-4 gap-y-1 whitespace-nowrap pt-3 text-[12px] font-semibold text-ink-3 sm:gap-x-5 sm:text-[12.5px]">
            <Link href={localize('/legal?view=impressum')} className="hover:text-ink">{t('imprint')}</Link>
            <Link href={localize('/legal?view=datenschutz')} className="hover:text-ink">{t('privacy')}</Link>
            <Link href={localize('/legal?view=nutzungsbedingungen')} className="hover:text-ink">{t('terms')}</Link>
          </nav>
        </section>
      </main>
    </div>
  );
}
