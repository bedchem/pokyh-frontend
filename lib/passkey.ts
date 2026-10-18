const DECLINED_COOKIE = 'passkey_declined';
const LEGACY_SESSION_KEY = 'pokyh_creds';

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

/**
 * Earlier versions kept the sign-in in the tab's sessionStorage; it lives in
 * cookies only now (lib/server/sign-in-cookies.ts). Removes the old copy.
 */
export function forgetTabCredentials(): void {
  try { sessionStorage.removeItem(LEGACY_SESSION_KEY); } catch { /* storage blocked */ }
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
