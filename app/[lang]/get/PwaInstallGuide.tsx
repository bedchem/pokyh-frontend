import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';
import { makeT } from '@/lib/i18n/dictionary';
import { getDict, type GetKey } from '@/lib/i18n/dictionaries/get';
import { rich } from '@/lib/i18n/rich';
import type { Locale } from '@/lib/i18n/locale';

const ShareGlyph = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

type Step = { key: 'pi1' | 'pi2' | 'pi3' | 'pi4' | 'pi5' | 'pa1' | 'pa2' | 'pa3' | 'pa4'; imgLight: string; imgDark: string };

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

/** Body text with `**bold**` and an optional `{icon}` placeholder for the inline share glyph. */
function stepBody(text: string) {
  const [before, after] = text.split('{icon}');
  if (after === undefined) return rich(text);
  return <>{rich(before)}{ShareGlyph}{rich(after)}</>;
}

/** Step-by-step PWA install guide (shared by /get/pwa/ios and /get/pwa/android). */
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
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title,
      text: s.text,
    })),
  };

  return (
    <div className="lp-root lp-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <LandingNav />

      <div className="lp-page-hero">
        <Link href={`/${locale}/get/`} className="get-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {t('back')}
        </Link>
        <div className="lp-page-hero-eyebrow">{ios ? 'PWA · iOS' : 'PWA · Android'}</div>
        <h1 className="lp-page-hero-h1">
          {ios ? t('pwaIosTitle1') : t('pwaAndroidTitle1')}<br />{ios ? t('pwaIosTitle2') : t('pwaAndroidTitle2')}
        </h1>
        <p className="lp-page-hero-sub">
          {ios ? t('pwaIosSub') : t('pwaAndroidSub')}
        </p>
      </div>

      <div className="lp-page-content">
        <div className="get-install-steps">
          {steps.map(({ num, title, body, imgLight, imgDark }) => {
            const alt = t('stepAlt', { num, title });
            const loading = num === '01' ? 'eager' : 'lazy';
            return (
              <article key={num} className="get-install-step">
                <div className="get-install-step-text">
                  <div className="get-install-step-num">{num}</div>
                  <h2 className="get-install-step-title">{title}</h2>
                  <div className="get-install-step-body">{stepBody(body)}</div>
                </div>
                <div className="get-install-screenshot-wrap">
                  {imgLight === imgDark ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgLight} alt={alt} className="screenshot-both" loading={loading} decoding="async" />
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgLight} alt={alt} className="screenshot-light" loading={loading} decoding="async" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgDark} alt={alt} className="screenshot-dark" loading={loading} decoding="async" aria-hidden="true" />
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
