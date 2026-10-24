'use client';

import { useState, type FormEvent } from 'react';
import { Check, Copy, ShieldCheck } from '@phosphor-icons/react';
import Sheet from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { FormStatus, TextField } from '@/components/ui/Field';
import { useT } from '@/providers/LocaleProvider';
import { securityDict } from '@/lib/i18n/dictionaries/security';
import { disableTwoFactor, enableTwoFactor, startTwoFactorSetup } from '@/lib/api';

// Two-factor sign-in for the WebUntis account, as WebUntis' own wizard sets
// it up: a short explanation, then the new secret as QR code (and as text to
// type), then the app's first code turns it on. Turning it off asks once.
// The secret lives only in this sheet while it is open.

type Step = 'intro' | 'scan' | 'done' | 'disable';

const groups = (secret: string) => secret.replace(/=+$/, '').match(/.{1,4}/g)?.join(' ') ?? secret;

export default function TwoFactorSheet({ mode, onClose, onChanged }: {
  /** null: closed. */
  mode: 'setup' | 'disable' | null;
  onClose: () => void;
  onChanged: (enabled: boolean) => void;
}) {
  const t = useT(securityDict);
  const [step, setStep] = useState<Step>('intro');
  const [setup, setSetup] = useState<{ secret: string; qrSvg: string | null } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Every opening starts afresh; a secret from before is forgotten.
  const [openedAs, setOpenedAs] = useState(mode);
  if (mode !== openedAs) {
    setOpenedAs(mode);
    if (mode) {
      setStep(mode === 'disable' ? 'disable' : 'intro');
      setSetup(null);
      setCode('');
      setError('');
      setCopied(false);
    }
  }

  async function begin() {
    setBusy(true);
    setError('');
    try {
      setSetup(await startTwoFactorSetup());
      setStep('scan');
    } catch (err) {
      setError(err instanceof Error && err.message && err.message !== 'session_expired' ? err.message : t('failed'));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    if (!setup || busy) return;
    const digits = code.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(digits)) {
      setError(t('tfCodeFormat'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await enableTwoFactor(setup.secret, digits);
      setSetup(null);
      setStep('done');
      onChanged(true);
    } catch (err) {
      setCode('');
      setError(err instanceof Error && err.message && err.message !== 'session_expired' ? err.message : t('failed'));
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setError('');
    try {
      await disableTwoFactor();
      onChanged(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message && err.message !== 'session_expired' ? err.message : t('failed'));
    } finally {
      setBusy(false);
    }
  }

  async function copySecret() {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* the key stays readable to copy by hand */ }
  }

  const title = step === 'disable' ? t('tfDisableTitle') : step === 'done' ? t('tfDoneTitle') : t('tfTitle');

  return (
    <Sheet open={mode !== null} onClose={onClose} title={title} closeLabel={t('close')}>
      <div className="flex flex-col gap-5 pb-4">
        {step === 'intro' && (
          <>
            <p className="text-[15px] leading-[1.6] text-ink-2">{t('tfIntro')}</p>
            <p className="text-[15px] leading-[1.6] text-ink-2">{t('tfApps')}</p>
            <p className="rounded-[14px] bg-inset px-4 py-3 text-[14px] leading-[1.55] text-ink-2">{t('tfRenewNote')}</p>
            {error && <FormStatus kind="error">{error}</FormStatus>}
            <Button onClick={() => void begin()} disabled={busy} className="self-start">
              {busy ? t('tfEnabling') : t('tfStart')}
            </Button>
          </>
        )}

        {step === 'scan' && setup && (
          <form onSubmit={confirm} className="flex flex-col gap-5" noValidate>
            <p className="text-[15px] leading-[1.6] text-ink-2">{t('tfScan')}</p>
            {setup.qrSvg && (
              // Drawn by the API from the code WebUntis made; dark on white so every camera reads it.
              <div
                className="mx-auto w-[208px] rounded-[18px] bg-white p-3 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
                role="img"
                aria-label={t('tfScan')}
                dangerouslySetInnerHTML={{ __html: setup.qrSvg }}
              />
            )}
            <div>
              <p className="text-[14px] text-ink-2">{t('tfManual')}</p>
              <div className="mt-2 flex items-center gap-2 rounded-[14px] bg-inset py-1.5 pl-4 pr-1.5">
                <code className="mono min-w-0 flex-1 break-all text-[15px] font-semibold tracking-[0.04em]">{groups(setup.secret)}</code>
                <Button size="sm" variant="quiet" onClick={() => void copySecret()} className="!bg-surface">
                  {copied ? <Check size={15} weight="bold" aria-hidden="true" /> : <Copy size={15} weight="bold" aria-hidden="true" />}
                  {copied ? t('tfCopied') : t('tfCopy')}
                </Button>
              </div>
            </div>
            <TextField
              label={t('tfCode')}
              hint={t('tfCodeHint')}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123 456"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, '').slice(0, 7))}
              error={error || undefined}
            />
            <Button type="submit" disabled={busy || code.replace(/\s+/g, '').length !== 6} className="self-start">
              {busy ? t('tfEnabling') : t('tfEnable')}
            </Button>
          </form>
        )}

        {step === 'done' && (
          <>
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-sage text-sage-ink">
                <ShieldCheck size={22} weight="bold" aria-hidden="true" />
              </span>
              <p className="text-[15px] leading-[1.6] text-ink-2">{t('tfDone')}</p>
            </div>
            <p className="rounded-[14px] bg-inset px-4 py-3 text-[14px] leading-[1.55] text-ink-2">{t('tfDoneNote')}</p>
            <Button variant="quiet" onClick={onClose} className="self-start">{t('close')}</Button>
          </>
        )}

        {step === 'disable' && (
          <>
            <p className="text-[15px] leading-[1.6] text-ink-2">{t('tfDisableText')}</p>
            {error && <FormStatus kind="error">{error}</FormStatus>}
            <div className="flex gap-2">
              <Button variant="quiet" onClick={onClose} disabled={busy}>{t('cancel')}</Button>
              <Button variant="danger" onClick={() => void turnOff()} disabled={busy}>
                {busy ? t('tfDisabling') : t('twoFactorDisable')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
