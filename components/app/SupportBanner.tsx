'use client';

import { ArrowUpRight, Coffee } from '@phosphor-icons/react';
import { PixelSpriteArt } from '@/components/app/PixelState';
import { useT } from '@/providers/LocaleProvider';
import { settingsDict } from '@/lib/i18n/dictionaries/settings';
import { SUPPORT_URL } from '@/lib/site-links';

// "POKYH unterstützen" in the settings: a mug of coffee and a plain link to
// the support page (NEXT_PUBLIC_SUPPORT_URL). Only a link: nothing of the
// support site is loaded until it is opened, in a new tab without a referrer.
export default function SupportBanner() {
  const t = useT(settingsDict);
  if (!SUPPORT_URL) return null;
  return (
    <section aria-labelledby="support-title" className="squircle rise flex flex-col items-start gap-5 rounded-[28px] bg-butter p-6 text-butter-ink sm:flex-row sm:items-center md:gap-8 md:p-8">
      <PixelSpriteArt sprite="coffee" className="w-[120px] shrink-0 md:w-[150px]" />
      <div className="min-w-0 flex-1">
        <h2 id="support-title" className="text-[22px] font-extrabold tracking-[-0.03em] md:text-[24px]">{t('supportTitle')}</h2>
        <p className="mt-1.5 max-w-[56ch] text-[15px] leading-relaxed opacity-85">{t('supportText')}</p>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-[14px] bg-ink px-5 text-[15px] font-semibold text-canvas transition-[filter] duration-200 hover:brightness-[1.25] dark:bg-butter-ink dark:text-butter dark:hover:brightness-110"
        >
          <Coffee size={18} weight="bold" aria-hidden="true" />
          {t('supportAction')}
          <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
          <span className="visually-hidden">{t('supportNewTab')}</span>
        </a>
      </div>
    </section>
  );
}
