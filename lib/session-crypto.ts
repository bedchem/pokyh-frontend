// AES-GCM session encryption – works in both Node.js and Edge runtimes

const SECRET = process.env.SESSION_SECRET ?? 'pockyh-default-secret-change-me!';

let _cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;
  const raw = new TextEncoder().encode(SECRET.slice(0, 32).padEnd(32, '0'));
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
