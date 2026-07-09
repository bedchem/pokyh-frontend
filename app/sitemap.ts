import type { MetadataRoute } from 'next';

const FALLBACK_SITE_URL = 'https://pokyh.com';

function resolveSiteUrl(): string {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!rawSiteUrl) {
    return FALLBACK_SITE_URL;
  }

  try {
    const parsedUrl = new URL(rawSiteUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const isLocalhost =
      hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1' || hostname.endsWith('.local');

    if (parsedUrl.protocol !== 'https:' || isLocalhost) {
      return FALLBACK_SITE_URL;
    }

    return parsedUrl.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

const SITE_URL = resolveSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date('2026-05-06'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date('2026-05-06'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/get`,
      lastModified: new Date('2026-05-06'),
      changeFrequency: 'monthly',
      priority: 0.90,
    },
    {
      url: `${SITE_URL}/get/ios`,
      lastModified: new Date('2026-05-06'),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/get/android`,
      lastModified: new Date('2026-05-06'),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/get/pwa/ios`,
      lastModified: new Date('2026-05-07'),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/get/pwa/android`,
      lastModified: new Date('2026-05-07'),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/howto`,
      lastModified: new Date('2026-05-06'),
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date('2026-05-06'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date('2026-05-06'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/comparison`,
      lastModified: new Date('2026-05-06'),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/legal`,
      lastModified: new Date('2026-04-15'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal?view=impressum`,
      lastModified: new Date('2026-04-15'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/legal?view=datenschutz`,
      lastModified: new Date('2026-04-15'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
