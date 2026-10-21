// The public Mensa data for the prerendered Mensa page, read once when the
// website is built (it is a static page). The browser loads the current menu
// from the API on top, so the built copy only has to be good for search
// engines and the first paint. MENSA_API_URL defaults to the POKYH API.

import 'server-only';

const trim = (v: string) => v.replace(/\/$/, '');
const BACKEND_URL = trim(process.env.API_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_BACKEND_URL ?? 'https://api.pokyh.com');
export const MENSA_API_URL = trim(process.env.MENSA_API_URL?.trim() || BACKEND_URL);
const API_KEY = process.env.MENSA_API_KEY ?? process.env.API_BACKEND_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? '';

/** A public read; null when the backend can't answer (the page then loads the menu in the browser). */
async function publicRead(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${MENSA_API_URL}${path}`, {
      headers: { Accept: 'application/json', ...(API_KEY ? { 'X-API-Key': API_KEY } : {}) },
      cache: 'force-cache',
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** The public menu (the default school's) for the prerendered Mensa page. */
export function publicMenu(): Promise<unknown | null> {
  return publicRead('/dishes');
}

/** The canteens to choose from on the public Mensa page; null when the backend can't say (an older one has no list). */
export function publicCanteens(): Promise<unknown | null> {
  return publicRead('/dishes/canteens');
}
