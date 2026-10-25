# 2026-10-25 · Read receipts, search, other timetables, the absence rate, QR sign-in

Factual log. No credentials, personal data or request bodies are recorded here.
Repositories: `pokyh-frontend`, `pokyh-backend`, `POKYH_ANDROID`. Follows
`2026-10-24-devices-2fa-webuntis-modules.md`.

## Pre-work checks

- `pokyh-frontend`: the owner committed the earlier work (`0d2d804`, `3af9327`).
- `pokyh-backend`: the owner committed the earlier work (`459219f`, `b5e9c30`).
- `POKYH_ANDROID`: the owner committed the two-factor sign-in (`40ca7eb`).
- Release state: what follows is uncommitted; the owner deploys.

## Messages (owner's request: read receipts, taking a message back, search)

- Backend routes (in `b5e9c30`): `/webuntis/messages?q=` (WebUntis'
  `searchText`), `POST /messages/confirm-read`, `GET /messages/read-status`,
  `POST /messages/revoke`.
- Inbox: messages waiting for a read confirmation (`readConfirmationMessages`)
  are listed with the others and marked "Bitte bestätigen"; the message itself
  has a banner with "Lesen bestätigen", afterwards the date it was confirmed.
- Sent: "x/y gelesen" in the list; the message opens who confirmed (per
  recipient, a class as "x/y"); "Zurücknehmen" where WebUntis allows it
  (`allowMessageDeletion`), with a second tap to confirm.
- Search over inbox and sent: the loaded list filtered at once, WebUntis'
  own search 350 ms after typing stops; a failed search keeps the filtered list.

## Other timetables (owner's request)

- `GET /webuntis/timetable/filters?type=` lists what the school shows
  (classes, teachers, rooms); `?type=&id=` on `/webuntis/timetable` loads one.
- Timetable page: "Mein Stundenplan" / the chosen one beside the school year
  (on a phone in the school-year menu, as the header is hidden there); weeks
  of the previous choice are dropped on switching; no absence overlay and no
  exam export for someone else's timetable.

## Absence rate (owner: /home and /abwesenheiten showed different figures, the whole jumped between 191 h and 203 h)

- Cause: every week of the year was requested at once, failed weeks counted
  as weeks without lessons, and that sum was kept for 7 days; /home counted
  missed minutes from the timetable while /abwesenheiten used WebUntis' own.
- Now `lib/absence-calc.ts` is used by both pages: the lessons are kept per
  week (`pokyh_abscalc_<student>_<year>`, same key as before, new format),
  three weeks at a time, a failed week is asked for again and there is no
  rate until every week is there; the whole counts lessons that have ended;
  missed minutes are WebUntis' where it gives them. Lessons one after the
  other are no longer merged. Tests: `tests/absence-calc.test.mjs`.
- "Bisher / Ganzes Jahr" on /abwesenheiten (owner's request): against every
  lesson up to 30 June; weeks still to come are loaded only for that.
- Removed on request: the "Pro Fach" panel on /abwesenheiten and the
  holiday countdown on /home.

## Signing the website in with the app (QR code)

- Website (`app/[lang]/login/QrSignIn.tsx`): "Mit der POKYH-App anmelden" on
  the school step and the account step; shows the code from
  `POST /webuntis/qr/start` as an image, asks `POST /webuntis/qr/poll` every
  2 s, replaces a code that ran out, asks for the authenticator code only when
  the backend answers `two_factor_required`. Needs the cookie choice first.
- App (`ui/settings/WebSignIn.kt`): Einstellungen → "Am Computer anmelden"
  scans with Google's code scanner (`play-services-code-scanner` 16.1.0, no
  camera permission), shows device, place and address
  (`GET /auth/qr/:code`) and approves (`POST /auth/qr/:code/approve`) with
  the app's WebUntis session and, where kept, the saved password. After a 401
  the app renews its POKYH token once (server-to-server sign-in, as at start).
- Login history and admin: method `qr` labelled.
- Checked locally against the test database: start, poll, info, approve,
  sign-in with refresh cookie, single use, sealed sign-in removed, history
  method `qr` (POKYH-only account). The WebUntis-account path needs a phone.

- Under the QR code: "POKYH für Android herunterladen" (the project's
  Android releases, `REPO_URLS.androidReleases`). `/login` is the website's
  only sign-in page; the QR way is on its school step and its account step.
- Backend: codes that ran out are deleted every minute (own interval in
  `src/index.ts`, no grace period), so a sealed handover the website never
  collected is gone at most three minutes after the code was made.

## Privacy policy

- New entry "Anmeldung mit der POKYH-App (QR-Code)" (de/it/en): what is
  stored about the computer, Google's code scanner without camera access for
  the app, the sealed handover (AES-256-GCM) and when it goes, database
  backups from those minutes. The sentences saying the password is never
  kept on POKYH servers now name this exception; retention updated.
- Date 25 October 2026; `PRIVACY_NOTICE_VERSION` `2026-10-25`, so everyone
  is asked once more.

## Timetable on tall screens, settings order (owner's request)

- Timetable, computers only (from 1024px wide, window at least 950px tall):
  the column keeps the 874px it has under the top bar of a maximised browser
  on a 1080p screen, so a taller screen no longer stretches the lessons; the
  page may scroll there. Phones, tablets and smaller windows unchanged.
- Settings: Darstellung first, then Konto & Sicherheit. The four cards
  (e-mail, password, two-factor sign-in, devices) are rows under thin rules
  with a 16 × 16 pixel icon on the left (`components/pixel/icons.ts`,
  `PixelIcon`); only a row that wants doing (no e-mail, two-factor off) keeps
  the accent outline. `SecurityCard` became `SecurityRow`.

## Other

- Removed `instrumentation-client.js`, a temporary layout check (fake
  timetable behind a `localStorage` flag), which every page loaded.
- `pokyh-backend/.gitignore`: `*.sql.gz.part` and
  `backups/database-state.json`, which the local test server had written into
  the repository (and which are in `b5e9c30`).

## Verification

- `pokyh-frontend`: `tsc --noEmit`, `eslint .`, `npm test` (60 tests) pass.
- `pokyh-backend`: `tsc --noEmit`, admin `tsc --noEmit`, `prisma validate`
  pass; `npm test`: 263 of 268 pass. The 4 failures are the cluster
  install/relay/update tests, which need a Unix machine (file modes 0600,
  shell, tar) and touch none of the changed files.
- `POKYH_ANDROID`: `:app:compileDebugKotlin` passes.
