'use client';

import { ChartBar } from '@phosphor-icons/react';
import { ButtonLink } from '@/components/ui/Button';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { profileDict } from '@/lib/i18n/dictionaries/profile';

// Said at the top of the profile and its statistics while the personal usage
// statistics are switched off: what is missing because of it, and where they
// are switched on (the settings, where the consent is explained).
export default function StatsOffNotice({ className = '' }: { className?: string }) {
  const t = useT(profileDict);
  const localize = useLocalizeHref();
  return (
    <div role="status" className={`squircle rise flex flex-col gap-4 rounded-[24px] bg-butter p-5 text-butter-ink sm:flex-row sm:items-center md:p-6 ${className}`}>
      <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,currentColor_14%,transparent)]">
        <ChartBar size={21} weight="bold" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[16.5px] font-bold tracking-[-0.015em]">{t('statsOffTitle')}</p>
        <p className="mt-1 max-w-[62ch] text-[14.5px] leading-relaxed">{t('statsOffText')}</p>
      </div>
      <ButtonLink href={localize('/settings#privacy')} variant="ink" size="sm" className="self-start sm:self-auto">
        {t('consentLink')}
      </ButtonLink>
    </div>
  );
}
