# 2026-10-18/19 · Class pages, phone layouts, Mensa pages, 404, yearly activity (branch `redesign`)

Factual log. No credentials, personal data or request bodies are recorded here.
Nothing was committed or pushed.

## Pages rebuilt in the design language

- Klassenbuch (`app/[lang]/(app)/classregevents/page.tsx`): figures for the year
  (entries, subjects, last entry, most common category) with a split bar by
  category, filter (all / last month / last 3 months), sort menu, entries by
  month (or by subject/category) on calendar tiles in the category's tone.
  Shared row and parsing in `components/class/ClassregEntry.tsx`; small menu
  component `components/app/PickMenu.tsx`.
- Klasse (`app/[lang]/(app)/class/page.tsx`): newest class-register entries,
  class duties, own open absences, exams and homework of this and next week
  (with date ranges). Every part loads and fails on its own.
- Message detail (`app/[lang]/(app)/messages/[id]/page.tsx`): new layout,
  attachments with file-type tiles, external-link warning as a sheet, trailing
  blank lines of the body trimmed, single "blob" attachments recognised.

## App frame and pages

- Sidebar: settings, language, the public website and folding in one row
  (a column when folded); folded items show their name in a label on hover or
  focus; on short screens the items sit closer and the list fades where it
  goes on (`components/app/AppShell.tsx`, `shell.module.css`).
  `components/site/LanguageButton.tsx` gained `placement`, `compact` and
  `buttonClassName`.
- Profile: settings, "Zur Website" and "Abmelden" (two-step, in place;
  `components/app/LogoutButton.tsx`).
- To-dos and Erinnerungen: one full-width column, separator lines between rows;
  overdue to-dos show "Überfällig" as its own chip. Title "To-dos".
- Timetable: from Saturday 17:00 (NEXT_PUBLIC_WEEK_ROLLOVER) the current week is
  the coming one, labelled "Nächste Woche" (`mondayOf` in
  `lib/timetable-logic.ts` now uses `currentWeekMonday`).
- Phone widths: dashboard tiles and actions no longer push the page wider than
  the screen; grid cells may shrink everywhere in the app (`app.css`); the
  search field fills the top bar; Nachrichten has a floating "Verfassen" button
  (`components/app/Fab.tsx`) and "Alle als gelesen" next to the title
  (`PageHeader` `mobileAside`).
- Avatar: a picture that failed before hydration now falls back to initials.

## Bugs fixed on the way

- Unread messages: WebUntis sends `isMessageRead`; all parsers read `isRead`, so
  nothing ever showed as unread (`messageIsRead` in `lib/untis-parse.ts`).
- The stored inbox was read and cleared under `/api/webuntis/messages` while it
  is saved under `…?folder=inbox`; opening a message now marks it read in the
  stored inbox and updates every badge (`lib/api.ts`).
- Comment lists scrolled the page to their end when they first loaded
  (`components/ui/CommentSection.tsx`).
- `lib/console-secret.ts` threw on keydown events without a key (autofill).
- Homepage carousel: the sentence under the cards waited for its fade-out
  before changing, so fast scrolling left the previous card's text in place; it
  now changes at once and rises in (`components/landing/FeatureCarousel.tsx`).

## Mensa

- The 3D plate (three.js + a 400 KB HDR) is replaced by pixel art drawn on the
  spot (`components/mensa/PixelPlate.tsx`): plate, fork, knife, dithered
  shadow, steam and glints; the dish photo is scaled down to the scene's pixels,
  without a photo a small pixel meal in the dish's style. `plateScene.ts` and
  `public/hdr/studio.hdr` removed, with their header/proxy entries.
- Dishes open a page instead of a sheet: `/mensa/dish/<id>` (public, noindex)
  and `/canteen/dish/<id>` (signed in); the proxy maps one to the other
  (`components/mensa/DishView.tsx`, shared pieces in `components/mensa/parts.tsx`).
  Dashboard card and search results link to the dish pages.
- The menu is cached in memory and on the device; plan and dish pages render
  from the stored copy first (`fetchMensa`, `getMensaStale`).
