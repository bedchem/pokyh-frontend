# 2026-10-16 · Frontend rebuild (branch `redesign`)

Factual log of the frontend rebuild. No credentials, personal data or request
bodies are recorded here.

## Scope confirmed by the owner

- Full rebuild of the web frontend on branch `redesign`; no commits or pushes
  without the owner.
- Browser verification is read-only. Real WebUntis writes (sending messages,
  excusing absences, changing the password) are tested by the owner.
- Languages: German, Italian, English. Ladin is removed from the UI.
- Public pages are redesigned; the legal wording, company and address data
  stay unchanged.
- GSAP and Lenis on the public pages, GSAP in the app.
- WebUntis credentials for silent re-login move from `sessionStorage` into
  the encrypted, httpOnly session cookie.
- The Android repository is reference material only and is not modified.

## Pre-work checks

- `git status`: clean on `main` before branching.
- Open pull requests (GitHub API): none for `bedchem/pokyh-frontend`, none for
  `bedchem/pokyh-backend`.
- `pokyh_learn-frontend` is not present on this machine, so this worklog lives
  in `pokyh-frontend/docs/worklog/` as agreed with the owner.

## Inventory of the existing frontend

- Next.js 16.3.5, React 19.2, Tailwind 4, framer-motion, three.js. Root layout
  in `app/[lang]`, locale prefix plus trailing slash enforced by `proxy.ts`.
- WebUntis is proxied by the frontend's own route handlers
  (`app/api/webuntis/*`); the POKYH backend serves auth sync, Mensa, ratings,
  comments, to-dos, reminders, classes, popups, privacy and push.
- Existing WebUntis features: timetable, lesson detail, exams, homework,
  grades, absences (read), class register events, class services, messages
  (inbox, sent, drafts, read state, attachments, recipients, send, drafts),
  profile image, permissions.

## Problems found

- Navigation: the mobile bottom navigation component exists but is never
  rendered; mobile relies on a hamburger drawer.
- Redirects: `AuthGuard`, the session-expiry handler and the dashboard send
  users to `/login` without `?next=`, so deep links are lost after expiry.
- Loading: the landing page shows a full-screen tile cover for at least 1.5 s
  on every visit, blocks scrolling and input until the 3D model is ready.
- Security: the WebUntis password is stored base64-encoded in
  `sessionStorage` (readable by any script). The login route logs the
  username in production logs.
- Absence writes: the create/excuse paths in
  `app/api/webuntis/absences/{create,excuse}` do not exist in the official
  WebUntis web client; they were unverified guesses.

## WebUntis capability research (official web client, read-only)

Source: the publicly served WebUntis web client of the school instance
(classic bundle `js/untis/main.js` 2027.3.1 and the new UI bundle).

- Change password: `POST {base}/api/profile/access/password`, JSON
  `{ oldPassword, newPassword }`. The client sends the session's
  `X-CSRF-TOKEN` (from the page configuration) and `Tenant-Id`.
  Errors arrive as `{ errors: [{ code, title }] }`.
- Forgotten password: `POST {base}/passwordReset/resetPassword.do`, JSON
  `{ username, email }`. Error codes: `INVALID_USER_DATA`,
  `SEND_EMAIL_FAILURE`, `PW_RESET_NOT_ALLOWED`, `INTERNAL_ERROR`.
- Login states returned by `j_spring_security_check`: `SUCCESS`,
  `MUST_SET_PASSWORD`, `MUST_UPDATE_LEGACY_PASSWORD`, `TOKEN_REQUIRED`,
  `LOGIN_ERROR`.
- Password rules: validated client-side by the official form (length, upper
  and lower case, digits, special characters, must differ from username and
  old password).
- Student absence self-service (report/excuse) is not part of the public
  bundles; it loads only for signed-in users. Pending read-only discovery with
  the owner's signed-in session.

## Messaging: why "write message" failed, and the fix

Reported by the owner: sending a message from Pokyh does not work.

Comparison with the official WebUntis web client (generated REST client in
the new UI bundle) showed:

- For the `TEACHER`, `STAFF` and `CUSTOM` recipient options the official
  client posts to `POST /api/rest/view/v2/messages/users` with
  `{ subject, content, requestConfirmation, recipientUserIds, forbidReply,
  oneDriveAttachments, draftMessageId? }`. Pokyh posted to
  `/api/rest/view/v2/messages` with `recipientPersons: [{ id }]` and
  `recipientGroups`, field names WebUntis does not accept.
