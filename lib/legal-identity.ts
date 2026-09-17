import 'server-only';

/**
 * Public operator data is deliberately configured at deployment time rather
 * than scattered through legal copy. POKYH has no registered company today and
 * is a free, ad-free, non-commercial project — the identity is the operating
 * private individual.
 *
 * What is published, and why:
 * - Name: required. GDPR Art. 13(1)(a) demands the controller's identity, and
 *   for a private individual that is their name.
 * - Contact: an e-mail address provides the "contact details" of Art. 13.
 * - Postal address: not published by default. The address duty of
 *   D.Lgs. 70/2003 Art. 7 targets services provided as an economic activity.
 *   If POKYH is ever monetised or incorporated, set LEGAL_ADDRESS_LINE_* (and
 *   the company fields) before that release.
 */
export type LegalIdentity = {
  name: string;
  addressLines: string[];
  contactEmail: string;
  privacyEmail: string;
  legalRepresentative: string;
  vatId: string;
  companyRegister: string;
  reaNumber: string;
  pec: string;
  isCompanyRegistrationComplete: boolean;
};

function configured(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

export function getLegalIdentity(): LegalIdentity {
  const legalRepresentative = configured('LEGAL_REPRESENTATIVE');
  const vatId = configured('LEGAL_VAT_ID');
  const companyRegister = configured('LEGAL_COMPANY_REGISTER');

  return {
    // No company is registered behind POKYH — it's operated by a private
    // individual — so the fallback must be a natural person's name, never a
    // company form like "GmbH" (a protected legal designation; claiming it
    // without an actual registered company is itself misleading/unlawful).
    // Registry details intentionally have no invented fallback.
    name: configured('LEGAL_ENTITY_NAME', 'Felix Plattner'),
    addressLines: [
      configured('LEGAL_ADDRESS_LINE_1'),
      configured('LEGAL_ADDRESS_LINE_2'),
    ].filter(Boolean),
    contactEmail: configured('LEGAL_CONTACT_EMAIL', 'contact@pokyh.com'),
    privacyEmail: configured('LEGAL_PRIVACY_EMAIL', configured('LEGAL_CONTACT_EMAIL', 'contact@pokyh.com')),
    legalRepresentative,
    vatId,
    companyRegister,
    reaNumber: configured('LEGAL_REA_NUMBER'),
    pec: configured('LEGAL_PEC'),
    isCompanyRegistrationComplete: Boolean(legalRepresentative && vatId && companyRegister),
  };
}
