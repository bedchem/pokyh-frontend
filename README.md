<div align="center">

# POKYH — Web Frontend

**The web app for students and guardians of LBS Brixen — WebUntis, reimagined.**

Stundenplan · Noten · Mensa · Abwesenheiten · Nachrichten · To-dos · Klassen-Erinnerungen — an einem Ort, als installierbare PWA.

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
notifications. WebUntis calls are proxied **server-side** so credentials and session cookies never
touch the browser.

---

## Features

- 📅 **Stundenplan** — timetable with lesson details, exams and homework
- 📊 **Noten** — grades with subject breakdowns and averages
- 🍽️ **Mensa** — daily menu with star ratings & comments (POKYH backend)
- 🚫 **Abwesenheiten** — view, self-report and excuse absences (where WebUntis permits)
- ✉️ **Nachrichten** — WebUntis message center (inbox / sent / drafts, attachments)
- ✅ **To-dos** — personal tasks, realtime-synced across devices
- 🔔 **Erinnerungen** — class-wide reminders with threaded comments
- 👪 **Eltern-Accounts** — guardians log in and are auto-assigned (invisibly) to their child's class
- 📲 **PWA** — installable, offline-aware, Web Push notifications
- 🔐 **Passkey/credential** save for frictionless re-login

---

## Architecture

The browser never talks to WebUntis or holds secrets directly. **Next.js route handlers**
(`app/api/**`) act as a secure server-side proxy:

```
Browser  ──►  Next.js Route Handlers (server)  ──►  WebUntis
   │                     │
   │                     └────────────────────►  POKYH Backend (api.pokyh.com)
   │
   └─ httpOnly session cookie · public user cookie · readable access-token cookie
```

- **`/api/webuntis/*`** — proxies WebUntis (timetable, grades, messages, absences, …) using a
  WebUntis session that lives **only** in an encrypted, httpOnly cookie.
- **`/api/auth/*`** — POKYH session lifecycle (`login`, `refresh`, `logout`, `pokyh-login`,
  `register`). The refresh token is httpOnly; refresh happens **server-side** so it actually works.
- **`proxy.ts`** (middleware) — gates every non-public route on a valid, non-expired session and
  redirects to `/login` otherwise.
- **Client `lib/api-client.ts`** — talks to the POKYH backend with `X-API-Key` + `Bearer` token,
  transparently refreshing on `401` and emitting a clean session-expiry event when it can't.

---

## Tech stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16 (App Router, route handlers)           |
| UI             | React 19 · Tailwind CSS 4 · Framer Motion         |
| 3D / landing   | three.js · @react-three/fiber & drei              |
| Language       | TypeScript (strict)                               |
| Realtime       | Server-Sent Events (`EventSource`)                |
| Offline / PWA  | Service worker + persistent caches (`lib/persist-cache.ts`) |
| Push           | Web Push (VAPID)                                  |
| Analytics      | Vercel Analytics                                  |
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
npm run dev                    # http://localhost:3000
```

> The dev server runs on **port 3000**. Make sure the backend's `CORS_ORIGIN` includes
> `http://localhost:3000`.

---

## Environment variables

Create **`.env.local`** (never commit it). Values prefixed `NEXT_PUBLIC_` are exposed to the
browser; the rest are server-only.

| Variable                       | Scope   | Purpose                                                                 |
| ------------------------------ | ------- | ----------------------------------------------------------------------- |
| `SESSION_SECRET`               | server  | Key for encrypting the WebUntis session cookie. **Secret.**             |
| `NEXT_PUBLIC_SITE_URL`         | public  | Canonical site URL for SEO/metadata. **Prod:** `https://pokyh.com` — note the `https://` (a malformed value breaks sitemap/OG, not auth). |
| `API_BACKEND_URL`              | server  | POKYH backend URL for server-side calls (no CORS). e.g. `https://api.pokyh.com` |
| `NEXT_PUBLIC_API_BACKEND_URL`  | public  | POKYH backend URL for client-side calls.                                |
| `API_BACKEND_KEY` / `NEXT_PUBLIC_API_KEY` | both | `X-API-Key` — must match the backend's `API_KEY`.                  |
| `API_SERVER_KEY`               | server  | `X-Server-Key` for the trusted server-to-server login. **Secret.** Must match the backend's `SERVER_KEY`. |
| `WEBUNTIS_BASE_URL`            | server  | WebUntis base, e.g. `https://lbs-brixen.webuntis.com/WebUntis`.         |
| `WEBUNTIS_SCHOOL`              | server  | WebUntis school short name, e.g. `lbs-brixen`.                          |
| `WEBUNTIS_API_PATH_*`          | server  | Overridable WebUntis REST paths (verified against LBS Brixen).          |
| `WEBUNTIS_ABSENCE_RIGHT`       | server  | Permission tokens that unlock absence report/excuse.                    |
| `NEXT_PUBLIC_DEBUG_API`        | public  | `true` to log API calls in the console.                                 |
| `NEXT_PUBLIC_FORCE_ABSENCE_REPORT` | public | Dev override to force-show the absence UI. `false` in prod.          |

