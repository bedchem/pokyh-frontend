<div align="center">

# POKYH: Web Frontend

**The web app for students and guardians of LBS Brixen, WebUntis, reimagined.**

Stundenplan · Noten · Mensa · Abwesenheiten · Nachrichten · To-dos · Klassen-Erinnerungen, an einem Ort, als installierbare PWA.

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Server-Sent Events · Web Push

</div>

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [How auth works](#how-auth-works)
- [Project layout](#project-layout)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Overview

A free, fast, mobile-first web app for the students, pupils and guardians of the
**Landesberufsschule Brixen** (South Tyrol). It wraps the school's [WebUntis](https://www.untis.at/)
instance in a clean, app-like interface and layers on POKYH's own social features (shared class
reminders, personal to-dos, the cafeteria menu with ratings & comments).

It is a **Progressive Web App**: installable to the home screen, offline-aware, with push
notifications. It is built as a **static site** (plain files, no server of its own); everything
dynamic goes from the browser straight to the POKYH API, WebUntis included. The WebUntis session
lives only in encrypted, httpOnly cookies of the API that page scripts cannot read.

---

## Features

- 📅 **Stundenplan**: timetable with lesson details, exams and homework
- 📊 **Noten**: grades with subject breakdowns and averages
- 🍽️ **Mensa**: daily menu with star ratings & comments (POKYH backend)
- 🚫 **Abwesenheiten**: view, self-report and excuse absences (where WebUntis permits)
- ✉️ **Nachrichten**: WebUntis message center (inbox / sent / drafts, attachments)
- ✅ **To-dos**: personal tasks, realtime-synced across devices
- 🔔 **Erinnerungen**: class-wide reminders with threaded comments
- 👪 **Eltern-Accounts**: guardians retain access to their child's WebUntis data but receive no Pokyh class assignment
- 📲 **PWA**: installable, offline-aware, Web Push notifications
- 🔐 **Passkey/credential** save for frictionless re-login

---

## Architecture

`next build` writes a **static export** (`out/`): one HTML file per page and language, plus the
navigation data and assets. Any web server or CDN can serve it; the Docker image uses nginx. The
browser talks to the POKYH API (`api.pokyh.com`) directly; nothing is proxied twice.

```
Browser ──► static files (nginx · deploy/nginx.conf, or a CDN · public/_headers, _redirects)
   │
   └─────► POKYH API (api.pokyh.com) ──► WebUntis (the person's own session)
             /webuntis/*   WebUntis: sign-in, timetable, grades, messages, absences, …
             /auth/web/*   token refresh, sign-out, POKYH-only accounts
             /dishes, /users/…, /classes/…, /sse/… — POKYH's own data
```

- **`lib/backend.ts`**: the API's address, and the website's own two readable cookies
  (`pokyh_user`, `pokyh_api_token`).
- **`lib/api.ts`**: WebUntis through the API's `/webuntis/*`, with the API's cookies along
  (`credentials: 'include'`), silent renewal on `401`.
- **`lib/api-client.ts`**: POKYH's own data with `X-API-Key` + `Bearer`, renewing the token on
  `401` through `/auth/web/refresh` and emitting a clean session-expiry event when it can't.
- **What a Next server did** now lives with the web server: security headers, the language of an
  address without one, old links, caching. In two equivalent forms: `deploy/nginx.conf` and
  `public/_headers` / `public/_redirects` (Cloudflare Pages). The root page and the 404 page
  pick the language in the browser too (`lib/locale-redirect.ts`), for any other host.
- **Signed-in pages** check the session in the browser (`components/AuthGuard.tsx`) and send to
  the sign-in page, coming back afterwards.
- **Detail pages with an id** (`/messages/123/`, `/mensa/dish/x/`, …) are built once for the id
  `_`; the web server answers every id with that page and the page reads the real id from the
  address (`lib/route-id.ts`).

---

## Tech stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16 (App Router, static export)            |
| UI             | React 19 · Tailwind CSS 4 · Framer Motion         |
| 3D / landing   | three.js · @react-three/fiber & drei              |
| Language       | TypeScript (strict)                               |
| Realtime       | Server-Sent Events (`EventSource`)                |
| Offline / PWA  | Service worker + persistent caches (`lib/persist-cache.ts`) |
| Push           | Web Push (VAPID)                                  |
| Analytics      | Google Analytics, only after consent              |
| E2E tests      | Playwright                                        |

---

## Quick start

### Prerequisites
- Node.js ≥ 20.9
- A running [POKYH backend](../pokyh-backend) (locally or `https://api.pokyh.com`)

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local     # or create .env.local (see below)

# 3. Run
npm run dev                    # http://localhost:3011
```

> `npm run dev` listens on port `3011` and passes the API's paths on to the API on its own
> address (`next.config.ts`), so the API's cookies land on localhost. The backend's `CORS_ORIGIN`
> must include `http://localhost:3011`.

---

## Environment variables

Create **`.env.local`** (never commit it). The site is static: every value is read **when it is
built** and frozen into the pages. There are no server-side secrets any more.

| Variable                       | Purpose                                                                 |
| ------------------------------ | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`         | Canonical site URL for SEO/metadata. **Prod:** `https://pokyh.com`.   |
| `NEXT_PUBLIC_API_BACKEND_URL`  | The POKYH API, `https://api.pokyh.com`. Must be on the same site as the website, or the browser does not send the API's sign-in cookies. |
| `NEXT_PUBLIC_API_KEY`          | `X-API-Key`, must match the backend's `API_KEY`.                    |
| `API_DEV_PROXY_TARGET`         | Development: where `npm run dev` passes the API's paths (default: the API above). |
| `NEXT_PUBLIC_API_DIRECT`       | Development: `true` talks to the API directly instead of through the proxy. |
| `MENSA_API_URL`                | Build time: where the prerendered Mensa page reads the menu (default: the API). |
| `NEXT_PUBLIC_FALLBACK_LOCALE`  | Language for visitors whose browser speaks none of de/it/en (default `en`); also used by nginx. |
| `NEXT_PUBLIC_DEBUG_API`        | `true` to log API calls in the console.                               |

WebUntis settings (school, paths, absence rights, …) are configured in **pokyh-backend** now.

---

## How auth works

1. The user enters their **WebUntis** credentials at `/login`.
2. `POST api.pokyh.com/webuntis/login` authenticates against the chosen school's WebUntis,
   resolves the student (or, for a guardian, the **child**, including deriving the class from the
   child's timetable when WebUntis doesn't expose it) and creates the POKYH session.
3. The API sets its own **httpOnly** cookies on `api.pokyh.com`:
   - `pokyh_session`: encrypted WebUntis session
   - `pokyh_renew`: encrypted sign-in for the automatic renewal, sent only to the sign-in address
   - `pokyh_api_refresh`: POKYH refresh token
4. From the answer the page sets its own readable cookies on `pokyh.com`:
   - `pokyh_api_token`: POKYH access token (sent as `Bearer`)
   - `pokyh_user`: non-sensitive profile for the UI
5. On `401` the client calls `/auth/web/refresh` (the browser sends the httpOnly refresh cookie
   along); if that fails, a single `pokyh-session-expired` event signs out cleanly — no retry loops.

---

## Project layout

```
app/
├── [lang]/           # every page, per language: landing, legal, login, the app
├── api/              # two static JSON files: privacy-notice (apps), legal/contact
├── index.html/       # the root page: on to the visitor's language
└── global-not-found  # 404.html: also sends addresses without a language on
deploy/               # nginx.conf + nginx-headers.conf (Docker image)
providers/            # Session, App, Theme, Locale, ActivityLogger contexts
lib/                  # backend (API address, sign-in cookies), api (WebUntis),
│                     # api-client (POKYH data), caches, push, passkey, route-id
components/           # UI: nav, guards, landing, messages, absences, ui/*
public/               # PWA assets, icons, models, service worker, _headers, _redirects
```

---

## Scripts

```bash
npm run dev      # dev server on port 3011 (API paths passed on to the API)
npm run build    # static export into out/
npm run lint     # ESLint
npm test         # unit tests
```

---

## Deployment

**Docker** (as before, port `3011`): the image builds the export and serves it with an
unprivileged nginx that carries the security headers, redirects, language detection and caching
(`deploy/nginx.conf`). The container needs no environment; the `NEXT_PUBLIC_*` values are build
arguments:

```bash
docker compose up --build -d
```

**Any static host / CDN** (Cloudflare Pages, …): `npm ci && npm run build`, publish `out/`.
`public/_headers` and `public/_redirects` carry the same rules for Cloudflare Pages. The site must
run on its own domain on the same site as the API (`pokyh.com` → `api.pokyh.com`; a
`*.pages.dev` address cannot sign in).

Either way:

- `NEXT_PUBLIC_SITE_URL=https://pokyh.com`, `NEXT_PUBLIC_API_BACKEND_URL=https://api.pokyh.com`
- `NEXT_PUBLIC_API_KEY` matches the backend `API_KEY`
- the backend's `CORS_ORIGIN` includes this site's origin (`https://pokyh.com`)
- the menu prerendered into the Mensa page is as old as the build; the browser loads the current one

---

## Security notes

- WebUntis credentials are sent once, at sign-in, to the API, which passes them to WebUntis and
  never stores or logs them. The WebUntis session and the renewal live only in **encrypted,
  httpOnly** cookies of the API; page scripts cannot read them.
- The POKYH refresh token is an httpOnly cookie of the API, exchanged only at `/auth/web/refresh`.
- Writes to the API carry `X-API-Key`, so browsers ask the API (CORS preflight against its
  allowed origins) before sending them; the cookies are `SameSite=Strict`.
- The site itself holds no secrets: it is plain files.

---

## Troubleshooting

| Symptom                                    | Likely cause / fix                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| Signed in, but every request says `session_expired` | The browser did not send the API's cookies: the site must be on the same site as the API (`pokyh.com` → `api.pokyh.com`) and the API's `CORS_ORIGIN` must list it. |
| **CORS** error calling `api.pokyh.com`     | Add this app's origin to the backend's `CORS_ORIGIN`.                               |
| "Klasse nicht gefunden" for a guardian     | WebUntis didn't expose the child's class; the API derives it from the child's timetable. Check the API log line `[webuntis login] resolved`. |
| CSS preload warning in the console         | Harmless Next.js preload notice, **not an error**, no action needed. |
| Pushes not arriving                        | VAPID keys must be configured on the backend and the user must grant permission.    |

---

<div align="center">

Part of the **POKYH** project · Frontend (this repo) · iOS (SwiftUI) · Backend (Express/Prisma)

</div>
