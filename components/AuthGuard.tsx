'use client';

import { useEffect } from 'react';
import { useSession, loginPath } from '@/providers/SessionProvider';

// Signed-in pages only: sends a missing session to the sign-in form (coming
// back here afterwards). The session is read from a cookie, so the check is
// over at once; nothing is drawn meanwhile (each page brings its own skeleton).
// `guests="mensa"` (the app's Mensa): a guest goes to the public Mensa page
// instead, keeping the dish: /de/canteen/dish/x/ → /de/mensa/dish/x/.
export default function AuthGuard({ children, guests = 'login' }: { children: React.ReactNode; guests?: 'login' | 'mensa' }) {
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (isLoading || user) return;
    if (guests === 'mensa') {
      window.location.replace(window.location.pathname.replace(/^(\/[a-z]{2,3})?\/canteen(?=\/|$)/, '$1/mensa') + window.location.search);
      return;
    }
    window.location.replace(loginPath());
  }, [isLoading, user, guests]);

  if (isLoading || !user) return null;

  return <>{children}</>;
}
