'use client';

import Link from 'next/link';
import { useSession } from '@/providers/SessionProvider';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { commonDict } from '@/lib/i18n/dictionaries/common';

export default function UntisGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const t = useT(commonDict);
  const localize = useLocalizeHref();

  if (isLoading) return null;

  if (user && user.isUntisUser === false) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center px-6"
        style={{ minHeight: '60vh', gap: 16 }}
      >
        <div style={{ fontSize: 40 }}>🎓</div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--app-text-primary)' }}>
          {t('untisTitle')}
        </h2>
        <p className="text-sm max-w-xs" style={{ color: 'var(--app-text-secondary)', lineHeight: 1.6 }}>
          {t('untisText')}
        </p>
        <Link
          href={localize('/login')}
          className="text-sm font-semibold px-4 py-2 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #5B3FD4, #8B5CF6)',
            color: '#fff',
            marginTop: 8,
          }}
        >
          {t('untisLogin')}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
