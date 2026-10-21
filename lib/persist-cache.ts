const PREFIX = 'pokyh_cache_';
const TTL_MS = 5 * 60 * 1000;

function ls(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; }
  catch { return null; }
}

export function pcGetStale<T>(url: string): T | undefined {
  const s = ls();
  if (!s) return undefined;
  try {
    const raw = s.getItem(PREFIX + url);
    if (!raw) return undefined;
    return (JSON.parse(raw) as { data: T }).data;
  } catch { return undefined; }
}

/** Like `pcGetStale`, but also returns when the copy was saved (epoch ms). */
export function pcGetWithTs<T>(url: string): { data: T; ts: number } | undefined {
  const s = ls();
  if (!s) return undefined;
  try {
    const raw = s.getItem(PREFIX + url);
    if (!raw) return undefined;
    return JSON.parse(raw) as { data: T; ts: number };
  } catch { return undefined; }
}

export function pcIsStale(url: string): boolean {
  const s = ls();
  if (!s) return true;
  try {
    const raw = s.getItem(PREFIX + url);
    if (!raw) return true;
    const { ts } = JSON.parse(raw) as { ts: number };
    return Date.now() - ts > TTL_MS;
  } catch { return true; }
}

export function pcSet<T>(url: string, data: T): void {
  const s = ls();
  if (!s) return;
  try { s.setItem(PREFIX + url, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* quota exceeded */ }
}

/** The addresses of everything stored, oldest first. */
export function pcUrls(): string[] {
  const s = ls();
  if (!s) return [];
  const out: { url: string; ts: number }[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (!k?.startsWith(PREFIX)) continue;
    const url = k.slice(PREFIX.length);
    out.push({ url, ts: pcGetWithTs(url)?.ts ?? 0 });
  }
  return out.sort((a, b) => a.ts - b.ts).map((e) => e.url);
}

export function pcDel(url: string): void {
  ls()?.removeItem(PREFIX + url);
}

export function pcClear(): void {
  const s = ls();
  if (!s) return;
  const keys: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => s.removeItem(k));
}
