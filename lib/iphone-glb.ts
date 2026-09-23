// Single shared download of the landing-page iPhone model.
//
// The request matches the <link rel="preload" as="fetch" crossorigin> emitted by
// LandingClient, so the browser reuses the bytes already in flight from the HTML
// instead of downloading twice. The worker then gets the buffer via postMessage
// (a worker's own fetch can't see the page's preload cache).

// Bump ?v= whenever the file changes: /models/* is served as immutable for a year.
export const IPHONE_GLB_URL = '/models/iphone.glb?v=2';

let pending: Promise<ArrayBuffer> | null = null;
let lastProgress = 0;
const listeners = new Set<(v: number) => void>();

/** Subscribe to download progress (0→1). Fires immediately with the current value. */
export function onIphoneGlbProgress(cb: (v: number) => void): () => void {
  listeners.add(cb);
  cb(lastProgress);
  return () => { listeners.delete(cb); };
}

function emit(v: number) {
  lastProgress = v;
  for (const cb of listeners) cb(v);
}

export function loadIphoneGlb(): Promise<ArrayBuffer> {
  if (pending) return pending;
  pending = (async () => {
    const res = await fetch(IPHONE_GLB_URL, { mode: 'cors', credentials: 'same-origin', priority: 'high' } as RequestInit);
    if (!res.ok) throw new Error(`GLB ${res.status}`);
    const total = Number(res.headers.get('Content-Length')) || 0;
    if (!res.body || !total) {
      const buf = await res.arrayBuffer();
      emit(1);
      return buf;
    }
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      emit(Math.min(0.99, loaded / total));
    }
    const out = new Uint8Array(loaded);
    let offset = 0;
    for (const c of chunks) { out.set(c, offset); offset += c.length; }
    emit(1);
    return out.buffer;
  })();
  // Let a later mount retry if the network failed.
  pending.catch(() => { pending = null; lastProgress = 0; });
  return pending;
}
