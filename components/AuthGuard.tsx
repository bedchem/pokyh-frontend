'use client';

import { useSession } from '@/providers/SessionProvider';
import Spinner from '@/components/ui/Spinner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--app-bg)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  return <>{children}</>;
}
