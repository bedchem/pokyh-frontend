import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

// Every page lives under a language prefix (/de/, /it/, /en/, /lld/), so the
// private app pages are matched with a wildcard for that segment.
const APP_PAGES = ['home', 'timetable', 'grades', 'messages', 'absences', 'reminders', 'todos', 'profile', 'school', 'class', 'classregevents'];
const privatePaths = [...APP_PAGES.map((p) => `/*/${p}/`), '/api/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
      // Allow AI crawlers to index public content — important for AI search visibility
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'anthropic-ai', 'Google-Extended', 'PerplexityBot', 'Applebot'],
        allow: '/',
        disallow: privatePaths,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
