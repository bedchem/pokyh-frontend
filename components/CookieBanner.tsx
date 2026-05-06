'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'pokyh_cookie_consent';

export type CookieConsent = 'all' | 'necessary';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function accept(choice: CookieConsent) {
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie-Einstellungen"
      className="fixed bottom-0 left-0 right-0 z-[999] px-4 pb-4 pt-0 sm:px-6 sm:pb-6"
    >
      <div
        className="mx-auto max-w-2xl rounded-2xl p-5 shadow-2xl"
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}
          >
            <Cookie size={17} color="var(--accent)" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold leading-snug" style={{ color: 'var(--app-text-primary)' }}>
              Cookies &amp; Datenschutz
            </p>
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--app-text-secondary)' }}>
              Wir verwenden notwendige Cookies für den Betrieb der App sowie optionale Analytics-Cookies
              (Google Analytics 4) zur Verbesserung unseres Dienstes.{' '}
              <Link
                href="/legal?view=cookies"
                className="underline underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: '#4F46E5' }}
              >
                Mehr erfahren
              </Link>
            </p>
          </div>
          <button
            onClick={() => accept('necessary')}
            className="flex-shrink-0 p-1.5 rounded-lg transition-opacity hover:opacity-60"
            style={{ color: 'var(--app-text-tertiary)' }}
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 mt-4">
          <button
            onClick={() => accept('necessary')}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold transition-opacity hover:opacity-70 press-scale"
            style={{
              background: 'var(--app-card)',
              color: 'var(--app-text-secondary)',
              border: '1px solid var(--app-border)',
            }}
          >
            Nur notwendige
          </button>
          <button
            onClick={() => accept('all')}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90 press-scale"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            Alles akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
