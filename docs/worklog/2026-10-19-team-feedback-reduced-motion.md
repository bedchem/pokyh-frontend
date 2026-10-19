# 2026-10-19 · Team feedback round and reduced motion (branch `redesign`)

Factual log. No credentials, personal data or request bodies are recorded here.

## 2026-10-19 15:19 CEST · Pre-work checks and intent

- `git status`: clean on `redesign` (HEAD `cb8d071`). Open pull requests
  (`gh pr list`): none for `pokyh-frontend`, `pokyh-backend`,
  `pokyh_learn-frontend`. `pokyh_learn-frontend` has uncommitted worklog
  files of other sessions; left untouched apart from appending this round's
  entry to `2026-10-19-pokyh-frontend-owner-feedback.md`.
- Intent (owner forwarded a teammate's list): profile picture opens full
  screen; excuse-absence popup in the style of "Mitteilung senden"; personal
  usage statistics follow "Alle akzeptieren"; PDFs open in a viewer with a
  download button beside it; pixel scenes for empty states that have none
  (drafts and similar); Mensa pixel plate no longer builds from top to
  bottom; Mensa comment field reworked; less space under the to-do list;
  more WebUntis texts in the lesson detail; pixel scene for excused days;
  automatic dots in the date field; a softer light theme in the app; tab
  title "POKYH" in the signed-in app.
- Intent (owner, same round): with "reduce motion" switched on in the system
  (Windows animation effects, macOS/iOS Reduce Motion, Android remove
  animations) the site must still look complete, and a notice explains that
  the site is shown without animations and how to switch them back on, as on
  plattnericus.dev (`../LandingPage`, `components/motion/ReducedMotionNotice.tsx`).
- Release state: uncommitted

## 2026-10-19 16:05 CEST · Reduced motion: complete pages and a notice

- Checked first: every public page (13) and signed-in page (10) at 1440 and
  390 px in headless Chromium with `prefers-reduced-motion: reduce` (fixture
  data, no WebUntis calls), scrolled to the end, then every visible text block
  checked for low opacity or a hiding clip. No hidden text; the homepage
  scroll frames compared with the normal version showed two real gaps:
  - the sentence section ("Schule ist kompliziert genug …") was covered
    entirely: the functions block pulls itself up one screen to rise over it,
    which without motion simply hid it. `components/home/Features.tsx`:
    `motion-reduce:mt-0`.
  - the functions carousel slid its names sideways while scrolling and showed
    half of the next one. `components/landing/FeatureCarousel.tsx`: without
    motion the position is rounded, so one function at a time, no sliding or
    turning.
  - the app-icon hand-over (`components/home/AppOpen.tsx`, aria-hidden) was a
    still icon on an empty screen without motion: left out (`motion-reduce:hidden`).
  - footer: the "Tipp die Buchstaben an." hint is hidden without motion (the
    letters only jump with motion on).
- New notice `components/MotionNotice.tsx` (+ `lib/i18n/dictionaries/motion.ts`,
  de/it/en; Ladin falls back to German), mounted in
  `components/shell/GlobalOverlays.tsx`, following plattnericus.dev
  (`../LandingPage/components/motion/ReducedMotionNotice.tsx`): shown on every
  visit while the setting is on; says the page is complete but without
  animations and names the way to the setting for Windows (11 and 10), macOS,
  iOS/iPadOS, Android and others; closing quiets it for the tab
  (sessionStorage); waits for the cookie banner; held back on the sign-in
  form; above the phone tab bar in the app; does not move in. When the setting
  changes while a public page is open the page reloads (its scroll scenes are
  set up once on load); in the app it only hides/shows.
- Verification: `tsc --noEmit` clean, ESLint clean on the changed files;
  browser test 15/15 (no notice with motion on; Windows, macOS, iOS paths by
  user agent; phone placement; close and stay closed after navigation; waits
  for "Alle akzeptieren"; not on /login; app phone above the tab bar and
  desktop bottom right; public page reloads when motion is switched on; app
  hides without reload; it and en texts). Homepage frames with reduced motion
  re-checked at 1440 and 390 px.
- Release state: uncommitted

## 2026-10-19 16:20 CEST · Profile activity counted on every device

- Report: phone use did not show up in the profile's activity.
- Cause (read from `pokyh-backend` `origin/main`, not changed): active days
  come from the backend request log (`request_account_days`, written for
  requests that carry a valid account token). The access token lives one
  hour. The website's page views (`POST /activity-log`) and usage heartbeat
  (`POST /usage/ping`) use optional authentication, which treats an expired
  token as anonymous without answering 401, so the token was never renewed.
  A phone opened hours later and used only for WebUntis pages (served by the
  Next server, not the backend) therefore never counted as the account's
  day; a computer usually also opened a page needing the backend (to-dos,
  profile), whose 401 renewed the token.
- Fix (`lib/api-client.ts`): `apiFetch` renews an expired or nearly expired
  access token before sending (also when the token cookie is gone while the
  user cookie says signed in), one renewal shared by all waiting requests,
  and a failed renewal is not retried for a minute. A failed renewal only
  clears the backend token cookies, as before; the WebUntis session stays.
- Release state: uncommitted

## 2026-10-19 17:40 CEST · Team list and owner additions: implementation

- Profile picture: `components/app/Avatar.tsx` `expandable` (profile only):
  once the picture has loaded, a tap opens it full screen in the new
  `components/ui/MediaViewer.tsx`.
- PDFs: `MediaViewer` shows PDFs page by page with pdf.js
  (`pdfjs-dist` 6.3.289, legacy build for the supported older Safari, loaded
  only when a PDF is opened, in a worker) and has the download button in its
  bar. Used for message attachments (PDF and pictures open in the viewer,
  every row also has its own download button) and the excuse letter on the
  Abwesenheiten page (before: a new tab). Dependency change: `pdfjs-dist`
  added (brings its optional `@napi-rs/canvas` binaries for Node; not used in
  the browser).
- Excuse popup (`components/absences/ExcuseSheet.tsx`) rebuilt like
  "Mitteilung an Lehrkraft": absence on top, reason as a field whose list is a
  second step (shared `components/absences/ReasonList.tsx`), note, pinned
  save button, confirmation.
- "Abwesenheit melden" (`components/absences/ReportAbsenceSheet.tsx`) rebuilt
  the same way: for whom, start, end (steps with the date/time picker inside
  the sheet), "Aus Stundenplan wählen" (lesson step,
  `TimetableLessonPicker.tsx` now an in-sheet step), reason step, text,
  pinned send button, confirmation. The fixed 07:50–16:45 default was one
  school's hours; the range now starts on today's first and last lesson from
  the timetable, or empty. The date/time picker (`components/ui/DateTimePicker.tsx`)
  is in the current design, as embeddable fields plus its own sheet (to-dos,
  reminders), and puts the dots into a typed date by itself (`maskDate`).
- Statistics consent: "Alle akzeptieren" already saved the consent to the
  account, but the open Settings switch and the Profile did not follow until
  a reload; both now listen to `USAGE_CONSENT_EVENT`.
- Pixel scenes: new `chat` (comments), `mail` (inbox/sent/drafts), `bell`
  (reminders), `excused` (a whole excused day in the timetable week, inside
  its absence band); `empty`/`search`/`sun` added where empty states were
  plain text or an icon tile (to-dos, grade search, search palette, teacher
  and reason pickers, lesson picker, FAQ search, class week lists).
- Mensa: the plate is laid from the middle outwards (was top to bottom);
  comment section rebuilt (author tone, "Du", the author's stars beside the
  name from the dish ratings keyed by account, auto-growing field, send on
  Enter, inline error); the public /mensa page is prerendered with the menu
  (ISR, 10 minutes; cookie-free server read `publicMenu`).
- To-dos: rows no longer taller than their text (delete button in the row's
  padding), less space under the last list.
- Lesson detail: every text WebUntis sends with the period, plus (read
  defensively from calendar-entry/detail, each field optional) lesson content,
  the teacher's note for everyone, lesson info, substitution text, classes,
  group and exam name; HTML turned into plain text, duplicates dropped. The
  extra detail field names could not be checked against a live response (no
  browser session available); missing fields are simply not shown.
- Light theme in the app: off-white cards on a slightly deeper paper
  (`--surface #FBF9F5`, `--canvas #F2EEE7`, matching lines and fills); public
  pages keep their own values.
- Signed-in app: tab title "POKYH", `noindex`.
- Search: the top bar shows "/" as its shortcut; "/" opens the search (not
  while typing, with modifier keys or with a dialog open), Ctrl/⌘ K still do.
- Sign-in mascot (`components/pixel/mascot.ts`): redrawn after the owner's
  reference drawing (rounded, slightly tilted block, big white eyes with
  upright indigo pupils, blush, small smile, stubby arms outside the body,
  feet), a bit taller, waving in three positions; speech bubbles wrap onto
  up to three lines (names break at their own separators) instead of cutting
  the name.
- SEO: the sign-in page rendered nothing on the server (`useSearchParams`
  kept it out of the prerender); `next` is now read at submit time. Titles
  and descriptions over ~60/160 characters shortened (home, sign-in,
  WebUntis, get, FAQ en, about, comparison, calculators) keeping the agreed
  wording; legal descriptions now join as sentences and add the site line
  only when it fits; the Italian legal overview no longer shares its title
  with the imprint. Legal texts themselves unchanged.
- Release state: uncommitted
