# 2026-10-19 · Owner feedback: dish page, sidebar, scroll, grade trend, profile, timetable, homepage, absences, Mensa (branch `redesign`)

Factual log. No credentials, personal data or request bodies are recorded here.
Nothing was committed or pushed.

## Pre-work checks

- `git status`: clean on `redesign` (HEAD `620f1d0`).
- Open pull requests (`gh pr list`): none for `pokyh-frontend`, `pokyh-backend`,
  `pokyh_learn-frontend`. `pokyh-backend` (`main`) is one commit behind
  `origin/main` (account-activity work, no Mensa change); not pulled, nothing
  changed there. `pokyh_learn-frontend` has uncommitted worklog files of
  another session; left untouched.
- Dev server natively on :3011. Signed-in pages were checked in headless
  Chromium with fixture data intercepted in the browser (no WebUntis calls,
  no writes); the public Mensa menu came from the live backend (read-only).

## Mensa dish page

- "Zum Speiseplan" now sits in the dish picture's column, which is sticky on
  wide screens, so it travels down with the picture
  (`components/mensa/DishView.tsx`). Loading and error states keep it on top.

## Sidebar (signed in)

- Bottom: one block a step off the sidebar with the profile (avatar, name,
  class) and the settings, and under it three equal buttons: language,
  light/dark, public start page (`components/app/AppShell.tsx`,
  `shell.module.css`).
- Folding (owner's reference picture): a round button on the sidebar's edge,
  level with the logo, with a chevron and an accent ring on hover/focus; the
  sidebar's edge got a hairline for it. The fold button left the logo row.
- Folded: the bottom shows only the picture; a click opens a small account
  menu beside it (name and class, profile, settings, light/dark, start page,
  language as three flags; arrow keys, Escape, click outside, closes on a new
  page). All places fit again on a 800 px tall window. New string
  `accountMenu` (de/it/en).

## Scroll feel (public pages, desktop)

- Back to the slow glide of the redesign (owner: "wie damals"): `lerp` 0.068
  and gear 0.66 for wheel and trackpad, hero pace 0.45, carousel 0.82, scene
  stretch 1, hero follow 7 (`lib/scroll-pace.ts`). Wheel/trackpad detection
  and `NEXT_PUBLIC_SCROLL_TUNING` stay. Touch keeps native scrolling. Test
  updated (`tests/scroll-pace.test.mjs`).

## Grade trend chart

- Redrawn for reading at a glance (`components/grades/TrendChart.tsx`):
  legend (grades, average, own grades, pass mark), straight lines between
  grades instead of a curve that overshot, solid hairline grid, the running
  average as a quiet line ending in its value ("Ø 7,31"), only the latest
  grade labelled, dates never cut off at the edges, comma decimals, the card
  follows pointer and arrow keys (the chart is focusable), red dots below 6.
  New strings `trendGrades`, `trendPass` (de/it/en).

## Profile

- The buttons in the header (settings, website, sign out) and the account
  card are replaced by rows at the end, set like the settings page: account
  details (copyable IDs), then "Einstellungen", "Startseite", "Abmelden"
  (two-step). Row components shared in `components/app/SettingsRows.tsx`
  (settings page uses them too); `Item` got `inline` for one-line rows on
  phones.

## Wording

- Public header/footer and homepage CTAs when signed in: "Zum Dashboard" /
  "Vai alla dashboard" / "Go to dashboard" (was "Zur App").
- Sidebar and profile: "Startseite" / "Pagina iniziale" / "Homepage" (was
  "Zur Website").

## Timetable

- The week bar (arrows, dates) and the day names stay at the top while the
  week scrolls; a soft edge appears under the day names once lessons scroll
  beneath them. The pager clips only sideways (`overflow: clip visible`,
  older browsers keep `hidden`). The first time on the axis is no longer
  covered.
- Week change: the new week glides in 56 px and fades up while the old one
  fades out quickly (was a full-width slide that showed two time axes).
- Phones show the week's dates without the year, so the bar stays one line
  (`rangeText(…, withYear)`).

## Homepage

- Opening: the letters move with transform and opacity only (the blur
  filter ran on the main thread and stalled or was already over while the
  page started up). On a first visit a small inline script holds the opening
  at its start until the name's font is loaded and the tab is visible (at
  most 1.2 s), so it is never skipped in a background tab
  (`HeroStart` in `components/home/Hero.tsx`, `html[data-hero-wait]` in
  `globals.css`).
- Hero tunnel built piece by piece with pauses, shared geometry and faces,
  textures sent to the GPU while building, shaders compiled with
  `compileAsync`, drawing buffers only reallocated when the size changes
  (`components/home/heroScene.ts`). The tiles arrive once the opening and the
  build are both done. The carousel builds its cards when the browser is
  idle, one at a time; its drawing code loads with three.js.
- Measured on a production build, 4× CPU throttling, first visit: before,
  the main thread was blocked 247 ms + 786 ms during the opening; after,
  no long task over 75 ms in the first 1.4 s, the opening starts at first
  paint (font cached) and runs on the compositor.
