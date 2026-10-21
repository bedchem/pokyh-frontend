import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { makeT } from '@/lib/i18n/dictionary';
import { ogDict, type OgKey } from '@/lib/i18n/dictionaries/og';
import type { Locale } from '@/lib/i18n/locale';
import { SITE_URL } from '@/lib/site-url';

// The link preview (Open Graph / social card) of the public pages: the name
// on the logo's indigo, a line about the page and the four category tones.

export const OG_SIZE = { width: 1200, height: 630 };

const TONES = [
  { bg: '#DEDDFB', ink: '#4A46A6' },
  { bg: '#F7E7AC', ink: '#6E5112' },
  { bg: '#D5E4D0', ink: '#3E5D39' },
  { bg: '#F7D9D3', ink: '#8A4237' },
];

export function ogAlt(locale: Locale, title: OgKey): string {
  const t = makeT(ogDict, locale);
  return `POKYH: ${t(title)}`;
}

// The site's typeface (Plus Jakarta Sans, SIL Open Font License, lib/og/fonts/OFL.txt).
let fonts: Promise<{ name: string; data: Buffer; weight: 600 | 800; style: 'normal' }[]> | null = null;
function loadFonts() {
  fonts ??= Promise.all(
    ([600, 800] as const).map(async (weight) => ({
      name: 'Jakarta',
      data: await readFile(join(process.cwd(), 'lib/og/fonts', `plus-jakarta-sans-${weight}.woff`)),
      weight,
      style: 'normal' as const,
    })),
  );
  return fonts;
}

export async function ogCard(locale: Locale, title: OgKey, line: OgKey) {
  const t = makeT(ogDict, locale);
  const chips = t('chips').split('|');
  const host = SITE_URL.replace(/^https?:\/\//, '');
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#534AB7',
          color: '#FFFFFF',
          padding: '64px 72px',
          fontFamily: 'Jakarta',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 30, fontWeight: 800, opacity: 0.85 }}>POKYH</span>
          <span style={{ fontSize: 24, fontWeight: 600, opacity: 0.6 }}>{host}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 80, fontWeight: 800, letterSpacing: -3.5, lineHeight: 1.08, maxWidth: 1000 }}>{t(title)}</span>
          <span style={{ marginTop: 26, fontSize: 32, fontWeight: 600, lineHeight: 1.35, opacity: 0.8, maxWidth: 940 }}>{t(line)}</span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {chips.map((chip, i) => (
            <span
              key={chip}
              style={{
                display: 'flex',
                padding: '12px 24px',
                borderRadius: 20,
                fontSize: 24,
                fontWeight: 800,
                background: TONES[i % TONES.length].bg,
                color: TONES[i % TONES.length].ink,
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts().catch(() => undefined) },
  );
}
