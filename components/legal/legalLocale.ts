// The legal texts (imprint, privacy notice, cookies, Pokyh Learn) exist in
// Italian, German and English only. Someone browsing Pokyh in Ladin reads them
// in the language their device asks for (German, Italian or English) and in
// English when it asks for none of these; the rest of the site stays Ladin.
export type LegalLocale = 'de' | 'en' | 'it';
export type LegalView = 'impressum' | 'datenschutz' | 'cookies' | 'learn' | 'landing';

export const LEGAL_LOCALES: LegalLocale[] = ['it', 'de', 'en'];

export function isLegalLocale(value: string | null | undefined): value is LegalLocale {
  return value === 'de' || value === 'en' || value === 'it';
}

/**
 * The first language of an Accept-Language header ("de-AT,de;q=0.9,en;q=0.8")
 * that the legal texts exist in, by the device's own order of preference.
 */
export function deviceLegalLocale(acceptLanguage: string | null | undefined): LegalLocale | null {
  const ranked = (acceptLanguage ?? '')
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const weight = q ? Number(q.slice(2)) : 1;
      return { code: tag.trim().toLowerCase().split('-')[0] ?? '', weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((entry) => entry.code && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  return ranked.map((entry) => entry.code).find(isLegalLocale) ?? null;
}

/** The language a legal text is shown in for a page or query locale. */
export function legalLocale(value: string | null | undefined, acceptLanguage?: string | null): LegalLocale {
  if (isLegalLocale(value)) return value;
  return deviceLegalLocale(acceptLanguage) ?? 'en';
}
