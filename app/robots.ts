import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/legal'],
        disallow: [
          '/home',
          '/timetable',
          '/grades',
          '/messages/',
          '/mensa',
          '/absences',
          '/reminders',
          '/todos',
          '/profile',
          '/school',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
