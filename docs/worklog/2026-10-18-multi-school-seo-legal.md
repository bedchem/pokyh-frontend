# 2026-10-17/18 · Login for every WebUntis school, SEO, legal pages, Mensa, scroll feel (branch `redesign`)

Factual log. No credentials, personal data or request bodies are recorded here.
Nothing was committed or pushed; the owner confirms scope and Git identity first.

## Pre-work checks

- `git status`: clean on `redesign` (HEAD `36d96b6`).
- Open pull requests (`gh pr list`): none for `pokyh-frontend`, `pokyh-backend`,
  `pokyh_learn-frontend`. `pokyh_learn-frontend` has uncommitted worklog
  changes of another session; left untouched.
- Backup of the starting version: zip of the repository (without
  `node_modules`, `.next`) in the owner's Downloads folder.

## Owner decisions (asked during the session)

- Legal seat Italy. Operator shown as "POKYH" everywhere; the private
  individual's name appears only once, as GDPR controller in the privacy notice
  (Art. 13(1)(a)). No postal address.
- School choice remembered until 31 August (at least 30 days).
- Minimum age 14; younger only with parents' consent; consent-based statistics
  only from 14 (Art. 8 GDPR, Art. 2-quinquies Codice privacy).
- Wording "WebUntis alternative / app for WebUntis" with the note "not
  affiliated with Untis GmbH"; never "clone". Objective comparison only.
- Mensa shown in the app only for schools with a menu; public Mensa page
  labelled LBS Brixen.
- Smooth scrolling on all public pages (desktop); touch keeps native scroll.
- Local dev: frontend natively on :3011; backend CORS extended locally.

## Changes

- Sign-in for every school on WebUntis: public school search proxied by
  `app/api/webuntis/schools` (rate-limited, cached 10 min, host allowlist
  `WEBUNTIS_HOST_SUFFIXES`, optional `WEBUNTIS_SCHOOL_ALLOWLIST`);
  `lib/server/schools.ts`; sessions carry the school; every WebUntis route,
  password reset, silent re-login and push use the session's school.
  The login sends `school`, `schoolName`, `schoolServer` to the backend
  (already supported there). Login errors as codes, localized in the client.
  Login log line no longer contains the username.
- New sign-in page (two steps, combobox search with keyboard support,
  remembered school in `localStorage` `pokyh_school`, decorative school-day
  tiles, phone band). Tests: `tests/school-choice.test.mjs`.
- Mensa: account-scoped menu route `api/mensa/mine` (app home hides Mensa when
  the school has none). Dish photos from third-party sites load only after
  consent (`pokyh_external_media`); no copying of photos.
- Mensa 3D: minimal coupe plate and one-piece brushed-steel cutlery,
  lit by a CC0 studio HDRI (Poly Haven "Monochrome Studio 03", 512 px,
  `public/hdr/studio.hdr`).
- Homepage: large-viewport units for all pinned scenes (fixes the strip of the
  next section on iPhone when browser bars collapse), hero hand-over guarded
  on scroll-up, smaller textures on phones. Per-scene scroll pace and lengths
  in `lib/scroll-pace.ts` (override `NEXT_PUBLIC_SCROLL_TUNING`). Leftover
  trackpad momentum after a page change is swallowed.
- Language menu redesigned (greeting per language, keyboard navigation,
  switch curtain); segmented control in the mobile menu and footer.
- Console greeting with a self-XSS warning and `window.pokyh` commands.
- SEO: Europe-wide titles/descriptions (de/it/en), JSON-LD graph
  (Organization, WebSite, WebApplication; no ratings), localized Open Graph
  cards with the site font, page `/webuntis` (FAQPage, HowTo, Breadcrumb),
  `llms.txt` / `llms-full.txt`, robots with search and AI crawlers, manifest
  fixed (`/manifest.json` link removed), sitemap dates. Hidden keyword text on
  the homepage replaced by a visible summary in the footer.
- Copy: no em/en dashes as punctuation in source, dictionaries, styles,
  README (ranges and placeholders became hyphens).
- Legal pages rebuilt (`legal/content.ts` + `page.tsx`): imprint, privacy
  notice, new terms of use, cookies, Learn notice (Learn text unchanged).
  Corrections: statement that WebUntis access needs prior school approval
  replaced by an accurate description; push storing the WebUntis session
  disclosed; outdated third-party entry removed; school search, chosen school,
  external photos, minors, duty to provide data and automated decisions added.
  Privacy notice version raised to `2026-10-18`.
- `.gitignore`: assistant/editor files and local notes; `CLAUDE.md` and
  `AGENTS.md` removed from the index (files kept locally).
- Backend (`pokyh-backend`, new local branch `redesign`, uncommitted):
  the push poller uses each subscriber's school server.

