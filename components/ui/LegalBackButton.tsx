'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { isPWA } from '@/lib/pwa';

export default function LegalBackButton({ label = 'Zurück', fallbackUrl }: { label?: string; fallbackUrl?: string }) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace(fallbackUrl || (isPWA() ? '/home' : '/'));
    }
  }

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium press-scale transition-opacity hover:opacity-70"
      style={{
        background: 'var(--app-surface)',
        color: 'var(--app-text-secondary)',
        border: '1px solid var(--app-border)',
        cursor: 'pointer',
      }}
    >
      <ArrowLeft size={15} />
      {label}
    </button>
  );
}
