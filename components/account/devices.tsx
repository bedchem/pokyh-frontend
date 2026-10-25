'use client';

import { useState } from 'react';
import { AppWindow, Desktop, DeviceMobile, DeviceTablet, Globe, X } from '@phosphor-icons/react';
import Spinner from '@/components/ui/Spinner';
import { IconTile } from '@/components/app/Page';
import { useDateLocale, useT } from '@/providers/LocaleProvider';
import { securityDict, type SecurityKey } from '@/lib/i18n/dictionaries/security';
import type { DeviceClient, DeviceSession, LoginEntry } from '@/lib/api-client';

// How a signed-in device and a sign-in read in the device list
// (app/[lang]/(app)/settings/devices): what it is ("Windows · Chrome 130"),
// where it was (city, region and the country in the reader's language), when,
// and from which address.

type Device = Pick<DeviceSession, 'client' | 'platform' | 'os' | 'browser' | 'model' | 'city' | 'region' | 'country' | 'ip'>;

const CLIENT_KEY: Record<DeviceClient, SecurityKey> = {
  app: 'clientApp',
  web: 'clientWeb',
  pwa: 'clientPwa',
  other: 'clientOther',
};

/** The device's glyph: a phone for the app, a window for the installed website, a screen otherwise. */
function DeviceGlyph({ device, size }: { device: Pick<Device, 'client' | 'platform'>; size: number }) {
  if (device.client === 'pwa') return <AppWindow size={size} weight="bold" />;
  if (device.client === 'other') return <Globe size={size} weight="bold" />;
  if (device.platform === 'android' || device.platform === 'ios') {
    return device.client === 'app' ? <DeviceMobile size={size} weight="bold" /> : <DeviceTablet size={size} weight="bold" />;
  }
  return <Desktop size={size} weight="bold" />;
}

/** "Windows · Chrome 130", "Android 15 · POKYH App 2.1.0", or the kind of client. */
export function useDeviceName() {
  const t = useT(securityDict);
  return (device: Pick<Device, 'client' | 'os' | 'browser' | 'model'>) => {
    const client = t(CLIENT_KEY[device.client] ?? 'clientOther');
    const browser = device.client === 'app' ? device.browser.replace(/^POKYH App/, client) : device.browser;
    const system = device.model ? `${device.os} (${device.model})`.trim() : device.os;
    const parts = [system, browser || client].filter(Boolean);
    return parts.length ? parts.join(' · ') : t('unknownDevice');
  };
}

/** "Brixen, Trentino-Südtirol, Italien"; empty when the place is unknown. */
export function usePlace() {
  const { tag } = useDateLocale();
  return (device: Pick<Device, 'city' | 'region' | 'country'>) => {
    let country = device.country;
    if (country) {
      try { country = new Intl.DisplayNames([tag], { type: 'region' }).of(country) ?? country; } catch { /* keep the code */ }
    }
    return [device.city, device.region, country].filter((part) => part && part.trim()).join(', ');
  };
}

/** "vor 5 Minuten", "gestern"…: how long before `now`, in the reader's language. */
export function useAgo() {
  const { tag } = useDateLocale();
  return (iso: string, now: number) => {
    const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
    const rtf = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' });
    const abs = Math.abs(seconds);
    if (abs < 60) return rtf.format(0, 'second');
    if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
    if (abs < 86400 * 30) return rtf.format(Math.round(seconds / 86400), 'day');
    return rtf.format(Math.round(seconds / (86400 * 30)), 'month');
  };
}

export function useLongDate() {
  const { tag } = useDateLocale();
  return (iso: string) => new Date(iso).toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric' });
}

const rowBase = 'flex w-full items-center gap-3.5 rounded-[6px] bg-surface px-4 py-3.5 text-left first:rounded-t-[22px] last:rounded-b-[22px] min-h-[72px]';

/** One signed-in device, with its sign-out button (none on the current device: it signs out in the settings). */
export function DeviceRow({ device, busy, onSignOut }: { device: DeviceSession; busy?: boolean; onSignOut?: () => void }) {
  const t = useT(securityDict);
  const name = useDeviceName();
  const place = usePlace();
  const ago = useAgo();
  const longDate = useLongDate();
  // When the row was first drawn: "zuletzt aktiv" counts from there.
  const [now] = useState(Date.now);
  const where = place(device) || t('unknownPlace');
  const recent = now - new Date(device.lastUsedAt).getTime() < 5 * 60_000;
  const when = device.current || recent ? t('activeNow') : t('lastActive', { when: ago(device.lastUsedAt, now) });
  return (
    <div className={rowBase}>
      <IconTile tone={device.current ? 'periwinkle' : 'neutral'} size={44}>
        <DeviceGlyph device={device} size={22} />
      </IconTile>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px] font-semibold leading-snug">{name(device)}</span>
        <span className="mt-0.5 block truncate text-[13.5px] leading-snug text-ink-2">{where} · {when}</span>
        <span className="mt-0.5 block truncate text-[12.5px] leading-snug text-ink-3">
          {device.ip && <span className="mono">{device.ip}</span>}
          {device.ip && ' · '}
          {t('since', { date: longDate(device.createdAt) })}
        </span>
      </span>
      {onSignOut && (
        <button
          type="button"
          onClick={onSignOut}
          disabled={busy}
          aria-label={t('signOutDevice', { name: name(device) })}
          title={t('signOut')}
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-inset hover:text-danger-ink disabled:opacity-50"
        >
          {busy ? <Spinner size={18} /> : <X size={19} weight="bold" aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}

const METHOD_KEY: Record<string, SecurityKey> = {
  webuntis: 'methodWebuntis',
  office: 'methodOffice',
  local: 'methodLocal',
  register: 'methodRegister',
  qr: 'methodQr',
};

/** One sign-in of the login history. */
export function LoginRow({ login }: { login: LoginEntry }) {
  const t = useT(securityDict);
  const { tag } = useDateLocale();
  const name = useDeviceName();
  const place = usePlace();
  const at = new Date(login.at).toLocaleString(tag, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const method = METHOD_KEY[login.method];
  return (
    <div className={rowBase}>
      <IconTile tone="neutral" size={40}>
        <DeviceGlyph device={login} size={20} />
      </IconTile>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-snug">{name(login)}</span>
        <span className="mt-0.5 block truncate text-[13.5px] leading-snug text-ink-2">
          {place(login) || t('unknownPlace')}
          {login.ip && <> · <span className="mono text-[12.5px]">{login.ip}</span></>}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[13.5px] font-semibold tnum">{at}</span>
        {method && <span className="block text-[12.5px] text-ink-3">{t(method)}</span>}
      </span>
    </div>
  );
}
