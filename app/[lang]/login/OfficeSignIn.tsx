'use client';

import { useState, type ClipboardEvent, type FormEvent } from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { FormStatus, PasswordField, TextField } from '@/components/ui/Field';
import Spinner from '@/components/ui/Spinner';
import { loginDict } from '@/lib/i18n/dictionaries/login';
import { normaliseAppKey, parseAppAccess, webuntisLoginUrl, webuntisProfileUrl } from '@/lib/app-access';
import { useT } from '@/providers/LocaleProvider';

type School = { loginName: string; server: string };

/** Microsoft's four squares, the mark of every "sign in with Microsoft" button. */
export function MicrosoftMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" aria-hidden="true" className="shrink-0">
      <rect x="0" y="0" width="10" height="10" fill="#F25022" />
      <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
      <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
      <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-inset text-[12px] font-bold text-ink-2">{n}</span>
      <div className="min-w-0 flex-1 text-[14.5px] leading-[1.5] text-ink">{children}</div>
    </li>
  );
}

function OutLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent-ink underline-offset-4 hover:underline">
      {children}
      <ArrowSquareOut size={14} weight="bold" aria-hidden="true" />
    </a>
  );
}

// Office 365 schools: WebUntis signs their people in through Microsoft, which
// only WebUntis itself can complete. POKYH signs in with the app key WebUntis
// shows each account instead (lib/app-access.ts): the steps to it, with links
// into the school's own WebUntis, then user and key.
export default function OfficeSignIn({
  school,
  initialUser = '',
  initialKey = '',
  busy,
  busyLabel,
  error,
  onSubmit,
  onInvalid,
}: {
  school: School;
  initialUser?: string;
  initialKey?: string;
  busy: boolean;
  busyLabel: string;
  error: string;
  onSubmit: (user: string, key: string) => void;
  /** A problem with what was typed, said in the form. */
  onInvalid: (message: string) => void;
}) {
  const t = useT(loginDict);
  const [user, setUser] = useState(initialUser);
  const [key, setKey] = useState(initialKey);

  // WebUntis' table copied whole (or the QR code's link) fills both fields.
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = parseAppAccess(e.clipboardData.getData('text'));
    if (!pasted.key) return;
    e.preventDefault();
    setKey(pasted.key);
    if (pasted.user) setUser(pasted.user);
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!user.trim() || !key.trim()) return onInvalid(t('errKeyMissing'));
    const normalised = normaliseAppKey(key);
    if (!normalised) return onInvalid(t('errKeyInvalid'));
    onSubmit(user.trim(), normalised);
  }

  return (
    <div className="flex flex-col gap-6 pb-2">
      <ol className="flex flex-col gap-4">
        <Step n={1}>
          <p>{t('officeStep1')}</p>
          <OutLink href={webuntisLoginUrl(school)}>{t('officeOpenLogin')}</OutLink>
        </Step>
        <Step n={2}>
          <p>{t('officeStep2')}</p>
          <OutLink href={webuntisProfileUrl(school)}>{t('officeOpenProfile')}</OutLink>
          <p className="mt-1.5 text-[13px] text-ink-3">{t('officeAdmin')}</p>
        </Step>
        <Step n={3}>
          <p>{t('officeStep3')}</p>
        </Step>
      </ol>

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField
          label={t('officeUser')}
          value={user}
          onChange={(e) => setUser(e.target.value)}
          onPaste={onPaste}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={100}
        />
        <PasswordField
          label={t('officeKey')}
          showLabel={t('showPassword')}
          hideLabel={t('hidePassword')}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onPaste={onPaste}
          autoComplete="current-password"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={200}
        />
        <p className="-mt-2 text-[13px] text-ink-3">{t('officeKeyHint')}</p>
        {error && <FormStatus kind="error">{error}</FormStatus>}
        <button type="submit" disabled={busy} className="key key-lg key-indigo w-full disabled:opacity-60">
          {busy ? <><Spinner size={18} /><span>{busyLabel}</span></> : <>{t('login')}<span aria-hidden="true" className="key-arrow">→</span></>}
        </button>
      </form>
    </div>
  );
}
