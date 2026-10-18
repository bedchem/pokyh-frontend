'use client';

import { SlidersHorizontal } from '@phosphor-icons/react';
import { COOKIE_SETTINGS_EVENT } from '@/components/CookieSettingsButton';

/** Opens the cookie settings (CookieBanner listens for the event). */
export default function CookieButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))} className="key key-sm key-lilac self-start">
      <SlidersHorizontal size={17} weight="bold" aria-hidden="true" />
      {label}
    </button>
  );
}
