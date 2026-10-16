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
          <a
            href={releases}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 items-center gap-2.5 rounded-full bg-accent px-7 text-[16px] font-semibold text-on-accent press transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_88%,#000)]"
          >
            {t('releases')}
            <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
          </a>
          <Link href={`/${locale}/get/`} className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink underline-offset-[6px] decoration-2 hover:underline">
            <ArrowLeft size={15} weight="bold" aria-hidden="true" />
            {t('back')}
          </Link>
        </div>
      </PageIntro>

      <RevealScope>
        <section className="bg-canvas">
          <ol className="mx-auto max-w-[1440px] px-5 md:px-10 pb-24 md:pb-36">
            {steps.map((s, i) => (
              <li key={s.title} data-reveal className="grid gap-4 border-t border-line py-10 md:py-12 lg:grid-cols-12 lg:gap-10">
                <span className="lg:col-span-2 font-extrabold leading-none tracking-[-0.05em] text-ink-3 text-[56px] md:text-[80px] tnum">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="lg:col-span-4 text-ink text-[28px] md:text-[38px] font-extrabold tracking-[-0.04em] leading-[1.05] lg:pt-3">{s.title}</h2>
                <p className="lg:col-span-6 text-[17px] md:text-[19px] leading-[1.6] text-ink-2 lg:pt-4">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </RevealScope>
    </>
  );
}
