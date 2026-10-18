import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr';
import LegalToc from '@/components/legal/LegalToc';
import { legalLocale } from '@/components/legal/legalLocale';
import { getLegalIdentity, type LegalIdentity } from '@/lib/legal-identity';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, ogImage, ogLocale } from '@/lib/i18n/seo';
import {
  LEGAL_DOCS,
  LEGAL_TILES,
  LEGAL_UI,
  LEGAL_UPDATED,
  type Block,
  type CookieKind,
  type LegalDocView,
  type LegalLocale,
} from './content';
import CookieButton from './CookieButton';
import PageJsonLd from '@/components/site/PageJsonLd';
import { makeT } from '@/lib/i18n/dictionary';
import { metaDict } from '@/lib/i18n/dictionaries/meta';

// Imprint, privacy notice, terms of use, cookies and the Pokyh Learn notice.
// One page with a `?view=` per text (the iOS and Android apps link to these
// URLs). The texts live in content.ts; the identity and contact details come
// from the deployment (lib/legal-identity.ts). Legal seat: Italy.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';
const VIEWS: LegalDocView[] = ['impressum', 'datenschutz', 'nutzungsbedingungen', 'cookies', 'learn'];
const isView = (v: string | undefined): v is LegalDocView => !!v && (VIEWS as string[]).includes(v);

// The category tones of the site, one per text.
const TONE: Record<LegalDocView, string> = {
  impressum: 'bg-[var(--periwinkle)] text-[var(--periwinkle-ink)]',
  datenschutz: 'bg-[var(--sage)] text-[var(--sage-ink)]',
  nutzungsbedingungen: 'bg-[var(--butter)] text-[var(--butter-ink)]',
  cookies: 'bg-[var(--blush)] text-[var(--blush-ink)]',
  learn: 'bg-[var(--mint)] text-[var(--mint-ink)]',
};

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ view?: string; lang?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { view } = await searchParams;
  const locale = legalLocale(await routeLocale(params), (await headers()).get('accept-language'));
  const known = isView(view);
  const title = known ? LEGAL_DOCS[view][locale].title : LEGAL_UI[locale].legal;
  // The documents' leads are short; the line about POKYH tells search results what the site is.
  const about = makeT(metaDict, locale)('websiteDescription');
  const description = `${known ? LEGAL_DOCS[view][locale].lead : LEGAL_UI[locale].lead} ${about}`;
  const alternates = localeAlternates(SITE_URL, locale, '/legal');
  if (known) {
    const q = `?view=${view}`;
    alternates.canonical = `${alternates.canonical}${q}`;
    alternates.languages = Object.fromEntries(Object.entries(alternates.languages ?? {}).map(([k, v]) => [k, `${v}${q}`]));
  }
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates,
    openGraph: {
      images: ogImage(locale, 'legal'),
      title,
      description,
      type: 'website',
      siteName: 'POKYH',
      ...ogLocale(locale),
    },
  };
}

export default async function LegalPage({ params, searchParams }: Props) {
  const { view, lang } = await searchParams;
  const { lang: routeLang } = await params;
  const requested = lang ?? routeLang;
  const locale = legalLocale(requested, (await headers()).get('accept-language'));
  const identity = getLegalIdentity();
  const ui = LEGAL_UI[locale];

  const doc = isView(view) ? LEGAL_DOCS[view][locale] : null;

  return (
    <div className="wrap pb-24 pt-28 md:pb-32 md:pt-36">
      <PageJsonLd
        locale={locale}
        path="/legal"
        query={doc ? `?view=${view}` : ''}
        name={doc ? doc.title : ui.legal}
        description={doc ? doc.lead : ui.lead}
        trail={[
          { name: ui.legal, path: '/legal' },
          ...(doc ? [{ name: doc.title, path: '/legal', query: `?view=${view}` }] : []),
        ]}
      />
      {requested !== locale && (
        <p className="mb-8 max-w-[68ch] rounded-[16px] bg-inset px-4 py-3 text-[14px] text-ink-2">{ui.fallback}</p>
      )}
      {isView(view) ? (
        <LegalDocumentView view={view} locale={locale} identity={identity} />
      ) : (
        <LegalLanding locale={locale} />
      )}
    </div>
  );
}

/* ─── Overview ──────────────────────────────────────────────────────────── */

