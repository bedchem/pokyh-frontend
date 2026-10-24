// Signing in with the app key of a WebUntis account: the way in for schools
// that sign their people in with Office 365, who have no WebUntis password.
// WebUntis shows every account its key under Profil → Freigaben → "Zugriff
// über Untis Mobile" → Anzeigen, as a QR code and a table (Schule, URL,
// Benutzer, Schlüssel); the API signs in with the one-time code of the moment
// (pokyh-backend, src/webuntis/appKey.ts). Pure, tested on its own
// (tests/app-access.test.mjs).

type School = { loginName: string; server: string };

/** The school's WebUntis sign-in page, with its "Office 365 Anmeldung" button. */
export function webuntisLoginUrl(school: School): string {
  return `https://${school.server}/WebUntis/?school=${encodeURIComponent(school.loginName)}#/basic/login`;
}

/** The profile in WebUntis, where the "Freigaben" tab shows the key. */
export function webuntisProfileUrl(school: School): string {
  return `https://${school.server}/WebUntis/?school=${encodeURIComponent(school.loginName)}#/basic/profile`;
}

/** The key as WebUntis shows it, normalised; '' when it is not one. */
export function normaliseAppKey(text: string): string {
  const key = text.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
  return /^[A-Z2-7]{16,128}$/.test(key) ? key : '';
}

/** Whether a "password" is in fact an app key (a browser filling in what was saved for the key). */
export function looksLikeAppKey(text: string): boolean {
  return /^[A-Z2-7]{16,128}$/.test(text.trim());
}

// The table's row names in WebUntis' languages (IDC_BENUTZER, LBL_SHARED_SECRET).
const USER_LABEL = /(?:^|\n)\s*(?:Benutzer|User|Utente)\s*:?[ \t]*([^\s]+)/i;
const KEY_LABEL = /(?:^|\n)\s*(?:Schlüssel|Key|Chiave)\s*:?[ \t]*([A-Za-z2-7 =-]{16,})/i;

/**
 * User and key out of whatever was pasted: the key alone, WebUntis' table
 * copied whole, or the QR code's link (untis://setschool?…&user=…&key=…).
 */
export function parseAppAccess(text: string): { user?: string; key?: string } {
  const pasted = text.trim();
  const link = pasted.match(/untis:\/\/setschool\?(\S+)/i);
  if (link) {
    const params = new URLSearchParams(link[1]);
    const key = normaliseAppKey(params.get('key') ?? '');
    const user = params.get('user')?.trim();
    return { ...(user ? { user } : {}), ...(key ? { key } : {}) };
  }
  const labelled = pasted.match(KEY_LABEL);
  if (labelled) {
    const key = normaliseAppKey(labelled[1].split('\n')[0]);
    const user = pasted.match(USER_LABEL)?.[1];
    return { ...(user ? { user } : {}), ...(key ? { key } : {}) };
  }
  const key = normaliseAppKey(pasted);
  return key ? { key } : {};
}
