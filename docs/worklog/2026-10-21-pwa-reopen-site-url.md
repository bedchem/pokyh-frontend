# 2026-10-21 · Installed app reopened after a while; no local addresses in a build (frontend)

Factual log. No credentials, personal data or request bodies are recorded here.

## 2026-10-21 · Merge and pre-work checks

- `git fetch`; `redesign` fast-forwarded to `origin/redesign` (`7912afd`);
  `main` had no commits of its own and was fast-forwarded to `7912afd`
  locally (no merge commit, nothing pushed). No open pull requests.
- Release state: uncommitted

## 2026-10-21 · Owner report: reopening the installed app

- Report: after the app was closed for a while, reopening shows a black
  screen, then the dashboard, everything hangs, then the sign-in page, and
  signing in works only after about 3 seconds.
- Reproduced in the iOS 27.0 simulator with the app added to the home screen,
  against a production build (static export served like deploy/nginx.conf,
  the backend's answers for a run-out sign-in, 150–400 ms added per request):
  - start address `/login` → `/de/login` → `/de/login/` → sign-in page loads
    and hydrates → sends on to `/de/home/` → dashboard loads, ~15 requests
    answer 401 → renewal attempt → the sign-out request is awaited before the
    page moves on → two navigations to the sign-in page;
  - the sign-in form exists only after hydration (not in the static HTML);
  - on the sign-in page the site bar is drawn, vanishes when the page hydrates
    and fades in again (~1.5 s).
  - About 4 s between the tap and the first request belong to the
    simulator's launch of the web app itself (also without a service worker).

## 2026-10-21 · Changes

- `components/SessionScript.tsx` (root layout head, before the first paint):
  an app page without a valid sign-in (no `pokyh_user`, or older than 4 h,
  whose cookie is then removed) goes to the sign-in page, the app's Mensa to
  the public one; the sign-in page with a valid sign-in goes on to `next` or
  `/home/`.
- `providers/SessionProvider.tsx`: one way to the sign-in page
  (`leaveForLogin`, at most one navigation); an expired sign-in moves on at
  once and signs out with the API on the way; the 4-hour timer counts as
  expiry. All app pages and `AuthGuard` use `leaveForLogin`.
- `lib/api-client.ts` `signOutEverywhere`: the page's cookies go first; the
  API request is kept alive, shared, and gives up after 4 s.
  `lib/api.ts`: an expired session no longer waits for the sign-out.
- `app/manifest.ts`: start address `/home/` (new installs).
  `deploy/nginx.conf`: `/login` (start address of existing installs) goes in
  one step to `/<lang>/home/` with `pokyh_user`, otherwise to
  `/<lang>/login/`; checked with nginx 1.27 (`nginx -t`, curl).
- `components/site/SiteHeader.tsx`: no entrance animation of the bar in the
  installed app.

## 2026-10-21 · Owner request: no localhost, SEO

- Found live on www.pokyh.com: canonical, hreflang, `og:url`, `og:image`,
  `twitter:image`, JSON-LD, robots.txt and sitemap.xml named
  `http://localhost:3011` (the live bundle's API address was correct).
- `lib/site-url.ts`: one site address for all 23 places that read
  `NEXT_PUBLIC_SITE_URL`. `next.config.ts`: a production build replaces a
  local `NEXT_PUBLIC_SITE_URL` with `https://pokyh.com` and a local API
  address with `https://api.pokyh.com` (warning in the build log; the build
  still goes through; `NEXT_PUBLIC_API_LOCAL=true` keeps a local API for
  tests). README updated.
- `og:url` added to the sign-in and legal pages.
- Open for the owner: pokyh.com answers 301 to www.pokyh.com (Cloudflare),
  while the canonical address is pokyh.com; either the redirect goes the
  other way or `NEXT_PUBLIC_SITE_URL` is set to the www address.

## 2026-10-21 · Verification

- `tsc --noEmit`, ESLint (changed files), `npm test` 49/49, `next build`
  (static export) with the development env file: no local address in `out/`.
- Inline script: 18 cases in Node (signed in/out, expired, `next` with `//`
  and `https://`, Mensa, public pages).
- SEO audit of the export: 67 indexable pages with self-referencing
  canonical, reciprocal hreflang with x-default, one h1, image alt texts,
  valid JSON-LD, sitemap matching the pages.
- Simulator, production build, 300–400 ms: existing install with a sign-in
  the server no longer knows: one step to the dashboard, one navigation to
  the sign-in page; new install signed out: sign-in page without the
  dashboard being drawn; sign-out with an unreachable API ends after 4 s
  (before: waited without end); the start request carries `pokyh_user`.
- Not checked: a real iPhone; a real WebUntis sign-in (no test account).
- Release state: uncommitted
