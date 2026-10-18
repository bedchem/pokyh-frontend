const DECLINED_COOKIE = 'passkey_declined';
const SESSION_KEY = 'pokyh_creds';

export function hasDeclinedPasskey(): boolean {
  if (typeof document === 'undefined') return false;
  return /(?:^|;\s*)passkey_declined=true/.test(document.cookie);
}

export function setPasskeyDeclined(): void {
  document.cookie = `${DECLINED_COOKIE}=true; max-age=${365 * 24 * 60 * 60}; path=/; samesite=strict`;
}

export function clearPasskeyDeclined(): void {
  document.cookie = `${DECLINED_COOKIE}=; max-age=0; path=/; samesite=strict`;
}

export function isPasswordCredentialSupported(): boolean {
  return typeof window !== 'undefined' && 'PasswordCredential' in window;
}

export type CredentialSchool = { loginName: string; server: string; name?: string };

/**
 * Keeps the sign-in for this tab only (sessionStorage, gone when the tab
 * closes), so an expired WebUntis session can be renewed at the same school.
 * Without `school`, the school stored before is kept (password change).
 */
export function saveSessionCredentials(username: string, password: string, school?: CredentialSchool): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const s = school ?? getSessionCredentials()?.school;
    sessionStorage.setItem(SESSION_KEY, btoa(unescape(encodeURIComponent(JSON.stringify({ u: username, p: password, ...(s ? { s } : {}) })))));
  } catch { /* ignore */ }
}

export function getSessionCredentials(): { username: string; password: string; school?: CredentialSchool } | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { u, p, s } = JSON.parse(decodeURIComponent(escape(atob(raw))));
    const school = s && typeof s.loginName === 'string' && typeof s.server === 'string'
      ? { loginName: s.loginName, server: s.server, ...(typeof s.name === 'string' ? { name: s.name } : {}) }
      : undefined;
    return { username: String(u), password: String(p), ...(school ? { school } : {}) };
  } catch {
    return null;
  }
}

export function clearSessionCredentials(): void {
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(SESSION_KEY);
}

export async function storePasswordCredential(username: string, password: string): Promise<boolean> {
  if (!isPasswordCredentialSupported()) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PC = (window as any).PasswordCredential;
    const cred = new PC({ id: username, password, name: username });
    await navigator.credentials.store(cred);
    return true;
  } catch {
    return false;
  }
}

export async function getPasswordCredential(): Promise<{ username: string; password: string } | null> {
  if (!isPasswordCredentialSupported()) return null;
  try {
    const cred = await navigator.credentials.get({
      password: true,
      mediation: 'silent',
    } as CredentialRequestOptions);
    if (!cred || !('password' in cred)) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pc = cred as any;
    if (!pc.password) return null;
    return { username: pc.id ?? '', password: pc.password };
  } catch {
    return null;
  }
}
