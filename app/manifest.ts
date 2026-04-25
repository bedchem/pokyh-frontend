import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'POKYH – Schulapp LBS Brixen',
    short_name: 'POKYH',
    description: 'Stundenplan, Noten, Mensa und mehr für LBS Brixen Schüler.',
    start_url: '/login',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#0A84FF',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