## Verification

- `tsc --noEmit`: passes. `npm test`: 18/18. Backend `npm test`: 182/182,
  backend `tsc`: passes.
- ESLint: 48 errors, all pre-existing (49 at the starting commit, none new).
- `next build`: passes; OG fonts traced into the standalone output.
- Browser matrix (Playwright, WebKit and Chromium): 19 public pages on
  iPhone SE, iPhone 14, iPad Pro 11 (portrait/landscape), Pixel 7, Galaxy
  S9+ (320 px), 1280 and 1920 desktop, light and dark: 152 checks, all 200,
  no horizontal overflow, no console errors, one `h1` per page.
- Sign-in: school search, choice, persistence after reload and the wrong
  password message verified against WebUntis with a non-existent user.
  A real sign-in needs the owner's credentials and was not performed.
- Not verifiable here: real iOS Safari toolbar behaviour and real trackpad
  momentum (logic verified, devices not available).

## Open points

- Backend container not rebuilt (push poller change takes effect after a
  rebuild/deploy).
- Production env: `LEGAL_ADDRESS_LINE_*` must stay empty; set
  `LEGAL_ENTITY_NAME`, `NEXT_PUBLIC_SITE_URL`, optionally
  `GOOGLE_SITE_VERIFICATION`.
- Using WebUntis through a third-party client is governed by each school's
  rules; Untis offers official partner APIs. A legal review by a lawyer is
  recommended before wide promotion.

## 2026-10-18 08:15 · Follow-ups from the owner

- Hero: the sentence stays visible inside the dark screen during the whole
  flight (the size-based fade-in was removed).
- Scroll feel slower everywhere: base wheel distance 0.82 → 0.66, glide
  `lerp` 0.075 → 0.068 (`lib/scroll-pace.ts`). Measured on the homepage:
  hero 28 notches (~38 px each), carousel 46 (~84 px), other scenes 13-19.
- Verification: `tsc --noEmit` passes; wheel run through the homepage
  without errors; frames checked in the dark theme.

## 2026-10-18 · Second round of follow-ups

- Dev errors: Turbopack "No link element found for chunk …css" traced to
  `globals.css` also being imported by `app/global-not-found.tsx`; that page is
  now self-contained, unknown public paths render the site's own 404
  (`(site)/[...rest]`, `components/site/NotFoundView.tsx`). `app/favicon.ico`
  added, activity log requests use `keepalive`.
- Mensa: the menu, ratings and comments are fetched through local routes
  (`app/api/mensa/*`, `lib/server/mensa-api.ts`, `MENSA_API_URL`); the user
  token is forwarded only to the own backend. Live menu verified (30 dishes).
- Language menu rewritten: round flags, native language names, keyboard
  navigation, no greeting text; segmented control with flags in the mobile
  menu and footer.
- Sign-in page rebuilt as a fixed screen without page scroll (only the form
  column scrolls internally when a screen is very short); place-name aliases
  for the school search (e.g. Bolzano/Bozen, Bressanone/Brixen, Vienna/Wien).
  Verified: no document scroll and no horizontal overflow on 1440x900,
  1280x720, iPhone SE, iPhone 14, iPad Pro 11 and Galaxy S9+.
- SEO:
  - `x-default` and the language for browsers that ask for none of de/it/en
    are English (`NEXT_PUBLIC_FALLBACK_LOCALE`, default `en`).
  - `<html lang>` without region (`de`, `it`, `en`); Open Graph `de_DE`.
  - Descriptions widened from Europe to worldwide; `areaServed` removed.
  - New public calculators in de/it/en: `/tools/` (hub),
    `/tools/grade-average/` (weighted average on the 1-10, 1-6, 0-15 and 1-5
    scales, grade needed for a target) and `/tools/absences/` (percent missed
    and hours left; explains the three-quarter rule with its sources:
    DPR 122/2009 art. 14(7), D.Lgs. 62/2017 art. 5, in South Tyrol also
    L.P. 11/2010, exceptions set by each school). Calculation runs only in the
    browser; nothing is stored or sent. Breadcrumb, FAQPage and WebApplication
    data, no ratings. Footer, sitemap and `llms.txt` link them.
  - IndexNow: key file `/indexnow.txt` (only when `INDEXNOW_KEY` is set),
    `npm run indexnow` sends the sitemap URLs after a deploy; optional
    `BING_SITE_VERIFICATION`.
- Tests: `tests/school-math.test.mjs` (grade parsing, weighted average,
  needed grade, absences).
