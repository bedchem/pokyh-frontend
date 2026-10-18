'use client';

import Link from 'next/link';
import { ImageSquare } from '@phosphor-icons/react';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { mediaDict } from '@/lib/i18n/dictionaries/media';
import { setExternalMedia, useExternalMedia } from '@/lib/external-media';

// Says where the photos come from and lets the visitor hide them (objection,
// Art. 21 GDPR) or show them again. `compact` is the smaller box.
export default function ExternalMediaNotice({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const t = useT(mediaDict);
  const localize = useLocalizeHref();
  const allowed = useExternalMedia();

  if (allowed) {
    return (
      <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-[1.5] text-ink-3 ${className}`}>
        <span>{t('on')}</span>
        <button type="button" onClick={() => setExternalMedia(false)} className="font-semibold underline-offset-4 hover:text-ink hover:underline">
          {t('revoke')}
        </button>
        <Link href={localize('/legal/datenschutz')} className="font-semibold underline-offset-4 hover:text-ink hover:underline">{t('more')}</Link>
      </p>
    );
  }

  return (
    <div className={`flex items-start gap-3.5 rounded-[20px] bg-[var(--surface)] p-4 text-left shadow-[0_0_0_1px_var(--line)] ${compact ? '' : 'md:p-5'} ${className}`}>
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[var(--butter)] text-[var(--butter-ink)]">
        <ImageSquare size={20} weight="bold" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-ink">{t('title')}</p>
        <p className="mt-1 text-[14px] leading-[1.5] text-ink-2">
          {t('text')}{' '}
          <Link href={localize('/legal/datenschutz')} className="font-semibold text-ink underline-offset-4 hover:underline">{t('more')}</Link>
        </p>
        <button type="button" onClick={() => setExternalMedia(true)} className="key key-sm key-lilac mt-3">
          {t('allow')}
        </button>
      </div>
    </div>
  );
}
