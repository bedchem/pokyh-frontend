// Background preloading of subject header images, so a lesson's photo is already there when its
// detail sheet opens — whichever screen the user happens to be on when the app starts.
//
// The backend only accepts the API key as an X-API-Key header on these routes, so images are always
// fetched via fetch() and shown as blob URLs — never by pointing an <img> at the network URL.

const CACHE_NAME = 'pokyh-subject-images-v2';
const CONCURRENCY = 3;

const objectUrls = new Map<string, string>();
const inflight = new Map<string, Promise<Blob | null>>();

function hasCacheStorage(): boolean {
  return typeof window !== 'undefined' && 'caches' in window;
}

/** The key the backend files a subject's image under. */
export function subjectImageKey(subjectLong: string, subjectName: string): string {
  return (subjectLong || subjectName || '').toLowerCase().trim();
}

async function download(url: string): Promise<Blob | null> {
  const { api } = await import('@/lib/api-client');
  const res = await api.subjectImages.fetchImage(url);
  if (!res.ok) return null;
  if (hasCacheStorage()) {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(url, res.clone());
    } catch { /* quota or private mode — the in-memory blob URL still works */ }
  }
  return res.blob();
}

async function loadBlob(url: string): Promise<Blob | null> {
  if (hasCacheStorage()) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(url);
      if (hit) return hit.blob();
    } catch { /* fall through to network */ }
  }
  let p = inflight.get(url);
  if (!p) {
    p = download(url).catch(() => null).finally(() => inflight.delete(url));
    inflight.set(url, p);
  }
  return p;
}

async function preloadOne(url: string): Promise<void> {
  if (objectUrls.has(url)) return;
  await loadBlob(url);
}

/** Downloads every image the backend has for these subjects, a few at a time, in the background. */
export async function preloadSubjectImages(
  subjects: Array<{ subjectName: string; subjectLong: string }>,
): Promise<void> {
  if (typeof window === 'undefined') return;
  const { api } = await import('@/lib/api-client');
  const available = await api.subjectImages.getCache();
  const urls = [...new Set(subjects.map(s => subjectImageKey(s.subjectLong, s.subjectName)))]
    .filter(key => key && available.has(key))
    .map(key => api.subjectImages.imageUrl(key));

  let i = 0;
  const worker = async () => {
    while (i < urls.length) await preloadOne(urls[i++]);
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
}

/** A blob URL for the image (from the persistent cache or freshly downloaded), or null if unavailable. */
export async function resolveSubjectImageSrc(url: string): Promise<string | null> {
  const known = objectUrls.get(url);
  if (known) return known;
  const blob = await loadBlob(url);
  if (!blob) return null;
  const objectUrl = objectUrls.get(url) ?? URL.createObjectURL(blob);
  objectUrls.set(url, objectUrl);
  return objectUrl;
}
