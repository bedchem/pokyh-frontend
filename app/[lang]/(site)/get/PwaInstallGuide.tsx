import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/ssr';
import { makeT } from '@/lib/i18n/dictionary';
import { getDict, type GetKey } from '@/lib/i18n/dictionaries/get';
import { rich } from '@/lib/i18n/rich';
import type { Locale } from '@/lib/i18n/locale';
import PageIntro from '@/components/site/PageIntro';
import RevealScope from '@/components/site/RevealScope';

const ShareGlyph = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="inline -mt-1">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

type Step = { key: string; imgLight: string; imgDark: string };

const STEPS: Record<'ios' | 'android', Step[]> = {
  ios: [
    { key: 'pi1', imgLight: '/tutorials_Screenshots/iosWhite_schritt1.webp', imgDark: '/tutorials_Screenshots/ios_schritt1.webp' },
    { key: 'pi2', imgLight: '/tutorials_Screenshots/iosWhite_schritt2.webp', imgDark: '/tutorials_Screenshots/ios_schritt2.webp' },
    { key: 'pi3', imgLight: '/tutorials_Screenshots/iosWhite_schritt3.webp', imgDark: '/tutorials_Screenshots/ios_schritt3.webp' },
    { key: 'pi4', imgLight: '/tutorials_Screenshots/iosWhite_schritt4.webp', imgDark: '/tutorials_Screenshots/ios_schritt4.webp' },
    { key: 'pi5', imgLight: '/tutorials_Screenshots/iosWhite_schritt5.webp', imgDark: '/tutorials_Screenshots/ios_schritt5.webp' },
  ],
  android: [
    { key: 'pa1', imgLight: '/tutorials_Screenshots/androidWhite_schritt1.webp', imgDark: '/tutorials_Screenshots/android_schritt1.webp' },
    { key: 'pa2', imgLight: '/tutorials_Screenshots/androidWhite_schritt2.webp', imgDark: '/tutorials_Screenshots/android_schritt2.webp' },
    { key: 'pa3', imgLight: '/tutorials_Screenshots/androidWhite_schritt3.webp', imgDark: '/tutorials_Screenshots/android_schritt3.webp' },
    { key: 'pa4', imgLight: '/tutorials_Screenshots/androidBoth_schritt4.webp', imgDark: '/tutorials_Screenshots/androidBoth_schritt4.webp' },
  ],
};

function stepBody(text: string) {
  const [before, after] = text.split('{icon}');
  if (after === undefined) return rich(text);
  return (
    <>
      {rich(before)}
      {ShareGlyph}
      {rich(after)}
    </>
  );
}

/** Home-screen install guide (shared by /get/pwa/ios and /get/pwa/android). */
export default function PwaInstallGuide({ platform, locale }: { platform: 'ios' | 'android'; locale: Locale }) {
  const t = makeT(getDict, locale);
  const ios = platform === 'ios';
  const steps = STEPS[platform].map((s, i) => ({
    ...s,
    num: String(i + 1).padStart(2, '0'),
    title: t(`${s.key}Title` as GetKey),
    text: t(`${s.key}Text` as GetKey),
    body: t(`${s.key}Body` as GetKey),
  }));

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: ios ? t('pwaIosSchemaName') : t('pwaAndroidSchemaName'),
    description: ios ? t('pwaIosSchemaDescription') : t('pwaAndroidSchemaDescription'),
    totalTime: 'PT2M',
    step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.text })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <PageIntro title={ios ? t('pwaIosTitle') : t('pwaAndroidTitle')} lead={ios ? t('pwaIosLead') : t('pwaAndroidLead')}>
        <Link href={`/${locale}/get/`} className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink underline-offset-[6px] decoration-2 hover:underline">
          <ArrowLeft size={15} weight="bold" aria-hidden="true" />
          {t('back')}
        </Link>
      </PageIntro>

      <RevealScope>
        <section className="bg-canvas">
          <ol className="mx-auto max-w-[1440px] px-5 md:px-10 pb-24 md:pb-36">
            {steps.map((s, i) => {
              const alt = t('stepAlt', { num: s.num, title: s.title });
              return (
                <li key={s.key} data-reveal className="grid items-center gap-8 border-t border-line py-12 md:grid-cols-2 md:gap-16">
                  <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                    <span className="block font-extrabold leading-none tracking-[-0.05em] text-ink-3 text-[64px] md:text-[96px] tnum">{s.num}</span>
                    <h2 className="mt-4 text-ink text-[30px] md:text-[44px] font-extrabold tracking-[-0.04em] leading-[1.02]">{s.title}</h2>
                    <p className="mt-4 max-w-[44ch] text-[17px] md:text-[19px] leading-[1.6] text-ink-2">{stepBody(s.body)}</p>
                  </div>
                  <div className="flex justify-center">
                    <div className="squircle w-[min(72vw,300px)] overflow-hidden rounded-[40px] border-[6px] border-ink bg-ink shadow-[var(--shadow-float)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.imgLight} alt={alt} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" className="block w-full dark:hidden" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.imgDark} alt={alt} loading="lazy" decoding="async" className="hidden w-full dark:block" />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </RevealScope>
    </>
  );
}
