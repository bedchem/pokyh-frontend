'use client';

import { useState, type FormEvent } from 'react';
import { useT } from '@/providers/LocaleProvider';
import { untisActionsDict } from '@/lib/i18n/dictionaries/untisActions';
import { requestPasswordReset } from '@/lib/api';
import { TextField, FormStatus } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

// WebUntis' own "forgot password" page, as a fallback.
export const OFFICIAL_RESET_URL = 'https://lbs-brixen.webuntis.com/WebUntis/?school=lbs-brixen#/basic/resetPassword';

// Asks WebUntis to e-mail a reset link. The reset itself happens on WebUntis'
// page from that e-mail; Pokyh never handles the new password.
export default function ForgotPasswordForm({ initialUsername = '' }: { initialUsername?: string }) {
  const t = useT(untisActionsDict);
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      await requestPasswordReset(username.trim(), email.trim());
      setStatus({ kind: 'success', text: t('resetDone') });
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error && err.message ? err.message : t('failed') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <TextField label={t('resetUser')} autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <TextField label={t('resetEmail')} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      {status && <FormStatus kind={status.kind}>{status.text}</FormStatus>}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button type="submit" disabled={busy || !username.trim() || !email.trim() || status?.kind === 'success'}>
          {busy ? t('resetSending') : t('resetSend')}
        </Button>
        <a href={OFFICIAL_RESET_URL} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline">
          {t('resetOfficial')} ↗
        </a>
      </div>
    </form>
  );
}
