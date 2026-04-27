interface CacheEntry<T = unknown> {
  data: T;
  ts: number;
}

const STALE_MS = 5 * 60 * 1000; // 5 minutes
const store = new Map<string, CacheEntry>();

export function cacheGet<T>(key: string): T | undefined {
  return (store.get(key) as CacheEntry<T> | undefined)?.data;
}

export function cacheSet<T>(key: string, data: T): void {
  store.set(key, { data, ts: Date.now() });
}

export function cacheIsStale(key: string): boolean {
  const e = store.get(key);
  return !e || Date.now() - e.ts > STALE_MS;
}

export function cacheDel(key: string): void {
  store.delete(key);
}

export function cacheClear(): void {
  store.clear();
}
