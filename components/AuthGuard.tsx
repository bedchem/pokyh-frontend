'use client';

import { useEffect } from 'react';
import { useSession } from '@/providers/SessionProvider';

// Signed-in pages only: sends a missing session to the sign-in form. The
// session is read from a cookie, so the check is over at once; nothing is
// drawn meanwhile (each page brings its own skeleton).
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.replace('/login');
    }
  }, [isLoading, user]);

  if (isLoading || !user) return null;

  return <>{children}</>;
}
