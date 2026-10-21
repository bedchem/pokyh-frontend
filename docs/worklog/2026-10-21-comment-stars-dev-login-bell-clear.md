# 2026-10-21 · Stars beside every dish comment, sign-in on localhost, clearing the bell (branch `redesign`)

Factual log. No credentials, personal data or request bodies are recorded here.

## 2026-10-21 · Pre-work checks

- `git status` (frontend): the bell's uncommitted work of the same day
  (`2026-10-21-notification-bell.md`) on `redesign` at `e83066b`.
- `git status` (pokyh-backend): clean at `36d7066`.
- Release state: uncommitted

## 2026-10-21 · A comment's author's stars, also across a changed stableUid

- Owner reported that comments under a dish don't show the author's stars
  although the author rated the dish.
- Cause: the frontend matched comment and vote by `stableUid`. When an
  account's user row is recreated (school-year rollover, database rebuild),
  `reclaimDishRatings` moves its votes to the new stableUid; its comments keep
  the old one, so the stars (and the "Du" badge) are missing on them.
- pokyh-backend:
  - `src/utils/commentStars.ts` (new, pure): `withStars` gives every comment
    `stars` — the vote under its stableUid, else the vote under the same
    account name (case-insensitive) within the same school, else `null`.
  - `src/services/dishComments.ts`: `commentsForDish` reads the dish's votes
    of the menu alongside and attaches the stars (GET for signed-in accounts,
    `/sse/dish-comments`, `publishDishComments`).
  - `src/routes/dishComments.ts`: the cached comments also depend on
    `DishRating`. Guests still get placeholders only, no stars.
  - `src/routes/dishRatings.ts`: a vote also republishes the dish's comments;
    `src/cluster/effects.ts`: a vote replicated from another node does too.
  - `tests/commentStars.test.mjs` (new, 6 tests).
- Frontend: `ApiComment.stars` (`lib/api-client.ts`); `CommentSection`
  shows the live vote under the same stableUid first, else `stars`.
- The fix shows only once the backend is deployed (deploy backend first).
- Not changed: editing and deleting stays bound to the comment's stableUid,
  so a comment from before a stableUid change still can't be edited by its
  author.
- Checks: backend `tsc --noEmit` clean; `node --test tests/commentStars.test.mjs`
  6/6; `npm test` 215/220 — the 4 failures are the cluster installer/update
  tests that need a Unix shell, tar and file modes (Windows), unrelated.
  Frontend `tsc --noEmit` and `eslint` clean.

## 2026-10-21 · Signing in through `next dev`

- Owner reported that signing in on the local dev server failed.
- Cause: the dev rewrites passed the browser's `Origin: http://localhost:3011`
  on to the API, whose CORS list doesn't hold it (403 "CORS: origin … not
  allowed"); browsers send an Origin on same-origin POSTs too.
- `app/dev-api/[...path]/route.dev.ts` (new): passes the API's paths on
  without Origin, Host and hop-by-hop headers (as a server call: API key and
  sign-in still required), keeps every Set-Cookie, drops `Secure` from them
  when the page is plain http (LAN devices), ends a cut-off stream (`/sse`)
  quietly so EventSource reconnects, answers 502 when the API can't be
  reached.
- `next.config.ts` (development only): `pageExtensions` gains `dev.ts`, the
  rewrites point at `/dev-api/…`. The static build doesn't register the file:
  `next build` passes and `out/` has no `dev-api`.
- The production CORS configuration is unchanged.
- Checks: through the dev server, `POST /webuntis/login` without credentials
  answers 400 "Benutzername und Passwort erforderlich" (was 403); `GET
  /dishes` 200.

## 2026-10-21 · The bell: clearing, and a streak that ran out

- Owner asked for clearing notifications (one by one and all at once) and for
  a notice when the streak ran out. A "mark all read" button was added and
  taken out again on the owner's word (opening the bell already counts
  everything as seen); a warning before the streak runs out was dropped
  (any request of the account counts the day, so in the app it would
  practically never show).
