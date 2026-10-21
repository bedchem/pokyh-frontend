# 2026-10-21 · Faster WebUntis routes, same live data (frontend `redesign`, backend `main`)

Factual log. No credentials, personal data or request bodies are recorded here.

## 2026-10-21 · Pre-work checks

- Frontend: `git status` clean on `redesign` at `26861c9`.
- Backend: `git status` clean on `main` at `0863adc`.
- Release state: uncommitted (both repositories).

## 2026-10-21 · Owner decisions

- Goal: faster `/webuntis/*` routes; everything stays live and behaves as
  before for the person, only loading times change.
- Nothing from WebUntis is stored on the server (no Redis, no MySQL, no disk);
  low memory on the host and in the browser.
- Approved: current bearer tokens for every read; renewal that keeps the
  resolved student, class and picture; read routes in parallel; loading on
  intent; instant display from the device for every page; keeping the
  WebUntis session from going idle (while someone is at the app, and on
  returning to the tab).
- Declined: caching permissions, app data or school-year data on the server
  (live data wanted); a timing header in the deployed build.

## 2026-10-21 · Findings

- The backend's own share of a `/webuntis/*` request is 1–3 ms; the rest is
  WebUntis (one request 44–250 ms; grades take two in a row).
- Most reads sent the bearer token sealed at sign-in. It expires after 15
  minutes; REST reads were then refused, and each refusal ran a full silent
  sign-in before the retry.
- WebUntis ends a session after roughly 6 idle minutes (refusals after 364 s
  and 470 s without requests; a session read every 30–60 s stayed alive).
- WebUntis' nginx closes idle connections after about 4 s, as long as Node's
  fetch keeps them: a longer client keep-alive gains nothing, and now and then
  a request goes out on a connection being closed (`fetch failed`, seen as one
  500 in the local test).
- The absence rate fetched every school-year week through the stored cache, so
  all weeks stayed in memory and in localStorage; every opened timetable week,
  date range and message stayed on the device until sign-out.
- Home loaded Wednesday-based weeks, the timetable and the app frame Monday
  weeks: the same lessons were fetched twice. The class register had two
  addresses for the current school year.
- Opening a message made three WebUntis requests (detail, a "mark read" that
  repeats the same GET, and the attachment list from the same detail).

## 2026-10-21 · Backend (`pokyh-backend`)

- `src/webuntis/memo.ts` (new, pure, `tests/webuntisMemo.test.mjs`): the
  per-session memory of `client.ts` with lifetimes and one shared lookup for
  requests asking at the same time (token, school year, CSRF token, tenant).
  In process memory only, as before; at most 2,000 sessions, idle ones dropped.
- `client.ts`: every read sends a current bearer token (`sessionHeaders` and
  `untisGetText` use `bearerToken()`); concurrent mints and CSRF page lookups
  are shared; `readFetch` sends a read once more when its connection was
  dropped before reaching WebUntis (never for writes); `untis()` takes
  `textOnly` for answers that are passed on as they are.
- `routes/webuntis.ts`:
  - Sign-in: the POKYH school lookup starts right after `authenticate`; the
    app data loads as soon as the token is there, alongside classes and
    students; the class-from-timetable samples (after the current week) are
    asked together. A renewal keeps the student, class and picture of the
    session it renews (same account and school, at most 4 hours old) and only
    signs in to WebUntis again; the token is minted alongside the POKYH sync.
  - Sign-in records `imageUrl: ''` when the app data shows no picture, so the
    avatar needs no lookup; sessions from before still look it up.
  - Grades take the current school year from the memory REST requests already
    use; recipients and message permissions load together.
  - WebUntis JSON is passed on as text instead of parsed and serialised again
    (timetable, lesson detail, homework, exams, class register, class
    services, messages); attachments, the excuse letter and the profile
    picture are streamed instead of held in memory whole.
- Checks: `prisma generate` (dummy URL) → `tsc --noEmit` clean; the three
  WebUntis unit test files pass (22 tests); `readFetch` checked against a
  local server that drops the first connection (read answered on the second
  attempt, write not repeated).

## 2026-10-21 · Frontend (`pokyh-frontend`)

