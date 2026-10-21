import type { MetadataRoute } from 'next';
// Written once when the website is built (a static file).
export const dynamic = 'force-static';

// The installed web app. One manifest for all languages; the app itself
// follows the language of the device (proxy.ts) and the saved choice.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'POKYH: die App für WebUntis',
    short_name: 'POKYH',
    description: 'Stundenplan, Noten, Abwesenheiten und Nachrichten aus WebUntis in einer App. Für jede Schule mit WebUntis.',
    lang: 'de',
    dir: 'ltr',
    // Straight into the app: a device without a sign-in is sent to the
    // sign-in page before anything is drawn (components/SessionScript.tsx).
    start_url: '/home/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#F5F2ED',
    theme_color: '#534AB7',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
