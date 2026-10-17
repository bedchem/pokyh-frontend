import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/ssr';
import { makeT } from '@/lib/i18n/dictionary';
import { getDict, type GetKey } from '@/lib/i18n/dictionaries/get';
import { rich } from '@/lib/i18n/rich';
import type { Locale } from '@/lib/i18n/locale';
import PageIntro from '@/components/site/PageIntro';
import PhoneSteps from '@/components/site/PhoneSteps';

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

/** Home-screen install guide of the web app (shared by /get/pwa/ios and /get/pwa/android), with the screenshots in a phone of that platform. */
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
        <Link href={`/${locale}/get/`} className="key key-sm key-lilac">
          <ArrowLeft size={15} weight="bold" aria-hidden="true" />
          {t('back')}
        </Link>
      </PageIntro>

      <PhoneSteps
        platform={platform}
        steps={steps.map((st) => ({
          key: st.key,
          num: st.num,
          title: st.title,
          body: stepBody(st.body),
          imgLight: st.imgLight,
          imgDark: st.imgDark,
          alt: t('stepAlt', { num: st.num, title: st.title }),
        }))}
      />
    </>
  );
}
