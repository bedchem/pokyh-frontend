import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from '@phosphor-icons/react/ssr';
import { makeT } from '@/lib/i18n/dictionary';
import { getDict } from '@/lib/i18n/dictionaries/get';
import { rich } from '@/lib/i18n/rich';
import type { Locale } from '@/lib/i18n/locale';
import PageIntro from '@/components/site/PageIntro';
import RevealScope from '@/components/site/RevealScope';

export const RELEASES = {
  ios: 'https://github.com/bedchem/POKYH_IOS/releases',
  android: 'https://github.com/bedchem/POKYH_ANDROID/releases',
} as const;

/** Download guide for the native apps (shared by /get/ios and /get/android). */
export default function AppInstallGuide({ platform, locale }: { platform: 'ios' | 'android'; locale: Locale }) {
  const t = makeT(getDict, locale);
  const ios = platform === 'ios';
  const releases = RELEASES[platform];
  const [before, after] = t('appStep1Body').split('{link}');

  const steps = [
    {
      title: t('appStep1Title'),
      body: (
        <>
          {before}
          <a href={releases} target="_blank" rel="noopener noreferrer" className="mono break-all text-accent-ink underline underline-offset-4">
            {releases.replace('https://', '')}
          </a>
          {after}
        </>
      ),
    },
    { title: ios ? t('iosStep2Title') : t('androidStep2Title'), body: rich(ios ? t('iosStep2Body') : t('androidStep2Body')) },
    { title: ios ? t('iosStep3Title') : t('androidStep3Title'), body: rich(ios ? t('iosStep3Body') : t('androidStep3Body')) },
  ];

  return (
    <>
      <PageIntro title={ios ? t('appIosTitle') : t('appAndroidTitle')} lead={ios ? t('appIosLead') : t('appAndroidLead')}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <a href={releases} target="_blank" rel="noopener noreferrer" className="key key-lg">
            {t('releases')}
            <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
          </a>
          <Link href={`/${locale}/get/`} className="key key-lg key-lilac">
            <ArrowLeft size={16} weight="bold" aria-hidden="true" />
            {t('back')}
          </Link>
        </div>
      </PageIntro>

      <RevealScope>
        <ol className="wrap grid gap-4 pb-24 md:pb-32">
          {steps.map((st, i) => (
            <li key={st.title} data-reveal className="card grid gap-4 p-7 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.3fr)] md:items-start md:gap-10 md:p-10">
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-ink text-[16px] font-bold text-[var(--paper)] tnum">
                {i + 1}
              </span>
              <h2 className="text-[clamp(24px,2.6vw,34px)] font-extrabold leading-[1.1] tracking-[-0.035em] text-ink md:pt-1">{st.title}</h2>
              <p className="text-[17px] leading-[1.7] text-ink-2 md:pt-2 md:text-[18px]">{st.body}</p>
            </li>
          ))}
        </ol>
      </RevealScope>
    </>
  );
}
