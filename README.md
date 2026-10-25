<div align="center">

<img src="public/POKYH_Logo.png" alt="POKYH" width="112" />

# POKYH Web

**The better app for WebUntis.**<br />
Timetable, grades, absences, messages, the school canteen and class tools in one fast,
installable web app for students and guardians.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Static export](https://img.shields.io/badge/build-static_export-534AB7)](#static-export-a-hard-rule)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Getting started](#getting-started) · [Architecture](#architecture) · [Configuration](#configuration) · [Deployment](#deployment) · [Contributing](#contributing) · [Backend](https://github.com/bedchem/pokyh-backend)

</div>

> [!NOTE]
> POKYH is an independent project and is not affiliated with, endorsed by or connected to Untis GmbH.
> WebUntis is a trademark of Untis GmbH. POKYH acts only with the user's own WebUntis credentials
> and on their behalf; the school's rules apply.

---

## Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Static export: a hard rule](#static-export-a-hard-rule)
- [How sign-in works](#how-sign-in-works)
- [Excusing absences](#excusing-absences)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Project layout](#project-layout)
- [Internationalisation](#internationalisation)
- [Deployment](#deployment)
- [Security and privacy](#security-and-privacy)
- [Quality checks](#quality-checks)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

POKYH Web is the website and web app of POKYH. It works with **any school on WebUntis**: the
sign-in page searches all WebUntis schools, and the chosen school is remembered on the device until
the end of the school year. Students and guardians get their WebUntis data in a clean, mobile-first
interface, plus POKYH's own features such as class reminders, personal to-dos and canteen ratings.

| | |
| --- | --- |
| **Delivery** | A static export: `next build` writes plain files to `out/`, served by nginx or any CDN. No Node server in production. |
| **Data** | Everything dynamic runs in the browser and talks to the [POKYH API](https://github.com/bedchem/pokyh-backend), WebUntis included. |
| **Session** | The WebUntis session lives in encrypted, httpOnly cookies of the API, which page scripts cannot read. |
| **Languages** | German, Italian and English. |
| **Platforms** | Every modern browser, installable as a PWA; native iOS and Android apps are available as well. |

---

## Features

### In the app (signed in)

| Area | What it does |
| --- | --- |
| **Home** | Dashboard with the next lessons, recent grades, messages and what is due |
| **Timetable** | Week grid that always fits the screen, on phones too: substitutions, cancellations, exams and homework, lesson details, absences drawn over the lessons they cover, swipe between weeks, school-year switch, calendar export (`.ics`) |
| **Grades** | Grades per subject, averages and trends |
| **Absences** | Absence rate (rounded or exact, from the real timetable), per-month chart, report an absence ahead, excuse a past one, excuse letter as PDF |
| **Messages** | WebUntis message centre: inbox, sent, drafts, attachments, replies, new messages to teachers |
| **Canteen** | Menu of the school's canteen with star ratings and comments (only for schools with a plan) |
| **Class and reminders** | The class from WebUntis, class-wide reminders with comments, the class register |
| **To-dos** | Personal tasks, synced live across devices |
| **Profile** | Statistics, settings, theme, language, privacy choices |
| **Notifications** | Bell with new grades, messages, reminders and due items; Web Push when installed |
| **Search** | Command palette (`/` or Ctrl/⌘ K) across pages and content: lessons, grades, homework, messages, reminders, to-dos, dishes |

Guardian accounts see their child's WebUntis data and get no POKYH class membership.

### Public site (no sign-in)

Landing page, public canteen menu, free tools (absence calculator, grade average), feature
comparison, FAQ, guides, app downloads and PWA install guides, and the legal pages (imprint,
privacy, terms, cookies).

### Platform

- **Installable PWA** with a service worker, offline-aware caches and instant pages from the last
  answer stored on the device (`lib/persist-cache.ts`). When WebUntis cannot be reached, the last
  copy stays on screen and says how old it is.
- **Loading on intent**: when a link into the app is hovered, touched or focused, its data starts
  loading (`lib/preload.ts`).
- **SEO**: sitemap, robots.txt, hreflang, structured data, `llms.txt` / `llms-full.txt` and IndexNow.
- **Consent first**: analytics and third-party media load only after the visitor agrees.
- **Accessible**: keyboard navigation, focus states, reduced-motion support, light and dark theme.

---

## Architecture

```
                      ┌──────────────────────────────────────────────┐
 Browser ───────────► │ Static files (out/)                          │
    │                 │ nginx (deploy/nginx.conf) or a CDN           │
    │                 │ (public/_headers, public/_redirects)         │
    │                 └──────────────────────────────────────────────┘
    │
    └───────────────► POKYH API (pokyh-backend) ────► WebUntis of the user's school
                        /webuntis/*   sign-in, timetable, grades, absences, messages, ...
                        /auth/web/*   token refresh, sign-out, POKYH-only accounts
                        /dishes, /users, /classes, /sse, /push, ...   POKYH's own data
```

- **No server of its own.** What a Next.js server would do lives with the web server, in two
  equivalent forms that are kept in step: `deploy/nginx.conf` for the Docker image and
  `public/_headers` + `public/_redirects` for Cloudflare Pages and similar hosts. That covers
  security headers, caching, old links and the language of an address without one.
- **Pages with an id** (`/de/messages/123/`, `/de/canteen/dish/x/`, ...) are built once for the
  placeholder id `_`. The web server answers every id with that page, and the page reads the real
  id from the address (`lib/route-id.ts`).
- **Signed-in pages** check the session in the browser (`components/AuthGuard.tsx`) and send the
  visitor to the sign-in page and back.
- **Data access** is split into two clients:
  - `lib/api.ts`: WebUntis through the API's `/webuntis/*` with the API's cookies
    (`credentials: 'include'`), stale-while-revalidate caching, silent renewal on `401`.
  - `lib/api-client.ts`: POKYH's own data with `X-API-Key` and a Bearer token, refreshed through
    `/auth/web/refresh`.
- **Development** runs `next dev` on port 3011 and passes the API's paths on to the API
  (`next.config.ts`, `app/dev-api`), so the API's cookies land on `localhost` exactly as they do on
  `pokyh.com` in production.

---

## Static export: a hard rule

The website **must always build as a static export** (`output: 'export'` in `next.config.ts`).
Every change has to keep `npm run build` finishing and writing a complete `out/`. In practice:

| Do | Don't |
| --- | --- |
| Load data in the browser through `lib/api.ts` / `lib/api-client.ts` | Fetch data per request on the server (`cookies()`, `headers()`, uncached `fetch` in a page) |
| Guard pages in the browser (`AuthGuard`, `UntisGuard`) | Use middleware / proxy, Server Actions or route handlers that need a running server |
| Build pages with an id once for the placeholder `_` (`generateStaticParams`) | Add dynamic routes without static params |
| Keep redirects and headers in `deploy/nginx.conf` **and** `public/_headers` / `public/_redirects` | Rely on `redirects()` / `headers()` in `next.config.ts` (ignored by a static export) |
| Ship images as they are (`images.unoptimized`) | Depend on the Next.js image optimiser |
| Read settings at build time (`NEXT_PUBLIC_*`) | Expect environment variables at run time |

Route handlers under `app/` are allowed only when they are fully static (`dynamic = 'force-static'`),
like `app/api/privacy-notice` or the Open Graph images. Files ending in `.dev.ts` exist in
development only.

A production build never contains a local address: `next.config.ts` replaces `localhost` values of
`NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_API_BACKEND_URL` with the public defaults.

---

## How sign-in works

1. The user picks their school and enters their WebUntis credentials at `/login`.
2. `POST /webuntis/login` on the API signs in at the school's WebUntis, resolves the student (for a
   guardian: the child) and creates the POKYH account session. The password goes to WebUntis only;
   it is never stored or logged.
3. The API sets its own **httpOnly** cookies on its address:
   `pokyh_session` (sealed WebUntis session), `pokyh_renew` (sealed sign-in for automatic renewal,
   sent only to the sign-in path) and `pokyh_api_refresh` (POKYH refresh token).
4. From the answer the page sets its own readable cookies: `pokyh_api_token` (POKYH access token)
   and `pokyh_user` (non-sensitive display data).
5. When WebUntis ends its session early, the API signs in again by itself. When that is not
   possible, a single `pokyh-session-expired` event signs out cleanly, without retry loops.

---

## Excusing absences

WebUntis lets students of age and guardians report an absence **ahead**, but refuses to add a reason
to one that is already over. POKYH therefore handles the two cases differently:

| Case | What happens |
| --- | --- |
| **Report ahead** | Saved in WebUntis as an absence with reason and note (`/webuntis/absences/create`). |
| **Excuse afterwards** | The API writes a message to **each class teacher** in WebUntis with the day, the times, the reason and the note, in the user's language. |
| **Waiting for the school** | The absence shows *Message sent* (on the absences page and in the timetable's lesson popup), with the recipients and the date, until the class teacher marks it excused in WebUntis. |
| **Account may not message teachers** | For example a guardian: the reason and note are saved on the absence through WebUntis' own excuse, where the school allows it. |

The *Message sent* state is read back from the account's **Sent** folder in WebUntis, so it works on
every device and POKYH stores nothing about it. Who may excuse follows WebUntis' own permission
(`showCreateAbsence`).

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, `output: 'export'`, Turbopack in development) |
| UI | React 19, Tailwind CSS 4, CSS Modules, Framer Motion, Phosphor icons |
| 3D and motion on the landing page | three.js, @react-three/fiber and drei, GSAP, Lenis |
| Language | TypeScript (strict) |
| Documents | pdf.js for PDFs in the built-in viewer |
| Realtime | Server-Sent Events (`EventSource`) |
| Offline and push | Service worker, device caches, Web Push (VAPID) |
| Serving | nginx (unprivileged, read-only container) or any static host |

---

## Getting started

### Prerequisites

- **Node.js** `^22.23.4`, `^24.22.1` or `>=26.12.1` (see `engines` in `package.json`)
- A running [POKYH backend](https://github.com/bedchem/pokyh-backend), locally on port 4000 or a
  deployed one

### Run it

```bash
npm install
cp .env.example .env.local   # adjust NEXT_PUBLIC_API_KEY and, if needed, API_DEV_PROXY_TARGET
npm run dev                  # http://localhost:3011
```

The backend's `CORS_ORIGIN` must include `http://localhost:3011`. Devices on the local network can
open the dev server too, which is the easiest way to try the app on a real phone (it listens on
`0.0.0.0`; allowed origins are in `next.config.ts`).

### Build and preview the static site

```bash
npm run build                # writes out/
npx serve out                # or any static file server
```

A production build always points at public addresses. To test `out/` against a backend on this
machine, build with `NEXT_PUBLIC_API_LOCAL=true`. For a preview with the production web server
rules (headers, redirects, id pages), use the [Docker image](#docker-nginx).

---

## Configuration

All values are read **at build time** and frozen into the pages; there are no run-time secrets.
[`.env.example`](.env.example) lists every setting with an explanation. Local values go into
`.env.local`, which is never committed.

### Site and API

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical address (links, sitemap, metadata). A production build never uses a local address and falls back to `https://www.pokyh.com`. |
| `NEXT_PUBLIC_API_BACKEND_URL` | The POKYH API. Must be on the same site as the website (`pokyh.com` and `api.pokyh.com`), or the browser does not send the API's cookies. |
| `NEXT_PUBLIC_API_KEY` | `X-API-Key` for writes; must match the backend's `API_KEY`. |
| `NEXT_PUBLIC_API_LOCAL` | `true` keeps a local API address in a production build (testing only). |

### Development

| Variable | Purpose |
| --- | --- |
| `API_DEV_PROXY_TARGET` | Where `npm run dev` passes the API's paths (default: the API above). |
| `NEXT_PUBLIC_API_DIRECT` | `true` calls the API directly instead of through the proxy. |
| `DEV_ALLOWED_ORIGINS` | Devices on the local network that may open the dev server (comma-separated hosts, `*` as a wildcard). |
| `NEXT_PUBLIC_DEBUG_API` | `true` logs every API call in the console. |

### Behaviour and features

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FALLBACK_LOCALE` | Language for browsers that ask for none of de/it/en (default `en`); also hreflang `x-default` and nginx. |
| `NEXT_PUBLIC_WEEK_ROLLOVER` | When "this week" moves on, as `<weekday> <HH:MM>` (default `6 17:00`, Saturday evening). |
| `NEXT_STALE_DYNAMIC` · `NEXT_STALE_STATIC` | Router cache lifetime of visited pages, in seconds. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push public key (the backend's `VAPID_PUBLIC_KEY`). |
| `NEXT_PUBLIC_GA_ID` | Google Analytics id, loaded only after consent. |
| `NEXT_PUBLIC_COMMENT_MAX_LENGTH` | Longest comment (the backend's limit). |
| `NEXT_PUBLIC_WORD_FILTER_BLOCK` · `NEXT_PUBLIC_WORD_FILTER_ALLOW` | Extra words for the sign-in mascot's name filter. |
| `NEXT_PUBLIC_SCROLL_TUNING` | JSON to tune the scroll feel of the public pages. |
| `MENSA_API_URL` · `MENSA_API_KEY` | Source of the menu prerendered into the public canteen page. |

### Links, search engines and legal identity

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SOURCE_URL` · `NEXT_PUBLIC_SUPPORT_URL` | Source code and support links; an empty support link hides the banner. |
| `GOOGLE_SITE_VERIFICATION` · `BING_SITE_VERIFICATION` | Search console verification tokens. |
| `INDEXNOW_KEY` · `INDEXNOW_ENDPOINT` | IndexNow key served at `/indexnow.txt`, used by `npm run indexnow`. |
| `CONTENT_SIGNALS` | Content-Signal line in `robots.txt`, only to limit a use (unset: none, everything allowed; Google lists the line as an unknown rule). |
| `LEGAL_*` | Operator and contact details of the legal pages. The service is offered as **POKYH**; see the comments in `.env.example`. **`LEGAL_ENTITY_NAME` is required**: the privacy notice names the controller (GDPR Art. 13), and a production build stops without it. |

WebUntis settings (default school, school allow-list, internal paths) belong to the backend.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3011 with hot reload and the API proxy |
| `npm run build` | Static export into `out/` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (`node --test`) |
| `npm run indexnow` | After a deploy: submits every sitemap URL to IndexNow |

`npm start` (`next start`) does not apply: a static export has no Next.js server. Serve `out/`
instead.

---

## Project layout

```
app/
├── [lang]/
│   ├── (app)/            signed-in app: home, timetable, grades, absences, messages,
│   │                     canteen, class, classregevents, reminders, todos, school,
│   │                     profile, settings
│   ├── (site)/           public site: landing, mensa, tools, comparison, faq, howto,
│   │                     get (apps and PWA guides), legal, about, webuntis
│   ├── login/            school search and sign-in
│   └── legal/            Open Graph image of the legal pages
├── api/                  static JSON answers: privacy-notice (apps), legal/contact
├── dev-api/              development-only proxy to the API (*.dev.ts)
├── index.html/           root page: forwards to the visitor's language
├── global-not-found.tsx  404 page (also forwards addresses without a language)
└── sitemap.ts, robots.txt, manifest.ts, llms.txt, ...
components/               UI by area (app shell, absences, messages, landing, ui, ...)
providers/                session, locale, theme, app and activity contexts
lib/                      API clients, caches, parsing, i18n dictionaries, SEO, school logic
public/                   PWA assets, icons, 3D models, service worker, _headers, _redirects
deploy/                   nginx configuration of the Docker image
scripts/                  indexnow.mjs
tests/                    unit tests
docs/worklog/             change log of larger pieces of work
```

---

## Internationalisation

Every page exists under `/de/`, `/it/` and `/en/`. Texts live in typed dictionaries in
`lib/i18n/dictionaries/`; German is complete for every key and is the fallback for a missing
translation, so a raw key is never shown. The root address and the 404 page pick the visitor's
language in the browser (`lib/locale-redirect.ts`); nginx does the same for the Docker image. Old
Ladin addresses (`/lld/...`) redirect to German.

---

## Deployment

### Docker (nginx)

The image builds the export and serves it from an unprivileged nginx on port **3011** with a
read-only filesystem, all capabilities dropped and a health check. Every setting of `.env.example`
is a build argument (`.env` files are never copied into the image); one that is not given stays
unset, so the default in the code applies. The container itself needs no environment.

```bash
docker compose up --build -d
```

### Cloudflare Workers

`wrangler.jsonc` deploys the export as a Worker with static assets and no code of its own:
`npx wrangler deploy` runs `npm run build` and uploads `out/`. Without that file Wrangler takes
the project for a server-rendered Next.js app and tries to build it with OpenNext, which fails on
a static export.

In Workers Builds the deploy command is `npx wrangler deploy` (a separate build command is not
needed). Set the values of `.env.example` as **build variables**, `LEGAL_ENTITY_NAME` and
`NEXT_PUBLIC_SITE_URL` included; the Worker deploys under the name it is connected to
(Wrangler's `WRANGLER_CI_OVERRIDE_NAME`). Headers and redirects come from `public/_headers` and
`public/_redirects`. To check a deploy without uploading: `npx wrangler deploy --dry-run`; to
serve it locally the way Cloudflare does: `npx wrangler dev`.

### Cloudflare Pages

Build command `npm run build`, build output directory `out`, the same build variables. Pages
skips `wrangler.jsonc` (it has no `pages_build_output_dir`) and serves `out/` with
`_headers` and `_redirects`, which use the same rules on Pages and Workers.

### Any static host or CDN

```bash
npm ci && npm run build      # publish the out/ folder
```

`public/_headers` and `public/_redirects` carry the same rules as nginx for Cloudflare Pages,
Cloudflare Workers and compatible hosts.

### Release checklist

- [ ] The site runs on its own domain on the same site as the API (`pokyh.com` and
      `api.pokyh.com`); a `*.pages.dev` address cannot sign in.
- [ ] `NEXT_PUBLIC_SITE_URL` is the address the site is finally served at, without a redirect in
      between (`https://www.pokyh.com` while `pokyh.com` forwards there): canonical links,
      hreflang and the sitemap must not point at a redirect. `NEXT_PUBLIC_API_BACKEND_URL=https://api.pokyh.com`.
- [ ] `NEXT_PUBLIC_API_KEY` matches the backend's `API_KEY`.
- [ ] `LEGAL_ENTITY_NAME` (and the other `LEGAL_*` values) are set in the build environment.
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is the backend's `VAPID_PUBLIC_KEY`, for Web Push.
- [ ] The backend's `CORS_ORIGIN` includes the site's origin.
- [ ] After the deploy, `npm run indexnow` (optional).

The menu prerendered into the public canteen page is as old as the build; the browser loads the
current one.

---

## Security and privacy

- WebUntis credentials are sent once, at sign-in, to the API, which passes them to WebUntis and
  never stores or logs them.
- The WebUntis session and the renewal live in **encrypted, httpOnly, SameSite=Strict** cookies of
  the API; page scripts cannot read them. The refresh token is an httpOnly cookie too. Only when
  push notifications are turned on does the API keep the session, to check for new messages;
  turning them off removes it.
- Writes carry `X-API-Key`, so the browser checks the API's allowed origins (CORS preflight) first.
- The site is plain files and holds no secrets. A production build is checked to contain no local
  addresses.
- Security headers come from the web server: HSTS, frame, referrer and permissions policies, and a
  Content-Security-Policy that forbids plugins, injected `<base>` elements, foreign form targets
  and framing by other sites.
- Analytics and third-party media load only after consent; dish photos are loaded without a
  referrer and can be hidden.

Please report security issues privately to the contact named on the legal pages rather than in a
public issue.

---

## Quality checks

Run all of these before a pull request; each must pass.

```bash
npx tsc --noEmit             # type check
npm run lint                 # ESLint
npm test                     # unit tests: bell feed, canteens, popup schedule, school choice,
                             # school math, school week, scroll pace, word filter
npm run build                # must finish and write out/ (see "Static export: a hard rule")
```

For layout changes, check the page at phone width (e.g. 320, 390 and 430 px) and on a computer:
the timetable, for example, must fit the screen without scrolling on both.

---

## Contributing

1. Branch off `main` and keep the change focused.
2. Follow the existing style: TypeScript strict, CSS Modules next to the page for layout, Tailwind
   utilities for typography and spacing, comments that explain *why*.
3. New texts go into the dictionaries in `lib/i18n/dictionaries/` for **all three languages**.
4. Web server rules change in both `deploy/nginx.conf` and `public/_headers` / `public/_redirects`.
5. Keep the [static export](#static-export-a-hard-rule) intact and run the
   [quality checks](#quality-checks).
6. Larger pieces of work get a short entry in `docs/worklog/`.

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Signed in, but every request answers `session_expired` | The browser did not send the API's cookies. The site must be on the same site as the API, and the API's `CORS_ORIGIN` must list it. |
| CORS error calling the API | Add the site's origin to the backend's `CORS_ORIGIN`. |
| A built site calls `localhost` | Not possible by design; a production build replaces local addresses. Use `NEXT_PUBLIC_API_LOCAL=true` only for local tests. |
| Build fails after adding a page or route | Something needs a server: see [Static export: a hard rule](#static-export-a-hard-rule). |
| Style changes do not show in development | Restart `npm run dev`; the dev server occasionally keeps an old stylesheet. |
| Excuse: "no class teacher" | The class has no class teacher in WebUntis; the school sets it there. |
| Build stops: `LEGAL_ENTITY_NAME is not set` | Set it in `.env.local`, in the host's build environment or as a Docker build argument. |
| No push notifications | VAPID keys must be set on the backend and in `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, and the user must allow notifications. |
| CSS preload notice in the console | A harmless Next.js notice, not an error. |

---

## License

[MIT](LICENSE) © POKYH contributors. WebUntis and Untis are trademarks of Untis GmbH; POKYH is not
affiliated with it.

<div align="center">

**POKYH** · Web (this repository) · [Backend](https://github.com/bedchem/pokyh-backend) · iOS and Android apps

</div>