- Other options use `POST /api/rest/view/v2/messages` with
  `recipientPersonIds` / `recipientGroupIds`.
- Drafts (`POST /v2/messages/drafts`, `PUT /v2/messages/drafts/{id}`) carry no
  recipients.
- Message content is HTML (the official composer is a rich-text editor).
- REST calls need a fresh bearer token, `Tenant-Id` and
  `X-Webuntis-Api-School-Year-Id`; Pokyh reused the token captured at login,
  which expires.
- There is no "mark as read" endpoint; the official client marks a message read
  by opening it (`GET /v1/messages/{id}`). Pokyh called a non-existent
  `/markasread` path.
- Attachments: `GET /v1/messages/{storageId}/attachmentstorageurl` (signed URL
  plus headers) or `GET /v1/messages/{id}/attachment`; Pokyh tried a list of
  guessed URLs.
- Also available in the official client: reply
  (`POST /v2/messages/{id}/reply`, prefill via `GET /v1/messages/{id}/reply-form`),
  read confirmation (`POST /v1/messages/{id}/read-confirmation`), bulk delete,
  unread status (`GET /v1/messages/status`).

Changes:

- New `lib/server/untis.ts`: one server-side WebUntis client (session cookie,
  cached fresh bearer token, tenant and school-year headers, CSRF token lookup
  for classic writes, error extraction).
- `app/api/webuntis/messages/send`: sends exactly the official request for the
  account's recipient option; drafts without recipients; HTML content; one
  request per write, no fallback paths.
- `app/api/webuntis/messages` (list/detail/read), `.../draft`,
  `.../recipients`, `app/api/webuntis/attachment`: moved to the shared client
  with fresh tokens; removed the guessed endpoints.
- Verification: `tsc --noEmit` passes. A real send has to be confirmed by the
  owner (writes are not performed during development testing).

## Read-only verification with the owner's signed-in WebUntis session

The owner signed in to WebUntis in their own browser. No button was pressed and
nothing was submitted; only page loads and GET requests were made.

Messaging:

- The signed-in WebUntis loads `assets/index-xovnDbg8.js`, the bundle the
  messaging analysis above was based on.
- `GET /v1/messages/permissions` for the account: `recipientOptions: ["TEACHER"]`,
  `maxFileCount: 5`, `maxFileSize: 7000000`, read confirmations and
  reply-forbidding not allowed. With `TEACHER` the official client sends via
  `POST /v2/messages/users` with `recipientUserIds`, which is what Pokyh now does.
- `GET /v1/messages/recipients/static/persons` returns groups
  `CLASS_TEACHERS`, `TEACHERS`, `OTHERS` with persons
  `{ displayName, imageUrl, userId, tags }`.
- The official teacher picker is single-select (`[selectedPersonId]`, a
  `userId`). The send route now requires exactly one recipient for the
  `TEACHER` option.

Absences (from the embedded classic module `classreg/studentabsences` and the
shared `classreg/absences/widget/absence.ts`):

- Student actions offered by WebUntis: "Abwesenheit melden", "Löschen",
  "Entschuldigungsschreiben drucken". The excuse status itself is set by the
  school; students cannot mark an absence as excused.
- Report: `POST /api/classreg/absences/students/self`
  `{ studentId, startDate, startTime, endDate, endTime, reasonId, text }`
  → `{ data: { result, conflicts } }`, success when `conflicts` is empty.
- Edit: `POST /api/classreg/absences/students/edit` (adds `absenceId`).
- Delete: `DELETE /api/classreg/absences/students` with `{ absenceIds }`.
- Defaults and reasons: `GET /api/classreg/absences/meta`.
- Excuse letter (PDF): `GET /reports.do?name=Excuse&format=pdf&rpt_sd&rpt_ed&excuseStatusId&withLateness&withAbsences&excuseGroup&id`.
- Classic endpoints are called with the session's `X-CSRF-TOKEN` and
  `Tenant-Id` headers.
- Implementation of these flows is scheduled after the design checkpoint.

## WebUntis writes implemented (absences, messages, password)

All requests mirror the official WebUntis web client. Classic endpoints are
sent with the session cookie, the session's `X-CSRF-TOKEN` and `Tenant-Id`
(read from the WebUntis page configuration); a 403 from a stale CSRF token is
retried once with a fresh token (nothing was written in that case). Date
format `yyyymmdd`, time format `hhmm` as numbers, as in the official client.

