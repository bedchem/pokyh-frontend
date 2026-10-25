import { ACTIVE_LOCALES, htmlLang, type Locale } from '@/lib/i18n/locale';
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

/**
 * The pages a summary page leads to, as a list of their addresses (Google's
 * "summary page" pattern: an ItemList of ListItems with a url each).
 */
export function pageList(locale: Locale, pages: { path: string; name: string }[]) {
  return {
    '@type': 'ItemList',
    numberOfItems: pages.length,
    itemListElement: pages.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: localizedUrl(SITE_URL, locale, p.path) })),
  };
}

/**
 * A native POKYH app as offered on its download page: free, from the
 * project's releases (lib/site-links.ts), published by the organisation of
 * the site-wide graph.
 */
export function mobileApp({ locale, path, name, description, operatingSystem, downloadUrl }: {
  locale: Locale;
  path: string;
  name: string;
  description: string;
  operatingSystem: string;
  downloadUrl: string;
}) {
  const url = localizedUrl(SITE_URL, locale, path);
  return {
    '@type': 'MobileApplication',
    '@id': `${url}#app`,
    name,
    description,
    url,
    operatingSystem,
    applicationCategory: 'EducationalApplication',
    downloadUrl,
    installUrl: downloadUrl,
    image: `${SITE_URL}/icon-512.png`,
    inLanguage: ACTIVE_LOCALES.map(htmlLang),
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export interface FaqItem {
  q: string;
  a: string;
  /** The `id` of the question on the page, so it can be linked to. */
  id?: string;
}

/**
 * Questions and answers in the shape of a FAQPage's mainEntity. With the
 * page's `url`, each question carries the address of its place on the page.
 */
export function faqEntities(faq: FaqItem[], url?: string) {
  return faq.map((f) => {
    const at = url && f.id ? { url: `${url}#${f.id}` } : {};
    return {
      '@type': 'Question',
      name: f.q,
      ...at,
      answerCount: 1,
      acceptedAnswer: { '@type': 'Answer', text: f.a, ...at },
    };
  });
}
