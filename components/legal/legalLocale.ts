export type LegalLocale = 'de' | 'en' | 'it' | 'lld';
export type LegalView = 'impressum' | 'datenschutz' | 'cookies' | 'learn' | 'landing';

export const LEGAL_LOCALES: LegalLocale[] = ['it', 'de', 'lld', 'en'];

export function legalLocale(value?: string): LegalLocale {
  if (value === 'de' || value === 'en' || value === 'lld') return value;
  return 'it';
}