Absences (`app/api/webuntis/absences/*`):

- `create`: `POST /api/classreg/absences/students/self`; student id from the
  session only; WebUntis' `showCreateAbsence` gate checked first; conflicts
  returned as 409.
- `excuse`: per absence `GET /api/classreg/absences/student?absenceId=`,
  only when `canEdit`, then `POST /api/classreg/absences/students/edit` with the
  absence's own times plus reason and note. Partial results return 207.
- `delete`: `DELETE /api/classreg/absences/students` `{ absenceIds }`.
- `meta`: `GET /api/classreg/absences/meta` (reasons, defaults).
- `excuse-letter`: `GET /reports.do?name=Excuse&format=pdf…`; a finished report
  is streamed as PDF; an unfinished one answers 202 (the polling contract of the
  official client was not reproduced).
- The previous guessed calendar-entry endpoints were removed. The earlier
  403 on the classreg write path is explained by the missing CSRF token.

Messages:

- `reply`: `GET /v1/messages/{id}/reply-form`, `POST /v2/messages/{id}/reply`.
- `recipients` now reports the recipient option; the compose sheet is
  single-select for `TEACHER`; reply mode added to the compose sheet and a reply
  button to the message detail page.

Password:

- `password`: `POST /api/profile/access/password` `{ oldPassword, newPassword }`,
  rate-limited per session, nothing logged or stored; on success the client
  updates the credentials kept for automatic re-login.
- `password-reset` (public): anonymous WebUntis session, then
  `POST /passwordReset/resetPassword.do` `{ username, email }`; WebUntis error
  codes mapped to messages; rate-limited per IP; added to the proxy's public
  API list. A link to WebUntis' own reset page is offered as fallback.

UI hook-ups in the existing screens: report button and sheet re-enabled,
"Grund angeben" per open absence, excuse-letter link (absences); password
change section (profile); "Passwort vergessen?" sheet (login).

Verification: `tsc --noEmit` passes. No write was performed during
development; all writes need a test by the owner. Known gap: the app group has
no layout yet (old shell removed), so signed-in pages render without
navigation until the new app shell is built.

## Homepage rework (public `/[lang]/`)

Scope from the owner: new hero and section transitions, Android colours, the
3D feature carousel kept, German copy only (other locales fall back to it).

- Colours: the `.site` tokens now use the Android palette
  (`ui/theme/Palette.kt`): paper `#F5F2ED`, night `#111114`, logo indigo
  `#534AB7`, periwinkle `#DEDDFB`/`#4A46A6`, text ramp `#1C1A17`/`#6C655C`/
  `#A39B90`. This also applies to the other public pages' header and footer.
- New homepage in `components/home/` (copy in
  `lib/i18n/dictionaries/frontpage.ts`, German only):
  - Intro curtain once per browser session (greeting by school time, counter),
    skipped for reduced motion; an inline script in the page hides it before
    first paint on later visits, and a CSS fallback removes it after 4.5 s.
  - Hero: "POKYH" wordmark on paper, GitHub link, scroll cue, short line.
    Scrolling flies a three.js camera through a tunnel of school-day tiles
    (`components/home/heroScene.ts`, loaded lazily) into a dark screen; tiles
    can be clicked to turn over.
  - Statement on night, words lighting up with scroll.
  - Feature carousel (`components/landing/FeatureCarousel.tsx`): now pinned and
    turned by scrolling; each function floods the background with its colour
    and its name glides above the ring; Mensa is not part of the ring.
  - "Heute in der Mensa": today's dish only (or the next one on the plan),
    average star rating from the public ratings endpoint, one photo.
  - The real app icon (`/POKYH_Logo.png`) opens into the indigo "Hol dir
    POKYH." section with the ways in (browser, Android, iPhone, web app).
- Shared footer: large title, no wordmark, no "made in" line (`madeIn` key
  removed from `site.ts`).
- `lib/motion.ts` registers DrawSVGPlugin and adds two calm text reveals.
- The previous homepage components in `components/landing/` (except the
  carousel and `useMensaDishes`) and `lib/i18n/dictionaries/homepage.ts` keys
  for them are no longer rendered; they were left in place.

Verification: `tsc --noEmit` passes (apart from stale `.next/types` entries for
the moved routes), ESLint clean on the changed files, page scrolled end to end
in the browser on the dev server without console errors. Not yet checked on a
real phone.
