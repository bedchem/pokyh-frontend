'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/providers/SessionProvider';
import Spinner from '@/components/ui/Spinner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--app-bg)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) {
    // Redirect fires from the useEffect above; render nothing in the meantime
    // so we don't show a stuck spinner while the navigation completes.
    return null;
  }

  return <>{children}</>;
}
