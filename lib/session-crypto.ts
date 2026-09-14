// AES-GCM session encryption – works in both Node.js and Edge runtimes

// A predictable encryption key would let an attacker forge or decrypt WebUntis
// session cookies. Production must fail closed instead of silently falling back
// to a known development value. Validate at first use, rather than at module
// evaluation, so a multi-stage Docker build never needs to receive a runtime
// secret. The running container must still provide a strong secret before it
// can encrypt or decrypt a session.
function getSessionSecret(): string {
  const configuredSecret = process.env.SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === 'production' && (!configuredSecret || configuredSecret.length < 32)) {
    throw new Error('SESSION_SECRET must be set to at least 32 characters in production.');
  }

  return configuredSecret || 'development-only-session-secret-do-not-use-in-production';
}

let _cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;
  const secret = getSessionSecret();
  const raw = new TextEncoder().encode(secret.slice(0, 32).padEnd(32, '0'));
  _cachedKey = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
  return _cachedKey;
}

function toBase64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromBase64url(str: string): Uint8Array {
  const pad = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = pad + '='.repeat((4 - (pad.length % 4)) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function encryptSession(data: object): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), 12);
  return toBase64url(combined);
}

export async function decryptSession<T>(token: string): Promise<T | null> {
  try {
    const key = await getKey();
    const bytes = fromBase64url(token);
    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(decrypted)) as T;
  } catch {
    return null;
  }
}
