'use client';

import { useState, type FormEvent } from 'react';
import { useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { untisActionsDict } from '@/lib/i18n/dictionaries/untisActions';
import { changeUntisPassword } from '@/lib/api';
import { hasDeclinedPasskey, storePasswordCredential } from '@/lib/passkey';
import { PasswordField, FormStatus } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

// Changes the WebUntis password through WebUntis itself. Success and failure are
// whatever WebUntis answers; nothing is reported as done before it confirms.
export default function ChangePasswordForm() {
  const t = useT(untisActionsDict);
  const { user } = useSession();
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const mismatch = repeat.length > 0 && newPw !== repeat;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (newPw !== repeat) {
      setStatus({ kind: 'error', text: t('pwMismatch') });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      // The server also seals the new password into the renewal cookie.
      await changeUntisPassword(oldPw, newPw);
      if (user?.username && !hasDeclinedPasskey()) void storePasswordCredential(user.username, newPw);
      setOldPw('');
      setNewPw('');
      setRepeat('');
      setStatus({ kind: 'success', text: t('pwDone') });
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error && err.message && err.message !== 'session_expired' ? err.message : t('failed') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <input type="text" name="username" autoComplete="username" value={user?.username ?? ''} readOnly hidden />
      <PasswordField
        label={t('pwOld')}
        showLabel={t('show')}
        hideLabel={t('hide')}
        autoComplete="current-password"
        value={oldPw}
        onChange={(e) => setOldPw(e.target.value)}
        required
      />
      <PasswordField
        label={t('pwNew')}
        showLabel={t('show')}
        hideLabel={t('hide')}
        autoComplete="new-password"
        value={newPw}
        onChange={(e) => setNewPw(e.target.value)}
        required
      />
      <PasswordField
        label={t('pwRepeat')}
        showLabel={t('show')}
        hideLabel={t('hide')}
        autoComplete="new-password"
        value={repeat}
        onChange={(e) => setRepeat(e.target.value)}
        error={mismatch ? t('pwMismatch') : undefined}
        required
      />
      {status && <FormStatus kind={status.kind}>{status.text}</FormStatus>}
      <Button type="submit" disabled={busy || !oldPw || !newPw || !repeat || mismatch} className="self-start">
        {busy ? t('pwSaving') : t('pwSave')}
      </Button>
    </form>
  );
}
