'use client';

import { useEffect } from 'react';
import { useSession } from '@/providers/SessionProvider';
import Spinner from '@/components/ui/Spinner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.replace('/login');
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--app-bg)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
