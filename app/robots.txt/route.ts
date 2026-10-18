import { ACTIVE_LOCALES } from '@/lib/i18n/locale';
import { PROTECTED_APP_ROUTES } from '@/lib/routes';

// robots.txt, written by hand so it can carry content signals
// (https://contentsignals.org), which the metadata route cannot express.
// Public pages, the sitemap and llms.txt are open to everyone, search engines
// and AI assistants alike; the signed-in app and the API are not, except the
// public menu, which the Mensa page loads and crawlers need to render it.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';
/** What crawlers may do with the content (search, AI answers, AI training). */
const SIGNALS = process.env.CONTENT_SIGNALS ?? 'search=yes, ai-input=yes, ai-train=yes';

// Named so their access is explicit; each also follows the rules for `*`.
const SEARCH_AND_AI = [
  'Googlebot', 'Google-Extended', 'Bingbot', 'Applebot', 'Applebot-Extended', 'DuckDuckBot', 'YandexBot',
  'OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User', 'CCBot', 'Meta-ExternalAgent', 'Amazonbot', 'MistralAI-User',
  'DuckAssistBot', 'cohere-ai', 'YouBot',
];

const ALLOW = ['/', '/api/mensa'];
const DISALLOW = ['/api/', ...ACTIVE_LOCALES.flatMap((l) => PROTECTED_APP_ROUTES.map((r) => `/${l}${r}/`))];

function group(agents: string[]): string {
  return [
    ...agents.map((a) => `User-agent: ${a}`),
    `Content-Signal: ${SIGNALS}`,
    ...ALLOW.map((p) => `Allow: ${p}`),
    ...DISALLOW.map((p) => `Disallow: ${p}`),
  ].join('\n');
}

export function GET() {
  const body = [
    '# POKYH, the free app for WebUntis. Public pages are open to search engines and AI assistants.',
    '# A short summary for language models: ' + `${SITE_URL}/llms.txt`,
    '',
    group(['*']),
    '',
    group(SEARCH_AND_AI),
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