> **Secrets** (`SESSION_SECRET`, `API_SERVER_KEY`) must only ever be set server-side and must
> never be prefixed `NEXT_PUBLIC_`.

---

## How auth works

1. The user enters their **WebUntis** credentials at `/login`.
2. `POST /api/webuntis/login` (server) authenticates against WebUntis, resolves the student (or, for
   a guardian, the **child** — including deriving the class from the child's timetable when WebUntis
   doesn't expose it), then performs a trusted **server-to-server** login at the POKYH backend with
   `X-Server-Key`.
3. On success it sets cookies:
   - `pockyh_session` — encrypted WebUntis session (**httpOnly**)
   - `pockyh_api_token` — POKYH access token (readable by JS; sent as `Bearer`)
   - `pockyh_api_refresh` — POKYH refresh token (**httpOnly**)
   - `pockyh_user` — non-sensitive profile for the UI
4. The client uses the access token for backend calls. On `401` it calls **`/api/auth/refresh`**,
   which reads the httpOnly refresh cookie server-side, mints a fresh access token and updates the
   cookie. If refresh fails, a single `pockyh-session-expired` event redirects cleanly to `/login` —
   no retry loops.

---

## Project layout

```
app/
├── (pages)           # home, timetable, grades, mensa, absences, messages,
│                     # todos, reminders, profile, class, login, + landing/legal
├── api/
│   ├── auth/         # login · pokyh-login · refresh · logout · register
│   ├── webuntis/     # server-side WebUntis proxy (timetable, grades, messages, …)
│   ├── push/         # Web Push subscription registration
│   └── mensa/        # cafeteria menu proxy
proxy.ts              # middleware: session gate + public-path allow-list
providers/            # Session, App, Theme, Sidebar, ActivityLogger contexts
lib/                  # api-client (backend), api (WebUntis), session-crypto,
│                     # server-session, untis-permissions, caches, push, passkey
components/           # UI: nav, guards, landing, messages, absences, ui/*
workers/              # web workers (3D landing scene)
public/               # PWA assets, icons, models
```

---

## Scripts

```bash
npm run dev      # start the dev server (http://localhost:3000)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
```

---

## Deployment

Standard Next.js deployment (self-hosted or any Next-compatible host). Set all environment
variables in the host's config and ensure:

- `NEXT_PUBLIC_SITE_URL=https://pokyh.com`
- `API_BACKEND_URL` / `NEXT_PUBLIC_API_BACKEND_URL` point at the backend (`https://api.pokyh.com`)
- `API_BACKEND_KEY` / `NEXT_PUBLIC_API_KEY` match the backend `API_KEY`
- `API_SERVER_KEY` matches the backend `SERVER_KEY`
- the backend's `CORS_ORIGIN` includes this app's origin (`https://pokyh.com`)

```bash
npm ci
npm run build
npm run start
```

---

## Security notes

- WebUntis credentials are used **once** at login; only an **encrypted, httpOnly** session cookie
  persists. The browser never sees the WebUntis session or the refresh token.
- The POKYH refresh token is httpOnly and only ever exchanged through the server route
  `/api/auth/refresh` — client JS can't read it.
- The session-gate middleware (`proxy.ts`) enforces a maximum session age that matches the cookie
  lifetime.
- Server-only secrets are never prefixed `NEXT_PUBLIC_`.

---

## Troubleshooting

| Symptom                                    | Likely cause / fix                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| Repeated `GET /auth/me 401` after login    | Backend didn't issue a token (rate limit / `X-Server-Key` mismatch) **or** stale cache. Hard-refresh; verify the backend is deployed with the server-key rate-limit bypass. |
| **CORS** error calling `api.pokyh.com`     | Add this app's origin to the backend's `CORS_ORIGIN`.                               |
| "Klasse nicht gefunden" for a guardian     | WebUntis didn't expose the child's class; the login route derives it from the child's timetable. Check the server log line `[login] resolved {…}`. |
| CSS preload warning in the console         | Harmless Next.js preload notice — **not an error**, no action needed.               |
| Pushes not arriving                        | VAPID keys must be configured on the backend and the user must grant permission.    |

---

<div align="center">

Part of the **POKYH** project · Frontend (this repo) · iOS (SwiftUI) · Backend (Express/Prisma)

</div>
