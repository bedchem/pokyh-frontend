# 2026-10-18 · Signed-in app: shell, dashboard, settings, profile, pages (branch `redesign`)

Factual log. No credentials, personal data or request bodies are recorded here.
Nothing was committed or pushed.

## Pre-work checks

- `git status`: clean on `redesign` (HEAD `36d96b6`) in `pokyh-frontend`; clean
  on `main` in `pokyh-backend`.
- Open pull requests (GitHub API): none for `bedchem/pokyh-frontend`, none for
  `bedchem/pokyh-backend`.
- Scope from the owner: the public pages are being redesigned by another
  contributor on the same branch and are not changed; the signed-in app is
  rebuilt in the public pages' design language.

## App frame (new)

- `app/[lang]/(app)/layout.tsx` + `components/app/AppShell.tsx`: sidebar on
  wide screens (collapsible, state in localStorage `pokyh_sidebar_collapsed`,
  the name the privacy notice already lists), the Android app's five-tab
  bottom bar on phones (Home, Stundenplan, Schule, Noten, Mensa), top bar with
  the search. The active item is marked by one pill that glides between items
  (framer-motion). Pages fade in on navigation.
- One page column for every page: 1440px max, 20/32/48px from the edges
  (`components/app/Page.tsx`; timetable and in-app Mensa use the same values).
- Search (Ctrl/⌘ K, `/`): "Seiten" (places and actions) and "Inhalte" (class
  duties, class register, homework, exams, grades, lessons, messages,
  reminders, to-dos, dishes), each content row naming its source. Content is
  read from the device's caches and fetched lazily when the search opens.
- Writing to a teacher and reporting an absence are app-wide actions
  (`components/app/actions.tsx`); reporting only where WebUntis allows it.
- Hand cursor for every clickable element in the app (`app/[lang]/(app)/app.css`).
- Press-to-shrink effects removed from app controls.

## Loading, empty and error states

- Content loads with skeletons shaped like the content and one shared light
  sweep (`components/app/Skeleton.tsx`); spinners remain only inside buttons.
- Pixel-art scenes (`components/app/PixelState.tsx`, CSS in `app.css`):
  unplugged (load errors), search (not found), lock (session), empty, holiday
  week (beach), holiday day (sun), all cancelled, all substituted, day-long
  event. `components/ui/ErrorView.tsx` uses them, so every page's errors do.
  Weekends in the timetable are unchanged (owner's request).

## Pages

- Dashboard (`home`): greeting with the first name, quick tiles in the Android
  tones with figures (grade average, absence rate and hours, open to-dos,
  upcoming reminders), next exam, recent grades (3) with the average, messages,
  Mensa. Grades and messages load and fail independently. Iterated several
  times on the owner's feedback (day block removed, card density, exam block
  vertically centred, subject underlined).
- Settings (new route `/settings`): theme previews, language, sidebar,
  WebUntis password change and reset (existing forms in sheets), browser
  notifications, personal usage statistics, cookie settings, offline copies,
  about, logout. Laid out like the public FAQ.
- Profile: activity grid (GitHub-style) and figures from the backend, account
  details with copy buttons; `/profile/stats` with hours, weekdays, devices,
  most used pages and created items.
- Schule hub, To-dos (inline add, animated check-off), Erinnerungen (inline
  add, day timeline, comments sheet, members sheet), Nachrichten (folders with
  sliding indicator, grouped by day), Stundenplan (header, week switch joined
  to the grid, holiday week), Noten (stylesheet in the design language).
- Mensa for signed-in users: new route `/canteen` renders the existing public
  Mensa component unchanged inside the app frame (comments visible and
  writable when signed in). `proxy.ts` sends signed-in users from `/mensa` to
  `/canteen` and guests the other way. The public Mensa page is not changed.
- Marks keep quarter steps in the dashboard (7.25 is not shown as 7.3).

## Backend (`pokyh-backend`, uncommitted)

- New `GET /users/me/activity` (`src/routes/users.ts`,
  `src/services/accountActivity.ts`, pure helpers in
  `src/services/accountActivitySummary.ts`): the caller's own active days
  (request_account_days), successful sign-ins (request_logs), and — only with
  consent to the personal usage statistics — foreground time, visits, screens,
  start hours and most opened pages; plus counts of own to-dos, reminders,
  comments and ratings. No new data is collected; only the account itself can
  read it.
- Sign-in attribution: the request log row of a successful `POST /auth/login`
  or `/auth/register` now carries the signed-in account (`res.locals.signedIn`
  in `src/middleware/requestLogger.ts`). Automatic session renewals by the
  website send `renewal: true` (frontend `lib/api.ts` →
  `app/api/webuntis/login/route.ts` → backend) and are not counted.
- Retention is unchanged: request logs and account days 30 days, named usage
  statistics 90 days (consent only). Whether the sign-in attribution needs a
  sentence in the privacy notice is for the owner to decide (the notice already
  lists username and path in the request logs).

## Verification so far

- Frontend: `tsc --noEmit` passes; ESLint clean on new and rebuilt files
  (remaining warnings are pre-existing).
- Backend: `tsc --noEmit` passes; new `tests/accountActivity.test.mjs` 5/5;
  full suite 182/187 — the 4 failing tests are deploy/cluster tests (tar,
  shell, file permissions, compose host paths) that depend on a Linux host and
  were not touched.
- Browser (owner's dev server, signed in, desktop width): dashboard, search,
  timetable, holiday week, grades, Mensa, settings checked visually. Local
  calls from the browser to `api.pokyh.com` are refused for the dev origin
  (CORS, known), so to-dos/reminders counts and the activity grid show their
  error state locally.

## Later changes (same day)

- Grades: separator lines between subjects. Subject detail rebuilt with a new
  trend chart (`components/grades/TrendChart.tsx`: smooth curve, running
  average, pass band at 6, hover card, draw-in animation).
- Messages: inset separator lines between rows on the Nachrichten page and in
  the dashboard card, hidden next to a hovered row.
- Empty-state pixel art: the unclear box sprite was replaced by a tumbleweed
  rolling past a cactus (`components/app/PixelState.tsx`, keyframes in
  `app/[lang]/(app)/app.css`, still under reduced motion).
- Abwesenheiten: one statistics card (rate, lessons missed of all lessons,
  total/excused/unexcused with a split bar) beside a per-month chart (Sep–Jun,
  a bar jumps to its month); the absences below at full width with calendar
  tiles, written-out dates, status chips and separator lines. Two new strings
  (`ofLessons`, `perMonth`) in `lib/i18n/dictionaries/absences.ts`.
- Checks: `tsc --noEmit` passes. ESLint on the absences page reports three
  `no-explicit-any` errors in the unchanged timetable helper (present on
  `HEAD`); everything else is clean. Desktop width checked in the browser.

## Open

- Remaining pages to rebuild: Klassenbuch, Klasse, message detail; the compose
  and absence sheets.
- Phone width of the new Abwesenheiten layout still to be checked in the
  browser.
