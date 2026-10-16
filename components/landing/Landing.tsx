'use client';

import Link from 'next/link';
import { useLocalizeHref, useT } from '@/providers/LocaleProvider';
import { useSession } from '@/providers/SessionProvider';
import { homepageDict } from '@/lib/i18n/dictionaries/homepage';
import { siteDict } from '@/lib/i18n/dictionaries/site';
import Hero from './Hero';
import Statement from './Statement';
import FeatureCarousel from './FeatureCarousel';
import MensaToday from './MensaToday';
import { GetIn, Makers } from './Closing';

// Paper and night alternate as you scroll; the header follows the colours.
export default function Landing() {
  const t = useT(homepageDict);
  const ts = useT(siteDict);
  const localize = useLocalizeHref();
  const { user } = useSession();

  return (
    <>
      <Hero />
      <Statement id="idee" tone="dark" rise title={t('missionTitle')} text={t('missionText')}>
        <Link
          href={localize(user ? '/home' : '/login')}
          className="inline-flex h-[54px] items-center rounded-full bg-white px-9 text-[16px] font-medium text-ink transition-colors hover:bg-[#ECECEC] press"
        >
          {user ? ts('openApp') : t('missionCta')}
        </Link>
      </Statement>
      <FeatureCarousel />
      <MensaToday />
      <GetIn />
      <Makers />
    </>
  );
}