- Tiles and carousel cards now show POKYH as it looks in the app
  (`lib/landing-art.ts`): lesson cells in the timetable's subject tones with
  an Entfall and an exam, the Entfall cell, grade chip and trend line, the
  inbox, the dashboard's exam card, absence rate with month bars, reminders,
  to-dos with "Überfällig", and the Mensa's pixel plate (new
  `paintPixelPlate` in `components/mensa/PixelPlate.tsx`). Sample texts in
  `homepageDict` (de/it/en), shared via `components/home/useTileText.ts`.

## Absences and menus on other pages

- The school-year menu opened under the cards: every `.rise` element stayed a
  stacking context after its animation. `.rise` now fills backwards only, and
  `PageHeader` sits above the page content. Checked: Abwesenheiten,
  Klassenbuch, Noten.
- Like WebUntis: accounts without the report right (WebUntis'
  `showCreateAbsence`, false for students under 18) no longer see "Grund
  angeben" on open absences; "Abwesenheit melden" was already gated.

## Mensa

- The app reads `available` from the account's menu (`/api/mensa/mine`,
  pokyh-backend answers `available: false` for a school without a menu, set in
  the admin panel). Without a menu the Mensa disappears from the sidebar, the
  phone tab bar and the search; `/canteen` shows "Deine Schule hat in POKYH
  keine Mensa." (`useMensaAvailable` in `components/app/hooks.ts`). The stored
  menu answers at once on later visits.
- Loading: the empty pixel plate, breathing, with placeholders shaped like the
  result (no jump); error with the unplugged scene and retry. The frame reads
  the menu once per page load and `apiFetchCached` shares requests under way,
  so the Mensa page usually opens from memory.

## Verification

- `tsc --noEmit` passes; ESLint clean on all changed files except the older
  warning in the timetable page; `npm test` 41/41; `next build` passes.
- Browser (headless Chromium, desktop 1440 and phone 390/320, light and dark
  where relevant): dish page scrolled, sidebar open/folded/short screen/language
  menu, edge button hover, folded account menu (Escape closes), profile top and bottom, grade chart with and without hover, timetable
  top/scrolled/mid-switch, Mensa loading/without menu, absences as minor and
  adult (buttons 0/0 and 3/1), menus on Abwesenheiten/Klassenbuch/Noten, public
  header signed in, phone tab bar without Mensa, homepage hero tiles and
  carousel. No page errors.
- Not seen on a real device: scroll feel with a physical wheel/trackpad, the
  opening on a real phone GPU.

## Open

- Owner to try the scroll feel and the opening on real devices.

## 2026-10-19 · Messages: sent recipients and compose popup

- Bug: rows in "Gesendet" showed "Unbekannt". The list parser read only
  `recipients`; WebUntis names the field `recipientPersons` /
  `recipientGroups` (as drafts already did). New shared helper
  `messageRecipientNames` in `lib/untis-parse.ts`; sent and draft rows now show
  "An: <name>", drafts without a recipient show a pencil avatar and no name.
- Sent message detail: opened with `?folder=sent`, shows "An: <name>" (falls
  back to the stored sent list when the detail response has no recipients),
  hides "Antworten" and no longer calls mark-as-read.
- Compose popup ("Mitteilung an Lehrkraft") and the reply popup rebuilt on the
  shared `Sheet`, `Button` and `Field` components: labelled fields with inline
  errors, recipient field with avatars, recipient choice as a second step
  inside the same sheet (back arrow, search, skeleton while loading, "no
  match" state), pinned footer with Senden / Entwurf, success view after
  sending. `Sheet` gained optional `onBack` and `footer` props; existing
  sheets unchanged. New strings `chooseTeacher`, `noMatches` (de/it/en/lld).
- Verification: `tsc --noEmit` passes; ESLint clean on changed files;
  `npm test` 41/41; dev server on :3011 compiles the pages. Not checked in a
  browser (extension not connected) and the live sent-list field names were
  not inspected; no WebUntis writes were made.
- Release state: uncommitted

## Sidebar without borders

- Owner asked to remove the sidebar border, including the line shown around
  the profile picture of the folded sidebar.
- `components/app/shell.module.css`: dropped the sidebar's right edge line
  (`.side`), the line above the folded profile picture (folded `.dock`) and
  the 1px ring of the folded account menu (`.accountMenu`). Nothing else
  changed.
- Verification: CSS-only change; not checked in a browser.
- Release state: uncommitted

## Sidebar fold button one step off the sidebar

- Owner asked to drop the ring on the round fold button as well and to give
  it a colour that stands out; accent (indigo) and ink (black/white) fills
  were rejected, then a clearly darker grey too; the owner asked for only a
  minimal step off the sidebar (slightly darker in light mode, slightly
  lighter in dark mode).
- `components/app/shell.module.css` (`.edge`): ring removed; the button is
  the sidebar colour with 7% ink mixed in (12% on hover), caret in the ink
  colour, a soft shadow, and grows slightly on hover.
  Keyboard focus keeps the global focus outline.
- Verification: CSS-only change; not checked in a browser.
- Release state: uncommitted
