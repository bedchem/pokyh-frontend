'use client';

import Link from 'next/link';
import { ArrowLeft, Home, Utensils } from 'lucide-react';
import LandingNav from '@/components/LandingNav';
import { useSession } from '@/providers/SessionProvider';

export default function NotFoundClient() {
  const { user } = useSession();
  const homeHref = user ? '/home' : '/';

  function goBack() {
    if (window.history.length > 1) window.history.back();
    else window.location.assign(homeHref);
  }

  return (
    <div className="lp-root min-h-dvh flex flex-col" style={{ background: 'var(--app-bg)' }}>
      <LandingNav />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-20">
        <div className="fade-in">
          <p
            className="font-bold tracking-tighter leading-none select-none"
            style={{
              fontSize: 'clamp(96px, 22vw, 200px)',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            404
          </p>

          <h1
            className="mt-2 font-semibold tracking-tight"
            style={{ fontSize: 'clamp(24px, 4vw, 34px)', color: 'var(--app-text-primary)' }}
          >
            Diese Seite gibt es nicht.
          </h1>
          <p className="mt-3 mx-auto max-w-md text-base" style={{ color: 'var(--app-text-secondary)' }}>
            Vielleicht hat sich ein Tippfehler eingeschlichen oder der Link ist veraltet.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={homeHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold press-scale"
              style={{ background: 'linear-gradient(135deg, #5B3FD4, #8B5CF6)' }}
            >
              <Home size={16} />
              Zur Startseite
            </Link>
            <Link
              href="/mensa"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold press-scale"
              style={{
                background: 'color-mix(in srgb, #F59E0B 14%, transparent)',
                color: '#D97706',
              }}
            >
              <Utensils size={16} />
              Mensa ansehen
            </Link>
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold press-scale"
              style={{ background: 'rgba(130, 130, 150, 0.12)', color: 'var(--app-text-primary)' }}
            >
              <ArrowLeft size={16} />
              Zurück
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
