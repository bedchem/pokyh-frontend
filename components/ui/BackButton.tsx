'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { commonDict } from '@/lib/i18n/dictionaries/common';

export default function BackButton({ fallback = '/' }: { fallback?: string }) {
  const router = useRouter();
  const t = useT(commonDict);
  const localize = useLocalizeHref();

  function handleBack() {
    // If there's a browser history entry to go back to, use it
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace(localize(fallback));
    }
  }

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70 press-scale"
      style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <ChevronLeft size={16} />
      {t('back')}
    </button>
  );
}
