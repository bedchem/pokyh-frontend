'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function BackButton({ fallback = '/' }: { fallback?: string }) {
  const router = useRouter();

  function handleBack() {
    // If there's a browser history entry to go back to, use it
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace(fallback);
    }
  }

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70 press-scale"
      style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <ChevronLeft size={16} />
      Zurück
    </button>
  );
}
