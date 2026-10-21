import type { Locale } from '@/lib/i18n/locale';
import { localizedUrl } from '@/lib/i18n/seo';
import { pageModified } from '@/lib/seo/pages';
import { SITE_URL } from '@/lib/site-url';

// Structured data of a public page: what kind of page it is, where it sits
// (breadcrumb from the homepage), when it last changed, and that it belongs
// to the POKYH website and describes the POKYH app (the @ids of the site-wide
// graph in app/[lang]/layout.tsx). `extra` adds page-specific entities, such
// as the questions of a FAQ that the page shows.

export type PageType = 'WebPage' | 'AboutPage' | 'FAQPage' | 'CollectionPage' | 'ContactPage';

export default function PageJsonLd({
  locale,
  path,
  query = '',
  name,
  description,
  type = 'WebPage',
  trail = [],
  main,
  extra = [],
}: {
  locale: Locale;
  /** The page's path without language (`/faq`), as in lib/seo/pages.ts. */
  path: string;
  /** Query of the page's canonical URL, e.g. `?view=datenschutz`. */
  query?: string;
  name: string;
  description?: string;
  type?: PageType;
  /** Breadcrumb after the homepage, ending with this page. */
  trail?: { name: string; path: string; query?: string }[];
  /** The page's main entity (e.g. the questions of an FAQ page). */
  main?: object | object[];
  extra?: object[];
}) {
  const url = localizedUrl(SITE_URL, locale, path) + query;
  const crumbs: { name: string; path: string; query?: string }[] = [{ name: 'POKYH', path: '/' }, ...trail];
  const graph = [
    {
      '@type': type,
      '@id': `${url}#page`,
      url,
      name,
      ...(description ? { description } : {}),
      inLanguage: locale,
      dateModified: pageModified(path),
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#app` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      ...(main ? { mainEntity: main } : {}),
      ...(trail.length ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    },
    ...(trail.length
      ? [{
          '@type': 'BreadcrumbList',
          '@id': `${url}#breadcrumb`,
          itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: localizedUrl(SITE_URL, locale, c.path) + (c.query ?? '') })),
        }]
      : []),
    ...extra,
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') }}
    />
  );
}

/** Questions and answers in the shape of a FAQPage's mainEntity. */
export function faqEntities(faq: { q: string; a: string }[]) {
  return faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }));
}
