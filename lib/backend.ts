// Where the website talks to: the POKYH API (api.pokyh.com). The website is a
// static page, so every request goes straight from the browser to the API;
// WebUntis is reached through the API's /webuntis/* routes, which hold the
// sign-in in httpOnly cookies on the API's own address.
//
// `next dev` proxies the API's paths on its own address (next.config.ts), so
// in development the requests are same-origin and the API's cookies land on
// localhost; NEXT_PUBLIC_API_DIRECT=true talks to the API directly instead.

// A production build never talks to a local API unless asked to
// (next.config.ts, NEXT_PUBLIC_API_LOCAL).
export const DEFAULT_API_URL = 'https://api.pokyh.com';

function resolveApiBase(): string {
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_API_DIRECT !== 'true') return '';
  const configured = (
    process.env.NEXT_PUBLIC_API_BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_URL
  ).replace(/\/$/, '');
  // NEXT_PUBLIC_* values are frozen into the bundle at build time: on an
  // HTTPS page an http:// API would be blocked as mixed content.
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && configured.startsWith('http://')) {
    return `https://${configured.slice('http://'.length)}`;
  }
  return configured;
}

export const API_BASE = resolveApiBase();
export const API_KEY = process.env.NEXT_PUBLIC_API_BACKEND_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? '';

/** The API address of a path (`/webuntis/timetable?…`). */
export const apiUrl = (path: string) => `${API_BASE}${path}`;

/**
 * The website's former /api/… addresses (still the keys of the data stored
 * on the device) mapped to the API: /api/webuntis/x → <API>/webuntis/x.
 */
export function untisUrl(path: string): string {
  return path.startsWith('/api/webuntis/') ? apiUrl(path.slice('/api'.length)) : path;
}

// ─── The website's own sign-in cookies ───────────────────────────────────────
// What the page needs to know about the sign-in lives in two readable cookies
// on the website's address: pokyh_user (display data: no token, no password)
// and pokyh_api_token (the short-lived access token for the Authorization
// header). The secrets — the WebUntis session, the renewal and the refresh
// token — are httpOnly cookies of the API that no page script can read.

const USER_MAX_AGE = 4 * 60 * 60;
const LOCAL_USER_MAX_AGE = 8 * 60 * 60;
const TOKEN_MAX_AGE = 8 * 60 * 60;

function writeCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Strict${secure}`;
}

export interface SignInAnswer {
  token?: string;
  user?: { isUntisUser?: boolean } & Record<string, unknown>;
}

/** Keeps what a sign-in answered: the display data and, when there is one, the access token. */
export function rememberSignIn(answer: SignInAnswer): void {
  if (answer.user) writeCookie('pokyh_user', JSON.stringify(answer.user), answer.user.isUntisUser === false ? LOCAL_USER_MAX_AGE : USER_MAX_AGE);
  if (answer.token) rememberAccessToken(answer.token);
}

export function rememberAccessToken(token: string): void {
  writeCookie('pokyh_api_token', token, TOKEN_MAX_AGE);
}

/** The website's own sign-in cookies go (the API clears its cookies on /auth/web/logout). */
export function forgetSignIn(): void {
  writeCookie('pokyh_user', '', 0);
  writeCookie('pokyh_api_token', '', 0);
}
