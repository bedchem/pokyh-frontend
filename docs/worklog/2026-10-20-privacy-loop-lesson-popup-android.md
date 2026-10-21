# 2026-10-20 · Privacy notice loop, lesson popup, phone viewport, Android features (branch `redesign`)

Factual log. No credentials, personal data or request bodies are recorded here.

## 2026-10-20 · Pre-work checks

- `git status`: clean on `redesign` at `7ba8eee`; `POKYH_ANDROID` clean on
  `main` at `ff2e5c7`; `pokyh-backend` clean on `main` at `a64aa8a`.
- Release state: uncommitted

## 2026-10-20 · Privacy notice asked again and again (web ↔ Android)

- Owner reported: accepting the privacy notice on the web makes the Android
  app ask again, and accepting it there makes the web ask again.
- Cause: one backend, two notice versions. The Android app reads the version
  from `https://pokyh.com/api/privacy-notice` (www, branch `main`:
  `2026-10-15b`); beta.pokyh.com (branch `redesign`) has `2026-10-19`. Both
  clients asked unless the stored version was exactly their own, and each
  acknowledgement overwrote the other.
- Backend (`pokyh-backend` `src/routes/privacy.ts`): `POST
  /privacy/acknowledge` no longer replaces a stored version with an older one
  (versions compare as text: date, then tag); the newer one and its time stay.
  The log line names the kept version.
- Website: `noticeCovers()` in `lib/privacy-notice.ts`; `PrivacyGate` asks
  only when the acknowledged version is missing or older than its own.
- Android (`state/AppState.kt` `checkPrivacyNotice`): same rule.
- Still open: www (branch `main`) keeps the exact comparison until this branch
  is live there; an account that uses both www and beta can be asked again on
  www until then. Installed Android builds without this change behave the same.
- Release state: uncommitted (all three repositories)

## 2026-10-20 · Lesson popup in the Stundenplan

- Owner asked for the popup in the app's own style and disliked that "Klassen"
  appeared later than teacher and room.
- `LessonDetailSheet` now uses the shared `Sheet` (title = subject, focus
  handling, Escape, backdrop): a banner in the subject's colour with the photo
  or short name, day, time and status chips; below it the facts list
  (Lehrkraft, Raum, Klassen, Gruppe) with the subject's pastel icon tiles,
  absence, "Statt/Stattdessen", the lesson texts, exam content and homework as
  plain blocks. Phosphor icons, sentence-case labels; the old Android-style
  CSS of the sheet is removed from `timetable.module.css`.
- Everything below the banner waits for the lesson detail (at most 3.5 s), so
  it appears once; a quiet skeleton shows only after 140 ms.
- `timetable/lessonDetail.ts`: the detail is fetched once per lesson and kept
  for 5 minutes; the grid asks for it on press, on keyboard focus and when the
  mouse rests on a lesson for 140 ms.
- Wording: "Lehrer" → "Lehrkraft" (de); new key `detailsLoading` (de/it/en).
- Release state: uncommitted

## 2026-10-20 · Homepage on phones whose browser bars collapse

- Owner's iPhone screenshot (iOS Safari, bar collapsed): mid-flight, the next
  section ("Schule ist …") showed below the hero stage.
- `ViewportScript`: on touch devices the large viewport only grows (never
  shrinks while the width stays) when the window turns out taller than first
  measured; `pokyh-viewport-grow` makes ScrollTrigger measure again
  (`lib/motion.ts`).
- Hero stage paints its own colour 160 px below itself on touch devices
  (`--bleed`, box-shadow), so whatever Safari shows behind its floating bar is
  the stage, not the next section. Off with reduced motion.
- Release state: uncommitted

## 2026-10-20 · Android: features from the web app

- Owner asked to bring the missing features to the Android app (features only,
  not the redesign). Ported 1:1 from the Next routes into `UntisClient`:
  absence meta, report (`absences/students/self`), excuse (read absence, then
  `students/edit`, only when `canEdit`), excuse letter (`reports.do`, PDF),
  `canReportAbsence` (`showCreateAbsence`, else write right in app data),
  password change (`profile/access/password`, CSRF), password reset
  (`passwordReset/resetPassword.do`, anonymous session), reply form and reply
  (`messages/{id}/reply-form`, v2 `reply`), class services, homework, lesson
  detail (`calendar-entry/detail`). Classic writes carry the session's CSRF
  token and tenant from the WebUntis page and retry once on 403.
- Screens: Abwesenheiten ("Abwesenheit melden", "Entschuldigen" per open
  absence, "Entschuldigungsschreiben"; only when WebUntis allows reporting),
  Nachrichten ("Antworten" on inbox messages, compose sheet in reply mode),
  Profil ("Passwort ändern"; stored password and offline check follow the new
  one; "Aktivität" grid and "Statistiken" screen from `GET /users/me/activity`),
  sign-in ("Passwort vergessen?"), Klasse (Klassendienste, Hausaufgaben),
  Stundenplan popup (Klassen, Gruppe, lesson texts, homework; the part below
  the hero fills in once).
- Personal statistics cannot be switched on in the app; the statistics screen
  points to the website's settings.
- Release state: uncommitted

## 2026-10-20 · Verification

- Website: `tsc --noEmit` clean; ESLint 0 errors on the changed files (one
  existing warning in `lib/motion.ts`); `npm test` passes.
- Headless browser, dev server, fixture data (no WebUntis): lesson popup at
  390 (light, dark) and 1280; detail answer delayed 700 ms and 1.4 s, the
  part below the banner appears at once; no console errors.
- Homepage at 390 × 700 grown to 390 × 790 without a width change: `--lvh`
  follows (7 → 7.9 px), the stage fills the window.
- Android: `compileDebugKotlin` and `assembleDebug` with a local JDK
  (`-Dorg.gradle.java.home`, the one in `gradle.properties` is another
  machine's).
- Not checked: a real iPhone, a real Android device, any WebUntis write (owner
  tests reporting, excusing, replying and the password change).
- Release state: uncommitted
