// Public links of the project, overridable per deployment.

/** Where the source code lives: the GitHub organisation of the project. */
export const SOURCE_URL = (process.env.NEXT_PUBLIC_SOURCE_URL?.trim() || 'https://github.com/bedchem').replace(/\/+$/, '');

/** The organisation's name as it appears in its address ("bedchem"). */
export const SOURCE_OWNER = SOURCE_URL.split('/').pop() ?? '';

/** The project's repositories, all under SOURCE_URL. */
export const REPO_URLS = {
  web: `${SOURCE_URL}/pokyh-frontend`,
  backend: `${SOURCE_URL}/pokyh-backend`,
  iosReleases: `${SOURCE_URL}/POKYH_IOS/releases`,
  androidReleases: `${SOURCE_URL}/POKYH_ANDROID/releases`,
} as const;

/** Where people can support POKYH (Settings, "POKYH unterstützen"); empty hides it. */
export const SUPPORT_URL = (process.env.NEXT_PUBLIC_SUPPORT_URL ?? 'https://buymeacoffee.com/plattnericus').trim();
