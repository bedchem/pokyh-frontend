# 2026-10-17 · Public pages: naming, homepage fixes, dark mode, redesign (branch `redesign`)

Factual log. No credentials, personal data or request bodies are recorded here.
Nothing was committed or pushed (owner's instruction for this session).

## Pre-work checks

- `git status`: clean on `redesign` (HEAD `71b65c2`).
- Open pull requests (GitHub API): none for `bedchem/pokyh-frontend`, none for
  `bedchem/pokyh-backend`.
- Owner's dev server was already running on port 3011 and was used for
  verification (not restarted by the agent).

## Naming: "pockyh"/"pocky" → "pokyh"

- Cookie names `pockyh_session|user|api_token|api_refresh|locale`, storage keys
  (`pokyh_theme`, `pokyh_abscalc_*`, `pokyh_grade_drafts_v1`, `pokyh_popups_seen`,
  `pokyh_creds`, …), window events (`pokyh-session-expired`, `-refreshed`,
  `pokyh-messages-updated`) and WebUntis JSON-RPC ids/client name renamed.
- Migration so nobody is signed out: `proxy.ts` moves `pockyh_*` cookies to
  `pokyh_*` with a one-time 307 redirect on page GETs (same options as when
  they are set); `ThemeScript` moves `pockyh_*` keys in local and session
  storage before reading the theme.
- Legal page: the cookie/storage names listed there were updated to the new
  names; no other legal wording was changed. README updated accordingly.
- `package.json`/`package-lock.json` name `pocky-web` → `pokyh-web`.
- `app/[lang]/layout.tsx` `sameAs`: `github.com/bedchem/pocky-web` (a renamed
  repo, GitHub answers 301) → `github.com/bedchem/pokyh-frontend`.

## Mensa not loading in local development

- Cause: `app/api/mensa/route.ts` fell back to `http://localhost:4000` when
  `API_BACKEND_URL` is unset; all other routes fall back to
  `https://api.pokyh.com`. Fallback aligned; the route now logs the failing
  URL and error code on the server.
- Ratings/comments in local dev: the browser calls `api.pokyh.com` directly;
  the backend answers requests from origin `http://localhost:3011` with 403
  (CORS) and requires `X-API-Key` (`NEXT_PUBLIC_API_BACKEND_KEY`, not set
  locally). Not changed (backend configuration / owner's credentials).

## Theme (public pages)

- `.site` palette now has a dark version (`.dark .site`): no light surfaces,
  pastels as deep tints with light ink. Follows the existing ThemeProvider
  (system by default, choice saved in `localStorage` `pokyh_theme`).
- Header theme button and a System/Hell/Dunkel switch in footer and mobile
  menu; switching uses a circular View Transition where supported.
- Legacy `--app-*` variables are redefined inside `.site`; before, they
  resolved on `:root` and followed the app theme, which made e.g. the legal
  page light-on-light when the system was dark.
- Three.js colours (hero), carousel colours and homepage sections read the
  palette and react to theme changes.

## Homepage

- Opening on every load (the session-once dark curtain `Intro.tsx` is no
  longer rendered; the file was left in place): letters rise out of a mask
  and sharpen from a blur, then the school-day tiles arrive.
- Hero: GSAP warning "rotate not eligible for reset" fixed (`quickTo` now
  animates `rotation`). Scroll path shortened (hero 200svh); tiles placed
  around and behind the dark screen; the dark screen now shows the next
  section's sentence (an HTML copy of the Manifest layout, scaled to the
  projected screen) and the Manifest is positioned underneath so the hand-off
  is seamless. The screen's growth follows a smooth size curve instead of
  1/distance.
- Manifest: sentence fully lit, button and note fade in, gentle drift; more
  dwell before the features rise (original arch transition kept, `Features.tsx`
  unchanged).
- Mensa section: title follows the actual day ("Heute/Morgen/Montag … in der
  Mensa"); calmer empty state.
- App icon opening (AppOpen) rebuilt: one clipped indigo layer with the vector
  mark (no PNG upscaling, no layer swap, no rotate/back-ease).
- Magnetic buttons and the text-roll hover removed; buttons are flat solid
  `.key` styles (an intermediate 3D-edge version was rejected and removed).
- Header: tried in turn and rejected by the owner: a blurred backing, a
  gradient fade, difference-blended links. Final: text in the solid opposite
  colour of the section beneath (per `data-tone`), and the bar slides away
  on scroll-down and returns on scroll-up or at the top. Theme button is a
  plain icon; a language menu (DE/IT/EN) sits next to it. Desktop hamburger
  bug fixed (site component classes moved into `@layer components` so
  Tailwind utilities like `lg:hidden` apply).
- Footer: "bis morgen früh" replaced by "Deine Schule. Übersichtlich." with
  actions (not shown on the homepage, which already ends with the ways in);
  five letter tiles at the bottom drop in and jump when tapped.

## Subpages (same design language, little motion)

- Shared: `PageIntro` (no split-text animation, no eyebrow labels), `CtaBand`
  as a tone card, softer `RevealScope`; Lenis smooth scrolling only on the
  homepage.
- About: story only (chapters on a line), technical stack section removed;
  GitHub profiles as contribution-grid cards (initial drawn in squares;
  decorative, nothing loaded from GitHub).
- FAQ, Comparison, Get, native app guides, How-to restyled; How-to dev port
  corrected to 3011 (package.json); code blocks dark in both themes.
- Web-app install guides: screenshots from `public/tutorials_Screenshots` in a
  CSS iPhone frame (iOS) and Android frame (Android), light/dark captures by
  theme, phone pinned on wide screens with the screen changing per step.
- Mensa: moved from the app group into the public site layout
  (`app/[lang]/(site)/mensa`), same URL. The next dish is served on a plate
  between fork and knife rendered with three.js (`mensa/plateScene.ts`:
  lathe-turned glazed plate, swept steel cutlery, room environment, cast
  shadows; the food photo is an HTML layer in the plate's well because the
  dish images come from hosts without CORS). The whole plan follows by week.
  Dish sheet in a food-app layout (compact photo, meta line, ratings
  histogram with the own rating inside that section, nutrition, allergens,
  comments). `GuestCommentsLock` kept unchanged. A day strip and hover tilts
  were tried and removed at the owner's request.

## Languages, cursor, dev issues

- Homepage copy (`frontpage.ts`) translated to Italian and English; all other
  public-page dictionaries already had both. Ladin stays retired (earlier
  owner decision).
- Pointer cursor for clickable elements on the public pages (Tailwind 4's
  preflight no longer sets it on buttons).
- `SmoothScroll`: the Lenis instance is kept in a small external store read
  with `useSyncExternalStore` (fixes the `set-state-in-effect` lint error).
- Mensa ratings failures are logged as warnings instead of errors (they
  raised the Next.js dev overlay locally, where the backend refuses the dev
  origin).
- Downloaded cutlery assets were requested; candidates (CC0) were looked up
  but nothing was downloaded without the owner's confirmation.

## Verification

- `tsc --noEmit`: passes. `npm test`: 13/13 pass.
- ESLint on changed files: no findings in new or redesigned files; remaining
  findings are pre-existing (`set-state-in-effect`, `no-explicit-any`, unused
  vars in app files touched only by the rename; `setLenis` in SmoothScroll).
- Browser (owner's dev server, desktop width): homepage opening, hero → dark
  screen hand-off, manifest, features, Mensa section, app icon, footer; About,
  FAQ, Comparison, Get, PWA guides (iOS/Android), How-to, Legal, Mensa page and
  dish sheet as guest; light and dark theme. Not checked on a real phone.
- Dev server stopped serving CSS updates during the session (Turbopack
  "No link element found for chunk …css"); `globals.css` compiles with
  Tailwind directly. A dev-server restart is needed to see all CSS changes.
