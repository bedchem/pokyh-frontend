import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.app';

const publicPaths = ['/', '/login', '/legal'];
const privatePaths = [
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
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: publicPaths,
        disallow: privatePaths,
      },
      // Allow AI crawlers to index public content — important for AI search visibility
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'anthropic-ai', 'Google-Extended', 'PerplexityBot', 'Applebot'],
        allow: publicPaths,
        disallow: ['/home', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
