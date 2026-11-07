# 2026-11-07 · Classes from WebUntis, app sign-in check, faster endpoints, Prisma 7

Factual log. No credentials or personal data are recorded here.
Repositories: `pokyh-backend` (d0bd918), `pokyh-frontend` (46d621a),
`POKYH_IOS` (666ba01).

## What the owner asked for

- Parent accounts never in a class; many pupils had no class: take the class
  reliably from WebUntis, and check every account once more at its next
  sign-in, only once.
- A better admin page for the autonomous Mensa.
- Every endpoint faster, every dependency up to date and secure, a full
  security check; test everything, then commit and push.

## Findings

- An admin's "parent" was undone by the next sign-in: a parents' login on the
  child's WebUntis record looks like the child, so the parent went into the
  child's class.
- The iOS app never sent its WebUntis session at sign-in, so the backend had
  nothing to take a class from.
- Critical: the server key ships inside the apps, and `POST /auth/login` with
  it signed in any username without proof, past every rate limit.
- Self-registration could take a pupil's name before their first WebUntis
  sign-in.
- `/readyz` reported ready before the revoked sessions were loaded and the
  default school and menu existed.

## What changed

- App sign-in: the app's WebUntis session is required; the backend asks
  WebUntis whose it is (login name, and the school's tenant once known) before
  anything is created. Errors and limits: `docs/class-assignment.md`.
- Class rules v2 (`CLASS_CHECK_VERSION = 2`): admin role choices stick
  (`role_locked`); guardians are told by their children; more class sources
  (timetable set-up, weekly timetable by id, the single class of the picker);
  every account without a class records why (`class_note`). One-time start-up
  jobs `role-lock-v1`, `local-origin-v1`, `class-check-v2`.
- Self-registration off unless `SELF_REGISTRATION=true`; a self-registered
  local account with a pupil's name is taken over by the verified WebUntis
  account (audit `user.local_takeover`).
- Security: admin tokens revoked on password, second-factor and passkey
  changes; JWT algorithm and audience pinned; push endpoints only to the
  browsers' push services; large request bodies only behind a signed admin
  token; access token in the query only for SSE; website messages sanitized
  with an allowlist.
- Admin panel: class status, filters and reasons on the users page, role
  dialog with "Automatisch (WebUntis)"; Mensa page with status, upcoming days,
  preview and confirmation before a plan or mode change, own days with a
  reason.
- Speed: request logs written in batches, cached admin figures, fewer
  queries per request (`/admin/stats` 16 to 1, vote 24 to 6, `/auth/me` 10 to
  3), the dishes' ratings from the cache, indexes, a separate pool for
  analytics.
- `/readyz` answers ready only once revoked sessions are loaded and the
  default school and menu exist.
- Dependencies: zod 4, Express 5.3, express-rate-limit 8, Prisma 7 (MariaDB
  driver adapter, `prisma.config.ts`), Next 16.4.5, React 19.3; images
  `mysql:8.4.13`, `redis:7.4.12-alpine`, `node:22.23.4-alpine`,
  `caddy:2.11.9-alpine`. `npm audit`: 0 in backend, admin panel and website.
- Website: shows why an account has no class.
- iOS (`POKYH_IOS` 666ba01): sends its WebUntis session at sign-in and
  renewal, signs in to WebUntis again when the session expired.

## Verification

- Backend: `npm test` 452/452, `tsc`, admin build. End-to-end with real
  processes, MySQL 8.4.13 and a stand-in WebUntis: app sign-in and account
  21/21, admin 22/22, push 14/14, replication 26/26 (19/26 before this
  work), installer 20/20, relays 9/9, updates 6/6, features 5/5, blue/green
  updater with the pinned images 6/6; the local Mensa suites 12/12, 7/7 and
  10/10.
- Production image (Node 22.23.4 Alpine, Prisma 7) against MySQL 8.4.13:
  schema applied, the one-time jobs ran, ready after 7 s, 3 s at the second
  start; `migrate diff` against the live database empty.
- Benchmark (`tests/perf/bench.mjs`, 24 requests at once): 472 req/s before
  this work (600 requests); with 6000 requests 723 to 915 with the faster
  endpoints on Prisma 5, 746 to 1112 on Prisma 7. The ratings of 20 dishes
  47 to 4 ms.
- Website: `npm test` 83/83, `eslint`, `next build`. Admin panel in
  Playwright's Chromium, light and dark, 1440 and 390 px, no console errors.
  iOS build on the simulator.
- `npm audit`: 0 in backend, admin panel and website.

## After the deploy

- Ship the iOS update right after the backend: older app builds are refused
  at sign-in until updated.
- Check the logs for `class_check_reset`, `role_lock` and
  `local_origin_backfill`.
- The Ladin texts of the website's new class notes need a review.
