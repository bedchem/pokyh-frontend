// Public links of the project, overridable per deployment.

/** Where the source code lives (GitHub organisation or repository). */
export const SOURCE_URL = process.env.NEXT_PUBLIC_SOURCE_URL?.trim() || 'https://github.com/bedchem';

/** Where people can support POKYH (Settings, "POKYH unterstützen"); empty hides it. */
export const SUPPORT_URL = (process.env.NEXT_PUBLIC_SUPPORT_URL ?? 'https://buymeacoffee.com/plattnericus').trim();
