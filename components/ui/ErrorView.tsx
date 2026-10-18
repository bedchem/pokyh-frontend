'use client';

import { ArrowClockwise } from '@phosphor-icons/react';
import { useT } from '@/providers/LocaleProvider';
import { commonDict, type CommonKey } from '@/lib/i18n/dictionaries/common';
import { Button } from '@/components/ui/Button';
import PixelState, { type PixelSprite } from '@/components/app/PixelState';

// Maps any internal error to a short, readable sentence with a fitting pixel
// scene (components/app/PixelState). The raw reason is shown underneath in
// small type for support — without addresses, which can name servers.
function classifyError(message: string): { sprite: PixelSprite; title: CommonKey; detail: CommonKey } {
  const m = (message || '').toLowerCase();

  if (m.includes('session') || m.includes('login') || m.includes('auth') || m.includes('unauthorized') || m.includes('angemeldet')) {
    return { sprite: 'lock', title: 'errSessionTitle', detail: 'errSessionDetail' };
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('offline') || m.includes('verbindung') || m.includes('timeout') || m.includes('econnrefused')) {
    return { sprite: 'unplugged', title: 'errOfflineTitle', detail: 'errOfflineDetail' };
  }
  // Everything else (incl. 5xx, WebUntis upstream errors): generic, friendly.
  return { sprite: 'unplugged', title: 'errGenericTitle', detail: 'errGenericDetail' };
}

/** The raw reason, without URLs and kept short. */
export function technicalReason(message: string): string {
  return (message || '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
}

export default function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useT(commonDict);
  const { sprite, title, detail } = classifyError(message);
  const reason = technicalReason(message);
  return (
    <PixelState
      sprite={sprite}
      title={t(title)}
      detail={[t(detail), reason].filter(Boolean).join(' · ')}
      action={onRetry && (
        <Button variant="quiet" onClick={onRetry}>
          <ArrowClockwise size={17} weight="bold" aria-hidden="true" />
          {t('retry')}
        </Button>
      )}
    />
  );
}