- Verification: `tsc --noEmit` passes; `npm test` 27/27; ESLint 48 errors,
  all pre-existing, none in new or touched files; `next build` passes.
  Browser matrix with the calculator pages added: 184 checks on 8 devices,
  all 200, no horizontal overflow, no console errors, one `h1` per page.
  Calculators checked in de/it/en against hand-calculated values.

## 2026-10-18 · Third round (owner feedback with screenshots)

- Scroll pace: hero 0.6 → 0.45 (length 230 → 260 lvh), feature carousel
  1.28 → 0.82 (68 lvh per function, 150 extra), manifest and app scene 1.
  Measured with wheel events: hero 58 notches, carousel 86 (before 28 / 46).
- Sign-in step 1 like WebUntis: example chips removed; search reads "school
  name, city or address" (de/it/en); the remembered school stays.
- 404: redesigned (today's timetable with the missing page as the cancelled
  lesson, frequently used links), localized title, `noindex`. Checked on
  desktop, iPhone SE and iPad in de/it/en.
- Mensa photos: on the owner's explicit decision, after being informed of
  the GDPR risk of loading third-party images without consent, photos are
  now shown by default. Mitigations: no referrer, nothing in the server HTML,
  visible "hide photos" switch (objection, Art. 21 GDPR) kept in
  `pokyh_external_media`, privacy notice changed from consent to legitimate
  interest (Art. 6(1)(f)) in de/it/en, storage entry now a setting, imprint
  gives rights holders a contact for removal. Photos are still not copied.
- The dev overlay "1 Issue" from the owner's screenshot was not reproducible
  in a fresh browser; the dev log shows a stale CSS chunk error from a tab
  opened before the last dev server restart (reloading the tab clears it).
- Verification: `tsc` passes, `npm test` 27/27, ESLint 48 pre-existing
  errors (none new), `next build` passes. Matrix: 528 checks (22 public
  pages × de/it/en × 8 devices) and 192 checks after the photo/legal change,
  all OK. Photo switch verified in de/it/en (Chromium, WebKit, Android).

## 2026-10-18 · Pull of `origin/redesign`, console error, SEO round

- Pull: `origin/redesign` had one new commit by a contributor
  (`6149f9a`, app dashboard redesign, 54 files). Before merging, a zip of the
  whole working copy (with Git data) was made in the owner's Downloads folder
  and the local changes were saved as a patch. Local work was stashed,
  `redesign` fast-forwarded to `6149f9a`, the stash re-applied. The stash
  entry was kept as an extra safety copy.
- Conflicts (9 files) resolved by hand, keeping both sides: the
  contributor's redesigned app pages (absences, grades, subject, home,
  profile, timetable parts) were taken as they are, with only visible dash
  placeholders replaced; `lib/api.ts` and the login route keep the new
  `renewal` flag and the school fields; `app/robots.ts` stays replaced by
  the `robots.txt` route, which reads the protected routes (now including
  `/canteen` and `/settings`) from `lib/routes.ts`. The new canteen,
  dashboard widget and search load the own school's menu and respect the
  photo switch. Five visible dashes in the new dictionaries were replaced.
- Console error on the Mensa page ("useInsertionEffect must not schedule
  updates", `components/AnnouncementPopup.tsx`): the router pushes history
  inside an insertion effect and the Navigation API fires `navigate` there;
  the state update now runs after that commit. Reproduced before the fix (3
  errors), none after.
- SEO:
  - `robots.txt` as a route with content signals (search, AI input, AI
    training; `CONTENT_SIGNALS`), named search and AI crawlers, the public
    menu API allowed for rendering.
  - One page registry (`lib/seo/pages.ts`) for the sitemap (with the link
    preview image of each page, the menu dated daily) and the pages'
    structured data.
  - Structured data on every public page (`components/site/PageJsonLd.tsx`):
    page type, breadcrumb, date of last change; FAQPage only where the
    questions are shown (removed from the homepage, added to /faq).
  - The legal pages' preview image returned 404 (route group hash); moved to
    `app/[lang]/legal/opengraph-image.tsx`.
  - Short meta descriptions extended; header logo loaded eagerly (Next.js
    LCP warning).
  - `llms.txt` with key facts, features, all pages and every question the
    site answers; `llms-full.txt` with all answers in de/it/en.
- Verification: `tsc` passes, `npm test` 27/27, ESLint 23 errors, all in
  code already committed (none new), `next build` passes. Audit of 23 public
  pages × de/it/en on desktop, iPhone and Android: no console errors or
  warnings, no Next.js overlay issues, valid title/description/canonical/
  hreflang, reachable preview images, valid JSON-LD, one `h1`, correct
  `lang` (207 page loads, 0 issues, before and after the merge).
  Interaction runs (menus, language, theme, navigation, Mensa days, FAQ
  search, sign-in flow, calculators, legal pages, cookie settings, 404):
  no errors.
