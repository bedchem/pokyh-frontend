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