- The dish photo on the pixel plate is no longer scaled down to the scene's
  pixels: it is shown sharp, cut to the plate's stepped edge (CSS polygon),
  and fades in over the drawn meal once loaded. The food disc is now centred
  on the plate (it sat half a pixel up and left) and the well is drawn under
  it, so the plate shows around a pixel meal's heap.
- The plan's rows and the other dishes of the day use a small pixel plate
  (`PixelPlate size="plate"`: plate only, no cutlery or steam, a glint on
  hover) instead of the CSS plate; `Plate` in `parts.tsx` wraps it. The unused
  CSS plate, steel and plate-in/cutlery rules were removed from `globals.css`.

## Public pages

- 404: a pixel-art "404" (digits drop in, a question mark blinks in the zero, a
  tumbleweed rolls past a cactus), one sentence, "Zurück" and the start page
  (`components/site/Pixel404.tsx`, `NotFoundView.tsx`, `app/global-not-found.tsx`).
  Later replaced, because the tumbleweed and cactus are already the app's
  "empty" picture (`PixelState`): the missing page is now a paper ghost
  beside the digits (ruled sheet, folded corner, eyes and cheeks, fluttering
  hem), floating up and down with its shadow below, fading now and then,
  blinking. A faint outline keeps the white sheet visible in the light theme.
  The scene is 60 pixels wide instead of 52; the drawing is a little wider
  on the page (680 px, standalone 640 px) so the digits keep their size.
- Homepage scroll cue: the word rises letter by letter, a dot glides down a
  track; a click starts the flight through the name.
- Header: away from the top, what scrolls beneath it is blurred (`.header-blur`).
- /get: browser, then the apps, then the web app.
- /about: the story rewritten (two school websites, what was missing, "Und uns
  war langweilig."), a fourth point (Mensa), "Wer POKYH baut" instead of
  "Die Menschen dahinter" (de/it/en).

## Loading speed

- three.js is no longer in the homepage's first download: the carousel loads it
  when the ring is built (the hero already did).
- The homepage opening runs in CSS from the first paint instead of after
  hydration (same timings as before; the script keeps the pointer lean).
- Grades, grade detail and Nachrichten show the stored copy at once and refresh.

## Activity for the school year (`pokyh-backend`, uncommitted)

- `request_account_days` gets `sign_ins` (successful sign-ins per day and device
  kind, counted in `requestLogger` via `noteSignIn`); new table
  `archived_activity` (per account and school year: active days, sign-ins,
  foreground time, summary JSON). Both additive for `prisma db push`.
- `ACCOUNT_ACTIVITY_SCHOOL_YEAR` (default on): account days and, with consent,
  named usage visits are kept until the school year has been archived, instead
  of 30/90 days. `GET /users/me/activity` covers the school year so far.
- The rollover writes each archived account's year into `archived_activity`;
  the admin "Schuljahre" users table shows active days, sign-ins and time.
  The admin privacy overview lists the new periods.
- New unit tests in `tests/accountActivity.test.mjs` (school-year start,
  sign-in days, archive summary). Not run locally (backend is not run or
  compiled on this machine).
- Frontend: profile text and a denser grid for a whole year
  (`components/app/ActivityGrid.tsx`).
- Privacy notice (de/it/en): the account's day overview and its retention, the
  school-year archive; version raised to `2026-10-18b`.

## Verification

- `tsc --noEmit` passes; ESLint clean on all changed files except one existing
  warning in the timetable page; `npm test` 41/41.
- Browser (dev server, desktop, signed in): Klassenbuch, Klasse, Nachrichten,
  message detail, sidebar (row, menu, folded labels), Mensa plan and dish page,
  404, homepage cue and flight.
- Phone widths (390 px and 320 px, headless Chrome with fixture data for the
  signed-in pages): every app and public page without horizontal overflow;
  scroll tours (slow and fast, up and down) of the homepage and several
  subpages.
- The dev server was stopped later because the machine ran low on memory, so
  the last changes (CSS opening of the homepage, stored-copy grades and
  messages, dashboard dish links) are type-checked and linted but not yet seen
  in the browser.

## Open

- Check the homepage opening in the browser once.
- Deploy the frontend (new privacy notice) no later than the backend.
- The privacy notice names the school-year archive but not how long archived
  years are kept; that period is for the owner to set.
- A rolled-back school year does not bring back its daily activity rows.
