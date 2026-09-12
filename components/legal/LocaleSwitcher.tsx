import Link from 'next/link';

export type LegalLocale = 'de' | 'en' | 'it';
export type LegalView = 'impressum' | 'datenschutz' | 'cookies' | 'learn';

export const LEGAL_LOCALES: LegalLocale[] = ['it', 'de', 'en'];

export function legalLocale(value?: string): LegalLocale {
  return value === 'de' || value === 'en' ? value : 'it';
}

/**
 * Locale switcher for the legal notice views. Reads the current locale from
 * the parent (already resolved server-side from the `?lang=` query param) and
 * writes it back via plain links, preserving the current `?view=`.
 */
export default function LocaleSwitcher({
  view,
  locale,
  ariaLabel = 'Language',
}: {
  view: LegalView;
  locale: LegalLocale;
  ariaLabel?: string;
}) {
  return (
    <nav className="flex gap-2 text-xs" aria-label={ariaLabel}>
      {LEGAL_LOCALES.map((item) => (
        <Link
          key={item}
          href={`/legal?view=${view}&lang=${item}`}
          className="rounded-lg px-2 py-1 font-semibold"
          style={{
            background: item === locale ? 'var(--app-card-alt)' : 'transparent',
            color: 'var(--app-text-secondary)',
          }}
        >
          {item.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