- `lib/bell-feed.ts`: `SeenState.cleared` (newest first, at most 400);
  `clearKeys`, `withoutCleared`; `lostStreak` — the latest run of at least
  3 active days (the first milestone) followed by a whole day without POKYH
  (a quiet today doesn't end one yet, as on the backend); `buildFeed` adds it
  as `streakLost` on the day it ran out, within the 14 days. `readSeen` reads
  states stored before as nothing cleared.
- `components/app/useBell.ts`: the feed leaves out what was cleared;
  `clear(keys)`; the lost streak from the activity's days.
- `components/app/Bell.tsx`: an × on every row (always visible) and "Alle
  entfernen" with a red trash icon in the header; a cleared row slides out and the list closes up
  (`.bellItem` in `shell.module.css`, all at once one after another), then
  leaves the feed; focus stays in the panel. A lost streak: an unlit flame,
  "Deine Serie von N Tagen ist vorbei", "Fang heute eine neue an".
- Texts in `lib/i18n/dictionaries/bell.ts` (de/it/en).
- Cookies and storage (`app/[lang]/(site)/legal/content.ts`, de/it/en):
  `pokyh_bell_seen_*` also holds what was cleared.
- Checks: `node --test tests/bell-feed.test.mjs` 10/10 (3 new), `tsc --noEmit`
  clean, `eslint` clean on the changed files.
- Release state: uncommitted

## 2026-10-21 · Seen and cleared, the same on every device

- Owner asked whether clearing works account-wide (it was per browser) and
  then for it to be account-wide, asking first whether storing it is lawful.
- A "seen/cleared before time X" mark per account was considered and dropped:
  grades carry their exam date and often arrive days later, and due to-dos
  and reminders lie ahead, so a time mark would hide late grades or never
  clear due items. The identifiers the browser already keeps are stored
  instead.
- pokyh-backend (state at `35f5ced`, which holds the comment stars):
  - `prisma/schema.prisma`: `BellMark` (`bell_marks`: stable_uid, key ≤ 120,
    cleared, created_at; key (stable_uid, key); cascade with the user;
    index on created_at). Added by the start-up schema sync; replicated in a
    cluster without further code (catalog read from the database). Not part
    of the admin JSON export (short-lived state).
  - `src/services/bellMarks.ts`: read (last 30 days, newest 1000), add
    (seen stays seen, clearing upgrades a seen mark), delete expired.
  - `src/routes/users.ts`: `GET /users/me/bell` → `{ seen, cleared }`
    (`seen` includes the cleared; `Cache-Control: private, no-store`);
    `POST /users/me/bell` `{ seen?, cleared? }` → 204, at most 400 keys each,
    1–120 characters of `[A-Za-z0-9:._-]`; read/write rate limits.
  - `src/index.ts`: daily `cleanupBellMarks` (one node in a cluster), 30 days.
- Frontend:
  - `lib/bell-feed.ts`: `mergeSeen` (the account's marks joined in, same
    object when nothing is new), `unsyncedMarks` (what the account lacks).
  - `components/app/useBell.ts`: the device's copy shows at once; the
    account's marks are read when the bell starts, on opening (at most every
    30 s) and back in the tab after 5 minutes; what the device marks is sent
    800 ms later in batches of 400, unsent marks go with the next change or
    reading. The badge waits for the account's marks (at most 4 s), so
    another device's clearing doesn't flash up. Without the endpoint (backend
    not deployed yet, 404) or offline the device's copy stands.
  - `lib/api-client.ts`: `api.bell.marks()`, `api.bell.mark()`.
  - "Alle entfernen" got a red trash icon.
- Privacy notice (`app/[lang]/(site)/legal/content.ts`, de/it/en): new entry
  "Benachrichtigungen (Glocke)" (identifiers only, user ID, time; Art. 6(1)(b)
  GDPR; deleted after 30 days and with the account); a sentence in the
  storage periods; the browser entry `pokyh_bell_seen_*` refers to it. The
  canteen entry now says that a commenter's stars stand beside their comment
  (it said ratings appear only as average and count). `PRIVACY_NOTICE_VERSION`
  and `PRIVACY_NOTICE_DAY` raised to 2026-10-21: every account is asked to
  read the notice again.
- Deploy the backend before the frontend.
- Checks (bell sync): frontend `node --test tests/*.test.mjs` 49/49 (2 new), `tsc
  --noEmit` and `eslint` clean, `next build` passes; backend `prisma
  validate`, `tsc --noEmit` clean, `npm test` 215/220 with the same 4
  Windows-only cluster failures. Through the dev server the live API answers
  `GET /users/me/bell` with 404 (not deployed), which the bell handles.
- Release state: uncommitted

## 2026-10-21 · pokyh-backend CI green again

- Owner asked why the backend workflow exists and then for it to pass again.
- `.github/workflows/ci.yml` ("Backend verification", added 2026-09-11 in
  `1120c61`): on push, pull request and by hand — `npm ci`, `prisma validate`,
  `npm run build`, `npm audit --omit=dev`.
- Red on every push since 2026-10-21 04:22: only the audit step failed.
  `sanitize-html` 2.17.7 (popup HTML, `src/services/popupRender.ts`) has three
  moderate XSS advisories (GHSA-x3q4-9hxx-gx8m, GHSA-374f-7chj-9948,
  GHSA-cv27-6wvh-8x7j), published after it was installed; the dependency
  itself had not changed since `0f1b372`.
- `npm update sanitize-html`: 2.18.1 (within `^2.17.7`), `launder` 1.7.2,
  `deepmerge` no longer needed. Only `package-lock.json` changed.
- Checks: the workflow's steps run locally — `npm ci`, `prisma validate`
  (valid), `npm run build` (exit 0), `npm audit --omit=dev` (0
  vulnerabilities); `renderPopupContent` still renders Markdown, links and
  images and strips scripts, `javascript:` links, event handlers, meta
  refresh and SVG animation hrefs; `npm test` 215/220 with the same 4
  Windows-only cluster failures.
- The workflow turns green with the next push that contains the lockfile.
- Release state: uncommitted
