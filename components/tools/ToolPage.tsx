import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import CtaBand from '@/components/site/CtaBand';
import type { FaqItem } from '@/components/site/PageJsonLd';
import { makeT } from '@/lib/i18n/dictionary';
import type { Locale } from '@/lib/i18n/locale';
import { localeAlternates, localizedUrl, ogImage, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { toolsDict, type ToolsKey } from '@/lib/i18n/dictionaries/tools';
import { SITE_URL } from '@/lib/site-url';

// The frame of the calculator pages (app/[lang]/(site)/tools): metadata,
// structured data (breadcrumb, FAQ, the calculator as a free web app), the
// questions and the way into POKYH. The explanations are server-rendered, so
// search engines and AI answers read them without running the calculator.

export const TOOLS_PATH = '/tools';

type Copy = { title: ToolsKey; description: ToolsKey; ogTitle?: ToolsKey; ogDescription?: ToolsKey };

export function toolMetadata(locale: Locale, path: string, copy: Copy, keywords: Partial<Record<Locale, string[]>>): Metadata {
  const t = makeT(toolsDict, locale);
  const ogTitle = t(copy.ogTitle ?? copy.title);
  const ogDescription = t(copy.ogDescription ?? copy.description);
  return {
    title: { absolute: t(copy.title) },
    description: t(copy.description),
    keywords: [...(keywords[locale] ?? []), ...pageKeywords(locale).slice(0, 6)],
    alternates: localeAlternates(SITE_URL, locale, path),
    openGraph: {
      images: ogImage(locale),
      title: ogTitle,
      description: ogDescription,
      url: localizedUrl(SITE_URL, locale, path),
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
    twitter: { card: 'summary_large_image', title: ogTitle, description: ogDescription, images: ogImage(locale).map((i) => i.url) },
  };
}

/** The calculator itself, described as the free browser tool it is (no ratings). */
export function calculatorApp(locale: Locale, path: string, name: string, description: string) {
  return {
    '@type': 'WebApplication',
    name,
    description,
    url: localizedUrl(SITE_URL, locale, path),
    inLanguage: locale,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function ToolHeader({ title, lead, crumbs }: { title: string; lead: string; crumbs: { label: string; href?: string }[] }) {
  return (
    <header className="wrap pb-10 pt-32 md:pb-14 md:pt-44">
      <nav aria-label="Breadcrumb" className="rise mb-6 text-[14px] font-semibold text-ink-3">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {crumbs.map((c, i) => (
            <li key={c.label} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {c.href ? <Link href={c.href} className="transition-colors hover:text-ink">{c.label}</Link> : <span aria-current="page" className="text-ink-2">{c.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <h1 className="rise max-w-[16ch] text-[clamp(40px,6.6vw,88px)] font-extrabold leading-[1.03] tracking-[-0.05em] [animation-delay:60ms]">{title}</h1>
      <p className="rise mt-6 max-w-[58ch] text-[18px] leading-[1.6] text-ink-2 md:text-[20px] [animation-delay:120ms]">{lead}</p>
    </header>
  );
}

export function ToolSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="wrap pb-16 md:pb-24">
      <h2 id={id} className="max-w-[24ch] text-[clamp(28px,3.4vw,44px)] font-extrabold leading-[1.06] tracking-[-0.045em]">{title}</h2>
      <div className="mt-6 flex max-w-[68ch] flex-col gap-4 text-[17px] leading-[1.65] text-ink-2 md:text-[18px]">{children}</div>
    </section>
  );
}

export function FaqSection({ title, faq }: { title: string; faq: FaqItem[] }) {
  return (
    <section aria-labelledby="faq" className="wrap pb-20 md:pb-28">
      <h2 id="faq" className="text-[clamp(28px,3.4vw,44px)] font-extrabold leading-[1.06] tracking-[-0.045em]">{title}</h2>
      <div className="mt-8 flex flex-col gap-3">
        {faq.map((f) => (
          <details key={f.q} id={f.id} className="card group scroll-mt-28 p-6 md:px-8">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[18px] font-bold tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
              {f.q}
              <ArrowRight size={18} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3 transition-transform group-open:rotate-90" />
            </summary>
            <p className="mt-4 max-w-[68ch] text-[16px] leading-[1.65] text-ink-2">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ToolCta({ locale }: { locale: Locale }) {
  const t = makeT(toolsDict, locale);
  return (
    <CtaBand
      title={t('ctaTitle')}
      lead={t('ctaLead')}
      primary={{ label: t('ctaButton'), href: '/login' }}
      secondary={{ label: t('ctaSecondary'), href: '/webuntis' }}
      tone="sage"
    />
  );
}
