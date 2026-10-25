'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Check } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { PixelIcon } from '@/components/app/PixelState';
import SecurityRow, { StatusPill } from '@/components/account/SecurityRow';
import {
  deviceUnlockAccount,
  deviceUnlockSupported,
  isFresh,
  setupChallenge,
  turnOffDeviceUnlock,
  turnOnDeviceUnlock,
  unlockPlatform,
  type SetupChallenge,
  type UnlockPlatform,
} from '@/lib/device-unlock';
import { securityDict, type SecurityKey } from '@/lib/i18n/dictionaries/security';
import { useT } from '@/providers/LocaleProvider';

const TITLE: Record<UnlockPlatform, SecurityKey> = { ios: 'unlockTitleIos', android: 'unlockTitleAndroid', other: 'unlockTitleOther' };
const HINT: Record<UnlockPlatform, SecurityKey> = { ios: 'unlockHintIos', android: 'unlockHintAndroid', other: 'unlockHintOther' };

const noop = () => () => {};

// A challenge for the new passkey ahead of the tap, into `held`; the answer's
// code when there is none (no password for it in this session, …).
async function prepare(held: { current: SetupChallenge | null }): Promise<string | null> {
  const r = await setupChallenge();
  held.current = 'challenge' in r ? r.challenge : null;
  return 'code' in r ? r.code : null;
}

type State =
  | { kind: 'loading' }
  | { kind: 'on' }
  /** `holder`: the account it is on for on this device, when that is another one. */
  | { kind: 'off'; holder: string | null };

/**
 * Signing in with Face ID, the fingerprint or the PIN (lib/device-unlock.ts),
 * a row of Konto & Sicherheit: only in the installed website, on a device
 * with its own lock. The challenge for the new passkey is asked for before
 * the tap, as iOS starts Face ID only straight from one.
 */
export default function DeviceUnlockRow({ username }: { username: string }) {
  const t = useT(securityDict);
  const platform = useSyncExternalStore(noop, unlockPlatform, () => 'other' as const);
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const challenge = useRef<SetupChallenge | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      if (!(await deviceUnlockSupported()) || !live) return;
      setSupported(true);
      const holder = await deviceUnlockAccount();
      if (!live) return;
      const mine = holder !== null && holder.toLowerCase() === username.toLowerCase();
      setState(mine ? { kind: 'on' } : { kind: 'off', holder });
      if (mine) return;
      const code = await prepare(challenge);
      if (live && code === 'password_needed') setError(t('unlockPasswordNeeded'));
    })();
    return () => { live = false; };
  }, [username, t]);

  async function turnOn() {
    setBusy(true);
    setError('');
    const held = challenge.current;
    const refetched = !held || !isFresh(held);
    if (refetched) {
      const code = await prepare(challenge);
      if (code) {
        setBusy(false);
        setError(code === 'password_needed' ? t('unlockPasswordNeeded') : t('unlockFailed'));
        return;
      }
    }
    const current = challenge.current;
    challenge.current = null;
    const result = current ? await turnOnDeviceUnlock(current) : { kind: 'failed' as const };
    setBusy(false);
    if (result.kind === 'on') {
      setState({ kind: 'on' });
      return;
    }
    // A new challenge for the next tap.
    void prepare(challenge);
    // iOS refuses Face ID that does not follow a tap straight away, as after asking for a new challenge.
    if (result.kind === 'cancelled') setError(refetched ? t('unlockTapAgain') : '');
    else setError(result.code === 'password_needed' ? t('unlockPasswordNeeded') : t('unlockFailed'));
  }

  async function turnOff() {
    setBusy(true);
    setError('');
    const ok = await turnOffDeviceUnlock();
    setBusy(false);
    if (!ok) {
      setError(t('unlockFailed'));
      return;
    }
    setState({ kind: 'off', holder: null });
    void prepare(challenge);
  }

  if (!supported) return null;

  const hint = state.kind === 'off' && state.holder ? `${t(HINT[platform])} ${t('unlockOtherAccount', { name: state.holder })}` : t(HINT[platform]);

  return (
    <SecurityRow
      icon={<PixelIcon name="fingerprint" />}
      title={t(TITLE[platform])}
      value={state.kind === 'off' ? t('stateOff') : undefined}
      status={state.kind === 'on' ? <StatusPill tone="sage"><Check size={14} weight="bold" aria-hidden="true" />{t('stateOn')}</StatusPill> : undefined}
      hint={<>{hint}{error && <span role="alert" className="mt-1 block font-semibold text-danger-ink">{error}</span>}</>}
      actions={state.kind === 'loading' ? undefined : state.kind === 'on' ? (
        <Button variant="quiet" disabled={busy} onClick={() => void turnOff()}>
          {busy ? <Spinner size={16} /> : t('unlockOff')}
        </Button>
      ) : (
        <Button variant="tone" disabled={busy} onClick={() => void turnOn()}>
          {busy ? <Spinner size={16} /> : t('unlockOn')}
        </Button>
      )}
    />
  );
}
