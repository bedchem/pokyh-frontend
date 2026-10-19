'use client';

import { useEffect, useState } from 'react';
import { SignOut } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useSession } from '@/providers/SessionProvider';
import { useT } from '@/providers/LocaleProvider';
import { settingsDict } from '@/lib/i18n/dictionaries/settings';
import { commonDict } from '@/lib/i18n/dictionaries/common';

// Signing out takes two taps: the first asks "Wirklich abmelden?" in place,
// the second signs out. The question goes away on its own after a while.
export default function LogoutButton({ className = '' }: { className?: string }) {
  const t = useT(settingsDict);
  const tc = useT(commonDict);
  const { logout } = useSession();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!asking) return;
    const id = window.setTimeout(() => setAsking(false), 5000);
    return () => window.clearTimeout(id);
  }, [asking]);

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {asking && !busy && (
        <Button variant="quiet" onClick={() => setAsking(false)}>{tc('cancel')}</Button>
      )}
      <Button
        variant="danger"
        disabled={busy}
        aria-live="polite"
        onClick={async () => {
          if (!asking) { setAsking(true); return; }
          setBusy(true);
          await logout();
        }}
      >
        {busy ? <Spinner size={16} /> : <SignOut size={18} weight="bold" aria-hidden="true" />}
        {asking ? t('logoutConfirm') : t('logout')}
      </Button>
    </span>
  );
}