function LegalLanding({ locale }: { locale: LegalLocale }) {
  const ui = LEGAL_UI[locale];
  const tiles = LEGAL_TILES[locale];
  return (
    <>
      <h1 className="font-display text-[clamp(52px,9vw,120px)] leading-[0.92]">{ui.legal}</h1>
      <p className="mt-6 max-w-[52ch] text-[18px] leading-[1.6] text-ink-2 md:text-[20px]">{ui.lead}</p>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:mt-16">
        {VIEWS.map((v, i) => (
          <li key={v}>
            <Link
              href={`/${locale}/legal/?view=${v}`}
              className="card group flex h-full flex-col justify-between gap-10 p-6 transition-[transform,box-shadow] duration-500 ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgb(0_0_0/0.35)] md:p-8"
            >
              <span className={`grid size-12 place-items-center rounded-[16px] text-[17px] font-extrabold ${TONE[v]}`} aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <span className="flex items-center justify-between gap-4">
                  <span className="text-[22px] font-bold tracking-[-0.02em] text-ink md:text-[24px]">{tiles[v].title}</span>
                  <ArrowRight size={20} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3 transition-transform duration-500 group-hover:translate-x-1 group-hover:text-ink" />
                </span>
                <span className="mt-2 block text-[15px] leading-[1.55] text-ink-2">{tiles[v].desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-12 text-[14px] text-ink-3">{ui.updated}: {LEGAL_UPDATED[locale]}</p>
    </>
  );
}

/* ─── One legal text ───────────────────────────────────────────────────── */

function LegalDocumentView({ view, locale, identity }: { view: LegalDocView; locale: LegalLocale; identity: LegalIdentity }) {
  const doc = LEGAL_DOCS[view][locale];
  const ui = LEGAL_UI[locale];
  const tiles = LEGAL_TILES[locale];
  return (
    <>
      <Link href={`/${locale}/legal/`} className="group inline-flex items-center gap-2 text-[15px] font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft size={16} weight="bold" aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5" />
        {ui.back}
      </Link>
      <header className="mt-8 max-w-[900px]">
        <h1 className="font-display text-[clamp(44px,7vw,96px)] leading-[0.95]">{doc.title}</h1>
        <p className="mt-6 max-w-[56ch] text-[18px] leading-[1.6] text-ink-2 md:text-[19px]">{doc.lead}</p>
        <p className="mt-6 inline-flex rounded-full bg-inset px-4 py-2 text-[13px] font-semibold text-ink-2">
          {ui.updated}: {LEGAL_UPDATED[locale]}
        </p>
      </header>

      <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
        <aside>
          <LegalToc sections={doc.sections.map(({ id, title }) => ({ id, title }))} label={ui.contents} />
        </aside>
        <article className="min-w-0">
          {doc.sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-28 border-t border-line py-8 first:border-t-0 first:pt-0 md:py-10">
              <h2 id={`${s.id}-title`} className="flex items-baseline gap-4 text-[clamp(22px,2.4vw,30px)] font-bold leading-[1.15] tracking-[-0.025em] text-ink">
                <span className="w-8 shrink-0 text-[0.7em] font-semibold tabular-nums text-ink-3">{i + 1}</span>
                <span>{s.title}</span>
              </h2>
              <div className="mt-5 flex flex-col gap-4 md:pl-12">
                {s.blocks.map((b, j) => (
                  <BlockView key={j} block={b} locale={locale} identity={identity} />
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>

      <nav aria-label={ui.legal} className="mt-16 border-t border-line pt-10">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VIEWS.filter((v) => v !== view).map((v) => (
            <li key={v}>
              <Link href={`/${locale}/legal/?view=${v}`} className="card group flex items-center justify-between gap-3 px-5 py-4 text-[15px] font-semibold text-ink hover:bg-inset">
                {tiles[v].title}
                <ArrowRight size={16} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

/* ─── Blocks ───────────────────────────────────────────────────────────── */

const P = 'max-w-[68ch] text-[16px] leading-[1.75] text-ink-2 md:text-[17px]';

const KIND: Record<CookieKind, string> = {
  necessary: 'bg-[var(--sage)] text-[var(--sage-ink)]',
  setting: 'bg-[var(--periwinkle)] text-[var(--periwinkle-ink)]',
  analytics: 'bg-[var(--butter)] text-[var(--butter-ink)]',
  consent: 'bg-[var(--blush)] text-[var(--blush-ink)]',
};

function Mail({ address }: { address: string }) {
  return (
    <a href={`mailto:${address}`} className="inline-flex items-center gap-2 font-semibold text-[var(--accent-ink)] underline-offset-4 hover:underline">
      <EnvelopeSimple size={17} weight="bold" aria-hidden="true" />
      {address}
    </a>
  );
}

function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[var(--accent-ink)] underline-offset-4 hover:underline">
      {children}
      <ArrowUpRight size={13} weight="bold" aria-hidden="true" />
    </a>
  );
}

function IdentityCard({ identity, locale, role }: { identity: LegalIdentity; locale: LegalLocale; role: 'operator' | 'controller' }) {
  const ui = LEGAL_UI[locale];
  const registry = [
    [identity.legalRepresentative, identity.vatId, identity.companyRegister, identity.reaNumber, identity.pec],
  ].flat().filter(Boolean);
  return (
    <div className="max-w-[68ch] rounded-[20px] bg-inset px-5 py-4">
      <p className="text-[19px] font-bold tracking-[-0.015em] text-ink">{identity.operator}</p>
      {role === 'controller' && identity.name && identity.name !== identity.operator && (
        <p className="mt-0.5 text-[14px] text-ink-2">
          {ui.controllerBy} {identity.name} ({ui.privateIndividual})
        </p>
      )}
      {identity.addressLines.map((line) => <p key={line} className="text-[14px] text-ink-2">{line}</p>)}
      {registry.map((line) => <p key={line} className="text-[14px] text-ink-2">{line}</p>)}
      <p className="mt-2 text-[15px]"><Mail address={role === 'controller' ? identity.privacyEmail : identity.contactEmail} /></p>
    </div>
  );
}

function BlockView({ block, locale, identity }: { block: Block; locale: LegalLocale; identity: LegalIdentity }) {
  const ui = LEGAL_UI[locale];
  if ('p' in block) return <p className={P}>{block.p}</p>;
  if ('list' in block) {
    return (
      <ul className="flex max-w-[68ch] flex-col gap-2.5">
        {block.list.map((item) => (
          <li key={item} className="flex gap-3 text-[16px] leading-[1.65] text-ink-2 md:text-[17px]">
            <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-ink-3" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if ('items' in block) {
    return (
      <dl className="flex flex-col">
        {block.items.map((item) => (
          <div key={item.label} className="border-t border-line-soft py-4 first:border-t-0 first:pt-0">
            <dt className="text-[16px] font-bold text-ink">{item.label}</dt>
            <dd className="mt-1.5 max-w-[72ch] text-[15px] leading-[1.7] text-ink-2">{item.desc}</dd>
          </div>
        ))}
      </dl>
    );
  }
  if ('parties' in block) {
    return (
      <ul className="flex flex-col">
        {block.parties.map((tp) => (
          <li key={tp.name} className="flex flex-col gap-1 border-t border-line-soft py-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <span>
              <span className="block text-[16px] font-bold text-ink">{tp.name}</span>
              <span className="mt-1 block max-w-[60ch] text-[15px] leading-[1.6] text-ink-2">{tp.purpose}</span>
            </span>
            {tp.url && <span className="shrink-0 text-[14px]"><External href={tp.url}>{ui.privacyLink}</External></span>}
          </li>
        ))}
      </ul>
    );
  }
  if ('cookies' in block) {
    return (
      <ul className="flex flex-col">
        {block.cookies.map((row) => (
          <li key={row.name} className="border-t border-line-soft py-3.5 first:border-t-0 first:pt-0">
            <span className="flex flex-wrap items-center gap-2">
              <code className="rounded-[8px] bg-inset px-2 py-0.5 font-mono text-[13px] font-medium text-ink">{row.name}</code>
              <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${KIND[row.kind]}`}>{ui.cookieKinds[row.kind]}</span>
            </span>
            <span className="mt-1.5 block max-w-[72ch] text-[15px] leading-[1.65] text-ink-2">{row.desc}</span>
          </li>
        ))}
      </ul>
    );
  }
  if ('identity' in block) return <IdentityCard identity={identity} locale={locale} role={block.identity} />;
  if ('contact' in block) {
    return <p className="text-[16px]"><Mail address={block.contact === 'privacy' ? identity.privacyEmail : identity.contactEmail} /></p>;
  }
  if ('note' in block) {
    return (
      <p className="text-[15px] text-ink-2">
        <Link href={`/${locale}/legal/?view=datenschutz#verantwortlicher`} className="font-semibold text-[var(--accent-ink)] underline-offset-4 hover:underline">
          {ui.seePrivacy}
        </Link>
      </p>
    );
  }
  if ('complaint' in block) {
    return (
      <p className={P}>
        {block.complaint} <External href="https://www.garanteprivacy.it">www.garanteprivacy.it</External>
      </p>
    );
  }
  if ('mixed' in block) {
    return <p className={P}>{block.mixed[0]} <strong className="font-semibold text-ink">{block.mixed[1]}</strong> {block.mixed[2]}</p>;
  }
  if ('cookieButton' in block) return <CookieButton label={block.cookieButton} />;
  if ('optout' in block) {
    return (
      <p className={P}>
        {block.optout.prefix} <External href="https://tools.google.com/dlpage/gaoptout">{block.optout.label}</External>
      </p>
    );
  }
  if ('link' in block) {
    return (
      <p>
        <Link href={`/${locale}/legal/?view=${block.link.view}`} className="group inline-flex items-center gap-2 text-[16px] font-semibold text-[var(--accent-ink)]">
          {block.link.label}
          <ArrowRight size={16} weight="bold" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </p>
    );
  }
  if ('links' in block) {
    return (
      <ul className="flex flex-col gap-2">
        {block.links.map((l) => <li key={l.href} className="text-[15px]"><External href={l.href}>{l.label}</External></li>)}
      </ul>
    );
  }
  return null;
}
