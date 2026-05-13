'use client';

import Link from 'next/link';
import { useSession } from '@/providers/SessionProvider';

export default function UntisGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();

  if (isLoading) return null;

  if (user && user.isUntisUser === false) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center px-6"
        style={{ minHeight: '60vh', gap: 16 }}
      >
        <div style={{ fontSize: 40 }}>🎓</div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--app-text-primary)' }}>
          Schulaccount erforderlich
        </h2>
        <p className="text-sm max-w-xs" style={{ color: 'var(--app-text-secondary)', lineHeight: 1.6 }}>
          Diese Funktion ist nur mit einem WebUntis-Schulaccount verfügbar. Melde dich mit deinem Schulaccount an, um Stundenplan, Noten und mehr zu sehen.
        </p>
        <Link
          href="/login"
          className="text-sm font-semibold px-4 py-2 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #5B3FD4, #8B5CF6)',
            color: '#fff',
            marginTop: 8,
          }}
        >
          Mit Schulaccount anmelden
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
