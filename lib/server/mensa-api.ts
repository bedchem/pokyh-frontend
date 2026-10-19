// Where the Mensa data (menu, ratings, comments) is read from on the server.
// MENSA_API_URL defaults to the POKYH backend; a local development server can
// point it at the live backend to show the real menu. Public reads go through
// the app's own routes (app/api/mensa/*), so no browser needs CORS access.

import 'server-only';
import { cookies } from 'next/headers';

const trim = (v: string) => v.replace(/\/$/, '');
const BACKEND_URL = trim(process.env.API_BACKEND_URL ?? 'https://api.pokyh.com');
export const MENSA_API_URL = trim(process.env.MENSA_API_URL?.trim() || BACKEND_URL);
const API_KEY = process.env.MENSA_API_KEY ?? process.env.API_BACKEND_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? '';

/** GET/POST a Mensa endpoint; the signed-in account is passed on only to its own backend. */
export async function mensaFetch(path: string, init: { method?: 'GET' | 'POST'; body?: unknown } = {}): Promise<Response> {
  const token = MENSA_API_URL === BACKEND_URL ? (await cookies()).get('pokyh_api_token')?.value : undefined;
  return fetch(`${MENSA_API_URL}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
}

/**
 * The public menu for the prerendered Mensa page: no account, kept for ten
 * minutes (the page is regenerated as often). Null when the backend can't be
 * reached; the page then loads the menu in the browser, as before.
 */
export async function publicMenu(): Promise<unknown | null> {
  try {
    const res = await fetch(`${MENSA_API_URL}/dishes`, {
      headers: { Accept: 'application/json', ...(API_KEY ? { 'X-API-Key': API_KEY } : {}) },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** The backend's answer passed on as JSON, or a clean error. */
export async function relay(res: Response, cache = 'private, no-store'): Promise<Response> {
  if (!res.ok) return Response.json({ error: 'unavailable' }, { status: res.status >= 500 ? 502 : res.status, headers: { 'Cache-Control': 'no-store' } });
  return Response.json(await res.json(), { headers: { 'Cache-Control': cache } });
}
