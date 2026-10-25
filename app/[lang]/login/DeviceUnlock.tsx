'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Fingerprint, LockKey, ScanSmiley } from '@phosphor-icons/react';
import Spinner from '@/components/ui/Spinner';
import type { SignInAnswer } from '@/lib/backend';
import {
  deviceUnlockSupported,
  isFresh,
  unlockChallenge,
  unlockPlatform,
  unlockWithCode,
  unlockWithDevice,
  type UnlockChallenge,
  type UnlockPlatform,
  type UnlockResult,
} from '@/lib/device-unlock';
import { loginDict, type LoginKey } from '@/lib/i18n/dictionaries/login';
import { useT } from '@/providers/LocaleProvider';

const LABEL: Record<UnlockPlatform, LoginKey> = { ios: 'unlockIos', android: 'unlockAndroid', other: 'unlockOther' };
const ICON = { ios: ScanSmiley, android: Fingerprint, other: LockKey } as const;

const noop = () => () => {};

/**
 * Signing in with the device's own lock (lib/device-unlock.ts), above the
 * password form: only in the installed website, and only where it was turned
 * on in the settings. The challenge is asked for before the tap and kept
 * fresh, as iOS starts Face ID only straight from a tap. Accounts with
 * two-factor sign-in then type the authenticator app's code here.
 */
export default function DeviceUnlock({ consentGiven, onSignedIn, onStale, describeError }: {
  consentGiven: boolean;
  onSignedIn: (answer: SignInAnswer) => void;
  /** WebUntis no longer takes the saved password: the form, with the user name filled in. */
  onStale: (username: string) => void;
  /** The sign-in page's words for an error code of the sign-in. */
  describeError: (code: string | undefined) => string;
}) {
  const t = useT(loginDict);
  const platform = useSyncExternalStore(noop, unlockPlatform, () => 'other' as const);
  const [challenge, setChallenge] = useState<UnlockChallenge | null>(null);
  // Gone for this visit: none on the device, or WebUntis refused the saved password.
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const codeInput = useRef<HTMLInputElement>(null);
  const latest = useRef<UnlockChallenge | null>(null);

  // The challenge, asked ahead and again before it runs out (also when the
  // phone comes back from the background, where timers sleep).
  useEffect(() => {
    let live = true;
    let timer: number | undefined;
    const load = async () => {
      window.clearTimeout(timer);
      if (!(await deviceUnlockSupported())) return;
      const next = await unlockChallenge();
      if (!live) return;
      latest.current = next;
      setChallenge(next);
      if (next) timer = window.setTimeout(load, 3 * 60_000);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && latest.current && !isFresh(latest.current)) void load();
    };
    void load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      live = false;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    if (ticket) codeInput.current?.focus({ preventScroll: true });
  }, [ticket]);

  function settle(result: UnlockResult, refetched = false) {
    setBusy(false);
    switch (result.kind) {
      case 'signed-in':
        setBusy(true);
        onSignedIn(result.answer);
        return;
      case 'code':
        setTicket(result.ticket);
        setCode('');
        setError(result.wrong ? t('errCodeWrong') : '');
        return;
      case 'stale':
        setOver(true);
        setError(t('unlockStale'));
        onStale(result.username);
        return;
      case 'none':
        setOver(true);
        setError(t('unlockGone'));
        return;
      case 'cancelled':
        // iOS refuses Face ID that does not follow a tap straight away, as after asking for a new challenge.
        setError(refetched ? t('unlockTapAgain') : '');
        return;
      default:
        setError(result.code === 'network' ? t('errNetwork') : result.code ? describeError(result.code) : t('unlockFailed'));
    }
  }

  async function unlock() {
    if (!consentGiven) {
      setError(t('cookieError'));
      return;
    }
    setBusy(true);
    setError('');
    const held = latest.current;
    const refetched = !held || !isFresh(held);
    const current = refetched ? await unlockChallenge() : held;
    // Used once: the next tap needs a new one.
    latest.current = null;
    if (!current) {
      setChallenge(null);
      settle(navigator.onLine === false ? { kind: 'failed', code: 'network' } : { kind: 'none' });
      return;
    }
    const result = await unlockWithDevice(current);
    if (result.kind !== 'signed-in') void unlockChallenge().then((next) => { latest.current = next; if (next) setChallenge(next); });
    settle(result, refetched);
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const digits = code.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(digits)) {
      setError(t('errCodeFormat'));
      return;
    }
    if (!ticket) return;
    setBusy(true);
    setError('');
    settle(await unlockWithCode(ticket, digits));
  }

  if (!challenge && !over) return null;
  const Icon = ICON[platform];

  return (
    <div className="login-step mt-8 flex flex-col gap-2.5">
      {over ? null : ticket ? (
        <form onSubmit={submitCode} className="flex flex-col gap-2.5" noValidate>
          <div className="px-1">
            <p className="text-[17px] font-bold tracking-[-0.015em]">{t('codeTitle')}</p>
            <p className="mt-1 text-[14px] leading-[1.5] text-ink-2">{t('codeHint')}</p>
          </div>
          <label htmlFor="unlock-code" className="visually-hidden">{t('codeLabel')}</label>
          <div className="login-field flex h-[54px] items-center gap-3 rounded-[16px] bg-[var(--surface)] px-4 transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent-ink)]">
            <input
              ref={codeInput}
              id="unlock-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              placeholder="123 456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, '').slice(0, 7))}
              maxLength={7}
              className="h-full min-w-0 flex-1 bg-transparent text-[20px] font-semibold tracking-[0.18em] outline-none placeholder:text-ink-3 placeholder:tracking-[0.18em]"
            />
          </div>
          <button type="submit" disabled={busy} className="key key-lg key-indigo mt-2 w-full disabled:opacity-60">
            {busy ? <><Spinner size={18} /><span>{t('loggingIn')}</span></> : <>{t('login')}<span aria-hidden="true" className="key-arrow">→</span></>}
          </button>
        </form>
      ) : (
        <>
          <button type="button" onClick={() => void unlock()} disabled={busy} className="key key-lg key-indigo w-full disabled:opacity-60">
            {busy ? <Spinner size={18} /> : <Icon size={21} weight="bold" aria-hidden="true" />}
            <span>{busy ? t('loggingIn') : t(LABEL[platform])}</span>
          </button>
          {challenge && <p className="px-1 text-center text-[13px] font-medium text-ink-3">{t('unlockAs', { name: challenge.username })}</p>}
        </>
      )}

      {error && (
        <p role="alert" className="px-1 text-[13.5px] font-medium leading-[1.45] text-[var(--blush-ink)]">{error}</p>
      )}

      {!over && (
        <p aria-hidden="true" className="-mb-2 mt-4 flex items-center gap-3 text-[12.5px] font-semibold text-ink-3">
          <span className="h-px flex-1 bg-[var(--line)]" />
          {t('or')}
          <span className="h-px flex-1 bg-[var(--line)]" />
        </p>
      )}
    </div>
  );
}
