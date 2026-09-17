// Background preloading of subject header images, so a lesson's photo is already there when its
// detail sheet opens — whichever screen the user happens to be on when the app starts.
//
// The backend only accepts the API key as an X-API-Key header on these routes, so images are always
// fetched via fetch() and shown as blob URLs — never by pointing an <img> at the network URL.
//
// Every image is checked against the server once per page load (a cheap 304 when unchanged), so an
// image replaced in the admin panel reaches everyone on their next app start.

const CACHE_NAME = 'pokyh-subject-images-v3';
const OLD_CACHES = ['pokyh-subject-images-v1', 'pokyh-subject-images-v2'];
const CONCURRENCY = 3;

const objectUrls = new Map<string, string>();
// One load per image per page load; later callers share its result.
const loads = new Map<string, Promise<Blob | null>>();

function hasCacheStorage(): boolean {
  return typeof window !== 'undefined' && 'caches' in window;
}

/** The key the backend files a subject's image under. */
export function subjectImageKey(subjectLong: string, subjectName: string): string {
  return (subjectLong || subjectName || '').toLowerCase().trim();
}

async function fetchFresh(url: string): Promise<Blob | null> {
  const cache = hasCacheStorage() ? await caches.open(CACHE_NAME).catch(() => null) : null;
  const cached = cache ? await cache.match(url).catch(() => undefined) : undefined;

  let res: Response;
  try {
    const { api } = await import('@/lib/api-client');
    res = await api.subjectImages.fetchImage(url);
  } catch {
    // Offline — the cached copy is better than nothing.
    return cached ? cached.blob() : null;
  }

  if (res.status === 404) {
    await cache?.delete(url).catch(() => {});
    return null;
  }
  if (!res.ok) return cached ? cached.blob() : null;

  const unchanged = cached
    && cached.headers.get('Last-Modified')
    && cached.headers.get('Last-Modified') === res.headers.get('Last-Modified');
  if (unchanged) return cached.blob();

  await cache?.put(url, res.clone()).catch(() => { /* quota or private mode */ });
  return res.blob();
}

function loadBlob(url: string): Promise<Blob | null> {
  let p = loads.get(url);
  if (!p) {
    p = fetchFresh(url).catch(() => null);
    loads.set(url, p);
  }
  return p;
}

let oldCachesCleared = false;
function clearOldCaches(): void {
  if (oldCachesCleared || !hasCacheStorage()) return;
  oldCachesCleared = true;
  for (const name of OLD_CACHES) void caches.delete(name).catch(() => {});
}

/** Downloads every image the backend has for these subjects, a few at a time, in the background. */
export async function preloadSubjectImages(
  subjects: Array<{ subjectName: string; subjectLong: string }>,
): Promise<void> {
  if (typeof window === 'undefined') return;
  clearOldCaches();
  const { api } = await import('@/lib/api-client');
  const available = await api.subjectImages.getCache();
  const urls = [...new Set(subjects.map(s => subjectImageKey(s.subjectLong, s.subjectName)))]
    .filter(key => key && available.has(key))
    .map(key => api.subjectImages.imageUrl(key));

  let i = 0;
  const worker = async () => {
    while (i < urls.length) await loadBlob(urls[i++]);
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
}

/** A blob URL for the image (checked against the server once per page load), or null if unavailable. */
export async function resolveSubjectImageSrc(url: string): Promise<string | null> {
  const known = objectUrls.get(url);
  if (known) return known;
  const blob = await loadBlob(url);
  if (!blob) return null;
  const objectUrl = objectUrls.get(url) ?? URL.createObjectURL(blob);
  objectUrls.set(url, objectUrl);
  return objectUrl;
}
