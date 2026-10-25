'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { AndroidLogo, ArrowClockwise, ArrowUpRight, DeviceMobile } from '@phosphor-icons/react';
import Spinner from '@/components/ui/Spinner';
import { pollQrSignIn, startQrSignIn } from '@/lib/api';
import type { SignInAnswer } from '@/lib/backend';
import { useT } from '@/providers/LocaleProvider';
import { loginDict } from '@/lib/i18n/dictionaries/login';
import { REPO_URLS } from '@/lib/site-links';

// How often the website asks whether the app has confirmed the code.
const POLL_MS = 2000;
// After "too many requests": asked again less often.
const POLL_SLOW_MS = 6000;

type Code = { poll: string; image: string };

/**
 * Signing the website in with the POKYH app (the API's services/qrLogin.ts):
 * a QR code the app scans in "Am Computer anmelden". The page asks every two
 * seconds whether the app confirmed it; a code that ran out (two minutes) is
 * replaced by a new one at once. Accounts with two-factor sign-in are asked
 * for the authenticator app's code only when the app's own WebUntis session
 * could not be taken over.
 */
export default function QrSignIn({ onSignedIn, describeError }: {
  onSignedIn: (answer: SignInAnswer) => void;
  /** The sign-in page's words for an error code of the sign-in. */
  describeError: (code: string | undefined) => string;
}) {
  const t = useT(loginDict);
  const [code, setCode] = useState<Code | 'loading' | 'failed'>('loading');
  // The code the app confirmed, for an account that needs the authenticator app's code too.
  const [needsCode, setNeedsCode] = useState(false);
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [round, setRound] = useState(0);
  const codeInput = useRef<HTMLInputElement>(null);

  // A new code: on opening, after one ran out, and on "Neuer Code".
  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      startQrSignIn()
        .then((r) => {
          if (!alive) return;
          // The image of the API's own SVG; as an image it cannot run anything.
          setCode({ poll: r.poll, image: `data:image/svg+xml;base64,${window.btoa(r.qrSvg)}` });
        })
        .catch(() => { if (alive) setCode('failed'); });
    }, 0);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [round]);

  const renew = () => {
    setCode('loading');
    setNeedsCode(false);
    setDigits('');
    setRound((n) => n + 1);
  };

  // What an answer of the API means for the page; true while it is still worth asking.
  const answered = (status: number, body: Record<string, unknown>): boolean => {
    if (body.ok === true && (body.token || body.user)) {
      onSignedIn(body as SignInAnswer);
      return false;
    }
    if (body.code === 'two_factor_required') {
      setNeedsCode(true);
      setError('');
      return false;
    }
    if (body.code === 'two_factor_invalid') {
      setError(t('errCodeWrong'));
      setDigits('');
      return false;
    }
    if (status === 410) {
      if (body.code === 'session_gone') setNotice(t('qrSessionGone'));
      renew();
      return false;
    }
    if (body.status === 'pending' || status === 429 || status >= 500) return true;
    // Approved, but the sign-in itself failed (wrong password kept in the app, WebUntis refusing…).
    setError(describeError(typeof body.code === 'string' ? body.code : undefined));
    return false;
  };

  const onAnswer = useEffectEvent((status: number, body: Record<string, unknown>) => answered(status, body));

  useEffect(() => {
    if (typeof code !== 'object' || needsCode || error) return;
    let alive = true;
    let timer = 0;
    const ask = async () => {
      const r = await pollQrSignIn(code.poll).catch(() => null);
      if (!alive) return;
      // Offline for a moment: simply asked again.
      if (!r || onAnswer(r.status, r.body)) timer = window.setTimeout(ask, r?.status === 429 ? POLL_SLOW_MS : POLL_MS);
    };
    timer = window.setTimeout(ask, POLL_MS);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [code, needsCode, error]);

  useEffect(() => {
    if (needsCode) codeInput.current?.focus({ preventScroll: true });
  }, [needsCode]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (typeof code !== 'object' || busy) return;
    const token = digits.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(token)) {
      setError(t('errCodeFormat'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const r = await pollQrSignIn(code.poll, token);
      answered(r.status, r.body);
    } catch {
      setError(t('errNetwork'));
    } finally {
      setBusy(false);
    }
  }

  if (needsCode) {
    return (
      <form onSubmit={sendCode} className="flex flex-col gap-3 pb-2" noValidate>
        <div>
          <p className="text-[17px] font-bold tracking-[-0.015em]">{t('codeTitle')}</p>
          <p className="mt-1 text-[14px] leading-[1.5] text-ink-2">{t('codeHint')}</p>
        </div>
        <label htmlFor="qr-code" className="visually-hidden">{t('codeLabel')}</label>
        <div className="login-field flex h-[54px] items-center gap-3 rounded-[16px] bg-inset px-4 transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent-ink)]">
          <input
            ref={codeInput}
            id="qr-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123 456"
            value={digits}
            onChange={(e) => setDigits(e.target.value.replace(/[^\d ]/g, '').slice(0, 7))}
            maxLength={7}
            className="h-full min-w-0 flex-1 bg-transparent text-[20px] font-semibold tracking-[0.18em] outline-none placeholder:text-ink-3 placeholder:tracking-[0.18em]"
          />
        </div>
        {error && <p role="alert" className="px-1 text-[13.5px] font-medium leading-[1.45] text-[var(--blush-ink)]">{error}</p>}
        <button type="submit" disabled={busy} className="key key-lg key-indigo mt-1 w-full disabled:opacity-60">
          {busy ? <><Spinner size={18} /><span>{t('loggingIn')}</span></> : <>{t('login')}<span aria-hidden="true" className="key-arrow">→</span></>}
        </button>
        <button type="button" onClick={renew} className="self-center rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink-3 transition-colors hover:text-ink">
          {t('qrRenew')}
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 pb-2">
      <ol className="w-full list-decimal space-y-1.5 rounded-[18px] bg-inset py-3.5 pl-9 pr-4 text-[14px] leading-[1.5] text-ink-2 marker:font-bold marker:text-ink">
        <li>{t('qrStep1')}</li>
        <li>{t('qrStep2')}</li>
        <li>{t('qrStep3')}</li>
      </ol>

      {/* The code stays black on white in both themes: scanners need the contrast. */}
      <div className="grid size-[232px] place-items-center rounded-[22px] bg-white p-3 shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
        {code === 'loading' ? (
          <Spinner size={24} />
        ) : code === 'failed' ? (
          <span className="px-4 text-center text-[13.5px] font-semibold text-neutral-700">{t('qrError')}</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise
          <img src={code.image} alt={t('qrAlt')} width={208} height={208} className="size-[208px] [image-rendering:pixelated]" />
        )}
      </div>

      {error ? (
        <p role="alert" className="text-center text-[13.5px] font-medium leading-[1.45] text-[var(--blush-ink)]">{error}</p>
      ) : notice ? (
        <p role="status" className="text-center text-[13.5px] font-medium leading-[1.45] text-[var(--butter-ink)]">{notice}</p>
      ) : (
        <p role="status" className="flex items-center gap-2 text-[13.5px] font-semibold text-ink-3">
          {typeof code === 'object' && <DeviceMobile size={16} weight="bold" aria-hidden="true" />}
          {typeof code === 'object' ? t('qrWaiting') : ''}
        </p>
      )}

      {(code === 'failed' || error) && (
        <button type="button" onClick={() => { setError(''); setNotice(''); renew(); }} className="key w-full [--key-bg:var(--inset)] [--key-fg:var(--ink)]">
          <ArrowClockwise size={17} weight="bold" aria-hidden="true" />
          {t('qrRenew')}
        </button>
      )}

      {/* Without the app there is nothing to scan with: where to get it. */}
      <div className="flex w-full flex-col items-center gap-2 border-t border-[var(--line)] pt-4">
        <p className="text-[13px] font-semibold text-ink-3">{t('qrNoApp')}</p>
        <a
          href={REPO_URLS.androidReleases}
          target="_blank"
          rel="noopener noreferrer"
          className="key w-full [--key-bg:var(--inset)] [--key-fg:var(--ink)]"
        >
          <AndroidLogo size={18} weight="bold" aria-hidden="true" />
          {t('qrGetApp')}
          <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