- `lib/preload.ts` (new): loading on intent. A link the pointer rests on for
  60 ms, that a finger touches or that gets keyboard focus starts the first
  requests of the page behind it, with the pages' own addresses; each page at
  most every 20 s; a message only when it is already read (opening one in
  WebUntis marks it read). Installed once in `AppShell` while signed in with
  WebUntis.
- `lib/api.ts`:
  - `apiFetchStored`: live on every call, answer stored on the device only
    (no memory copy), shared while under way and for 5 s after; used for
    exams, homework, class services, permissions and message details.
  - Families of stored answers with endless addresses are capped: timetable
    weeks 8, exam and homework ranges 4 each, opened messages 10, single
    absence weeks 4; older devices are trimmed the next time a family is
    stored (`pcUrls` in `lib/persist-cache.ts`).
  - `fetchTimetableForCalc` for the absence rate: live, kept neither in memory
    nor on the device.
  - The current school year's class register has one address.
  - `markOpenedMessageRead` replaces the "mark read" request after opening a
    message (the opening GET is that request); the message list's "mark all
    read" is unchanged.
  - While WebUntis is used, a sign-in 3 hours old gets the silent renewal in
    the background (`renewWhileInUse`): current tokens ended the renewals that
    used to slide the 4-hour sign-in.
  - `refreshInbox` and `untisIdleMs` for the session keep-alive.
- `components/app/hooks.ts`: the person's name shows at once from the last
  permissions answer (the report gate still waits for the live one);
  `useKeepUntisSession` reads the inbox live after 3 minutes without WebUntis
  requests while someone is at the app (in view, input in the last 3
  minutes), and on returning to the tab after that long.
- Pages: home loads the Monday weeks 0–2 (shared with the timetable and the
  app frame), starts its exam sources at once and shows stored exams and
  absence hours first; the class page shows stored services, absences, exams
  and homework first; a message opened before shows at once and its
  attachment list comes from the same answer.
- Checks: `tsc --noEmit` and `eslint lib components app` clean.

## 2026-10-21 · Local test

- Backend run isolated from a scratch folder (throwaway secrets) against an
  empty throwaway MariaDB (XAMPP binaries, own data folder, port 3399, schema
  via `prisma db push`); static build served with the nginx rules on :3012;
  signed in with a real WebUntis account, reads only.
- Measured through the browser: timetable 47–148 ms, exams 44–118 ms,
  homework 46–104 ms, absences 47–103 ms, class register 85–135 ms, messages
  103–247 ms, grades 281–360 ms, renewal 119–144 ms (first sign-in 332 ms).
- Hover, then click: page with its data on screen after 35–106 ms once the
  page's code is loaded; the first visit of a page adds its code (about
  300 ms locally, served without caching).
- Token refresh after 15 minutes answered 200 with a new token; no refused
  requests while the session was in use.
- Afterwards: all local servers stopped, the earlier `out/` put back.

## 2026-10-21 · Report gate for students under 18

- Owner: "Abwesenheit melden" showed for students under 18 on the absences
  page, unlike WebUntis; and for those who may report, the button came up
  about a second after the page.
- Cause: when WebUntis' own flag (`showCreateAbsence`) could not be read, the
  backend scanned the app data for absence permissions, which students under
  18 hold too, and answered `canReportAbsence: true`.
- Backend (`main`): `/webuntis/permissions` and the gate before a report
  (`canReportAbsence`) follow only `showCreateAbsence`, as the WebUntis page
  does; unreadable counts as no. The permission scan (`detectAbsenceRight`)
  and its setting `WEBUNTIS_ABSENCE_RIGHT` are removed (`.env.example`).
- Frontend: the absences page uses the frame's shared permissions
  (`useUntisPermissions`) instead of its own request; the hook shows the last
  live answer stored on this device at once (name and button), then the live
  one. The copy lives under its own key (`#permissions`), so answers stored
  under the API's address before this fix are not used; the API checks the
  right live again before any report.
- Checks: backend `tsc --noEmit` clean, WebUntis unit tests 27/27; frontend
  `tsc --noEmit` and `eslint` on the changed files clean. Not tried with a
  real under-18 account.
- Release state: uncommitted; deploy the backend first.
