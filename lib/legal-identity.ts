import 'server-only';

/**
 * Public operator data is deliberately configured at deployment time rather
 * than scattered through legal copy. POKYH has no registered company today and
 * is a free, ad-free, non-commercial project; the controller is the operating
 * private individual.
 *
 * What is published, and why:
 * - Operator: "POKYH" everywhere (LEGAL_OPERATOR_NAME).
 * - Controller name: required once, in the privacy notice. GDPR Art. 13(1)(a)
 *   demands the controller's identity, and for a private individual that is
 *   their name (LEGAL_ENTITY_NAME). Nowhere else.
 * - Contact: an e-mail address provides the "contact details" of Art. 13.
 * - Postal address: not published (owner's decision of 17 Oct 2026). The
 *   address duty of D.Lgs. 70/2003 Art. 7 targets services provided as an
 *   economic activity. If POKYH is ever monetised or incorporated, set
 *   LEGAL_ADDRESS_LINE_* (and the company fields) before that release.
 */
export type LegalIdentity = {
  /** The name the service is offered under (imprint, footer, metadata). */
  operator: string;
  /** The natural person (or, once incorporated, the entity) responsible under the GDPR. */
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

/**
 * The controller's name comes from the deployment only (LEGAL_ENTITY_NAME),
 * never from the code. A production build without it stops: it would publish
 * a privacy notice that names no controller.
 */
function controllerName(): string {
  const name = configured('LEGAL_ENTITY_NAME');
  if (!name && process.env.NODE_ENV === 'production') {
    throw new Error(
      'LEGAL_ENTITY_NAME is not set. The privacy notice must name the controller (GDPR Art. 13(1)(a)): ' +
        'set it in .env.local or in the build environment (a build argument for Docker).',
    );
  }
  return name;
}

export function getLegalIdentity(): LegalIdentity {
  const legalRepresentative = configured('LEGAL_REPRESENTATIVE');
  const vatId = configured('LEGAL_VAT_ID');
  const companyRegister = configured('LEGAL_COMPANY_REGISTER');

  return {
    operator: configured('LEGAL_OPERATOR_NAME', 'POKYH'),
    // No company is registered behind POKYH (a private individual runs it),
    // so this must be a natural person's name, never a company form like
    // "GmbH" or "S.r.l." (protected designations; claiming one without a
    // registered company would itself be misleading). Registry details
    // intentionally have no invented fallback.
    name: controllerName(),
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
