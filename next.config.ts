import type { NextConfig } from 'next';

const securityHeaders = [
  // HSTS: force HTTPS for 2 years, include subdomains, preload
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // No embedding in iframes (prevents clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Strict referrer policy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable unused browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()',
  },
  // Cross-Origin Opener Policy
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // Cross-Origin Resource Policy
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  // XSS Protection (legacy browsers)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

const nextConfig: NextConfig = {
  output: 'standalone',

  // Allow LAN devices to access the dev server (e.g. mobile testing)
  allowedDevOrigins: ['192.168.178.90', '192.168.178.*'],

  // Security headers on all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Cache static API response (Mensa)
      {
        source: '/api/mensa',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=7200' }],
      },
    ];
  },

  // Enable gzip/brotli compression
  compress: true,

  // Disable X-Powered-By header (don't leak Next.js version)
  poweredByHeader: false,

  images: {
    // Allow external images from mensa API
    remotePatterns: [
      { protocol: 'https', hostname: 'mensa.plattnericus.dev' },
      { protocol: 'https', hostname: '*.plattnericus.dev' },
    ],
    // Modern formats for better performance
    formats: ['image/avif', 'image/webp'],
  },

  // Enable React strict mode for better debugging
  reactStrictMode: true,
};

export default nextConfig;
