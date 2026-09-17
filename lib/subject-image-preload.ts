// Background preloading of subject header images, so a lesson's photo is already there when its
// detail sheet opens — whichever screen the user happens to be on when the app starts.

const CACHE_NAME = 'pokyh-subject-images-v1';
const CONCURRENCY = 3;

const objectUrls = new Map<string, string>();
const done = new Set<string>();

function hasCacheStorage(): boolean {
  return typeof window !== 'undefined' && 'caches' in window;
}

/** The key the backend files a subject's image under. */
export function subjectImageKey(subjectLong: string, subjectName: string): string {
  return (subjectLong || subjectName || '').toLowerCase().trim();
}

async function preloadOne(url: string): Promise<void> {
  if (done.has(url)) return;
  done.add(url);
  try {
    if (hasCacheStorage()) {
      const cache = await caches.open(CACHE_NAME);
      if (await cache.match(url)) return;
      try {
        const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
        if (res.ok) {
          await cache.put(url, res);
          return;
        }
      } catch {
        // CORS or network — fall through to the plain <img> preload below.
      }
    }
    // Warms the HTTP cache (the backend sends max-age=86400).
    await new Promise<void>(resolve => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });
  } catch {
    done.delete(url);
  }
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
    .map(key => api.subjectImages.imageUrl(key))
    .filter(url => !done.has(url));

  let i = 0;
  const worker = async () => {
    while (i < urls.length) await preloadOne(urls[i++]);
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
}

/** A src for the image: a blob URL from the persistent cache when we have it, else the network URL. */
export async function resolveSubjectImageSrc(url: string): Promise<string> {
  const known = objectUrls.get(url);
  if (known) return known;
  if (!hasCacheStorage()) return url;
  try {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(url);
    if (!hit) {
      void preloadOne(url);
      return url;
    }
    const objectUrl = URL.createObjectURL(await hit.blob());
    objectUrls.set(url, objectUrl);
    return objectUrl;
  } catch {
    return url;
  }
}
